const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "admin",
  description: "Show Abir's owner info",
  usages: "admin",
  cooldowns: 5
};

module.exports.run = async ({ api, event, config, now }) => {
  const { threadID, messageID } = event;
  const owner = config.OWNER || {};
  const lines = [
    "┌───────────────⭓",
    "│ OWNER DETAILS",
    "├───────────────",
    `│ 👤 Name : ${owner.name || "Abir"}`,
    `│ 📘 Facebook : ${owner.facebook || "(set in config.json)"}`,
    `│ 💬 WhatsApp : ${owner.whatsapp || "(set in config.json)"}`,
    "└───────────────⭓",
    "",
    "┌───────────────⭓",
    "│ Time",
    "├───────────────",
    `│ ${now()}`,
    "└───────────────⭓"
  ].join("\n");

  const photoUrl = owner.photo;
  if (!photoUrl) return api.sendMessage(lines, threadID, undefined, messageID);

  try {
    const tmp = path.join(__dirname, "..", "..", "tmp_admin_photo.jpg");
    const res = await axios.get(photoUrl, { responseType: "stream" });
    await new Promise((resolve, reject) => {
      const w = fs.createWriteStream(tmp);
      res.data.pipe(w);
      w.on("finish", resolve);
      w.on("error", reject);
    });
    api.sendMessage({ body: lines, attachment: fs.createReadStream(tmp) }, threadID, () => {
      try { fs.unlinkSync(tmp); } catch {}
    }, messageID);
  } catch (e) {
    api.sendMessage(lines, threadID, undefined, messageID);
  }
};
