const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports.config = {
  name: "attitude",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "attitude video",
  commandCategory: "media",
  usages: "attitude",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
  }
};

module.exports.run = async ({ api, event }) => {
  const cachePath = path.join(__dirname, "cache");
  fs.ensureDirSync(cachePath);

  const messages = [
    "𝐀𝐓𝐓𝐈𝐓𝐔𝐃𝐄 𝐕𝐈𝐃𝐄𝐎 𝐁𝐘 𝐀𝐁𝐈𝐑 😇\n\n𝗬𝗼𝘂𝗥 𝗙𝗮𝘃𝗼𝘂𝗿𝗶𝘁𝗲 𝗦𝗔 𝗛𝗨"
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  const links = [
    "https://drive.google.com/uc?id=11dUXILgge35GyV9ilD_JmzLiL7yq5WMc",
    "https://drive.google.com/uc?id=11Wr0yQ3QVG1BucbdlANkSo5vE-a___Sn",
    "https://drive.google.com/uc?id=10e1TdrCvj0w2GIBrczbQYUFvb5HddTaW",
    "https://drive.google.com/uc?id=114eZDQU1xbBa2BKrfaboA8tQlJi2fWcS",
    "https://drive.google.com/uc?id=11x0wO9uv9foBrq0B585QEVTk1h0Ci6L_",
    "https://drive.google.com/uc?id=11PXirNeOGwoJblFBxp5M9DFYaGVDlyzT",
    "https://drive.google.com/uc?id=10qGgG0YdBksgEp1k9fCAsv46PrWfUCSm",
    "https://drive.google.com/uc?id=11f2yNWaoLNVORhsuwiQto47oLSqEFmyB",
    "https://drive.google.com/uc?id=10hxxvZ3zwKqmwxvZFg1YkIsEcI2x0d_a",
    "https://drive.google.com/uc?id=158uOCkcLSgn0yAmb9A3GxNBuwhQ6whJl",
    "https://drive.google.com/uc?id=1-0nXpw6ch9JTDRcSrN5bdsXzh67lyEDe",
    "https://drive.google.com/uc?id=1-LC1zOtGFf2Toa0zfTUN9Y8xC-CQloHp",
    "https://drive.google.com/uc?id=13AMbqn7jai43XgbNADQ8nqW7tieDY4fa",
    "https://drive.google.com/uc?id=10C_AagqYOXSp67gkPpwXOdhIXhSosf_O",
    "https://drive.google.com/uc?id=13068I_ImTH0RQkWHgxGddKMzC0qMirS3",
    "https://drive.google.com/uc?id=10CvsLzpZGbTyGbf9ysMWQHe4rwmC1yw3",
    "https://drive.google.com/uc?id=14dqAKDGlPsee-85XvJTld_Jcx6P7mNaI",
    "https://drive.google.com/uc?id=15BmVYod3VW0zePhdNGD3-RpPoQyFI65U",
    "https://drive.google.com/uc?id=14-ymwZdWOKj89pWtA0MiLGN7Eh2xmHaG",
    "https://drive.google.com/uc?id=1-y_vYnJYSPe2gMsPfZQjmjOvhkyVw35R",
    "https://drive.google.com/uc?id=14oBehghDvtnmJL3wNvN0Kc6YGzJt2iQJ",
    "https://drive.google.com/uc?id=13pTcxmag7B893dWzfe7OavvayD7OYiRa",
    "https://drive.google.com/uc?id=1-6mtt_fnc9czRRGsRqCqcURBZQUzczBy",
    "https://drive.google.com/uc?id=13xMtvrgt__qUUQ-U9PKGyUlq88x1CIPZ",
    "https://drive.google.com/uc?id=14OMrLCa7ef1jH7I39fouKG4lxwbd4K0b",
    "https://drive.google.com/uc?id=14HaSbb4fSHfUhUgKfNWJc66gNmqYgmPW",
    "https://drive.google.com/uc?id=1-E1mcGTX6_RCc5vEXOsDV2ODC059o6bF",
    "https://drive.google.com/uc?id=14Szrzz4CL3BBN1oQrH04cQ1zM1sNhx7s",
    "https://drive.google.com/uc?id=13UmjKL6oKSbDYJbOKr6qGfqJQgUoC-qa",
    "https://drive.google.com/uc?id=10BIFhf82pTFOq0Z1v4b-FFsPr877zsLo",
    "https://drive.google.com/uc?id=1-hHkePC6ukBhPTcaTKFlaJ5d5-aREthq",
    "https://drive.google.com/uc?id=1-bgjrQn6gfM7QOF-tAsu5t05KLwqK4_R",
    "https://drive.google.com/uc?id=14FeUarN4GoWwPQuv9ef3zdpAOu0p1PNi",
    "https://drive.google.com/uc?id=15C7IXIXsXwyC0Kj_CVsx-PHOuatPvjnx",
    "https://drive.google.com/uc?id=13W2XS8AxEcjKAX_MRD-rh4Sp00t_8XKq",
    "https://drive.google.com/uc?id=1-6Qh6CIsQ-Yhrb2sppnN4F7qhJ1tk3rO",
    "https://drive.google.com/uc?id=1-aI8DTnd2t1bmnyDAzq4VKb8Me0JaCPn",
    "https://drive.google.com/uc?id=1-884CM0iZpTAy6cSVA9MnLtfNHhILfov",
    "https://drive.google.com/uc?id=13McQhw-0wzraruEMKg7GxS8gudjLRA7c",
    "https://drive.google.com/uc?id=13kMv4G1hs0COispW70439SvAGKqv4XuA",
    "https://drive.google.com/uc?id=141f7fm8eUFvQl7C5XAk9-csm3PnaXaGT",
    "https://drive.google.com/uc?id=10R60lJzy8TfRGi48QJbTl68JdMTg21MU",
    "https://drive.google.com/uc?id=10V3eeUBXnW5N4UwtafHzgOjbnzWithX-",
    "https://drive.google.com/uc?id=11qS8wAi3HORxKQ4kZnwRlo-6HfrkS8tC",
    "https://drive.google.com/uc?id=119JOKHCHSDS9Hyuzrb586kxMQ4cbJPpx",
    "https://drive.google.com/uc?id=11-nUAWil79-wOLDtP-KwrlGF9xEGF6uh",
    "https://drive.google.com/uc?id=11G7osUuxilHaP8t4hGDVIQuH1iW9WKkw",
    "https://drive.google.com/uc?id=10a8nyCgJKN49ZBD1PxA1x2ZR6f-46oxR",
    "https://drive.google.com/uc?id=10z2V4bgJO23c5Nyc_-1Z4gDgmA4ZKXgk",
    "https://drive.google.com/uc?id=10fQP-HgzGTeSAhTRalFoBDi7cAoKrDO6",
    "https://drive.google.com/uc?id=11Y3RhXhlFjuc3hAH6haqw5u82Uz1j1rU",
    "https://drive.google.com/uc?id=12-YteljsOqh__Vcy7DCd1FrgZxhKjKVf",
    "https://drive.google.com/uc?id=11tllUwvnX_4W-sVq-QqYeaIpoF_cc9pJ",
    "https://drive.google.com/uc?id=119Da1fFnWTbDX4wCI0FUYlsyMaMjalXo",
    "https://drive.google.com/uc?id=144UKwffDum2KPi3wWNo_ArpdK-imnDOj",
    "https://drive.google.com/uc?id=13WNdC4KdInXvPRIETkuTi915MU8XHocS",
    "https://drive.google.com/uc?id=13MdC-fT1aYk6DlLZvJV9e_z-n25oSsW_",
    "https://drive.google.com/uc?id=13WO2JftbP129GR0fVmLpMAMfwx07K8fl",
    "https://drive.google.com/uc?id=15Bt2GrntjfOIswZRhQPuiBNfQ5NannK4",
    "https://drive.google.com/uc?id=14oWHvlsbsNaJLN_YaQGNVaUcerdUGrB8",
    "https://drive.google.com/uc?id=14tb-XgVWGcS63Jw0oNbm2hsqrQLw_gzL",
    "https://drive.google.com/uc?id=1520dma_yKw2ixGpb7wnktzrM20Kjo_3v",
    "https://drive.google.com/uc?id=1513P_XukMB6gPDf9lr20t8re3ScCL5Rw",
    "https://drive.google.com/uc?id=1-4yGIC7A0GKJHSUzaECF3d_bAWSp4Tl8",
    "https://drive.google.com/uc?id=1-xItCYLhq2oaR4tfiU8ap11CMDaJvMLq",
    "https://drive.google.com/uc?id=13qfO0aoXblNXXS-voJWj-8LqdYV4Gltu",
    "https://drive.google.com/uc?id=1-zgBe2_gCLh_Rl7DRBzKAG_CA914QbTQ",
    "https://drive.google.com/uc?id=10D9HinfwrtMjYo4fI7lWQYSStWrVllBQ",
    "https://drive.google.com/uc?id=107EjQ_uLg2Q5812NBux6QpAwx8ncS6JR",
    "https://drive.google.com/uc?id=14gr6fIUTYsF0nMOKtuOQqQmJ8Ggf71Tn",
    "https://drive.google.com/uc?id=14PgaietaupKI5jy89Y_VbENC_Zluy3D_",
    "https://drive.google.com/uc?id=13G9hyUkfx7oWWTbdD4AYQ6Vlk2f4EQ1Y",
    "https://drive.google.com/uc?id=13uE2XejtfWUJW6uzc83rXvcsPKoU3rek"
  ];

  const selectedLink = links[Math.floor(Math.random() * links.length)];
  const videoPath = path.join(cachePath, "attitude_video.mp4");

  try {
    // Send downloading message
    await api.sendMessage("⏳ Downloading attitude video...", event.threadID, event.messageID);

    // Download the video
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(videoPath);
      
      request(encodeURI(selectedLink))
        .on('error', reject)
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    // Wait a bit to ensure file is fully written
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if file exists and has content
    if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
      throw new Error('Downloaded file is empty or missing');
    }

    // Send the video
    await api.sendMessage(
      { body: `「 ${message} 」`, attachment: fs.createReadStream(videoPath) },
      event.threadID,
      event.messageID
    );

    // Clean up
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  } catch (err) {
    console.error("Error with attitude video:", err);
    api.sendMessage("❌ Failed to download attitude video. Please try again.", event.threadID, event.messageID);
    // Clean up on error
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  }
};
