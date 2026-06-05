# Keyring Portfolio Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, well-documented portfolio repo (`euisuh/keyring`) at `/Users/uiseo/Documents/archive/keyring/` that contains the Keyring OTP vault app with a minimal Flask auth backend — extracted from `../deploy/personal-site`.

**Architecture:** Static React/Babel frontend (no build step) served by nginx. Auth is a single-endpoint Flask service proxied through nginx at `/keyring/api/`. Credential gate at `/credential?service=otp` redirects to the vault at `/keyring/`. Everything runs via Docker Compose.

**Tech Stack:** nginx:alpine, React 18 (UMD), Babel standalone, Python 3.12, Flask, Gunicorn, Docker Compose

**Live demo:** `uiseoya.com/credential?service=otp`

---

## File Map

```
/Users/uiseo/Documents/archive/keyring/
  public/
    keyring/
      index.html          # Keyring app shell (copy from personal-site/public/keyring/index.html — no changes)
    credential/
      index.html          # Credential gate shell (copy from personal-site/public/credential/index.html — no changes)
    tweaks-panel.jsx      # Copy unchanged
    keyring-lib.jsx       # Copy unchanged
    keyring-screens.jsx   # Copy unchanged
    keyring-app.jsx       # Adapt: fix dead-code redirect
    credential-app.jsx    # Adapt: strip to otp service only, update console back link
    favicon.ico           # Copy unchanged
    favicon.png           # Copy unchanged
    robots.txt            # New: disallow credential + keyring for crawlers
    manifest.json         # Adapted: update start_url to /keyring/
  auth/
    app.py                # Flask: POST /keyring/api/auth
    requirements.txt      # flask, gunicorn
    Dockerfile            # python:3.12-slim + gunicorn
  nginx.conf              # Standalone: keyring + credential + auth proxy
  Dockerfile              # nginx:alpine, copies public/
  docker-compose.yml      # Two services: keyring-nginx + keyring-auth
  .env.example            # KEYRING_CREDENTIAL=you@email.com:changeme
  .gitignore              # .env, __pycache__, *.pyc, data/
  README.md               # Deploy instructions + live demo link
  docs/
    architecture.md       # System design, crypto, auth flow, data storage
```

---

## Task 1: Initialize repo + GitHub issue

**Files:**
- Create: `/Users/uiseo/Documents/archive/keyring/`

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create euisuh/keyring --public --description "Client-side TOTP vault with encrypted localStorage, RFC 6238 TOTP, and backup recovery codes. Live at uiseoya.com/credential?service=otp" --clone=false
```

Expected output: `https://github.com/euisuh/keyring`

- [ ] **Step 2: Create tracking issue**

```bash
gh issue create --repo euisuh/keyring \
  --title "feat: initial standalone keyring portfolio repo" \
  --body "$(cat <<'EOF'
## Summary

Extract the Keyring OTP vault from the personal-site monorepo into a standalone portfolio repo.

## Scope

- Static frontend: keyring app + credential gate (React/Babel, no build step)
- Auth backend: minimal Flask service for login verification
- nginx: serves static files, proxies `/keyring/api/` to auth service
- Docker Compose: single-command deploy
- Documentation: README with deploy guide, docs/architecture.md

## Live reference

https://uiseoya.com/credential?service=otp

## Checklist

- [ ] Project structure + .gitignore
- [ ] Static files (copied + adapted from personal-site)
- [ ] Flask auth service
- [ ] nginx config
- [ ] Docker Compose + Dockerfiles
- [ ] .env.example
- [ ] README.md
- [ ] docs/architecture.md
EOF
)"
```

Expected: Issue number printed (e.g., `#1`)

- [ ] **Step 3: Initialize local repo on a feature branch**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git init && \
git remote add origin https://github.com/euisuh/keyring.git && \
git checkout -b feat/initial-setup
```

---

## Task 2: Project scaffold — .gitignore + .env.example

**Files:**
- Create: `keyring/.gitignore`
- Create: `keyring/.env.example`

- [ ] **Step 1: Create .gitignore**

```
/Users/uiseo/Documents/archive/keyring/.gitignore
```

Content:
```
.env
__pycache__/
*.pyc
*.pyo
auth/data/
.DS_Store
```

- [ ] **Step 2: Create .env.example**

```
/Users/uiseo/Documents/archive/keyring/.env.example
```

Content:
```bash
# Keyring credentials — copy to .env and fill in real values.
# Format: identifier:password  (identifier can be email or username)
KEYRING_CREDENTIAL=you@email.com:changeme
```

- [ ] **Step 3: Commit scaffold**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add .gitignore .env.example && \
git commit -m "chore: initialize repo with .gitignore and .env.example"
```

---

## Task 3: Copy unchanged static files

**Files:**
- Create: `public/tweaks-panel.jsx` (copy)
- Create: `public/keyring-lib.jsx` (copy)
- Create: `public/keyring-screens.jsx` (copy)
- Create: `public/keyring/index.html` (copy)
- Create: `public/credential/index.html` (copy)
- Create: `public/favicon.ico` (copy)
- Create: `public/favicon.png` (copy)

Source: `/Users/uiseo/Documents/deploy/personal-site/public/`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p /Users/uiseo/Documents/archive/keyring/public/keyring \
         /Users/uiseo/Documents/archive/keyring/public/credential
```

- [ ] **Step 2: Copy files**

```bash
SRC=/Users/uiseo/Documents/deploy/personal-site/public
DST=/Users/uiseo/Documents/archive/keyring/public

cp "$SRC/tweaks-panel.jsx"    "$DST/tweaks-panel.jsx"
cp "$SRC/keyring-lib.jsx"     "$DST/keyring-lib.jsx"
cp "$SRC/keyring-screens.jsx" "$DST/keyring-screens.jsx"
cp "$SRC/keyring/index.html"  "$DST/keyring/index.html"
cp "$SRC/credential/index.html" "$DST/credential/index.html"
cp "$SRC/favicon.ico"         "$DST/favicon.ico"
cp "$SRC/favicon.png"         "$DST/favicon.png"
```

- [ ] **Step 3: Verify files are present**

```bash
ls /Users/uiseo/Documents/archive/keyring/public/
ls /Users/uiseo/Documents/archive/keyring/public/keyring/
ls /Users/uiseo/Documents/archive/keyring/public/credential/
```

Expected: `tweaks-panel.jsx keyring-lib.jsx keyring-screens.jsx credential/ keyring/ favicon.ico favicon.png`

- [ ] **Step 4: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add public/ && \
git commit -m "feat: add keyring and credential static shells (copied from personal-site)"
```

---

## Task 4: Adapt keyring-app.jsx

**Files:**
- Create: `public/keyring-app.jsx` (adapted copy)

Changes from source:
1. `keyringCredentialRedirect()` (dead code at line 38): update redirect from `/console` → `/credential?service=otp`
2. No other logic changes needed — sign-out and auto-login already redirect to `/credential?service=otp`

- [ ] **Step 1: Copy source file**

```bash
cp /Users/uiseo/Documents/deploy/personal-site/public/keyring-app.jsx \
   /Users/uiseo/Documents/archive/keyring/public/keyring-app.jsx
```

- [ ] **Step 2: Update dead-code redirect**

Open `/Users/uiseo/Documents/archive/keyring/public/keyring-app.jsx`.

Find and replace (line ~38):
```javascript
function keyringCredentialRedirect() {
  location.replace('/console');
}
```
With:
```javascript
function keyringCredentialRedirect() {
  location.replace('/credential?service=otp');
}
```

- [ ] **Step 3: Verify no other console references remain**

```bash
grep -n "console" /Users/uiseo/Documents/archive/keyring/public/keyring-app.jsx
```

Expected: only `/* eslint-disable react-hooks/exhaustive-deps */` comments or none — no `/console` href.

- [ ] **Step 4: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add public/keyring-app.jsx && \
git commit -m "feat: add keyring-app.jsx adapted for standalone deploy"
```

---

## Task 5: Adapt credential-app.jsx

**Files:**
- Create: `public/credential-app.jsx` (adapted copy)

Changes from source:
1. Remove `kanban`, `posts`, `notes` entries from `SERVICES` — keep only `otp`
2. Topbar: change back link from `href="/console"` → `href="/"` with text `keyring`
3. `FALLBACK.redirect`: change `location.href = '/console'` → `location.href = '/'`

- [ ] **Step 1: Copy source file**

```bash
cp /Users/uiseo/Documents/deploy/personal-site/public/credential-app.jsx \
   /Users/uiseo/Documents/archive/keyring/public/credential-app.jsx
```

- [ ] **Step 2: Strip SERVICES to otp only**

Open `/Users/uiseo/Documents/archive/keyring/public/credential-app.jsx`.

Replace the entire `SERVICES` object (from `const SERVICES = {` through the closing `};`) with:

```javascript
const SERVICES = {
  otp: {
    name: 'Keyring',
    kind: '2FA · OTP vault',
    glyph: 'OTP',
    tone: '#7dd3fc',
    headline: <>Unlock your <span className="accent">vault</span>.</>,
    sub: <>access your<span className="ser"> one-time codes</span>.</>,
    lede: <>Your OTP vault stays local. Enter your <b>keyring credentials</b> to unlock your saved codes on this device.</>,
    guestLabel: 'EXPLORE DEMO VAULT',
    guestHint: 'Guest mode loads sample accounts. No real codes are shown.',
    onAuth: () => {},
    onGuest: () => {
      try { localStorage.removeItem('kr_user'); } catch (e) {}
    },
    redirect: async (auth, qs, id, pw) => {
      if (auth) {
        let res;
        try {
          res = await fetch('/keyring/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password: pw }),
          });
        } catch (e) {
          return 'Could not reach auth server. Try again.';
        }
        if (!res.ok) return 'Incorrect username or password.';
        try { sessionStorage.setItem('kr_pending_auth', JSON.stringify({ email: id, pw })); } catch (e) {}
        location.href = '/keyring/';
      } else {
        location.href = '/keyring/?demo=1';
      }
    },
  },
};
```

- [ ] **Step 3: Update topbar back link**

Find:
```jsx
          <a className="back-link" href="/console">
            <Ico d={IC.arrow} size={13} sw={1.6} style={{ transform: 'rotate(180deg)' }} />
            console
          </a>
```

Replace with:
```jsx
          <a className="back-link" href="/">
            <Ico d={IC.arrow} size={13} sw={1.6} style={{ transform: 'rotate(180deg)' }} />
            keyring
          </a>
```

- [ ] **Step 4: Update FALLBACK redirect**

Find:
```javascript
  redirect: (_auth, _qs) => { location.href = '/console'; },
```

Replace with:
```javascript
  redirect: (_auth, _qs) => { location.href = '/'; },
```

- [ ] **Step 5: Verify no remaining /console references**

```bash
grep -n "console" /Users/uiseo/Documents/archive/keyring/public/credential-app.jsx
```

Expected: zero matches for `/console` href.

- [ ] **Step 6: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add public/credential-app.jsx && \
git commit -m "feat: add credential-app.jsx stripped to otp service only"
```

---

## Task 6: Static assets — robots.txt + manifest.json

**Files:**
- Create: `public/robots.txt`
- Create: `public/manifest.json`

- [ ] **Step 1: Create robots.txt**

```
/Users/uiseo/Documents/archive/keyring/public/robots.txt
```

Content:
```
User-agent: *
Disallow: /credential
Disallow: /keyring/
```

- [ ] **Step 2: Create manifest.json**

```
/Users/uiseo/Documents/archive/keyring/public/manifest.json
```

Content:
```json
{
  "name": "Keyring",
  "short_name": "Keyring",
  "start_url": "/keyring/",
  "display": "standalone",
  "background_color": "#08090d",
  "theme_color": "#7dd3fc",
  "icons": []
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add public/robots.txt public/manifest.json && \
git commit -m "feat: add robots.txt and PWA manifest"
```

---

## Task 7: Flask auth service

**Files:**
- Create: `auth/app.py`
- Create: `auth/requirements.txt`
- Create: `auth/Dockerfile`

- [ ] **Step 1: Create auth/requirements.txt**

```
/Users/uiseo/Documents/archive/keyring/auth/requirements.txt
```

Content:
```
flask==3.1.0
gunicorn==23.0.0
```

- [ ] **Step 2: Create auth/app.py**

```
/Users/uiseo/Documents/archive/keyring/auth/app.py
```

Content:
```python
import os
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/keyring/api/auth', methods=['POST'])
def auth():
    credential = os.environ.get('KEYRING_CREDENTIAL', '')
    parts = credential.split(':', 1)
    if len(parts) != 2 or not parts[0]:
        return jsonify({'error': 'Server misconfigured'}), 500

    stored_id, stored_pw = parts
    data = request.get_json(silent=True) or {}
    if data.get('id') == stored_id and data.get('password') == stored_pw:
        return jsonify({'ok': True}), 200
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/keyring/api/health')
def health():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

- [ ] **Step 3: Create auth/Dockerfile**

```
/Users/uiseo/Documents/archive/keyring/auth/Dockerfile
```

Content:
```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "app:app"]
```

- [ ] **Step 4: Verify auth service locally (optional)**

```bash
cd /Users/uiseo/Documents/archive/keyring/auth && \
pip install flask gunicorn && \
KEYRING_CREDENTIAL=user@test.com:secret python app.py &
curl -s -X POST http://localhost:8080/keyring/api/auth \
  -H "Content-Type: application/json" \
  -d '{"id":"user@test.com","password":"secret"}' && echo
# Expected: {"ok":true}
curl -s -X POST http://localhost:8080/keyring/api/auth \
  -H "Content-Type: application/json" \
  -d '{"id":"user@test.com","password":"wrong"}' && echo
# Expected: {"error":"Invalid credentials"} with 401
kill %1
```

- [ ] **Step 5: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add auth/ && \
git commit -m "feat: add minimal Flask auth service for keyring login"
```

---

## Task 8: nginx config

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Create nginx.conf**

```
/Users/uiseo/Documents/archive/keyring/nginx.conf
```

Content:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Root redirects to credential gate
    location = / {
        return 302 /credential?service=otp;
    }

    # Keyring app
    location = /keyring {
        return 301 /keyring/$is_args$args;
    }

    location = /keyring/ {
        try_files /keyring/index.html =404;
    }

    # Auth API — proxied to Flask service
    location ^~ /keyring/api/ {
        proxy_pass http://keyring-auth:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Credential gate
    location = /credential {
        try_files /credential/index.html =404;
    }

    location = /credential/ {
        return 301 /credential$is_args$args;
    }

    # Static assets
    location / {
        try_files $uri =404;
    }

    location ~* \.(?:html)$ {
        add_header Cache-Control "no-cache, must-revalidate";
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location ~* \.(?:css|js|svg|woff2?|ttf|otf|png|jpe?g|gif|webp|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location = /robots.txt {
        log_not_found off;
        access_log off;
    }

    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add nginx.conf && \
git commit -m "feat: add nginx config for standalone keyring deploy"
```

---

## Task 9: Dockerfile + docker-compose.yml

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create root Dockerfile (nginx)**

```
/Users/uiseo/Documents/archive/keyring/Dockerfile
```

Content:
```dockerfile
FROM nginx:alpine

COPY public/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/keyring/api/health >/dev/null 2>&1 || exit 1
```

- [ ] **Step 2: Create docker-compose.yml**

```
/Users/uiseo/Documents/archive/keyring/docker-compose.yml
```

Content:
```yaml
services:
  keyring-nginx:
    build: .
    image: keyring:latest
    container_name: keyring
    restart: unless-stopped
    ports:
      - "127.0.0.1:8088:80"
    depends_on:
      - keyring-auth
    networks:
      - default
      - npm

  keyring-auth:
    build: ./auth
    image: keyring-auth:latest
    container_name: keyring-auth
    restart: unless-stopped
    env_file:
      - path: .env
        required: false
    environment:
      KEYRING_CREDENTIAL: ${KEYRING_CREDENTIAL:-you@email.com:changeme}
    networks:
      - default

networks:
  npm:
    external: true
    name: nginx-proxy-manager_default
```

- [ ] **Step 3: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add Dockerfile docker-compose.yml && \
git commit -m "feat: add Dockerfile and docker-compose for single-command deploy"
```

---

## Task 10: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```
/Users/uiseo/Documents/archive/keyring/README.md
```

Content:
```markdown
# Keyring

A client-side TOTP vault with AES-GCM encrypted localStorage, RFC 6238 OTP codes, and backup recovery code management. No cloud sync, no third-party dependencies for the vault itself.

**Live:** [uiseoya.com/credential?service=otp](https://uiseoya.com/credential?service=otp)

## Features

- **RFC 6238 TOTP** — real `crypto.subtle` HMAC-SHA-1 for base32 secrets; deterministic hash fallback for demo seeds
- **AES-GCM-256 vault** — PBKDF2-SHA-256 (210 000 iterations) → AES-GCM. 12-byte random IV prepended to ciphertext, stored as base64 in `localStorage`
- **Backup codes** — per-service recovery code sets with tap-to-copy and used-state tracking
- **Demo mode** — `?demo=1` loads sample accounts without touching the real vault
- **Drag reorder** — HTML5 drag-and-drop to reorder accounts
- **Tweaks panel** — live accent color, density, layout, and theme switching

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML + React 18 (UMD) + Babel standalone — no build step |
| Styles | CSS custom properties (dark/light themes, accent theming) |
| Crypto | `window.crypto.subtle` — PBKDF2 + AES-GCM + HMAC-SHA-1 |
| Auth backend | Flask 3 + Gunicorn (single `POST /keyring/api/auth` endpoint) |
| Server | nginx:alpine |
| Container | Docker + Docker Compose |

## How it works

```
Browser
  └─ /credential?service=otp    ← auth gate (credential/index.html + credential-app.jsx)
       │  POST /keyring/api/auth  ← nginx proxies to keyring-auth Flask service
       │  200 OK → sessionStorage handoff
       └─ /keyring/              ← vault app (keyring/index.html + keyring-*.jsx)
            │  TOTP codes via crypto.subtle (client only)
            └─ localStorage kr_vault ← AES-GCM encrypted vault
```

The vault never leaves the browser. The auth service only gates initial login — it does not store or see OTP secrets.

## Deploy

### Prerequisites

- Docker + Docker Compose
- nginx-proxy-manager (for production TLS — or remove the `npm` network and expose port directly)

### Steps

```bash
git clone https://github.com/euisuh/keyring.git
cd keyring
cp .env.example .env
# Edit .env: set KEYRING_CREDENTIAL=your@email.com:yourpassword
docker compose up -d --build
```

Runs on `127.0.0.1:8088` by default. In production, reverse-proxy through nginx-proxy-manager to add TLS.

If you don't use nginx-proxy-manager, remove the `npm` network block from `docker-compose.yml` and change the port binding to `0.0.0.0:8088:80`.

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KEYRING_CREDENTIAL` | Login credential in `identifier:password` format | `you@email.com:changeme` |

### Health check

```bash
curl http://localhost:8088/keyring/api/health
# {"status": "ok"}
```

### Local dev (no Docker)

Serve `public/` from a static server for the frontend:

```bash
python3 -m http.server 8080 -d public
```

For auth, run the Flask service separately:

```bash
cd auth
pip install flask gunicorn
KEYRING_CREDENTIAL=you@email.com:pw python app.py
```

Then visit `http://localhost:8080/credential?service=otp`. The auth POST will fail (different port) — use demo mode instead: `http://localhost:8080/keyring/?demo=1`.

## Structure

```
public/
  keyring/
    index.html          # Vault app shell — loads keyring-*.jsx via Babel
  credential/
    index.html          # Auth gate shell — loads credential-app.jsx
  keyring-lib.jsx       # TOTP engine, AES-GCM vault crypto, shared icons + components
  keyring-app.jsx       # Root vault app — auth routing, account list, vault persistence
  keyring-screens.jsx   # AccountRow, BackupCard, AddModal, AddBackupModal
  credential-app.jsx    # Auth gate — OTP service definition + login form
  tweaks-panel.jsx      # Floating tweaks shell (theme, accent, density, layout)
  favicon.ico / favicon.png / manifest.json / robots.txt
auth/
  app.py                # Flask auth endpoint
  requirements.txt
  Dockerfile
nginx.conf
Dockerfile
docker-compose.yml
.env.example
```

## Security notes

- OTP secrets are stored AES-GCM encrypted in `localStorage`. The vault key is derived from your password at login and kept only in a JS `useRef` — it is never persisted.
- The Flask auth service reads credentials from an environment variable, never from disk or a database.
- nginx sends `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` headers on all responses.
- The credential gate is marked `noindex, nofollow` in its meta tags. `robots.txt` also disallows `/credential` and `/keyring/`.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add README.md && \
git commit -m "docs: add README with deploy guide, architecture overview, and live demo link"
```

---

## Task 11: docs/architecture.md

**Files:**
- Create: `docs/architecture.md`

- [ ] **Step 1: Create docs directory + architecture.md**

```bash
mkdir -p /Users/uiseo/Documents/archive/keyring/docs
```

Write `/Users/uiseo/Documents/archive/keyring/docs/architecture.md`:

```markdown
# Architecture

## Overview

Keyring is a two-component system: a static frontend and a single-endpoint auth backend. The vault itself is entirely client-side — the backend only verifies login credentials.

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser                                                         │
│                                                                 │
│  /credential?service=otp   /keyring/                           │
│  ┌────────────────────┐    ┌──────────────────────────────┐    │
│  │ credential-app.jsx │    │ keyring-app.jsx               │    │
│  │                    │    │  + keyring-lib.jsx            │    │
│  │  Login form        │    │  + keyring-screens.jsx        │    │
│  │  POST /keyring/api/│    │                               │    │
│  │  auth              │    │  Vault: AES-GCM encrypted     │    │
│  │  ↓ 200 OK          │    │  in localStorage              │    │
│  │  sessionStorage    │    │  TOTP: crypto.subtle HMAC-1   │    │
│  │  handoff ──────────┼───▶│                               │    │
│  └────────────────────┘    └──────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────────┘
                        │ POST /keyring/api/auth
┌─────────────────────────────────────────────────────────────────┐
│ nginx                 │                                         │
│                       │ proxy_pass http://keyring-auth:8080     │
│  /credential ──▶ credential/index.html                          │
│  /keyring/   ──▶ keyring/index.html                             │
│  /           ──▶ 302 /credential?service=otp                    │
│  /*.jsx      ──▶ static file (30d cache)                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────────────┐
│ keyring-auth (Flask)                                            │
│                                                                 │
│  POST /keyring/api/auth                                         │
│    reads KEYRING_CREDENTIAL env var                             │
│    compares { id, password } → 200 | 401                       │
│                                                                 │
│  GET  /keyring/api/health → 200                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Auth flow

1. User navigates to any URL → nginx redirects to `/credential?service=otp`
2. `credential-app.jsx` renders a login form
3. On submit: `POST /keyring/api/auth` with `{ id, password }`
4. nginx proxies to `keyring-auth:8080`
5. Flask compares against `KEYRING_CREDENTIAL` env var. Returns `200` or `401`
6. On `200`: credential-app writes `{ email, pw }` to `sessionStorage['kr_pending_auth']` then navigates to `/keyring/`
7. `keyring-app.jsx` reads `kr_pending_auth` from sessionStorage, removes it immediately, and calls `handleLogin(email, pw)`
8. `handleLogin` derives an AES-GCM key from the password via PBKDF2, decrypts the vault from `localStorage['kr_vault']`, and loads accounts into state

The raw password exists only in React state during the login call — it is never stored. The derived `CryptoKey` lives in a `useRef` for the session lifetime.

## Vault crypto

| Step | Detail |
|------|--------|
| Key derivation | PBKDF2-SHA-256, 210 000 iterations, 16-byte random salt stored in `localStorage['kr_salt']` |
| Encryption | AES-GCM-256, 12-byte random IV per save, IV prepended to ciphertext |
| Storage | `btoa(iv + ciphertext)` in `localStorage['kr_vault']` |
| On wrong password | `decryptVault` throws → login fails with "Wrong password" |

## TOTP engine

- For **base32 secrets** (real accounts): RFC 6238 via `crypto.subtle.importKey` + `HMAC-SHA-1`. Counter = `floor(unix_time / 30)`.
- For **demo seeds** (non-base32 strings): deterministic FNV-1a hash — produces stable fake codes for the demo without needing real secrets.
- Period is per-account (30s or 60s). The `useClock` hook ticks every 250 ms so countdowns stay smooth.

## Data model

```typescript
// TOTP account stored in vault
interface Account {
  id: string;          // 'a' + Date.now()
  issuer: string;      // "GitHub"
  account: string;     // "you@email.com"
  seed: string;        // base32 secret or demo seed string
  tone: string;        // color preset key: 'slate' | 'blue' | 'violet' | ...
  fav: boolean;        // pinned to top of list
  period?: number;     // TOTP period in seconds, default 30
}

// Backup recovery code set
interface Backup {
  id: string;
  issuer: string;
  tone: string;
  codes: string[];     // raw recovery code strings
  used: number[];      // indices of used codes
}

// Vault stored in localStorage (encrypted)
interface Vault {
  accounts: Account[];
  backups: Backup[];
}
```

## File responsibilities

| File | Responsibility |
|------|----------------|
| `keyring-lib.jsx` | TOTP engine, AES-GCM crypto functions, shared icons, `Tile`, `Countdown`, `Toast`, `useClock`, seed data |
| `keyring-app.jsx` | Root app — auth state machine, vault load/save, account/backup CRUD, drag reorder, export/import |
| `keyring-screens.jsx` | `AccountRow` (code display + copy), `BackupCard`, `AddModal`, `AddBackupModal` |
| `credential-app.jsx` | Auth gate — login form, guest mode, auth POST, sessionStorage handoff |
| `tweaks-panel.jsx` | Floating tweaks panel — `useTweaks`, `TweakRadio`, `TweakColor`, drag to reposition |
| `auth/app.py` | Flask: `POST /keyring/api/auth` credential check, `GET /keyring/api/health` |
| `nginx.conf` | Route `/credential` + `/keyring/`, proxy `/keyring/api/`, cache static assets |
```

- [ ] **Step 2: Commit**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git add docs/ && \
git commit -m "docs: add architecture documentation covering auth flow, crypto, and data model"
```

---

## Task 12: Push + open PR

- [ ] **Step 1: Push feature branch**

```bash
cd /Users/uiseo/Documents/archive/keyring && \
git push -u origin feat/initial-setup
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --repo euisuh/keyring \
  --title "feat: initial standalone keyring portfolio repo" \
  --base main \
  --head feat/initial-setup \
  --body "$(cat <<'EOF'
## Summary

- Extracts the Keyring OTP vault from `personal-site` into a standalone repo
- Adds a minimal Flask auth service (`POST /keyring/api/auth`)
- Strips `credential-app.jsx` to the `otp` service only
- Adds nginx config, Docker Compose, `.env.example`
- Adds README with deploy guide and live demo link
- Adds `docs/architecture.md` covering auth flow, vault crypto, TOTP engine, and data model

## Live demo

https://uiseoya.com/credential?service=otp

## Test plan

- [ ] `docker compose up -d --build` completes without error
- [ ] `curl http://localhost:8088/` redirects to `/credential?service=otp`
- [ ] `curl http://localhost:8088/keyring/api/health` returns `{"status":"ok"}`
- [ ] Auth POST with correct credentials returns 200
- [ ] Auth POST with wrong credentials returns 401
- [ ] Visiting `/credential?service=otp` in browser shows login form
- [ ] Demo mode (`/keyring/?demo=1`) loads sample accounts without login
- [ ] Login with correct credentials opens vault and loads (empty) account list

Closes #1

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.
```

---

## Self-Review

**Spec coverage check:**
- ✅ Keyring standalone (no kanban/notes/posts)
- ✅ Minimal Flask auth backend
- ✅ Credential gate (otp service only)
- ✅ nginx config
- ✅ Docker Compose
- ✅ `.env.example`
- ✅ README with deploy instructions + `uiseoya.com/credential?service=otp` link
- ✅ `docs/architecture.md`
- ✅ GitHub issue + commits + PR

**Placeholder scan:** No TBDs, no TODOs, no "implement later" — all steps have exact file content or exact commands.

**Type consistency:** `Account.seed`, `Backup.codes`, `Backup.used` types used in architecture.md match the actual field names in `keyring-lib.jsx` seed data and `keyring-app.jsx` state.
