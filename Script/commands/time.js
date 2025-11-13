const axios = require("axios");
const request = require("request");
const fs = require("fs-extra");
const moment = require("moment-timezone");

module.exports.config = {
  name: "time",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Displays current time and bot runtime",
  commandCategory: "Info",
  cooldowns: 1
};

module.exports.run = async function({ api, event }) {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const currentTime = moment.tz("Asia/Dhaka").format("[D/MM/YYYY] [hh:mm:ss]");

  const imgLinks = [
    "https://i.postimg.cc/rFnmYvCy/abir4.jpg",
    "https://i.imgur.com/EuiRi4v.jpeg",
    "https://i.imgur.com/ZjxQx17.jpeg"
  ];

  const cachePath = __dirname + "/cache";
  const imgPath = cachePath + "/time.jpg";
  const imgURL = imgLinks[Math.floor(Math.random() * imgLinks.length)];

  const message = `🌸 Assalamu Alaikum 🌸\n\n✨ Bot PREFIX: /\n\n📆 Current Time: ${currentTime}\n\n⏱️ Bot Uptime: ${hours} hour(s), ${minutes} minute(s), ${seconds} second(s)\n\n👤 BOT ADMIN: ABIR\n\n🌟 ABIR Chat Bot 🌟`;

  fs.ensureDirSync(cachePath);
  
  const callback = () => {
    api.sendMessage({
      body: message,
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
  };

  request(encodeURI(imgURL)).pipe(fs.createWriteStream(imgPath)).on("close", callback);
};
