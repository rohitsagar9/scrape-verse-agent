"""
api/sse_server.py
-----------------
Tiny FastAPI server with one SSE route that tails heal/live_events.jsonl
and streams new lines to the dashboard.

Also accepts POST /internal/event from heal_agent.py to push events immediately
during live demo recording.

Usage:
    pip install fastapi uvicorn
    python api/sse_server.py
    # Defaults to port 8000
    # Dashboard connects to http://localhost:8000/events
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import AsyncGenerator

ROOT = Path(__file__).parent.parent
LIVE_EVENTS_PATH = ROOT / "heal" / "live_events.jsonl"

try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse, JSONResponse
    import uvicorn
except ImportError:
    print("Install deps: pip install fastapi uvicorn", file=sys.stderr)
    sys.exit(1)

app = FastAPI(title="Autonomous CI Scraper — SSE Event Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dashboard on same host or Vercel preview URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory event queue for immediate pushes
_event_queue: asyncio.Queue = asyncio.Queue()


async def _tail_events() -> AsyncGenerator[str, None]:
    """
    Generator that:
    1. Sends all existing events in live_events.jsonl (catch-up)
    2. Then tails the file + drains the in-memory queue for new events
    """
    # ── Catch-up: send existing events ────────────────────────────────────
    if LIVE_EVENTS_PATH.exists():
        for line in LIVE_EVENTS_PATH.read_text().splitlines():
            line = line.strip()
            if line:
                yield f"data: {line}\n\n"

    # ── Tail: watch for new lines ──────────────────────────────────────────
    file_pos = LIVE_EVENTS_PATH.stat().st_size if LIVE_EVENTS_PATH.exists() else 0

    while True:
        # Check in-memory queue first (for immediate pushes from heal_agent)
        try:
            event = _event_queue.get_nowait()
            yield f"data: {json.dumps(event)}\n\n"
        except asyncio.QueueEmpty:
            pass

        # Check file for new lines
        if LIVE_EVENTS_PATH.exists():
            current_size = LIVE_EVENTS_PATH.stat().st_size
            if current_size > file_pos:
                with LIVE_EVENTS_PATH.open() as f:
                    f.seek(file_pos)
                    new_content = f.read()
                    file_pos = current_size
                for line in new_content.splitlines():
                    line = line.strip()
                    if line:
                        yield f"data: {line}\n\n"

        # Heartbeat every 5 seconds to keep the connection alive
        yield f": heartbeat\n\n"
        await asyncio.sleep(5)


@app.get("/events")
async def sse_events(request: Request) -> StreamingResponse:
    """SSE endpoint — dashboard connects here via EventSource."""
    return StreamingResponse(
        _tail_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/internal/event")
async def receive_event(request: Request) -> JSONResponse:
    """heal_agent.py POSTs events here for immediate broadcast."""
    body = await request.json()
    await _event_queue.put(body)
    return JSONResponse({"ok": True})


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({
        "status": "ok",
        "live_events_exists": LIVE_EVENTS_PATH.exists(),
        "live_events_size": LIVE_EVENTS_PATH.stat().st_size if LIVE_EVENTS_PATH.exists() else 0,
    })


@app.get("/api/run-history")
async def run_history() -> JSONResponse:
    """Serve run_history.json for the dashboard (fallback when no Vercel API route)."""
    path = ROOT / "logs" / "run_history.json"
    if path.exists():
        return JSONResponse(json.loads(path.read_text()))
    return JSONResponse([])


@app.get("/api/playbook")
async def playbook() -> JSONResponse:
    path = ROOT / "heal" / "playbook.json"
    if path.exists():
        return JSONResponse(json.loads(path.read_text()))
    return JSONResponse({})


@app.get("/api/incident")
async def incident() -> JSONResponse:
    path = ROOT / "heal" / "incident.json"
    if path.exists():
        return JSONResponse(json.loads(path.read_text()))
    return JSONResponse({})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"SSE server starting on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
