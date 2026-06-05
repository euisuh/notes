# Architecture

## Overview

```
Browser
  └─ /credential?service=notes   ← auth gate
       POST /keyring/api/auth
            │
       keyring-backend (Flask)
       reads KEYRING_CREDENTIAL
            │
         200 OK
            │
       /notes                     ← notes app
       localStorage['ej_notes']   ← all data (never leaves browser)
```

## Request routing

```
nginx (port 80)
  ├─ /notes          → public/notes/index.html
  ├─ /credential     → public/credential/index.html
  └─ /keyring/api/*  → keyring-backend:8080 (Flask)
```

## Auth flow

1. User visits `/credential?service=notes`
2. `credential-app.jsx` renders login form
3. On submit: `POST /keyring/api/auth` with `{id, password}`
4. nginx proxies to Flask `keyring-backend` container
5. Flask checks `KEYRING_CREDENTIAL` env var; returns `200 OK` or `401`
6. On success: `sessionStorage.setItem('notes_authed', '1')` → redirect to `/notes`
7. `notes-app.jsx` checks `sessionStorage` on load; redirects to `/credential` if absent

## Notes storage

Notes stored as JSON array in `localStorage['ej_notes']`:

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

On parse failure: corrupt payload backed up to `ej_notes_corrupt_<timestamp>`, app resets to empty state.

## Save behaviour

- Changes debounce 800 ms before writing to `localStorage`
- `pagehide` + `beforeunload` flush any pending save immediately

## No-build frontend

React 18 + Babel standalone loaded from unpkg CDN. JSX transpiled in-browser. No npm, no bundler, no build step.

## Container layout

```
docker-compose.yml
  notes-nginx (nginx:alpine)
    COPY public/ → /usr/share/nginx/html/
    port 127.0.0.1:8088:80
    depends_on: keyring-backend

  keyring-backend (python:3.12-slim + flask + gunicorn)
    backend/app.py
    KEYRING_CREDENTIAL from .env
    port :8080 (internal only)
```
