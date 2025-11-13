module.exports.config = {
  name: "slap",
  version: "1.0.0",
  hasPermssion: 0,
credits: "ABIR",
  description: "Slap the friend tag",
  commandCategory: "general",
  usages: "slap [Tag someone you want to slap]",
  cooldowns: 5,
};


module.exports.run = async ({ api, event, args }) => {
	const axios = require('axios');
	const request = require('request');
	const fs = require("fs-extra");
    var out = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
  if (!args.join("")) return out("Please tag someone");
  else
  return axios.get('https://api.waifu.pics/sfw/slap').then(res => {
        let getURL = res.data.url;
        let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
        var mention = Object.keys(event.mentions)[0];
                  let tag = event.mentions[mention].replace("@", "");    
        
        const cachePath = __dirname + "/cache";
        fs.ensureDirSync(cachePath);
        
 let callback = function () {
            api.setMessageReaction("👊", event.messageID, (err) => {}, true);
        api.sendMessage({
						        body: "Slapped! " + tag,
                                          mentions: [{
          tag: tag,
          id: Object.keys(event.mentions)[0]
        }],
						attachment: fs.createReadStream(cachePath + `/slap.${ext}`)
					}, event.threadID, () => fs.unlinkSync(cachePath + `/slap.${ext}`), event.messageID)
				};
 //   }
        request(getURL).pipe(fs.createWriteStream(cachePath + `/slap.${ext}`)).on("close", callback);
			})
    .catch(err => {
                     api.sendMessage("Failed to generate gif, be sure that you've tag someone!", event.threadID, event.messageID);
    api.setMessageReaction("â˜¹ï¸", event.messageID, (err) => {}, true);
                  })     
}

