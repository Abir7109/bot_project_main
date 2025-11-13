const fs = require("fs-extra");

module.exports.config = {
  name: "dare",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Random dare prompt",
  commandCategory: "fun",
  usages: "dare",
  cooldowns: 3
};

const ABIR_IMG = "https://i.postimg.cc/FF37J2Nd/abir4.jpg";

const DARES = [
  "Send a voice note saying 'I love coding!'",
  "Change your nickname to 'Coder' for 24h",
  "Compliment 3 people in this chat",
  "Tell a funny story from school",
  "Share your favorite meme"
];

module.exports.run = async function ({ api, event }) {
  const path = __dirname + "/cache/dare.jpg";
  try {
    await require("request")(ABIR_IMG).pipe(fs.createWriteStream(path)).on("close", () => {
      const body = `🔥 Dare: ${DARES[Math.floor(Math.random() * DARES.length)]}`;
      api.sendMessage({ body, attachment: fs.createReadStream(path) }, event.threadID, () => fs.unlinkSync(path));
    });
  } catch (e) {
    api.sendMessage(`🔥 Dare: ${DARES[Math.floor(Math.random() * DARES.length)]}`, event.threadID);
  }
};
