module.exports.config = {
  name: "mealannounce",
  description: "Announce current month's meal counts with mentions",
  usages: "mealannounce",
  cooldowns: 5,
  credits: "Abir"
};

const fs = require("fs-extra");
const path = require("path");
const STORE = path.join(__dirname, "..", "..", "data", "meals.json");
function load() {
  try {
    if (!fs.existsSync(STORE)) return { threads: {} };
    const d = fs.readJsonSync(STORE); if (!d.threads) d.threads = {}; return d;
  } catch { return { threads: {} }; }
}
function yyyymm() { const dt = new Date(); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }
function clamp(v){ const n=Math.floor(Number(v)); if(!Number.isFinite(n)) return 0; return Math.max(0,Math.min(2,n)); }
function totalMeals(u){ const bq=clamp(u?.bq||0), dq=clamp(u?.dq||0); return 0.25*(bq+dq); }

module.exports.run = async ({ api, event }) => {
  const { threadID } = event;
  const month = yyyymm();
  const data = load();
  const bucket = data.threads?.[String(threadID)]?.months?.[month];
  if (!bucket || !bucket.users) return api.sendMessage("No meal data yet.", threadID);
  try {
    const info = await api.getThreadInfo(threadID);
    const ids = (info.participantIDs || []).map(String);
    const names = await api.getUserInfo(ids);

    let body = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`+
               `┃   🍽️ Meals • ${month}               ┃\n`+
               `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
    const mentions = [];
    let fromIndex = body.length;
    for (const id of ids) {
      const u = bucket.users[id] || { bq: 0, dq: 0 };
      const name = (names[id]?.name || `User ${id}`).slice(0, 22);
      const tag = `@${name}`;
      const tm = totalMeals(u).toFixed(2);
      const line = `${tag}  BQ:${u.bq||0} DQ:${u.dq||0} = ${tm}\n`;
      body += line;
      mentions.push({ id, tag, fromIndex });
      fromIndex += line.length;
    }
    body += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    return api.sendMessage({ body, mentions }, threadID);
  } catch (e) {
    return api.sendMessage(`Announce failed: ${e.message}`, threadID);
  }
};
