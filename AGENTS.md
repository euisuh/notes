# AGENTS.md

Workflow pointer for AI agents working in this repo.

## Repo

**euisuh/notes** — local-first markdown scratchpad with auth gate

## Key paths

| Path | Purpose |
|------|---------|
| `public/notes/index.html` | Notes app shell (self-contained CSS) |
| `public/notes-app.jsx` | Full notes app |
| `public/credential/index.html` | Auth gate shell |
| `public/credential-app.jsx` | Auth gate — SERVICES registry (notes only) |
| `backend/app.py` | Flask auth endpoint (`POST /keyring/api/auth`) |
| `nginx.conf` | Routing: /notes, /credential, /keyring/api/ |
| `docker-compose.yml` | Container orchestration |

## Rules

- Never commit `.env`
- No build tools — frontend is CDN React 18 + Babel standalone
- Auth uses `KEYRING_CREDENTIAL` env var (`identifier:password`)
- Any logic/feature/config change → feature branch + PR, never direct to `main`
