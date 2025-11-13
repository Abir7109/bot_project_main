const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const login = require("sahu-fca");
const logger = require("./utils/log");
const chalkNS = require("chalk");
const chalk = chalkNS?.default || chalkNS;

const cfgPath = path.join(__dirname, "config.json");
const config = fs.readJsonSync(cfgPath);

const PREFIX = config.PREFIX || "/";

function loadAppState() {
  const appStatePath = path.isAbsolute(config.APPSTATEPATH)
    ? config.APPSTATEPATH
    : path.join(__dirname, config.APPSTATEPATH || "appstate.json");
  if (!fs.existsSync(appStatePath)) {
    logger(`Missing ${appStatePath}. Add your appstate.json file to the project.`, "error");
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(appStatePath, "utf8"));
  } catch (e) {
    logger(`Failed to read appstate: ${e.message}`, "error");
    process.exit(1);
  }
}

function loadCommands() {
  const dir = path.join(__dirname, "Script", "commands");
  const commands = new Map();
  if (!fs.existsSync(dir)) return commands;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
  for (const f of files) {
    try {
      const cmd = require(path.join(dir, f));
      if (!cmd || !cmd.config || !cmd.config.name || typeof cmd.run !== "function") {
        logger(`Skip invalid command file: ${f}`, "warn");
        continue;
      }
      commands.set(cmd.config.name.toLowerCase(), cmd);
    } catch (e) {
      logger(`Failed to load command ${f}: ${e.message}`, "error");
    }
  }
  return commands;
}

function loadEvents() {
  const dir = path.join(__dirname, "Script", "events");
  const events = new Map();
  if (!fs.existsSync(dir)) return events;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
  for (const f of files) {
    try {
      const evt = require(path.join(dir, f));
      if (!evt || !evt.config || !evt.config.name || typeof evt.run !== "function") {
        logger(`Skip invalid event file: ${f}`, "warn");
        continue;
      }
      events.set(evt.config.name.toLowerCase(), evt);
    } catch (e) {
      logger(`Failed to load event ${f}: ${e.message}`, "error");
    }
  }
  return events;
}

function formatNow() {
  return moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");
}

function printBanner() {
  const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        █████╗ ██████╗ ██╗██████╗      ██████╗  ██████╗ ████████╗  ║
║       ██╔══██╗██╔══██╗██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝  ║
║       ███████║██████╔╝██║██████╔╝    ██████╔╝██║   ██║   ██║     ║
║       ██╔══██║██╔══██╗██║██╔══██╗    ██╔══██╗██║   ██║   ██║     ║
║       ██║  ██║██████╔╝██║██║  ██║    ██████╔╝╚██████╔╝   ██║     ║
║       ╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝     ║
║                                                           ║
║                  🤖 Facebook Messenger Bot 🤖              ║
║                                                           ║
║          Owner: ABIR                                      ║
║          Version: 1.0.0                                   ║
║          Facebook: fb.com/ABIRMAHMMUD1344                 ║
║          WhatsApp: +8801919069898                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `;
  if (chalk && typeof chalk.cyan === 'function') {
    console.log(chalk.cyan(banner));
  } else {
    console.log(banner);
  }
}

(async () => {
  printBanner();
  
  const appState = loadAppState();
  const commands = loadCommands();
  const events = loadEvents();

  login({ appState }, (err, api) => {
    if (err) {
      logger(JSON.stringify(err), "error");
      process.exit(1);
    }

    api.setOptions({
      selfListen: config.FCAOption?.selfListen ?? false,
      listenEvents: config.FCAOption?.listenEvents ?? true,
      updatePresence: config.FCAOption?.updatePresence ?? false,
      userAgent: config.FCAOption?.userAgent,
      autoReconnect: config.FCAOption?.autoReconnect ?? true
    });

    const separator = (chalk && typeof chalk.gray === 'function') ? chalk.gray("═".repeat(60)) : "═".repeat(60);
    console.log(separator);
    logger(`${config.BOTNAME} is online. Loaded ${commands.size} commands and ${events.size} events.`, "[ online ]");
    logger(`Prefix: ${PREFIX} | Listening for messages...`, "[ info ]");
    console.log(separator);
    
    // Connection monitoring
    let lastMessageTime = Date.now();
    let messageCount = 0;
    
    // Keep-alive mechanism - prevents bot from sleeping
    setInterval(() => {
      const uptime = Math.floor(process.uptime());
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const timeSinceLastMsg = Math.floor((Date.now() - lastMessageTime) / 1000 / 60);
      
      logger(`Bot alive | Uptime: ${hours}h ${minutes}m | Messages: ${messageCount} | Last msg: ${timeSinceLastMsg}m ago`, "[ info ]");
      
      // Warn if no messages received for 30 minutes
      if (timeSinceLastMsg > 30) {
        logger(`WARNING: No messages received for ${timeSinceLastMsg} minutes. Connection may be lost.`, "[ warn ]");
      }
    }, 300000); // Every 5 minutes
    
    // Heartbeat - check connection every minute
    setInterval(() => {
      try {
        api.getCurrentUserID(); // Simple call to check if API is still responsive
      } catch (e) {
        logger(`Heartbeat failed: ${e.message}. API may be disconnected.`, "[ error ]");
      }
    }, 60000); // Every minute

    const cooldowns = new Map(); // Map<cmdName, Map<userId, ts>>

    function hasPrefix(body) {
      if (!body || typeof body !== "string") return false;
      return body.trim().startsWith(PREFIX);
    }

    function parse(body) {
      const text = body.trim().slice(PREFIX.length);
      const parts = text.split(/\s+/);
      const name = (parts.shift() || "").toLowerCase();
      return { name, args: parts };
    }

    // Dedup structures
    const processedIds = new Set();
    const recentSignatures = new Map(); // sig -> timestamp

    function makeSig(e) {
      const base = `${e.threadID}:${e.senderID}:${(e.body || '').trim()}`;
      return base;
    }

    function seenRecently(sig, now) {
      const ts = recentSignatures.get(sig);
      if (ts && now - ts < 5000) return true; // 5s window
      recentSignatures.set(sig, now);
      // simple cleanup
      if (recentSignatures.size > 2000) {
        const cutoff = now - 5000;
        for (const [k, v] of recentSignatures) if (v < cutoff) recentSignatures.delete(k);
      }
      return false;
    }

    const stopListen = api.listenMqtt(async (listenErr, event) => {
      if (listenErr) {
        logger(`Listen error: ${listenErr.message}`, "[ error ]");
        logger(`Error type: ${listenErr.error || 'unknown'}`, "[ warn ]");
        
        // Try to reconnect on certain errors
        if (listenErr.error === 'Connection closed' || listenErr.error === 'Connection lost') {
          logger('Attempting to reconnect...', "[ warn ]");
        }
        return;
      }
      if (!event) return;
      
      // Update connection monitoring
      lastMessageTime = Date.now();
      messageCount++;

      // Dispatch non-message events to event handlers (e.g., joinNoti)
      if (event.type !== "message") {
        // First check events folder
        for (const evt of events.values()) {
          if (evt.config.eventType && evt.config.eventType.includes(event.logMessageType)) {
            try { 
              await evt.run({ api, event, config, commands, logger }); 
            } catch (e) {
              logger(`Event ${evt.config.name} error: ${e.message}`, "error");
            }
          }
        }
        // Then check commands with handleEvent
        for (const mod of commands.values()) {
          if (typeof mod.handleEvent === "function") {
            try { await mod.handleEvent({ api, event, config, commands, logger }); } catch {}
          }
        }
        return;
      }

      const { threadID, senderID, messageID, body } = event;

      // Deduplicate by messageID
      if (messageID) {
        if (processedIds.has(messageID)) return;
        processedIds.add(messageID);
        if (processedIds.size > 5000) processedIds.clear();
      }

      // Deduplicate by signature (covers cases where IDs differ)
      const nowTs = Date.now();
      const sig = makeSig(event);
      if (seenRecently(sig, nowTs)) return;

      // Thread-level ban: drop messages from banned users
      try {
        const banPath = path.join(__dirname, "data", "ban.json");
        if (fs.existsSync(banPath)) {
          const ban = JSON.parse(fs.readFileSync(banPath, "utf8"));
          const blocked = (ban.threads && ban.threads[String(threadID)]) || [];
          if (blocked.includes(String(senderID))) return; // ignore
        }
      } catch {}

      // Track thread ID for allbox
      try {
        const tpath = path.join(__dirname, "data", "threads.json");
        const set = fs.existsSync(tpath) ? new Set(JSON.parse(fs.readFileSync(tpath, "utf8"))) : new Set();
        if (!set.has(String(threadID))) {
          set.add(String(threadID));
          fs.ensureDirSync(path.join(__dirname, "data"));
          fs.writeFileSync(tpath, JSON.stringify(Array.from(set)), "utf8");
        }
      } catch {}

      // Check for reply to bot message (for interactive commands like help)
      if (event.messageReply) {
        for (const mod of commands.values()) {
          if (typeof mod.handleReply === "function") {
            try {
              await mod.handleReply({ api, event, config, commands, logger });
            } catch (e) {
              logger(`handleReply error: ${e.message}`, "warn");
            }
          }
        }
      }

      if (!hasPrefix(body)) {
        // No prefix: dispatch handleEvent hooks (e.g., autoreply) if present
        for (const mod of commands.values()) {
          if (typeof mod.handleEvent === "function") {
            try { await mod.handleEvent({ api, event, config, commands, logger }); } catch {}
          }
        }
        return;
      }

      const { name, args } = parse(body);
      const cmd = commands.get(name);
      if (!cmd) {
        const availableCommands = Array.from(commands.keys()).map(c => `${PREFIX}${c}`).join(', ');
        return api.sendMessage(`❌ Unknown command "${name}". Available commands: ${availableCommands}`, threadID);
      }

      // simple per-user cooldown
      const cdMs = (cmd.config.cooldowns || 1) * 1000;
      const map = cooldowns.get(cmd.config.name) || new Map();
      const last = map.get(senderID) || 0;
      if (nowTs - last < cdMs) {
        const left = ((cdMs - (nowTs - last)) / 1000).toFixed(1);
        return api.sendMessage(`Slow down. Try again in ${left}s`, threadID);
      }

      try {
        logger(`User ${senderID.slice(0, 8)}... executed: /${name}`, "[ cmd ]");
        await cmd.run({ api, event, args, config, commands, logger, now: formatNow });
        map.set(senderID, nowTs);
        cooldowns.set(cmd.config.name, map);
      } catch (e) {
        logger(`Command ${name} error: ${e.message}`, "[ error ]");
        api.sendMessage(`Command error: ${e.message}`, threadID);
      }
    });

    process.on("SIGINT", () => {
      try { stopListen?.(); } catch {}
      process.exit(0);
    });
  });
})();
