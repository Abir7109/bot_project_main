const chalkNS = require("chalk");
const chalk = chalkNS?.default || chalkNS; // handle ESM (v5) and CJS (v4)

const colors = {
  '[ online ]': chalk.bold.green,
  '[ error ]': chalk.bold.red,
  '[ warn ]': chalk.bold.yellow,
  '[ info ]': chalk.bold.cyan,
  '[ cmd ]': chalk.bold.blue,
  '[ event ]': chalk.bold.magenta,
  'default': chalk.bold.white
};

module.exports = (msg, tag = "log") => {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  const date = now.toLocaleDateString('en-GB');
  
  // Choose color based on tag
  const colorFn = colors[tag] || colors['default'];
  const label = colorFn(`${tag}`);
  const timestamp = chalk.gray(`[${date} ${time}]`);
  
  // Format message with colors
  let formattedMsg = msg;
  if (tag === '[ online ]') {
    formattedMsg = chalk.green.bold(msg);
  } else if (tag === '[ error ]') {
    formattedMsg = chalk.red(msg);
  } else if (tag === '[ warn ]') {
    formattedMsg = chalk.yellow(msg);
  }
  
  console.log(`${timestamp} ${label} ${formattedMsg}`);
};
