const fs = require("fs-extra");

module.exports.config = {
  name: "joke",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Send a random clean joke",
  commandCategory: "fun",
  usages: "joke",
  cooldowns: 3
};

const ABIR_IMG = "https://i.postimg.cc/FF37J2Nd/abir4.jpg";

const JOKES = [
  "Why don't programmers like nature? It has too many bugs!",
  "I told my computer I needed a break… it said 'No problem, I'll go to sleep.'",
  "Why did the function break up with the loop? It needed space.",
  "Debugging: Removing needles from a haystack."
];

module.exports.run = async function ({ api, event }) {
  const path = __dirname + "/cache/joke.jpg";
  try {
    await require("request")(ABIR_IMG).pipe(fs.createWriteStream(path)).on("close", () => {
      const body = `😂 ${JOKES[Math.floor(Math.random() * JOKES.length)]}`;
      api.sendMessage({ body, attachment: fs.createReadStream(path) }, event.threadID, () => fs.unlinkSync(path));
    });
  } catch (e) {
    api.sendMessage(JOKES[Math.floor(Math.random() * JOKES.length)], event.threadID);
  }
};
