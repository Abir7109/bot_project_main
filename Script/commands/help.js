module.exports = {
  config: {
    name: "help",
    version: "1.0.0",
    role: 0,
    author: "Abir",
    description: "Show all available commands or details about a specific command",
    usage: "[command name]",
    cooldowns: 2
  },

  run: async function({ api, event, args, commands }) {
    const { threadID } = event;
    const commandName = args[0]?.toLowerCase();

    if (!commandName) {
      // Show all commands
      const commandList = Array.from(commands.values())
        .map(cmd => `• /${cmd.config.name} - ${cmd.config.description}`)
        .join('\n');

      const helpMessage = `📋 ABIR BOT - Available Commands\n\n${commandList}\n\n💡 Use /help <command> for more details about a specific command.`;
      
      return api.sendMessage(helpMessage, threadID);
    }

    // Show details for specific command
    const command = commands.get(commandName);
    if (!command) {
      return api.sendMessage(`❌ Command "${commandName}" not found. Use /help to see all commands.`, threadID);
    }

    const { name, description, usage, author, version } = command.config;
    const detailMessage = `📖 Command Details\n\n` +
      `Name: ${name}\n` +
      `Description: ${description}\n` +
      `Usage: /${name} ${usage || ''}\n` +
      `Author: ${author}\n` +
      `Version: ${version}`;

    return api.sendMessage(detailMessage, threadID);
  }
};
