# IOCF Dashboard

International Online Cricket Federation — a premium, dark-themed cricket
management dashboard. Landing page → "Get Started" → full Dashboard, with
modules for Boards, Players, Stadiums, Tournaments, Rankings, Credits,
Trophy Cabinet, Fixtures & Results, Auctions & Transfers, and News.

All data is read live from a Google Sheet:
https://docs.google.com/spreadsheets/d/1RNkCuLhopiDYGNPJ5YY3zD1TmFaRdEAEw1dwRWL05Qs/edit

Edit that sheet, and the dashboard picks it up automatically — the Python
server re-downloads it (as .xlsx, via Google's export endpoint) at most
once every 10 seconds and re-parses whenever the content actually changed.
The frontend polls every 15s, or you can force a refresh via
`/api/dashboard?refresh=1`.

**Sharing requirement:** the sheet must be shared as "Anyone with the link
— Viewer" (Share button, top right of the sheet), otherwise the export
endpoint returns a login page instead of data and the server logs a
warning and keeps serving the last good copy.

The server keeps a local cache of the last successful pull at
`server/IOCF_ALL_BOARDS.xlsx` — this is what actually gets parsed, and it
also acts as a fallback if the machine is offline or the sheet becomes
temporarily unreachable.

## Hosting (production)

The whole app (API + built frontend) runs as a **single Docker service** —
see the root `Dockerfile`. It multi-stage builds the React app with Node,
then copies the static build into a Python image that runs `server.py`,
which serves both `/api/*` and the frontend from one process on one port
(`$PORT`, provided by the host).

Deploying on **Render** (free tier):
1. Push this repo to GitHub (already done if you're reading this from there).
2. On [render.com](https://render.com): **New** → **Web Service** → connect
   this GitHub repo.
3. Render auto-detects the root `Dockerfile` — leave Environment as
   **Docker**, Root Directory blank.
4. No environment variables are required (defaults to the Google Sheet ID
   baked into `server.py`); optionally set `IOCF_SHEET_ID` to point at a
   different sheet.
5. Click **Create Web Service**. First build takes a few minutes (installs
   Node deps, runs `vite build`, installs `openpyxl`). Render gives you a
   public URL like `https://iocf-dashboard.onrender.com` when it's live.

Any other Docker-based host (Railway, Fly.io, a VPS with `docker run`)
works the same way, since it's just a standard `Dockerfile`.

## Running it locally

You need two processes running at once: the Python data server (pulls the
Google Sheet and parses it) and the Vite dev server (the React app). Open
two terminal windows in this project:

**Terminal 1 — data server:**
```
cd server
python3 server.py
```
Leave this running. It serves JSON at http://127.0.0.1:8787/api/dashboard
and pulls the Google Sheet on a timer so edits made there show up on the
next refresh.

**Terminal 2 — web app:**
```
cd web
npm install    # first time only
npm run dev
```
Then open the URL Vite prints (usually http://localhost:5173). The Vite
dev server proxies `/api/*` requests to the data server automatically
(see `web/vite.config.js`).

## Updating the data

Open the Google Sheet, make your changes — the dashboard picks them up
within ~10-25 seconds (no restart of either server needed). To point at a
different sheet, set the `IOCF_SHEET_ID` env var before starting the
server (`IOCF_SHEET_ID=... python3 server.py`).

## Project structure

```
IOCF/
  server/
    IOCF_ALL_BOARDS.xlsx   <- local cache of the last successful Google Sheet pull
    data.py                 <- parses every sheet into a JSON-friendly dict
    server.py               <- tiny stdlib HTTP server; pulls the Google Sheet, serves + caches the parsed data
  web/
    src/
      pages/                <- one file per route (Dashboard, Boards, Players, ...)
      components/           <- shared UI (Badge, StatCard, TopNav, Sidebar, GlobalSearch, ...)
      context/DashboardContext.jsx  <- fetches /api/dashboard, exposes useDashboard()
      lib/                  <- formatting + badge-color helpers
      styles/                <- shared layout/component CSS (design tokens live in index.css)
```

## Notes on the data

The workbook (mirrored from the Google Sheet) is a very free-form "fantasy
cricket league" spreadsheet (no fixed columns, numbered lists, inline
sub-headers) rather than a clean database, so `server/data.py` parses it
heuristically sheet-by-sheet. It never fabricates values — anything not
confidently identifiable in a sheet is simply omitted rather than guessed.
Keep sheet names and column layouts in the Google Sheet consistent with
the original workbook's structure, since that's what the heuristics key
off of.
