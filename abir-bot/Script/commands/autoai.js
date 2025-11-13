const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const aiProvider = require(path.join(__dirname, "..", "..", "utils", "aiProvider"));

module.exports.config = {
  name: "autoai",
  description: "AI auto-reply in chat (per-thread). Modes: smart|all|mention; lang: auto|bn|en; cooldown; context",
  usages: "autoai on|off|status | autoai mode <smart|all|mention> | autoai lang <auto|bn|en> | autoai cooldown <sec> | autoai context <on|off>",
  cooldowns: 3,
  credits: "Abir"
};

const STORE = path.join(__dirname, "..", "..", "data", "autoai.json");
const AUTOREPLY_STORE = path.join(__dirname, "..", "..", "data", "autoreply.json");

function loadStore() {
  try {
    if (!fs.existsSync(STORE)) {
      fs.ensureDirSync(path.dirname(STORE));
      fs.writeJsonSync(STORE, { threads: {} }, { spaces: 2 });
    }
    const d = fs.readJsonSync(STORE);
    if (!d.threads) d.threads = {};
    return d;
  } catch {
    return { threads: {} };
  }
}
function saveStore(d) { try { fs.writeJsonSync(STORE, d, { spaces: 2 }); } catch {}
}
function isBanglaText(s) { return /[\u0980-\u09FF]/.test(s || ""); }
function looksBanglish(s) {
  const t = (s || "").toLowerCase();
  // Common Banglish tokens/phrases
  const patterns = [
    /\b(kmn|kemon|kemne|kivabe|ki vabe)\b/,
    /\b(tumi|ami|apni|vai|bhai|bondhu|dosto|jan|babu)\b/,
    /\b(bhalo|valo|accha|thik|thikache|thik ase)\b/,
    /\b(koro|korcho|korso|korcen|korchi|korte|korbo|korben)\b/,
    /\b(kotha|kothay|koi|ekhane|okhane)\b/,
    /\b(aso|asho|asbo|jacchi|jabo|jai|gele|chilam)\b/,
    /\b(kisu|kichu|kisu ekta|kisui|kharap|valo na)\b/,
    /\b(khabo|khacchi|khailam|khabi)\b/,
    /\b(hasi|hahaha|lmao|xD)\b/,
    /\b(bangla|banglish)\b/
  ];
  return patterns.some(r => r.test(t));
}

// Decide if we should answer this message based on mode and heuristics
function shouldAnswer({ mode, body, botId, event }) {
  if (!body || typeof body !== "string") return false;
  const text = body.trim();
  if (mode === "all") return true;
  // mention mode: only if user mentioned bot or replied to bot
  const repliedToBot = event.messageReply && String(event.messageReply.senderID) === String(botId);
  const mentionsBot = event.mentions && Object.keys(event.mentions).some(id => String(id) === String(botId));
  if (mode === "mention") return repliedToBot || mentionsBot;

  // smart mode: question or addresses bot by name, or reply to bot
  const looksQuestion = /\?|\b(how|why|what|kivabe|kemne|ki|kemon|কিভাবে|কেন|কি|কেমন)\b/i.test(text);
  const callsBot = /(abir|bot|বট|আবির)/i.test(text) || mentionsBot;
  return repliedToBot || looksQuestion || callsBot;
}

function buildSystemPrompt(lang, preferBn) {
  const base = [
    "You are Abir Bot, a helpful Messenger assistant.",
    "- Be concise, friendly, and safe.",
    "- The user may write Bangla in Latin letters (Banglish).",
    "- Correctly infer intent from Banglish and respond naturally.",
  ];
  if (lang === "bn" || (lang === "auto" && preferBn)) {
    base.push("- Reply in Bangla (Bengali). If the user uses Banglish, reply in proper Bangla.");
  } else if (lang === "en") {
    base.push("- Reply in English.");
  } else {
    base.push("- Detect language: reply in Bangla if the user writes in Bangla/Banglish, otherwise reply in English.");
  }
  // Lightweight examples to guide Banglish
  base.push("Examples:");
  base.push("User: kmn aso? → Assistant (bn): আমি ভালো আছি, তুমি কেমন আছ?\nUser: tumi ki korte paro? → Assistant (bn): আমি বিভিন্ন প্রশ্নের উত্তর দিতে পারি।");
  return base.join("\n");
}

async function callAIWithProvider(messages) {
  try {
    const out = await aiProvider.chat({ baseDir: path.join(__dirname, "..", ".."), messages, opts: {} });
    if (!out) return "Sorry, I couldn't generate a reply right now.";
    return out.length > 2800 ? out.slice(0, 2800) + "…" : out;
  } catch (e) {
    return "Sorry, AI is busy right now. Please try again.";
  }
}

function getThreadConf(store, tid) {
  const def = { enabled: false, mode: "smart", lang: "auto", cooldown: 20, contextOn: true, lastTs: 0, ctx: [] };
  const c = store.threads[tid] || def;
  // fill defaults
  return { ...def, ...c };
}

function updateContext(conf, userText, botText) {
  if (!conf.contextOn) return;
  conf.ctx = conf.ctx || [];
  conf.ctx.push({ role: "user", content: userText });
  conf.ctx.push({ role: "assistant", content: botText });
  if (conf.ctx.length > 8) conf.ctx.splice(0, conf.ctx.length - 8);
}

module.exports.handleEvent = async function({ api, event, logger }) {
  try {
    if (event.type !== "message") return;
    const { threadID, body } = event;
    if (!body || typeof body !== "string") return;

    // If curated autoreply is enabled for this thread, let it handle to avoid double answers
    try {
      const ar = fs.existsSync(AUTOREPLY_STORE) ? fs.readJsonSync(AUTOREPLY_STORE) : { enabledThreads: [] };
      if (Array.isArray(ar.enabledThreads) && ar.enabledThreads.includes(String(threadID))) return;
    } catch {}

    const store = loadStore();
    const conf = getThreadConf(store, String(threadID));
    if (!conf.enabled) return;

    const now = Date.now();
    if (conf.lastTs && now - conf.lastTs < Math.max(5, conf.cooldown) * 1000) return;

    const botId = api.getCurrentUserID();
    if (!shouldAnswer({ mode: conf.mode, body, botId, event })) return;

    const preferBn = isBanglaText(body) || looksBanglish(body);
    const sys = buildSystemPrompt(conf.lang, preferBn);

    // Build messages for chat provider (system + optional short context + user)
    const messages = [
      { role: "system", content: sys }
    ];
    if (conf.contextOn && conf.ctx && conf.ctx.length) {
      for (const m of conf.ctx.slice(-6)) {
        messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
      }
    }
    messages.push({ role: "user", content: body });

    const reply = await callAIWithProvider(messages);
    conf.lastTs = Date.now();
    updateContext(conf, body, reply);
    store.threads[String(threadID)] = conf;
    saveStore(store);

    return api.sendMessage(reply, threadID);
  } catch (e) {
    // be quiet on failure
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const store = loadStore();
  const id = String(threadID);
  const conf = getThreadConf(store, id);
  const sub = (args[0] || "").toLowerCase();

  if (sub === "on") {
    conf.enabled = true; store.threads[id] = conf; saveStore(store);
    return api.sendMessage("AutoAI: enabled for this thread.", threadID, undefined, messageID);
  }
  if (sub === "off") {
    conf.enabled = false; store.threads[id] = conf; saveStore(store);
    return api.sendMessage("AutoAI: disabled for this thread.", threadID, undefined, messageID);
  }
  if (sub === "mode") {
    const m = (args[1] || "").toLowerCase();
    if (!/^(smart|all|mention)$/.test(m)) return api.sendMessage("Usage: autoai mode <smart|all|mention>", threadID, undefined, messageID);
    conf.mode = m; store.threads[id] = conf; saveStore(store);
    return api.sendMessage(`AutoAI mode set to ${m.toUpperCase()}.`, threadID, undefined, messageID);
  }
  if (sub === "lang") {
    const l = (args[1] || "").toLowerCase();
    if (!/^(auto|bn|en)$/.test(l)) return api.sendMessage("Usage: autoai lang <auto|bn|en>", threadID, undefined, messageID);
    conf.lang = l; store.threads[id] = conf; saveStore(store);
    return api.sendMessage(`AutoAI language set to ${l.toUpperCase()}.`, threadID, undefined, messageID);
  }
  if (sub === "cooldown") {
    const sec = parseInt(args[1], 10);
    if (!sec || sec < 5 || sec > 600) return api.sendMessage("Usage: autoai cooldown <5..600>", threadID, undefined, messageID);
    conf.cooldown = sec; store.threads[id] = conf; saveStore(store);
    return api.sendMessage(`AutoAI cooldown set to ${sec}s.`, threadID, undefined, messageID);
  }
  if (sub === "context") {
    const v = (args[1] || "").toLowerCase();
    if (!/^(on|off)$/.test(v)) return api.sendMessage("Usage: autoai context <on|off>", threadID, undefined, messageID);
    conf.contextOn = (v === "on"); if (!conf.contextOn) conf.ctx = []; store.threads[id] = conf; saveStore(store);
    return api.sendMessage(`AutoAI context ${v.toUpperCase()}.`, threadID, undefined, messageID);
  }

  // status
  const lines = [
    "AutoAI status:",
    `• enabled : ${conf.enabled}`,
    `• mode    : ${conf.mode}`,
    `• lang    : ${conf.lang}`,
    `• cooldown: ${conf.cooldown}s`,
    `• context : ${conf.contextOn ? "ON" : "OFF"}`
  ].join("\n");
  return api.sendMessage(lines, threadID, undefined, messageID);
};
