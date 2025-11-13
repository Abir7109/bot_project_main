const axios = require("axios");

module.exports.config = {
  name: "weather",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ABIR",
  description: "Get current weather info for a location (uses wttr.in, no API key)",
  commandCategory: "utility",
  usages: "weather <city>",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const city = args.join(" ").trim();
  if (!city) return api.sendMessage("Usage: /weather <city>", event.threadID, undefined, event.messageID);
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data;
    const cur = data?.current_condition?.[0];
    const area = data?.nearest_area?.[0]?.areaName?.[0]?.value || city;
    if (!cur) throw new Error("No data");
    const temp = cur.temp_C;
    const feels = cur.FeelsLikeC;
    const desc = cur.weatherDesc?.[0]?.value || "";
    const humidity = cur.humidity;
    const wind = cur.windspeedKmph;
    const msg = `Weather for ${area}\nTemp: ${temp}°C (feels ${feels}°C)\nSky: ${desc}\nHumidity: ${humidity}%\nWind: ${wind} km/h`;
    return api.sendMessage(msg, event.threadID, undefined, event.messageID);
  } catch (e) {
    return api.sendMessage(`Couldn't fetch weather for "${city}".`, event.threadID, undefined, event.messageID);
  }
};
