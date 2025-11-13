const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "hug",
  version: "7.3.2",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Create a hug frame with avatars",
  commandCategory: "img",
  usages: "hug @mention",
  cooldowns: 5
};

async function ensureBg(bgPath) {
  fs.ensureDirSync(path.dirname(bgPath));
  if (!fs.existsSync(bgPath)) {
    const url = "https://i.imgur.com/7lPqHjw.jpg";
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(data));
  }
}

async function circle(image) {
  const img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const root = path.resolve(__dirname, "cache", "canvas");
  const bgPath = path.join(root, "hugv3.png");
  const outPath = path.join(root, `hug_${one}_${two}.png`);
  const avatarOne = path.join(root, `avt_${one}.png`);
  const avatarTwo = path.join(root, `avt_${two}.png`);

  await ensureBg(bgPath);

  const getAvatar = async (id, savePath) => {
    const res = await axios.get(
      `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(savePath, Buffer.from(res.data));
  };

  await getAvatar(one, avatarOne);
  await getAvatar(two, avatarTwo);

  const base = await jimp.read(bgPath);
  const circ1 = await jimp.read(await circle(avatarOne));
  const circ2 = await jimp.read(await circle(avatarTwo));

  base.composite(circ1.resize(220, 220), 200, 50);
  base.composite(circ2.resize(220, 220), 490, 200);

  const raw = await base.getBufferAsync("image/png");
  fs.writeFileSync(outPath, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);
  return outPath;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions || {});

  if (mention.length !== 1) {
    return api.sendMessage("Please mention exactly one person to hug.", threadID, messageID);
  }

  try {
    const out = await makeImage({ one: senderID, two: mention[0] });
    return api.sendMessage(
      { body: "A warm hug!", attachment: fs.createReadStream(out) },
      threadID,
      () => fs.unlinkSync(out),
      messageID
    );
  } catch (e) {
    console.error(e);
    return api.sendMessage("Failed to generate hug image.", threadID, messageID);
  }
};
