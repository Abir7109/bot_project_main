const axios = require("axios");
const path = require("path");
const aiProvider = require(path.join(__dirname, "..", "..", "utils", "aiProvider"));
module.exports.config = {
  name: "ai",
  description: "AI chat (Groq-backed if GROQ_API_KEY is set), fallback to HTTP endpoint; image via legacy HTTP",
  usages: "ai <message> | reply to an image",
  cooldowns: 2,
  credits: "Abir"
};

module.exports.run = async ({ api, event, args }) => {
  const input = args.join(" ");
  const encodedApi = "aHR0cHM6Ly9hcGlzLWtlaXRoLnZlcmNlbC5hcHAvYWkvZGVlcHNlZWtWMz9xPQ==";
  const apiUrl = Buffer.from(encodedApi, "base64").toString("utf-8");
  if (event.type === "message_reply" && event.messageReply?.attachments?.length) {
    try {
      const imageUrl = event.messageReply.attachments[0]?.url;
      if (!imageUrl) return api.sendMessage("Please reply to an image.", event.threadID, undefined, event.messageID);
      const res = await axios.post(`${apiUrl}${encodeURIComponent(input || "Describe this image.")}`, { image: imageUrl });
      const result = res.data.result || res.data.response || res.data.message || "No response.";
      return api.sendMessage(result, event.threadID, undefined, event.messageID);
    } catch (e) {
      return api.sendMessage(`AI error: ${e.message}`, event.threadID, undefined, event.messageID);
    }
  } else {
    if (!input) return api.sendMessage("Say something after ai", event.threadID, undefined, event.messageID);
    try {
      const looksBanglish = /\b(kmn|kemon|kemne|kivabe|tumi|ami|valo|bhalo|kor(bo|be|chi|cho|cen)|kothay|koi|aso|asho|kichu|kisu)\b/i.test(input);
      const systemText = [
        "You are Abir Bot, a helpful Messenger assistant.",
        "- Be concise, friendly, and safe.",
        "- The user may write Bangla in Latin letters (Banglish).",
        looksBanglish ? "- Reply in Bangla (Bengali)." : "- Detect language and reply appropriately (Bangla for Banglish)."
      ].join("\n");
      const system = { role: "system", content: systemText };
      const user = { role: "user", content: input };
      const result = await aiProvider.chat({ baseDir: path.join(__dirname, "..", ".."), messages: [system, user], opts: {} });
      return api.sendMessage(result, event.threadID, undefined, event.messageID);
    } catch (e) {
      return api.sendMessage(`AI error: ${e.message}`, event.threadID, undefined, event.messageID);
    }
  }
};
