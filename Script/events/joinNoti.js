const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "joinnoti",
  eventType: ["log:subscribe"],
  version: "1.0.2",
  credits: "ABIR",
  description: "Welcome message with optional image/video"
};

module.exports.run = async function({ api, event }) {
  const { threadID } = event;
  
  const botPrefix = "/";
  const botName = "Abir Chat Bot";

  // Bot added to group
  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    await api.changeNickname(`[ ${botPrefix} ] • ${botName}`, threadID, api.getCurrentUserID());

    api.sendMessage("চ্ঁলে্ঁ এ্ঁসে্ঁছি্ঁ Abir Chat Bot এঁখঁনঁ তোঁমাঁদেঁরঁ সাঁথেঁ আঁড্ডাঁ দিঁবঁ..!", threadID, () => {
      const randomGifPath = path.join(__dirname, "cache", "randomgif");
      
      let selected = null;
      if (fs.existsSync(randomGifPath)) {
        const allFiles = fs.readdirSync(randomGifPath).filter(file =>
          [".mp4", ".jpg", ".png", ".jpeg", ".gif", ".mp3"].some(ext => file.endsWith(ext))
        );
        if (allFiles.length > 0) {
          selected = fs.createReadStream(path.join(randomGifPath, allFiles[Math.floor(Math.random() * allFiles.length)]));
        }
      }

      const messageBody = `╭•┄┅═══❁🌺❁═══┅┄•╮
     আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ
╰•┄┅═══❁🌺❁═══┅┄•╯

𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐬𝐨 𝐦𝐮𝐜𝐡 𝐟𝐨𝐫 𝐚𝐝𝐝𝐢𝐧𝐠 𝐦𝐞 𝐭𝐨 𝐲𝐨𝐮𝐫 𝐠𝐫𝐨𝐮𝐩-🖤🤗
𝐈 𝐰𝐢𝐥𝐥 𝐚𝐥𝐰𝐚𝐲𝐬 𝐬𝐞𝐫𝐯𝐞 𝐲𝐨𝐮 𝐢𝐧𝐬𝐡𝐚𝐚𝐥𝐥𝐚𝐡 🌺❤️

𝐓𝐨 𝐯𝐢𝐞𝐰 𝐚𝐧𝐲 𝐜𝐨𝐦𝐦𝐚𝐧𝐝:
${botPrefix}help
${botPrefix}admin
${botPrefix}ai

★ যেকোনো অভিযোগ অথবা হেল্প এর জন্য এডমিন ABIR কে নক করতে পারেন ★
➤𝐌𝐞𝐬𝐬𝐞𝐧𝐠𝐞𝐫: https://m.me/ABIRMAHMMUD1344
➤𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: https://wa.me/+8801919069898

❖⋆═══════════════════════⋆❖
          𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫 ➢ ABIR`;

      if (selected) {
        api.sendMessage({ body: messageBody, attachment: selected }, threadID);
      } else {
        api.sendMessage(messageBody, threadID);
      }
    });

    return;
  }

  // New member added to group
  try {
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (e) {
      console.error("Error getting thread info:", e);
      return;
    }

    const { threadName, participantIDs } = threadInfo;
    let nameArray = [], memLength = [], i = 0;

    for (let id in event.logMessageData.addedParticipants) {
      const userName = event.logMessageData.addedParticipants[id].fullName;
      nameArray.push(userName);
      memLength.push(participantIDs.length - i++);
    }
    memLength.sort((a, b) => a - b);

    let msg = `╭•┄┅═══❁🌺❁═══┅┄•╮
     আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ
╰•┄┅═══❁🌺❁═══┅┄•╯
হাসি, মজা, ঠাট্টায় গড়ে উঠুক  
চিরস্থায়ী বন্ধুত্বের বন্ধন।🥰
ভালোবাসা ও সম্পর্ক থাকুক আজীবন।💝

➤ আশা করি আপনি এখানে হাসি-মজা করে 
আড্ডা দিতে ভালোবাসবেন।😍
➤ সবার সাথে মিলেমিশে থাকবেন।😉
➤ উস্কানিমূলক কথা বা খারাপ ব্যবহার করবেন না।🚫
➤ গ্রুপ এডমিনের কথা শুনবেন ও রুলস মেনে চলবেন।✅

›› প্রিয় ${nameArray.join(', ')},  
আপনি এই গ্রুপের ${memLength.join(', ')} নম্বর মেম্বার!

›› গ্রুপ: ${threadName}

💌 🌺 𝐖 𝐄 𝐋 𝐂 𝐎 𝐌 𝐄 🌺 💌
╭─╼╾─╼🌸╾─╼╾───╮
   Abir Chat Bot 🌺
╰───╼╾─╼🌸╾─╼╾─╯

❖⋆══════════════════════════⋆❖
          𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫 ➢ ABIR`;

    const joinGifPath = path.join(__dirname, "cache", "joinGif");
    let randomFile = null;
    
    if (fs.existsSync(joinGifPath)) {
      const files = fs.readdirSync(joinGifPath).filter(file =>
        [".mp4", ".jpg", ".png", ".jpeg", ".gif", ".mp3"].some(ext => file.endsWith(ext))
      );
      if (files.length > 0) {
        randomFile = fs.createReadStream(path.join(joinGifPath, files[Math.floor(Math.random() * files.length)]));
      }
    }

    return api.sendMessage(
      randomFile ? { body: msg, attachment: randomFile } : { body: msg },
      threadID
    );
  } catch (e) {
    console.error("Error in joinNoti:", e);
  }
};
