const fs = require("fs-extra");
const axios = require("axios");

const ABIR_IMG = "https://i.postimg.cc/rFnmYvCy/abir4.jpg";
const helpCache = new Map(); // Store messageID -> command list mapping

module.exports = {
  config: {
    name: "help",
    version: "2.0.0",
    role: 0,
    author: "Abir",
    description: "Show all available commands",
    usage: "[command name or number]",
    cooldowns: 2
  },

  handleReply: async function({ api, event, commands }) {
    const { threadID, messageID, body, senderID } = event;
    const cachedData = helpCache.get(event.messageReply?.messageID);
    
    if (!cachedData) return;
    
    const num = parseInt(body.trim());
    if (isNaN(num) || num < 1 || num > cachedData.length) {
      return api.sendMessage(`❌ Invalid number. Reply with 1-${cachedData.length}`, threadID, messageID);
    }
    
    const cmdName = cachedData[num - 1];
    const cmd = commands.get(cmdName);
    if (!cmd) return;
    
    try {
      await cmd.run({ api, event: { ...event, body: `/${cmdName}`, senderID }, args: [], config: global.config || {}, commands, logger: console.log });
    } catch (e) {
      api.sendMessage(`Error running ${cmdName}: ${e.message}`, threadID, messageID);
    }
  },

  run: async function({ api, event, args, commands, config }) {
    const { threadID, messageID } = event;
    const commandName = args[0]?.toLowerCase();

    if (!commandName) {
      const cmdArray = Array.from(commands.values()).sort((a, b) => a.config.name.localeCompare(b.config.name));
      const commandNames = cmdArray.map(c => c.config.name);
      
      const cmdList = cmdArray
        .map((cmd, i) => `${i + 1}. /${cmd.config.name}`)
        .join('\n');

      const helpMessage = `╭─────────────╮\n` +
        `│  📚 ABIR BOT MENU  │\n` +
        `╰─────────────╯\n\n` +
        `${cmdList}\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `💡 Reply with a number to run\n` +
        `📝 Total Commands: ${cmdArray.length}\n` +
        `👤 Created by: ABIR\n` +
        `🔗 FB: fb.com/ABIRMAHMMUD1344\n` +
        `━━━━━━━━━━━━━━━`;

      try {
        const imgPath = __dirname + "/cache/help.jpg";
        const response = await axios.get(ABIR_IMG, { responseType: 'arraybuffer' });
        fs.writeFileSync(imgPath, Buffer.from(response.data));
        
        return api.sendMessage(
          { body: helpMessage, attachment: fs.createReadStream(imgPath) },
          threadID,
          (err, info) => {
            fs.unlinkSync(imgPath);
            if (!err && info?.messageID) {
              helpCache.set(info.messageID, commandNames);
              setTimeout(() => helpCache.delete(info.messageID), 60000); // Clean up after 1 min
            }
          },
          messageID
        );
      } catch (e) {
        return api.sendMessage(helpMessage, threadID, (err, info) => {
          if (!err && info?.messageID) {
            helpCache.set(info.messageID, commandNames);
            setTimeout(() => helpCache.delete(info.messageID), 60000);
          }
        }, messageID);
      }
    }

    // Show details for specific command
    const command = commands.get(commandName);
    if (!command) {
      return api.sendMessage(`❌ Command "${commandName}" not found. Use /help to see all commands.`, threadID, messageID);
    }

    const { name, description, usage } = command.config;
    const detailMessage = `📖 ${name.toUpperCase()}\n\n` +
      `📝 ${description}\n` +
      `💬 Usage: /${name} ${usage || ''}`;

    return api.sendMessage(detailMessage, threadID, messageID);
  }
};
