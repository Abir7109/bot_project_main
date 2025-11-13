const fs = require("fs-extra");

module.exports.config = {
  name: "truth",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Random truth prompt",
  commandCategory: "fun",
  usages: "truth",
  cooldowns: 3
};

const ABIR_IMG = "https://i.postimg.cc/FF37J2Nd/abir4.jpg";

const PROMPTS = [
  "What is a fear you’ve never told anyone?",
  "Who was your first crush?",
  "What’s a secret goal you’re working on?",
  "What’s the most embarrassing thing you’ve done recently?",
  "What’s a habit you want to change?"
];

module.exports.run = async function ({ api, event }) {
  const cachePath = __dirname + "/cache";
  const imgPath = cachePath + "/truth.jpg";
  fs.ensureDirSync(cachePath);
  try {
    await require("request")(ABIR_IMG).pipe(fs.createWriteStream(imgPath)).on("close", () => {
      const body = `🧠 Truth: ${PROMPTS[Math.floor(Math.random() * PROMPTS.length)]}`;
      api.sendMessage({ body, attachment: fs.createReadStream(imgPath) }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
    });
  } catch (e) {
    api.sendMessage(`🧠 Truth: ${PROMPTS[Math.floor(Math.random() * PROMPTS.length)]}`, event.threadID, event.messageID);
  }
};
