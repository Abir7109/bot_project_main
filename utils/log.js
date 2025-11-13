const chalkNS = require("chalk");
const chalk = chalkNS?.default || chalkNS; // handle ESM (v5) and CJS (v4)

module.exports = (msg, tag = "log") => {
  const stamp = new Date().toISOString();
  const label = chalk.bold.magenta(`[ ${tag} ]`);
  console.log(`${label} ${chalk.gray(stamp)} ${msg}`);
};
