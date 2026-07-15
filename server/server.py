"""
IOCF Dashboard local API server.

Pure standard-library HTTP server (no Flask/pip install required - this
machine has no network access to PyPI). The live "database" is a Google
Sheet that gets pulled down as .xlsx via Google's export endpoint and
cached at IOCF_ALL_BOARDS.xlsx; that local copy is what actually gets
parsed (data.py is unchanged). Re-pulls the sheet at most once every
GOOGLE_REFRESH_SECONDS, and re-parses whenever the pulled file's content
changes, so edits made in the Google Sheet show up automatically without
restarting anything. If the pull fails (offline, sharing revoked, etc.)
the server keeps serving the last good cached copy.

Run:
    python3 server.py
Then in another terminal:
    cd ../web && npm run dev
The Vite dev server proxies /api requests to this server (see vite.config.js).
"""
import hashlib
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import data as data_module

XLSX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "IOCF_ALL_BOARDS.xlsx")
PORT = int(os.environ.get("IOCF_PORT", "8787"))

# The Google Sheet is the live database now; IOCF_ALL_BOARDS.xlsx is just a
# local cache of the last successful pull (used as a fallback if the pull
# fails, and as what data.py actually parses).
GOOGLE_SHEET_ID = os.environ.get(
    "IOCF_SHEET_ID", "1RNkCuLhopiDYGNPJ5YY3zD1TmFaRdEAEw1dwRWL05Qs"
)
GOOGLE_EXPORT_URL = f"https://docs.google.com/spreadsheets/d/{GOOGLE_SHEET_ID}/export?format=xlsx"
GOOGLE_REFRESH_SECONDS = 10

_cache_lock = threading.Lock()
_cache = {"mtime": None, "payload": None, "error": None, "pullError": None}
_last_pull_attempt = 0.0


def _pull_google_sheet(force=False):
    """Best-effort: download the sheet as .xlsx and overwrite the local
    cache file if the content actually changed. Never raises - logs and
    leaves the existing cache file alone on any failure."""
    global _last_pull_attempt
    now = time.time()
    if not force and now - _last_pull_attempt < GOOGLE_REFRESH_SECONDS:
        return
    _last_pull_attempt = now

    try:
        req = urllib.request.Request(
            GOOGLE_EXPORT_URL, headers={"User-Agent": "Mozilla/5.0 (IOCF dashboard)"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read()
    except (urllib.error.URLError, OSError) as e:
        msg = f"Google Sheet pull failed (offline?): {e}"
        print(f"[iocf-server] {msg}")
        _cache["pullError"] = msg
        return

    if not body.startswith(b"PK"):
        msg = (
            "Google Sheet pull returned something that isn't an xlsx file - "
            "check that the sheet is shared as 'Anyone with the link' (Viewer)."
        )
        print(f"[iocf-server] {msg}")
        _cache["pullError"] = msg
        return

    if os.path.exists(XLSX_PATH):
        with open(XLSX_PATH, "rb") as f:
            existing_hash = hashlib.sha256(f.read()).hexdigest()
        if hashlib.sha256(body).hexdigest() == existing_hash:
            _cache["pullError"] = None
            return  # unchanged - don't touch mtime, no re-parse needed

    tmp_path = XLSX_PATH + ".tmp"
    with open(tmp_path, "wb") as f:
        f.write(body)
    os.replace(tmp_path, XLSX_PATH)
    _cache["pullError"] = None
    print("[iocf-server] pulled updated data from Google Sheet")


def _default_json(o):
    if isinstance(o, (datetime,)):
        return o.isoformat()
    return str(o)


def get_dashboard_payload(force=False):
    _pull_google_sheet(force=force)
    with _cache_lock:
        try:
            mtime = os.path.getmtime(XLSX_PATH)
        except OSError as e:
            return {"error": f"Workbook not found at {XLSX_PATH}: {e}"}, 500

        if force or _cache["mtime"] != mtime or _cache["payload"] is None:
            try:
                payload = data_module.build_dashboard(XLSX_PATH)
                payload["generatedAt"] = datetime.fromtimestamp(
                    mtime, tz=timezone.utc
                ).isoformat()
                _cache["mtime"] = mtime
                _cache["payload"] = payload
                _cache["error"] = None
            except Exception as e:  # keep serving the last good payload if re-parse fails
                _cache["error"] = str(e)
                if _cache["payload"] is None:
                    return {"error": str(e)}, 500

        return _cache["payload"], 200


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, obj, status=200):
        body = json.dumps(obj, default=_default_json).encode("utf-8")
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass  # client disconnected before the response finished - harmless

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/dashboard"):
            force = "refresh=1" in self.path
            payload, status = get_dashboard_payload(force=force)
            self._send_json(payload, status)
        elif self.path.startswith("/api/health"):
            self._send_json({
                "ok": True,
                "workbook": XLSX_PATH,
                "googleSheetUrl": f"https://docs.google.com/spreadsheets/d/{GOOGLE_SHEET_ID}/edit",
                "lastPullError": _cache.get("pullError"),
            })
        else:
            self._send_json({"error": "not found"}, 404)

    def log_message(self, fmt, *args):
        sys.stderr.write("[iocf-server] " + (fmt % args) + "\n")


def main():
    print(f"[iocf-server] Google Sheet source: {GOOGLE_EXPORT_URL}")
    print(f"[iocf-server] local cache: {XLSX_PATH}")
    # warm the cache & fail fast with a clear error if the workbook is missing/broken
    payload, status = get_dashboard_payload(force=True)
    if status != 200:
        print(f"[iocf-server] WARNING on startup: {payload.get('error')}")
    else:
        print(f"[iocf-server] loaded {payload['stats']['totalBoards']} boards, "
              f"{payload['stats']['totalPlayers']} players")

    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"[iocf-server] listening on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
