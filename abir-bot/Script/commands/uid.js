module.exports.config = {
  name: "uid",
  description: "Show a user's numeric Facebook UID (you, a mention, or a reply)",
  usages: "uid [@user] | reply",
  cooldowns: 2,
  credits: "Abir"
};

module.exports.run = async ({ api, event }) => {
  const { threadID, senderID, messageReply, mentions } = event;
  let id = null;
  if (messageReply?.senderID) id = String(messageReply.senderID);
  else if (mentions && Object.keys(mentions).length) id = String(Object.keys(mentions)[0]);
  else id = String(senderID);
  return api.sendMessage(`UID: ${id}\nhttps://facebook.com/${id}`, threadID);
};
