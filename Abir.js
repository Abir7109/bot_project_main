const { spawn } = require("child_process");
const express = require("express");
const path = require("path");
const logger = require("./utils/log");

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.listen(port, () => logger(`Server running on port ${port}…`, "[ starting ]"));

let restarts = 0;
function startBot(msg) {
  if (msg) logger(msg, "[ starting ]");
  const child = spawn(process.execPath, ["Main.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: false
  });
  child.on("close", (code) => {
    if (code !== 0 && restarts < 5) {
      restarts += 1;
      logger(`Bot exited with code ${code}. Restarting… (${restarts}/5)`, "[ restarting ]");
      startBot();
    } else {
      logger(`Bot stopped. Exit code: ${code}`, "[ stopped ]");
    }
  });
  child.on("error", (err) => logger(`Spawn error: ${err.message}`, "error"));
}

startBot();
