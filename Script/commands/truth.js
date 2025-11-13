const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "truth",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Play truth game and earn points by answering",
  commandCategory: "fun",
  usages: "truth",
  cooldowns: 3
};

const ABIR_IMG = "https://i.postimg.cc/rFnmYvCy/abir4.jpg";

const TRUTHS = [
  "What is a fear you've never told anyone?",
  "Who was your first crush?",
  "What's a secret goal you're working on?",
  "What's the most embarrassing thing you've done recently?",
  "What's a habit you want to change?",
  "What's the biggest lie you've told?",
  "Who do you secretly admire in this group?",
  "What's something you're afraid to admit?",
  "Have you ever stalked someone's profile?",
  "What's your biggest insecurity?",
  "What's the last thing you searched on Google?",
  "Have you ever had a crush on a friend's partner?",
  "What's the most childish thing you still do?",
  "What's your most embarrassing moment in public?",
  "Have you ever pretended to be sick to avoid something?"
];

const dataPath = path.join(__dirname, "..", "..", "data", "truthdare.json");
const pendingReplies = new Map(); // Store messageID -> user/type mapping

function loadData() {
  fs.ensureDirSync(path.dirname(dataPath));
  if (!fs.existsSync(dataPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.ensureDirSync(path.dirname(dataPath));
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
}

function getPoints(userID) {
  const data = loadData();
  return data[userID] || { truth: 0, dare: 0, total: 0 };
}

function addPoints(userID, type) {
  const data = loadData();
  if (!data[userID]) {
    data[userID] = { truth: 0, dare: 0, total: 0 };
  }
  data[userID][type] += 1;
  data[userID].total += 1;
  saveData(data);
  return data[userID];
}

module.exports.handleReply = async function({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const replyData = pendingReplies.get(event.messageReply?.messageID);
  
  if (!replyData || replyData.type !== 'truth') return;
  
  if (body.trim().length < 10) {
    return api.sendMessage("⚠️ Please give a proper answer (at least 10 characters) to earn points!", threadID, messageID);
  }
  
  const points = addPoints(senderID, 'truth');
  pendingReplies.delete(event.messageReply.messageID);
  
  const response = `✅ Truth completed!\n\n🎯 You earned 1 point!\n\n📊 Your Stats:\n🧠 Truth Points: ${points.truth}\n🔥 Dare Points: ${points.dare}\n⭐ Total Points: ${points.total}`;
  
  return api.sendMessage(response, threadID, messageID);
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const cachePath = __dirname + "/cache";
  const imgPath = cachePath + "/truth.jpg";
  fs.ensureDirSync(cachePath);
  
  const truth = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
  const points = getPoints(senderID);
  
  const message = `🧠 TRUTH CHALLENGE\n\n❓ ${truth}\n\n💡 Reply to this message with your answer to earn 1 point!\n\n📊 Your Current Stats:\n🧠 Truth: ${points.truth} | 🔥 Dare: ${points.dare}\n⭐ Total: ${points.total} points`;
  
  try {
    await require("request")(ABIR_IMG).pipe(fs.createWriteStream(imgPath)).on("close", () => {
      api.sendMessage(
        { body: message, attachment: fs.createReadStream(imgPath) },
        threadID,
        (err, info) => {
          fs.unlinkSync(imgPath);
          if (!err && info?.messageID) {
            pendingReplies.set(info.messageID, { userID: senderID, type: 'truth' });
            setTimeout(() => pendingReplies.delete(info.messageID), 300000); // 5 min timeout
          }
        },
        messageID
      );
    });
  } catch (e) {
    api.sendMessage(
      message,
      threadID,
      (err, info) => {
        if (!err && info?.messageID) {
          pendingReplies.set(info.messageID, { userID: senderID, type: 'truth' });
          setTimeout(() => pendingReplies.delete(info.messageID), 300000);
        }
      },
      messageID
    );
  }
};
