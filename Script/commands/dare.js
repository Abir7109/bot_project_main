const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "dare",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Play dare game and earn points by completing",
  commandCategory: "fun",
  usages: "dare",
  cooldowns: 3
};

const ABIR_IMG = "https://i.postimg.cc/rFnmYvCy/abir4.jpg";

const DARES = [
  "Send a voice note saying 'I love coding!'",
  "Change your nickname to 'Daredevil' for 1 hour",
  "Compliment 3 people in this chat",
  "Tell a funny story from school",
  "Share your favorite meme",
  "Send a selfie with a funny face",
  "Do 10 pushups and send proof",
  "Sing a song in voice note",
  "Text your crush 'Hey'",
  "Share your most embarrassing photo",
  "Call someone random and say 'I miss you'",
  "Post a story praising this bot",
  "Share your search history screenshot",
  "Let someone else text from your account for 5 minutes",
  "Change your profile picture to a funny one"
];

const dataPath = path.join(__dirname, "..", "..", "data", "truthdare.json");
const pendingReplies = new Map();

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
  
  if (!replyData || replyData.type !== 'dare') return;
  
  const hasAttachment = event.attachments && event.attachments.length > 0;
  const hasText = body.trim().length >= 5;
  
  if (!hasAttachment && !hasText) {
    return api.sendMessage("⚠️ Please send proof (photo/video/voice) or text confirmation (at least 5 characters) to earn points!", threadID, messageID);
  }
  
  const points = addPoints(senderID, 'dare');
  pendingReplies.delete(event.messageReply.messageID);
  
  const response = `✅ Dare completed!\n\n🎯 You earned 1 point!\n\n📊 Your Stats:\n🧠 Truth Points: ${points.truth}\n🔥 Dare Points: ${points.dare}\n⭐ Total Points: ${points.total}\n\n🏆 Keep playing to earn more!`;
  
  return api.sendMessage(response, threadID, messageID);
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const cachePath = __dirname + "/cache";
  const imgPath = cachePath + "/dare.jpg";
  fs.ensureDirSync(cachePath);
  
  const dare = DARES[Math.floor(Math.random() * DARES.length)];
  const points = getPoints(senderID);
  
  const message = `🔥 DARE CHALLENGE\n\n🎯 ${dare}\n\n💡 Reply to this message with proof or confirmation to earn 1 point!\n\n📊 Your Current Stats:\n🧠 Truth: ${points.truth} | 🔥 Dare: ${points.dare}\n⭐ Total: ${points.total} points`;
  
  try {
    await require("request")(ABIR_IMG).pipe(fs.createWriteStream(imgPath)).on("close", () => {
      api.sendMessage(
        { body: message, attachment: fs.createReadStream(imgPath) },
        threadID,
        (err, info) => {
          fs.unlinkSync(imgPath);
          if (!err && info?.messageID) {
            pendingReplies.set(info.messageID, { userID: senderID, type: 'dare' });
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
          pendingReplies.set(info.messageID, { userID: senderID, type: 'dare' });
          setTimeout(() => pendingReplies.delete(info.messageID), 300000);
        }
      },
      messageID
    );
  }
};
