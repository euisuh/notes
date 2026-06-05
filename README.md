# console

A private tools launcher with two live services: an encrypted OTP vault and a local-first markdown scratchpad. One credential unlocks both.

**Live:** [uiseoya.com/console](https://uiseoya.com/console)

| Tool | Live demo |
|------|-----------|
| Keyring (OTP vault) | [uiseoya.com/credential?service=otp](https://uiseoya.com/credential?service=otp) |
| Notes (scratchpad) | [uiseoya.com/credential?service=notes](https://uiseoya.com/credential?service=notes) |

---

## What's inside

### Console `/console`
A private launcher page. Select a tool to authenticate and open it. Keyboard shortcuts `1`–`2` open tools directly. Supports grid, roster, and dock layouts via the tweaks panel.

### Keyring `/keyring`
A client-side TOTP (OTP) vault:
- RFC 6238 TOTP codes via `window.crypto.subtle` HMAC-SHA-1 for real base32 secrets
- AES-GCM-256 encrypted vault in `localStorage` — secrets never leave the browser
- Backup recovery codes with tap-to-copy
- Demo mode (`?demo=1`) — no real codes, no auth required
- Drag-to-reorder accounts, favorites, per-account color theming

### Notes `/notes`
A fast local markdown scratchpad:
- All notes stored in `localStorage` — no server, no sync
- Pin notes, search, word count
- Auto-save with 800 ms debounce, flush on page unload

### Credential gate `/credential`
Shared auth page for both tools. Handles the `?service=otp` and `?service=notes` flows. Guest/demo mode available for Keyring.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML + React 18 (UMD) + Babel standalone — no build step |
| Styles | CSS custom properties, dark/light themes, accent theming |
| OTP crypto | `window.crypto.subtle` — PBKDF2 + AES-GCM + HMAC-SHA-1 |
| Auth backend | Flask 3 + Gunicorn (`POST /keyring/api/auth`) |
| Server | nginx:alpine |
| Container | Docker + Docker Compose |

---

## How it works

```
Browser
  └─ /console                         ← launcher (console/index.html + console-app.jsx)
       ├─ → /credential?service=otp   ← auth gate (credential/index.html + credential-app.jsx)
       │       POST /keyring/api/auth  ← nginx proxies to keyring-backend Flask service
       │       200 OK → /keyring/      ← vault app (keyring/index.html + keyring-*.jsx)
       │                               AES-GCM vault in localStorage
       └─ → /credential?service=notes ← auth gate (same credential-app.jsx, notes service)
               POST /keyring/api/auth  ← same auth endpoint, same credential
               200 OK → /notes        ← notes app (notes/index.html + notes-app.jsx)
                                       notes in localStorage['ej_notes']
```

Both tools share a single `KEYRING_CREDENTIAL`. The auth backend only gates login — it never stores or sees OTP secrets or note contents.

---

## Deploy

### Prerequisites

- Docker + Docker Compose

### Steps

```bash
git clone https://github.com/euisuh/console.git
cd console
cp .env.example .env
# Edit .env: set KEYRING_CREDENTIAL=your@email.com:yourpassword
docker compose up -d --build
```

Runs on `127.0.0.1:8088` by default. Reverse-proxy through nginx or nginx-proxy-manager for production TLS.

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KEYRING_CREDENTIAL` | Shared login credential (`identifier:password`) | `you@email.com:changeme` |

### Health check

```bash
curl http://localhost:8088/keyring/api/health
# {"status": "ok"}
```

### Local dev (no Docker)

Serve `public/` directly for the frontend:

```bash
python3 -m http.server 8080 -d public
# Visit http://localhost:8080/console/
# Use ?demo=1 for Keyring: http://localhost:8080/keyring/?demo=1
# Notes: http://localhost:8080/notes/  (auth skipped — no backend running)
```

For full auth flow, run the backend separately:

```bash
cd backend
pip install flask gunicorn
KEYRING_CREDENTIAL=you@email.com:pw python app.py
```

---

## Structure

```
public/
  console/
    index.html          # Launcher shell — loads console-app.jsx
  keyring/
    index.html          # OTP vault shell — loads keyring-*.jsx
    manifest.json       # PWA manifest
  notes/
    index.html          # Notes shell — loads notes-app.jsx (self-contained)
  credential/
    index.html          # Auth gate shell — loads credential-app.jsx
  console-app.jsx       # Launcher registry (Keyring + Notes)
  keyring-app.jsx       # Vault root — auth routing, account list, vault persistence
  keyring-lib.jsx       # TOTP engine, AES-GCM crypto, shared components
  keyring-screens.jsx   # AccountRow, BackupCard, Add modals
  notes-app.jsx         # Notes scratchpad app
  credential-app.jsx    # Auth gate (otp + notes services)
  tweaks-panel.jsx      # Floating tweaks shell (theme, accent, density, layout)
  favicon.ico / favicon.png / robots.txt
backend/
  app.py                # Flask auth endpoint
  requirements.txt
  Dockerfile
nginx.conf              # Routing: /console, /keyring, /notes, /credential, /keyring/api/
Dockerfile              # nginx image
docker-compose.yml      # nginx + keyring-backend Flask
.env.example
```

---

## Security notes

- OTP secrets are stored AES-GCM encrypted in `localStorage`. The vault key is derived from your password at login and kept only in a JS `useRef` — never persisted.
- Notes are stored unencrypted in `localStorage`. Access is gated by the credential check; notes never leave the browser.
- The Flask auth service reads credentials from an environment variable, never from disk or a database.
- nginx sends `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` on all responses.
- The credential gate and tool pages are marked `noindex, nofollow`. `robots.txt` disallows all crawlers.

---

## Related

- **[euisuh/keyring](https://github.com/euisuh/keyring)** — standalone Keyring deployment (OTP vault only, no console or notes)

---

## License

MIT
