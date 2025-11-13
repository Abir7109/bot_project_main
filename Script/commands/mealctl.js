const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mealctl",
  description: "Set/view controller, and DM the controller a control panel",
  usages: "mealctl set <controller_uid> | mealctl get | mealctl dm",
  cooldowns: 3,
  credits: "Abir"
};

const STORE = path.join(__dirname, "..", "..", "data", "meals.json");
function load() {
  try {
    if (!fs.existsSync(STORE)) {
      fs.ensureDirSync(path.dirname(STORE));
      fs.writeJsonSync(STORE, { threads: {}, sessions: {}, sessionsPending: {}, dmThreads: {} }, { spaces: 2 });
    }
    const d = fs.readJsonSync(STORE);
    if (!d.threads) d.threads = {};
    if (!d.sessions) d.sessions = {};
    if (!d.sessionsPending) d.sessionsPending = {};
    if (!d.dmThreads) d.dmThreads = {};
    return d;
  } catch { return { threads: {}, sessions: {}, sessionsPending: {}, dmThreads: {} }; }
}
function save(d) { try { fs.writeJsonSync(STORE, d, { spaces: 2 }); } catch {} }
function yyyymm(){ const dt=new Date(); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }
function clamp(v){ const n=Math.floor(Number(v)); if(!Number.isFinite(n)) return 0; return Math.max(0,Math.min(2,n)); }
function totalMeals(u){ const bq=clamp(u?.bq||0), dq=clamp(u?.dq||0); return 0.25*(bq+dq); }

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const data = load();
  const id = String(threadID);
  data.threads[id] = data.threads[id] || { controller: null, controllers: [], months: {}, reminders: { enabled: false, times: [] } };
  // migrate single controller -> controllers array; also seed defaults
  if (data.threads[id].controller && (!Array.isArray(data.threads[id].controllers) || data.threads[id].controllers.length === 0)) {
    data.threads[id].controllers = [String(data.threads[id].controller)];
  }
  if (!Array.isArray(data.threads[id].controllers)) data.threads[id].controllers = [];
  // seed default controllers if none (global controllers)
  const defaults = ["61556527816380","100066185562053"];
  if (data.threads[id].controllers.length === 0) {
    data.threads[id].controllers = defaults.slice();
  }

  const sub = (args[0] || "").toLowerCase();
  if (sub === "set") {
    const uid = (args[1] || "").trim();
    if (!/^\d+$/.test(uid)) return api.sendMessage("Usage: mealctl set <controller_uid>", threadID, undefined, messageID);
    if (!data.threads[id].controllers.includes(uid)) data.threads[id].controllers.push(uid);
    // keep legacy field in sync
    data.threads[id].controller = data.threads[id].controllers[0] || null;
    save(data);
    return api.sendMessage(`Controller added: UID ${uid}. Current controllers: ${data.threads[id].controllers.join(", ")}`, threadID, undefined, messageID);
  }
  if (sub === "del" || sub === "remove") {
    const uid = (args[1] || "").trim();
    if (!/^\d+$/.test(uid)) return api.sendMessage("Usage: mealctl del <controller_uid>", threadID, undefined, messageID);
    data.threads[id].controllers = data.threads[id].controllers.filter(x => x !== uid);
    data.threads[id].controller = data.threads[id].controllers[0] || null;
    save(data);
    return api.sendMessage(`Controller removed: UID ${uid}. Current controllers: ${data.threads[id].controllers.join(", ") || '(none)'}`, threadID, undefined, messageID);
  }
  if (sub === "setthread") {
    const tid = (args[1] || "").trim();
    const val = /^\d+$/.test(tid) ? tid : id; // if not numeric provided, use current thread
    data.threads[id].controlThreadID = String(val);
    save(data);
    return api.sendMessage(`Control thread set to ${val}. Panels will be posted here.`, threadID, undefined, messageID);
  }

  if (sub === "dm") {
    const ctrls = data.threads[id].controllers || [];
    const ctrlThread = data.threads[id].controlThreadID;
    if (ctrlThread) {
      try {
        // Build panel and send to control thread (group thread)
        const info = await api.getThreadInfo(id);
        const ids = (info.participantIDs || []).map(String);
        const names = await api.getUserInfo(ids);
        const month = yyyymm();
        const bucket = data.threads[id].months[month] = data.threads[id].months[month] || { users: {}, history: [] };
        let body = `🍽️ Meal Control — ${month}\n`+
                   `Thread: ${info.threadName || id}\n`+
                   `Reply here with: add <num> <bq> <dq> | remove <num> <bq> <dq> | set <num> <bq> <dq> | list | done\n`+
                   `(bq/dq are quarters 0..2; 2 quarters = 1 meal)\n\n`;
        const map = [];
        let idx = 1;
        for (const uid of ids) {
          const name = names[uid]?.name || `User ${uid}`;
          const u = bucket.users[uid] || { bq: 0, dq: 0 };
          const tm = totalMeals(u).toFixed(2);
          body += `${idx}. ${name}  BQ:${u.bq||0} DQ:${u.dq||0}  = ${tm}\n`;
          map.push({ uid, name });
          idx++;
        }
        data.sessions[String(ctrlThread)] = { threadID: id, month, map, startedAt: Date.now() };
        save(data);
        await api.sendMessage(body, String(ctrlThread));
        return api.sendMessage("Control panel posted in the control thread.", threadID, undefined, messageID);
      } catch (e) {
        // fall back to DMs
      }
    }
    if (!ctrls.length) return api.sendMessage("Set a controller first: mealctl set <uid>", threadID, undefined, messageID);
    try {
      const info = await api.getThreadInfo(threadID);
      const ids = (info.participantIDs || []).map(String);
      const names = await api.getUserInfo(ids);
      const month = yyyymm();
      const bucket = data.threads[id].months[month] = data.threads[id].months[month] || { users: {}, history: [] };
      let body = `🍽️ Meal Control — ${month}\n`+
                 `Thread: ${info.threadName || id}\n`+
                 `Reply here with: add <num> <bq> <dq> | remove <num> <bq> <dq> | set <num> <bq> <dq> | list | done\n`+
                 `(bq/dq are quarters 0..2; 2 quarters = 1 meal)\n\n`;
      const map = [];
      let idx = 1;
      for (const uid of ids) {
        const name = names[uid]?.name || `User ${uid}`;
        const u = bucket.users[uid] || { bq: 0, dq: 0 };
        const tm = totalMeals(u).toFixed(2);
        body += `${idx}. ${name}  BQ:${u.bq||0} DQ:${u.dq||0}  = ${tm}\n`;
        map.push({ uid, name });
        idx++;
      }
      const sent = [];
      const queued = [];
      for (const ctl of ctrls) {
        try {
          data.sessions[String(ctl)] = { threadID: id, month, map, startedAt: Date.now() };
          // Try sending to UID first; if fails, try cached DM thread
          try {
            await api.sendMessage(body, ctl);
            sent.push(ctl);
          } catch (e1) {
            const d = load();
            const cached = d.dmThreads[String(ctl)];
            if (cached && cached !== String(ctl)) {
              await api.sendMessage(body, String(cached));
              sent.push(ctl);
            } else {
              throw e1;
            }
          }
        } catch (e) {
          // queue pending; deliver when controller DMs the bot first
          const d = load(); d.sessionsPending[String(ctl)] = { threadID: id, queuedAt: Date.now() }; save(d);
          queued.push(ctl);
        }
      }
      save(data);
      const parts = [];
      if (sent.length) parts.push(`sent: ${sent.join(', ')}`);
      if (queued.length) parts.push(`queued (DM me first): ${queued.join(', ')}`);
      await api.sendMessage(`Control panel ${parts.join(' | ')}`, threadID, undefined, messageID);
      // Group fallback: tag queued controllers so they see instruction
      if (queued.length) {
        try {
          const info = await api.getUserInfo(queued);
          let body = "Controllers, please DM me once to activate control: ";
          const mentions = [];
          let fromIndex = body.length;
          queued.forEach((id, idx) => {
            const name = info?.[id]?.name || `Controller ${id}`;
            const tag = `@${name}`;
            body += (idx ? ", " : "") + tag;
            mentions.push({ id, tag, fromIndex });
            fromIndex += tag.length + (idx ? 2 : 0);
          });
          await api.sendMessage({ body, mentions }, threadID);
        } catch {}
      }
      return;
    } catch (e) {
      return api.sendMessage(`Failed to DM controller: ${e.message}`, threadID, undefined, messageID);
    }
  }

  // get (default)
  const ctrls = data.threads[id].controllers || [];
  const times = (data.threads[id].reminders?.times || []).join(", ") || "(none)";
  const enabled = !!data.threads[id].reminders?.enabled;
  const lines = [
    "Meal control (this thread)",
    `• Controllers  : ${ctrls.length ? ctrls.join(", ") : '(none)'}`,
    `• Reminders    : ${enabled ? "ON" : "OFF"}`,
    `• Times        : ${times}`,
    `• ControlThread: ${data.threads[id].controlThreadID || '(not set)'}
  ];
  return api.sendMessage(lines.join("\n"), threadID, undefined, messageID);
};

module.exports.handleEvent = async ({ api, event }) => {
  if (event.type !== 'message') return;
  const { threadID, body, senderID } = event;
  const data = load();
  // If this looks like a DM (threadID === senderID), cache DM thread
  try { if (String(threadID) === String(senderID)) { data.dmThreads[String(senderID)] = String(threadID); save(data); } } catch {}
  // If no active session but a pending session exists for this controller, auto-send the panel now
  const pending = data.sessionsPending[String(threadID)];
  if (!data.sessions[String(threadID)] && pending) {
    try {
      // Reuse the DM panel builder from mealsync by requiring it indirectly would be complex.
      // Build a light panel here.
      const id = pending.threadID;
      const info = await api.getThreadInfo(id);
      const ids = (info.participantIDs || []).map(String);
      const names = await api.getUserInfo(ids);
      const month = new Date();
      const mStr = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`;
      const bucket = (data.threads[id] = data.threads[id] || { controllers: [], months: {} }).months[mStr] = (data.threads[id].months[mStr] || { users: {}, history: [] });
      let bodyText = `🍽️ Meal Control — ${mStr}\nThread: ${info.threadName || id}\nReply here with: add <num> <bq> <dq> | remove <num> <bq> <dq> | set <num> <bq> <dq> | list | done\n(bq/dq are quarters 0..2; 2 quarters = 1 meal)\n\n`;
      const map = [];
      let idx = 1;
      for (const uid of ids) {
        const name = names[uid]?.name || `User ${uid}`;
        const u = bucket.users[uid] || { bq: 0, dq: 0 };
        const tm = (0.25 * ((u.bq||0)+(u.dq||0))).toFixed(2);
        bodyText += `${idx}. ${name}  BQ:${u.bq||0} DQ:${u.dq||0}  = ${tm}\n`;
        map.push({ uid, name });
        idx++;
      }
      data.sessions[String(threadID)] = { threadID: id, month: mStr, map, startedAt: Date.now() };
      delete data.sessionsPending[String(threadID)];
      save(data);
      await api.sendMessage(bodyText, threadID);
    } catch {}
  }
  const session = data.sessions[String(threadID)]; // threadID is controller's inbox (UID) in DMs
  if (!session) return;
  const text = (body || '').trim();
  const tokens = text.split(/\s+/);
  const cmd = (tokens[0] || '').toLowerCase();
  function reply(msg){ try { api.sendMessage(msg, threadID); } catch {}
  }
  if (cmd === 'done') {
    delete data.sessions[String(threadID)]; save(data);
    return reply('✅ Control session closed.');
  }
  if (cmd === 'list') {
    // re-list
    try {
      const info = await api.getThreadInfo(session.threadID);
      const ids = (info.participantIDs || []).map(String);
      const names = await api.getUserInfo(ids);
      const month = session.month;
      const bucket = (data.threads?.[session.threadID]?.months?.[month]) || { users: {} };
      let body = `🍽️ Meal Control — ${month}\n`;
      let idx=1; for (const uid of ids){ const u=bucket.users[uid]||{bq:0,dq:0}; const name=names[uid]?.name||`User ${uid}`; const tm=(0.25*((u.bq||0)+(u.dq||0))).toFixed(2); body += `${idx}. ${name}  BQ:${u.bq||0} DQ:${u.dq||0}  = ${tm}\n`; idx++; }
      return reply(body);
    } catch (e) { return reply(`List failed: ${e.message}`); }
  }
  if (!['add','remove','set'].includes(cmd)) return; // ignore other messages
  const index = parseInt(tokens[1], 10);
  const bq = clamp(tokens[2]);
  const dq = clamp(tokens[3]);
  if (!index || (cmd!=='set' && (!Number.isFinite(bq)||!Number.isFinite(dq)))) {
    return reply('Usage: add <num> <bq> <dq> | remove <num> <bq> <dq> | set <num> <bq> <dq>');
  }
  const map = session.map || [];
  const entry = map[index-1];
  if (!entry) return reply('Invalid number. Send list to see indices.');
  // Apply update
  const threadIDGroup = session.threadID;
  const month = session.month;
  const bucket = data.threads[threadIDGroup].months[month] = data.threads[threadIDGroup].months[month] || { users: {}, history: [] };
  const user = bucket.users[entry.uid] = bucket.users[entry.uid] || { bq: 0, dq: 0 };
  if (cmd === 'add') { user.bq = clamp(user.bq + bq); user.dq = clamp(user.dq + dq); }
  else if (cmd === 'remove') { user.bq = clamp(user.bq - bq); user.dq = clamp(user.dq - dq); }
  else { user.bq = bq; user.dq = dq; }
  bucket.history.push({ ts: Date.now(), uid: entry.uid, bq: user.bq, dq: user.dq, by: String(threadID) });
  save(data);
  const tm = totalMeals(user).toFixed(2);
  return reply(`Updated ${entry.name}: BQ=${user.bq} DQ=${user.dq} (= ${tm})`);
};
