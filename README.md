# AterBot — Multi-bot dashboard (UI + 24/7 tips)

This fork improves the original project by:
- Supporting multiple bots from `config.json` (see `bots` array).
- Providing a dashboard and per-bot page (live health, hunger, coords, nearby entities).
- Aesthetic dark UI with SSE-based live updates.
- Notes on running 24/7 for free using Replit + UptimeRobot.

Quick start
1. Install dependencies:
   - npm install
   - npm i mineflayer express
2. Configure: copy `config.example.json` -> `config.json` and edit bots.
3. Build / run (repo uses plain node + ESM):
   - node ./dist/index.js (or run via ts-node during development).
4. Open the web UI on the server port (default 5500) and point UptimeRobot's HTTP monitor to that URL to keep the Repl / instance alive.

Replit + UptimeRobot 24/7 (recommended free route)
1. Import this repo to Replit (choose Blank Repl / Node).
2. In Replit, ensure your run command starts the server (e.g. `node ./dist/index.js` or `node ./src/web.ts` if using ts-node).
3. Start the Repl once and copy the Webview URL.
4. Create an UptimeRobot HTTP monitor that pings that Webview URL every 5 minutes.
5. UptimeRobot will keep the Repl awake and the bots running.

Security / caution
- Keep in mind server rules — Aternos or other host may take action if they detect suspicious automated behavior. Use responsibly.
- If you expose the UI publicly you might want to add a simple auth layer (token, password).

Want me to create a PR with these file changes directly in the repo, or do you prefer the patch as a zip/patch file? I can also trim or expand the UI (add charts, graphs, or commands to remotely control bots from the web page).
