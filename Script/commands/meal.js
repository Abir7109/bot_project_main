const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "meal",
  description: "Manage meals: add/set quarters; show your own totals/history",
  usages: "meal add @user <bq> <dq> | meal set @user <bq> <dq> | meal | meal history [@user]",
  cooldowns: 3,
  credits: "Abir"
};

const STORE = path.join(__dirname, "..", "..", "data", "meals.json");
function load() {
  try {
    if (!fs.existsSync(STORE)) {
      fs.ensureDirSync(path.dirname(STORE));
      fs.writeJsonSync(STORE, { threads: {} }, { spaces: 2 });
    }
    const d = fs.readJsonSync(STORE);
    if (!d.threads) d.threads = {};
    return d;
  } catch { return { threads: {} }; }
}
function save(d) { try { fs.writeJsonSync(STORE, d, { spaces: 2 }); } catch {} }
function yyyymm() {
  const dt = new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
}
function clamp(v) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(2, n));
}
function totalMeals(u) {
  const bq = clamp(u.bq||0), dq = clamp(u.dq||0);
  return 0.25 * (bq + dq); // perMealHalf rule
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, mentions } = event;
  const data = load();
  const tid = String(threadID);
  data.threads[tid] = data.threads[tid] || { controller: null, months: {}, reminders: { enabled: false, times: [] } };
  const month = yyyymm();
  const bucket = data.threads[tid].months[month] = data.threads[tid].months[month] || { users: {}, history: [] };

  const sub = (args[0] || '').toLowerCase();
  if (sub === 'add' || sub === 'set') {
    const ids = Object.keys(mentions || {});
    if (!ids.length) return api.sendMessage("Tag one user. Usage: meal add @user <bq> <dq>", threadID, undefined, messageID);
    const uid = ids[0];
    const bq = clamp(args[args.length-2]);
    const dq = clamp(args[args.length-1]);
    const entry = bucket.users[uid] = bucket.users[uid] || { bq: 0, dq: 0 };
    if (sub === 'add') { entry.bq = clamp(entry.bq + bq); entry.dq = clamp(entry.dq + dq); }
    else { entry.bq = bq; entry.dq = dq; }
    bucket.history.push({ ts: Date.now(), uid, bq: entry.bq, dq: entry.dq, by: String(event.senderID) });
    save(data);
    return api.sendMessage(`Updated: <@${uid}> → BQ=${entry.bq}, DQ=${entry.dq} (month ${month})`, threadID, undefined, messageID);
  }

  if (sub === 'history') {
    let uid = Object.keys(mentions || {})[0];
    if (!uid) uid = String(event.senderID);
    const list = (bucket.history || []).filter(h => h.uid === uid).slice(-10);
    if (!list.length) return api.sendMessage("No history.", threadID, undefined, messageID);
    const lines = [
      `Meal history (last 10) — ${month}`,
      ...list.map(h => `• ${new Date(h.ts).toLocaleString('en-GB')} → BQ=${h.bq}, DQ=${h.dq}`)
    ];
    return api.sendMessage(lines.join("\n"), threadID, undefined, messageID);
  }

  // show mine (compact)
  try {
    const uid = String(event.senderID);
    const info = await api.getUserInfo([uid]);
    const name = info?.[uid]?.name || `User ${uid}`;
    const u = bucket.users[uid] = bucket.users[uid] || { bq: 0, dq: 0 };
    const tm = totalMeals(u).toFixed(2);
    const lines = [
      `🍽️ Your Meals — ${month}`,
      `${name}`,
      `BQ:${u.bq||0}  DQ:${u.dq||0}  = ${tm}`,
      `Tip: /meal history to see last changes`
    ];
    return api.sendMessage(lines.join("\n"), threadID, undefined, messageID);
  } catch (e) {
    return api.sendMessage(`Failed: ${e.message}`, threadID, undefined, messageID);
  }
};
