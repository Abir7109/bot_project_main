const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mealsync",
  description: "Auto-sync group members into meal roster on join/leave",
  usages: "(event-based)",
  cooldowns: 0,
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

async function syncThreadRoster(api, threadID) {
  const info = await api.getThreadInfo(threadID);
  const ids = (info.participantIDs || []).map(String);
  const data = load();
  const id = String(threadID);
  data.threads[id] = data.threads[id] || { controller: null, months: {}, reminders: { enabled: false, times: [] } };
  const month = yyyymm();
  const bucket = data.threads[id].months[month] = data.threads[id].months[month] || { users: {}, history: [] };
  const before = new Set(Object.keys(bucket.users || {}));
  for (const uid of ids) {
    bucket.users[uid] = bucket.users[uid] || { bq: 0, dq: 0 };
  }
  save(data);
  const added = ids.filter(u => !before.has(u));
  return { count: ids.length, name: info.threadName || id, ids, added };
}

async function announceRoster(api, threadID, header) {
  try {
    const info = await api.getThreadInfo(threadID);
    const ids = (info.participantIDs || []).map(String);
    const names = await api.getUserInfo(ids);
    const lines = [header, "", ...ids.map((id, i) => `${String(i+1).padStart(2,'0')}. ${names[id]?.name || ('User '+id)}  •  UID: ${id}`)];
    lines.push("", "Your meals will now be counted. Use /meal to view the table.");
    await api.sendMessage(lines.join("\n"), threadID);
  } catch {}
}

async function dmControllerPanel(api, threadID, ctlUID) {
  const data = load();
  try {
    const id = String(threadID);
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
    data.sessions[String(ctlUID)] = { threadID: id, month, map, startedAt: Date.now() };
    save(data);
    // Try user UID first, then cached DM thread if needed
    try {
      await api.sendMessage(body, String(ctlUID));
      return true;
    } catch (e1) {
      try {
        const target = String(load().dmThreads[String(ctlUID)] || ctlUID);
        if (target !== String(ctlUID)) {
          await api.sendMessage(body, target);
          return true;
        }
      } catch (_) {}
      throw e1;
    }
  } catch (e) {
    // queue a pending session that will trigger when the controller DMs the bot first
    data.sessionsPending[String(ctlUID)] = { threadID: String(threadID), queuedAt: Date.now() };
    save(data);
    return false;
  }
}

module.exports.handleEvent = async ({ api, event }) => {
  try {
    if (event.type === 'event') {
      const t = event.logMessageType;
      if (t === 'log:subscribe' || t === 'log:unsubscribe') {
        const res = await syncThreadRoster(api, event.threadID);
        if (res && res.ids && res.ids.length) {
          await announceRoster(api, event.threadID, `✅ Mess members synced for '${res.name}' (${res.count} members)`);
          const data = load();
          const ctrlThread = data.threads?.[String(event.threadID)]?.controlThreadID;
          if (ctrlThread) {
            try { await dmControllerPanel(api, event.threadID, ctrlThread); } catch {}
          } else {
            const ctrls = data.threads?.[String(event.threadID)]?.controllers || [];
            for (const ctl of ctrls) { await dmControllerPanel(api, event.threadID, ctl); }
          }
        }
      }
    }
    if (event.type === 'message') {
      // Lazy init on first message if not present
      const data = load();
      const id = String(event.threadID);
      const month = yyyymm();
      const exists = data.threads?.[id]?.months?.[month]?.users;
      if (!exists) {
        const res = await syncThreadRoster(api, event.threadID);
        if (res && res.ids && res.ids.length) {
          await announceRoster(api, event.threadID, `✅ Mess members initialized for '${res.name}' (${res.count} members)`);
          const ctrlThread = data.threads?.[String(event.threadID)]?.controlThreadID;
          if (ctrlThread) {
            try { await dmControllerPanel(api, event.threadID, ctrlThread); } catch {}
          } else {
            const ctrls = data.threads?.[String(event.threadID)]?.controllers || [];
            for (const ctl of ctrls) { await dmControllerPanel(api, event.threadID, ctl); }
          }
        }
      }
    }
  } catch {}
};

module.exports.run = async ({ api, event }) => {
  try {
    const { count, name } = await syncThreadRoster(api, event.threadID);
    return api.sendMessage(`Synced ${count} members for '${name}'.`, event.threadID);
  } catch (e) {
    return api.sendMessage(`Sync failed: ${e.message}`, event.threadID);
  }
};
