# LedgerMem Telegram Bot

Telegram bot for [LedgerMem](https://ledgermem.dev), built with [telegraf](https://telegraf.js.org).

## Features

- `/remember <text>` — save text as a memory
- `/recall <query>` — search memories and reply with the top 3
- `/forget <id>` — delete a memory by id
- **Forward-to-bot** — forward any message to the bot DM and it gets saved with `source: telegram-forward`

## Setup

1. Talk to [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token
2. Disable Privacy Mode (`/setprivacy` → Disable) so the bot can see group messages if you want group support
3. Suggested commands list (set via BotFather `/setcommands`):
   ```
   remember - Save text as a memory
   recall - Search your memory
   forget - Delete a memory by id
   ```

_Screenshots: `docs/botfather-setup.png` (placeholder)_

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | Token from @BotFather |
| `LEDGERMEM_API_KEY` | yes | LedgerMem API key |
| `LEDGERMEM_WORKSPACE_ID` | yes | LedgerMem workspace id |

## Run

```bash
cp .env.example .env
npm install
npm run dev
npm test
```

## Deploy

- **Docker:** `docker build -t ledgermem-telegram-bot . && docker run --env-file .env ledgermem-telegram-bot`
- **Fly.io / Railway / Render:** Telegram long-polling needs only outbound network — no exposed ports
- **Webhook mode:** to use webhooks instead, replace `bot.launch()` with `bot.launch({ webhook: { domain, port } })`

## License

MIT
