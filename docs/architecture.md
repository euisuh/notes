# Architecture

## Overview

```
                    Browser
                       │
              /console (launcher)
             /         \
   /credential          /credential
   ?service=otp         ?service=notes
        │                    │
        │  POST /keyring/api/auth (shared)
        │        │
        │   keyring-backend
        │   (Flask, reads KEYRING_CREDENTIAL)
        │        │
      200 OK   200 OK
        │        │
   /keyring/   /notes
  (OTP vault) (scratchpad)
  localStorage localStorage
```

## Request flow

```
nginx (port 80)
  ├─ /console          → public/console/index.html
  ├─ /keyring/         → public/keyring/index.html
  ├─ /notes            → public/notes/index.html
  ├─ /credential       → public/credential/index.html
  └─ /keyring/api/*    → keyring-backend:8080 (Flask)
```

## Auth flow

1. User visits `/console`, clicks a tool (e.g. Keyring)
2. Redirect to `/credential?service=otp`
3. `credential-app.jsx` renders login form
4. On submit: `POST /keyring/api/auth` with `{id, password}`
5. nginx proxies to Flask `keyring-backend` container
6. Flask checks `KEYRING_CREDENTIAL` env var; returns `200 OK` or `401`
7. On success: `sessionStorage` handoff → redirect to `/keyring/` or `/notes`
8. Tool page checks `sessionStorage` for auth token; redirects to `/credential` if absent

Notes auth uses the same endpoint and same credential as Keyring. There is one credential for the entire console.

## Crypto (Keyring vault)

```
password
    │
    └─ PBKDF2-SHA-256 (210,000 iterations, random 16-byte salt)
            │
            └─ 256-bit AES-GCM key
                    │
                    ├─ encrypt(OTP secrets JSON) → base64 ciphertext
                    │   (12-byte random IV prepended)
                    └─ stored in localStorage['kr_vault']
```

The vault key lives only in a React `useRef` for the session duration. It is never persisted.

TOTP codes use `window.crypto.subtle` HMAC-SHA-1 (RFC 6238). Demo mode uses a deterministic hash fallback — no real secrets involved.

## Notes storage

Notes are stored as a JSON array in `localStorage['ej_notes']`:

```json
[
  {
    "id": "uuid",
    "title": "string",
    "body": "string",
    "pinned": false,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
]
```

On parse failure, the corrupt payload is backed up to `ej_notes_corrupt_<timestamp>` before the app resets to an empty state.

## No-build frontend

All frontend pages use React 18 + Babel standalone loaded from unpkg CDN. JSX files are fetched as `text/babel` scripts and transpiled in the browser. No npm, no bundler, no build step. The only server-side computation is the auth endpoint.

## Container layout

```
docker-compose.yml
  personal-tools (nginx:alpine)
    COPY public/ → /usr/share/nginx/html/
    port 127.0.0.1:8088:80
    depends_on: keyring-backend

  keyring-backend (python:3.12-slim + flask + gunicorn)
    backend/app.py
    KEYRING_CREDENTIAL from .env
    port :8080 (internal only)
```
