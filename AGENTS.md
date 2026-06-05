# AGENTS.md

Workflow pointer for AI agents working in this repo.

## Repo

**euisuh/console** — private tools console (Keyring OTP vault + Notes scratchpad)

## Key paths

| Path | Purpose |
|------|---------|
| `public/console/index.html` | Console launcher shell |
| `public/console-app.jsx` | Tools registry — add new tools here |
| `public/keyring/index.html` | Keyring app shell |
| `public/keyring-app.jsx` | OTP vault root app |
| `public/keyring-lib.jsx` | TOTP engine + AES-GCM crypto |
| `public/keyring-screens.jsx` | Account row, backup card, modals |
| `public/notes/index.html` | Notes app shell |
| `public/notes-app.jsx` | Notes scratchpad app |
| `public/credential/index.html` | Shared auth gate shell |
| `public/credential-app.jsx` | Auth gate — SERVICES registry |
| `public/tweaks-panel.jsx` | Shared tweaks panel component |
| `backend/app.py` | Flask auth endpoint |
| `nginx.conf` | Routing config |
| `docker-compose.yml` | Container orchestration |

## Rules

- Never commit `.env`
- Never add build tools (no npm, no bundler) — frontend is CDN React + Babel standalone
- Adding a new tool: update `TOOLS` in `console-app.jsx` and `SERVICES` in `credential-app.jsx`
- Auth uses one shared `KEYRING_CREDENTIAL` env var for all services
- Any logic/feature/config change → feature branch + PR (never commit directly to `main`)
