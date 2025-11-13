# Abir Messenger Bot (Unofficial)

A minimal Facebook Messenger account bot scaffolded for Abir. It runs an Express server for uptime and a message listener using an unofficial API.

Important: This uses an unofficial chat API and logs in with a user session (appstate). Use at your own risk.

## Run locally

1) Put your `appstate.json` file in the project root (same folder as `config.json`).
2) Update `config.json` (ADMINBOT UID, OWNER links).
3) Install and start:

```bash
npm install
npm start
```

- Health endpoint: `GET /healthz` returns `ok`.

## Deploy on Render (file-based configuration)

1) Push this folder to a private GitHub repository.
2) Ensure your `appstate.json` is present in the repo (same folder as `config.json`).
3) In Render, "New +" → "Blueprint" → Connect your repo, keep defaults.
4) Deploy. Render will run `npm install` and `npm start`.

Service details:
- Type: Web Service (kept alive by Express in Abir.js)
- Health check: `/healthz`

## Commands
- `/help` — list commands or details for one
- `/admin` — show Abir owner info
- `/ping` — latency check
- `/echo <text>` — echo text

## Notes
- If you keep `appstate.json` in the repo, keep the repository private to protect your session.
- Keep dependencies minimal and updated.
