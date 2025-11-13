const axios = require("axios");
const simsim = "https://simsimi.cyberbot.top";

// Local cache for handleReply tracking
const replyCache = new Map(); // messageID -> { author, type }

module.exports.config = {
  name: "baby",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Cute AI Baby Chatbot | Talk, Teach & Chat with Emotion ☢️",
  commandCategory: "simsim",
  usages: "[message/query]",
  cooldowns: 0,
  prefix: false
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const uid = event.senderID;
    let senderName = "Friend";
    try {
      const userInfo = await api.getUserInfo(uid);
      senderName = userInfo[uid]?.name || "Friend";
    } catch (e) {
      console.error("Error getting user name:", e);
    }
    const rawQuery = args.join(" "); 
    const query = rawQuery.toLowerCase(); 

    if (!query) {
      const ran = ["Bolo baby", "hum"];
      const r = ran[Math.floor(Math.random() * ran.length)];
      return api.sendMessage(r, event.threadID, (err, info) => {
        if (!err && info?.messageID) {
          replyCache.set(info.messageID, { author: event.senderID, type: "simsimi" });
          setTimeout(() => replyCache.delete(info.messageID), 300000); // 5 min timeout
        }
      });
    }

    const command = args[0].toLowerCase();
    
    if (["remove", "rm"].includes(command)) {
      const parts = rawQuery.replace(/^(remove|rm)\s*/i, "").split(" - ");
      if (parts.length < 2)
        return api.sendMessage("❌ | Use: remove [Question] - [Reply]", event.threadID, event.messageID);
      const [ask, ans] = parts.map(p => p.trim());
      const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
      return api.sendMessage(res.data.message, event.threadID, event.messageID);
    }

    if (command === "list") {
      const res = await axios.get(`${simsim}/list`);
      if (res.data.code === 200) {
        return api.sendMessage(
          `♾ Total Questions Learned: ${res.data.totalQuestions}\n★ Total Replies Stored: ${res.data.totalReplies}\n☠️ Developer: ${res.data.author}`,
          event.threadID, event.messageID
        );
      } else {
        return api.sendMessage(`Error: ${res.data.message || "Failed to fetch list"}`, event.threadID, event.messageID);
      }
    }

    if (command === "edit") {
      const parts = rawQuery.replace(/^edit\s*/i, "").split(" - ");
      if (parts.length < 3)
        return api.sendMessage("❌ | Use: edit [Question] - [OldReply] - [NewReply]", event.threadID, event.messageID);
      const [ask, oldReply, newReply] = parts.map(p => p.trim());
      const res = await axios.get(`${simsim}/edit?ask=${encodeURIComponent(ask)}&old=${encodeURIComponent(oldReply)}&new=${encodeURIComponent(newReply)}`);
      return api.sendMessage(res.data.message, event.threadID, event.messageID);
    }

    if (command === "teach") {
      const parts = rawQuery.replace(/^teach\s*/i, "").split(" - ");
      if (parts.length < 2)
        return api.sendMessage("❌ | Use: teach [Question] - [Reply]", event.threadID, event.messageID);

      const [ask, ans] = parts.map(p => p.trim());
      
      const groupID = event.threadID; 
      let groupName = event.threadName ? event.threadName.trim() : ""; 
      
      if (!groupName && groupID != uid) {
        try {
          const threadInfo = await api.getThreadInfo(groupID);
          if (threadInfo && threadInfo.threadName) {
            groupName = threadInfo.threadName.trim();
          }
        } catch (error) {
          console.error(`Error fetching thread info for ID ${groupID}:`, error);
        }
      }

      let teachUrl = `${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}&groupID=${encodeURIComponent(groupID)}`;
      
      if (groupName) {
        teachUrl += `&groupName=${encodeURIComponent(groupName)}`;
      }

      const res = await axios.get(teachUrl);
      return api.sendMessage(`${res.data.message || "Reply added successfully!"}`, event.threadID, event.messageID);
    }

    const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`);
    const responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

    for (const reply of responses) {
      await new Promise((resolve) => {
        api.sendMessage(reply, event.threadID, (err, info) => {
          if (!err && info?.messageID) {
            replyCache.set(info.messageID, { author: event.senderID, type: "simsimi" });
            setTimeout(() => replyCache.delete(info.messageID), 300000);
          }
          resolve();
        }, event.messageID);
      });
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(`❌ | Error in baby command: ${err.message}`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event }) {
  try {
    const cachedData = replyCache.get(event.messageReply?.messageID);
    if (!cachedData || cachedData.type !== 'simsimi') return;
    
    let senderName = "Friend";
    try {
      const userInfo = await api.getUserInfo(event.senderID);
      senderName = userInfo[event.senderID]?.name || "Friend";
    } catch (e) {
      console.error("Error getting user name:", e);
    }
    const replyText = event.body ? event.body.toLowerCase() : "";
    if (!replyText) return;
    
    replyCache.delete(event.messageReply.messageID);

    const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(replyText)}&senderName=${encodeURIComponent(senderName)}`);
    const responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

    for (const reply of responses) {
      await new Promise((resolve) => {
        api.sendMessage(reply, event.threadID, (err, info) => {
          if (!err && info?.messageID) {
            replyCache.set(info.messageID, { author: event.senderID, type: "simsimi" });
            setTimeout(() => replyCache.delete(info.messageID), 300000);
          }
          resolve();
        }, event.messageID);
      });
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(`❌ | Error in handleReply: ${err.message}`, event.threadID, event.messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const raw = event.body ? event.body.toLowerCase().trim() : "";
    if (!raw) return;
    const senderID = event.senderID;
    let senderName = "Friend";
    try {
      const userInfo = await api.getUserInfo(senderID);
      senderName = userInfo[senderID]?.name || "Friend";
    } catch (e) {
      console.error("Error getting user name:", e);
    }

    if (
      raw === "baby" || raw === "bot" || raw === "bby" ||
      raw === "jan" || raw === "xan" || raw === "জান" || raw === "বট" || raw === "বেবি" 
    ) {
      const greetings = [
        "বেশি bot Bot করলে leave নিবো কিন্তু😑😑",
        "শুনবো না😼 তুমি আমার বস সাহ কে প্রেম করাই দাও নাই🥺পচা তুমি🥺",
        "আমি আবাল দের সাথে কথা বলি না,ok😑",
        "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈",
        "Bolo Babu, তুমি কি আমার বস সাহ কে ভালোবাসো? 🙈💋",
        "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑",
        "হ্যা বলো😑, তোমার জন্য কি করতে পারি😐😑?",
        "এতো ডাকছিস কেন?গালি শুনবি নাকি? 🤬",
        "I love you janu🥰",
        "আরে Bolo আমার জান ,কেমন আছো?😚",
        "আজ বট বলে অসম্মান করছি,😰😿",
        "Hop beda😾,Boss বল boss😼",
        "চুপ থাক ,নাই তো তোর দাত ভেঙ্গে দিবো কিন্তু",
        "আমাকে না ডেকে মেয়ে হলে বস সাহর ইনবক্সে চলে যা 🌚😂 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/ABIRMAHMMUD1344",
        "আমাকে বট না বলে , বস সাহ কে জানু বল জানু 😘",
        "বার বার Disturb করছিস কোনো😾,আমার জানুর সাথে ব্যাস্ত আছি😋",
        "আরে বলদ এতো ডাকিস কেন🤬",
        "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘",
        "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😑",
        "হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘",
        "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
        "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂",
        "আমাকে ডেকো না,আমি বস সাহুর সাথে ব্যাস্ত আছি",
        "কি হলো , মিস্টেক করচ্ছিস নাকি🤣",
        "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤨",
        "জান মেয়ে হলে বস সাহুর ইনবক্সে চলে যাও 😐🫣💕 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/ABIRMAHMMUD1344",
        "কালকে দেখা করিস তো একটু 😈",
        "হা বলো, শুনছি আমি 😁",
        "আর কত বার ডাকবি ,শুনছি তো",
        "হুম বলো কি বলবে😑",
        "বলো কি করতে পারি তোমার জন্য",
        "আমি তো অন্ধ কিছু দেখি না🐸 😎",
        "আরে বোকা বট না জানু বল জানু😌",
        "বলো জানু 🌚",
        "তোর কি চোখে পড়ে না আমি ব্যাস্ত আছি😑",
        "হুম জান তোমার ওই খানে উম্মমহ😑😘",
        "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
        "jang hanga korba😑😬",
        "হুম জান তোমার অইখানে উম্মমাহ😷😘",
        "আসসালাম আলাইকুম বলেন আপনার জন্য কি করতে পারি..!🥰",
        "ভালোবাসার নামক আবলামি করতে চাইলে বস সাহুর ইনবক্সে গুঁতা দিন ~🙊😘🤣 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/ABIRMAHMMUD1344",
        "আমাকে এতো না ডেকে বস সাহ এর কে একটা গফ দে 🙄",
        "আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈",
        "🌻🌺💚-আসসালাম আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻",
        "আমি এখন বস সাহ এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😁 ধন্যবাদ-🤍🌻",
        "আমাকে না ডেকে আমার বস সাহ কে একটা জি এফ দাও-😽🫶🌺",
        "এ‌ং থুমালে আইলাপিউ পেপি-💍😽",
        "উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈",
        "জান তোমার বান্ধবী রে আমার বস সাহুর হাতে তুলে দিবা-🙊🙆‍♂️",
        "আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧",
        "এ‌ং 🫵থুমালে ্যামি রাইতে পাল্পাসি উম্মমাহ-🌺🤤💦",
        "চুনা ও চুনা আমার বস সাহ এর হবে বউ রে কেও দেখছো খুজে পাচ্ছি না😪🤧😭",
        "স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💍🌺🌻",
        "জান হাঙ্গা করবা-🙊😐🌻",
        "জান মেয়ে হলে চিপায় আসো বস সাহুর থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽",
        "ইসসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈🖤🌼",
        "আমার বস সাহুর পক্ষ থেকে তোমারে এতো এতো ভালোবাসা-🥰😽🫶 আমার বস সাহ ইসলামে'র জন্য দোয়া করবেন-💍💚🌺🌻",
        "- ভালোবাসা নামক আবূলামি করতে মন চাইলে আমার বস সাহ এর ইনবক্স চলে যাও-🙊🥱💅 🌻𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐈𝐃 𝐋𝐈𝐍𝐊 🌻:- https://www.facebook.com/ABIRMAHMMUD1344",
        "আমার জান তুমি শুধু আমার আমি তোমারে ৩৬৫ দিন ভালোবাসি-💍🌺😽",
        "কিরে প্রেম করবি তাহলে বস সাহুর ইনবক্সে গুঁতা দে 😘🤌 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/ABIRMAHMMUD1344",
        "জান আমার বস সাহ কে বিয়ে করবা-🙊😘🥳"
      ];

      const randomReply = greetings[Math.floor(Math.random() * greetings.length)];
      const mention = {
        body: `@${senderName} ${randomReply}`,
        mentions: [{
          tag: `@${senderName}`,
          id: senderID
        }]
      };

      return api.sendMessage(mention, event.threadID, (err, info) => {
        if (!err && info?.messageID) {
          replyCache.set(info.messageID, { author: event.senderID, type: "simsimi" });
          setTimeout(() => replyCache.delete(info.messageID), 300000);
        }
      }, event.messageID);
    }

    if (
      raw.startsWith("baby ") || raw.startsWith("bot ") || raw.startsWith("bby ") ||
      raw.startsWith("jan ") || raw.startsWith("xan ") ||
      raw.startsWith("জান ") || raw.startsWith("বট ") || raw.startsWith("বেবি ")
    ) {
      const query = raw
        .replace(/^baby\s+|^bot\s+|^bby\s+|^jan\s+|^xan\s+|^জান\s+|^বট\s+|^বেবি\s+/i, "")
        .trim();
      if (!query) return;

      const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`);
      const responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

      for (const reply of responses) {
        await new Promise((resolve) => {
          api.sendMessage(reply, event.threadID, (err, info) => {
            if (!err && info?.messageID) {
              replyCache.set(info.messageID, { author: event.senderID, type: "simsimi" });
              setTimeout(() => replyCache.delete(info.messageID), 300000);
            }
            resolve();
          }, event.messageID);
        });
      }
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(`❌ | Error in handleEvent: ${err.message}`, event.threadID, event.messageID);
  }
};

