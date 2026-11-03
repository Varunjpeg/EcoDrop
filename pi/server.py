"""
EcoDrop-CA — HTTP API Server (FastAPI)
=======================================
Final Architecture:
  Pi WiFi hotspot "EcoDrop-Machine"
  → Phone connects (no internet on hotspot)
  → Phone opens http://10.42.0.1:8000 (Pi serves React PWA)
  → Pi runs YOLOv11 locally (edge AI)
  → If confidence < 50%: Pi returns image to phone
  → Phone calls Gemini via cellular (phone is internet bridge)
  → Phone posts result back to Pi
  → Pi calculates final coins → returns to phone
  → Pi needs ZERO internet/ethernet
"""

import logging
import os
import time
import uuid
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

log = logging.getLogger("ecodrop.http")

# In-memory session store {session_id: {...}}
sessions: Dict[str, dict] = {}


def create_app(pipeline=None):
    app = FastAPI(title="EcoDrop-CA", version="3.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Health ────────────────────────────────────────────────────────
    @app.get("/health")
    def health():
        return {
            "status":     "ok",
            "machine_id": "MACH_001",
            "mode":       "edge-ai-wifi",
            "ssid":       "EcoDrop-Machine",
            "internet":   "phone-bridge-only",
        }

    @app.get("/machine/info")
    def machine_info():
        return {
            "id":       "MACH_001",
            "name":     "EcoDrop Station #001",
            "ssid":     "EcoDrop-Machine",
            "location": "Campus",
            "status":   "active",
        }

    # ── /connect — QR sticker landing page ───────────────────────────
    @app.get("/connect", response_class=HTMLResponse)
    def connect_page():
        return HTMLResponse(content="""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>EcoDrop — Connect</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         background:#f0fdf4;min-height:100vh;display:flex;align-items:center;
         justify-content:center;padding:24px}
    .card{background:#fff;border-radius:24px;padding:32px 24px;max-width:360px;
          width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    h1{font-size:22px;font-weight:800;color:#059669;margin:12px 0 6px}
    p{color:#6b7280;font-size:13px;line-height:1.6;margin-bottom:20px}
    .btn{display:block;background:#059669;color:#fff;text-decoration:none;
         padding:16px;border-radius:14px;font-size:16px;font-weight:700;margin-bottom:12px}
    .step{display:flex;align-items:center;gap:12px;text-align:left;
          padding:10px 0;border-bottom:1px solid #f3f4f6}
    .step:last-child{border:none}
    .num{width:28px;height:28px;border-radius:50%;background:#d1fae5;color:#059669;
         font-weight:800;font-size:13px;flex-shrink:0;display:flex;
         align-items:center;justify-content:center}
    small{display:block;margin-top:16px;font-size:11px;color:#9ca3af}
    small a{color:#059669;font-weight:600;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:52px">♻️</div>
    <h1>EcoDrop Machine</h1>
    <p>Recycle smart. Earn E-Coins.<br>Redeem at campus canteens.</p>
    <a class="btn" href="http://10.42.0.1:8000">▶&nbsp; Open EcoDrop App</a>
    <div style="margin:16px 0 12px;font-size:10px;font-weight:700;
                letter-spacing:.06em;color:#9ca3af">FIRST TIME — INSTALL IN 30 SECONDS</div>
    <div class="step"><div class="num">1</div>
      <div style="font-size:13px">Tap <b>Open EcoDrop App</b> above</div></div>
    <div class="step"><div class="num">2</div>
      <div style="font-size:13px">Chrome ⋮ menu → <b>Add to Home Screen</b> → Install</div></div>
    <div class="step"><div class="num">3</div>
      <div style="font-size:13px">Next time just tap the <b>EcoDrop icon</b> — no URL needed!</div></div>
    <small>Already installed? <a href="http://10.42.0.1:8000">Open app →</a></small>
  </div>
</body>
</html>""")

    # ── Sessions ──────────────────────────────────────────────────────
    class SessionReq(BaseModel):
        machine_id: str = "MACH_001"
        user_id: Optional[str] = None

    @app.post("/session/start")
    def start_session(req: SessionReq):
        sid = str(uuid.uuid4())
        sessions[sid] = {
            "status":       "started",
            "machine_id":   req.machine_id,
            "timestamp":    time.time(),
            "local_result": None,
            "final_result": None,
        }
        return {"session_id": sid, "machine_id": req.machine_id}

    @app.post("/session/{sid}/item-detected")
    async def item_detected(sid: str):
        """
        Phone taps Capture Now → Pi captures image → runs YOLOv11.
        Returns either:
          needs_cloud: false → full result (done, calculate coins)
          needs_cloud: true  → partial result + image_b64 (phone must call Gemini)
        """
        if sid not in sessions:
            raise HTTPException(404, "Session not found")

        sessions[sid]["status"] = "analyzing"

        if pipeline:
            result = await pipeline.run()
        else:
            # Laptop mock mode — simulate low confidence 30% of time
            import random
            from config import ITEM_CLASSES, CONDITION_MULTIPLIERS
            items = list(ITEM_CLASSES.keys())
            item  = random.choice(items)
            cond  = random.choice(["excellent", "good", "fair"])
            conf  = round(random.uniform(0.70, 0.97), 4)
            mult  = CONDITION_MULTIPLIERS[cond]
            idata = ITEM_CLASSES[item]
            coins = round(idata["base_coins"] * mult * idata["recyclability"])
            result = {
                "item_type":            item,
                "display":              idata["label"],
                "confidence":           conf,
                "condition":            cond,
                "model_used":           "mock",
                "base_coins":           idata["base_coins"],
                "condition_multiplier": mult,
                "recyclability_factor": idata["recyclability"],
                "calculated_coins":     coins,
                "co2_kg":               idata["co2_kg"],
                "needs_cloud":          conf < 0.85,
                "image_b64":            "" if conf >= 0.85 else "mock_base64_image_data",
            }

        # Store local result for later (cloud-result endpoint needs it)
        sessions[sid]["local_result"] = result
        sessions[sid]["status"] = (
            "awaiting_cloud" if result.get("needs_cloud") else "analyzed"
        )

        # Don't send image_b64 in regular response if not needed
        response = {k: v for k, v in result.items() if k != "image_b64"}
        if result.get("needs_cloud"):
            response["image_b64"] = result.get("image_b64", "")

        return {"status": sessions[sid]["status"], "result": response}

    class CloudResultReq(BaseModel):
        item_type:  str
        condition:  str
        confidence: float = 0.90

    @app.post("/session/{sid}/cloud-result")
    def cloud_result(sid: str, req: CloudResultReq):
        """
        Phone calls this after getting Gemini result via cellular.
        Pi applies it, recalculates coins, returns final result.
        """
        if sid not in sessions:
            raise HTTPException(404, "Session not found")

        local = sessions[sid].get("local_result", {})

        if pipeline:
            final = pipeline.apply_cloud_result(req.dict(), local)
        else:
            # Laptop mock mode
            from config import ITEM_CLASSES, CONDITION_MULTIPLIERS
            item  = req.item_type if req.item_type in ITEM_CLASSES else local.get("item_type", list(ITEM_CLASSES.keys())[0])
            cond  = req.condition
            mult  = CONDITION_MULTIPLIERS.get(cond, 0.65)
            idata = ITEM_CLASSES[item]
            coins = round(idata["base_coins"] * mult * idata["recyclability"])
            final = {
                "item_type":            item,
                "display":              idata["label"],
                "condition":            cond,
                "confidence":           req.confidence,
                "model_used":           "gemini-3.5-flash-lite",
                "base_coins":           idata["base_coins"],
                "condition_multiplier": mult,
                "recyclability_factor": idata["recyclability"],
                "calculated_coins":     coins,
                "co2_kg":               idata["co2_kg"],
                "needs_cloud":          False,
            }

        sessions[sid]["final_result"] = final
        sessions[sid]["status"] = "analyzed"
        log.info(f"✅ Cloud result applied: {final['item_type']} [{final['condition']}] → {final['calculated_coins']} coins")
        return {"status": "analyzed", "result": final}

    @app.post("/session/{sid}/confirm")
    def confirm(sid: str):
        if sid not in sessions:
            raise HTTPException(404, "Session not found")
        sessions[sid]["status"] = "completed"
        return {"status": "completed"}

    @app.post("/session/{sid}/reject")
    def reject_session(sid: str):
        if sid not in sessions:
            raise HTTPException(404, "Session not found")
        sessions[sid]["status"] = "rejected"
        return {"status": "rejected"}

    # ── Live Camera Preview (phone polls every 500ms) ────────────────────
    @app.get("/preview.jpg")
    async def preview_jpg():
        """Returns latest PiCam frame as JPEG. Phone refreshes this every 500ms."""
        import io
        import asyncio
        from fastapi.responses import Response
        from PIL import Image
        import numpy as np

        if pipeline:
            try:
                loop = asyncio.get_event_loop()
                frame = await loop.run_in_executor(None, pipeline.camera.get_preview_frame)
            except Exception as e:
                log.error(f"Preview capture error: {e}")
                frame = np.zeros((240, 320, 3), dtype=np.uint8)
        else:
            # Mock frame for laptop testing
            frame = np.zeros((240, 320, 3), dtype=np.uint8)
            frame[:, :, 1] = 80   # green tint

        try:
            img = Image.fromarray(frame)
            img = img.resize((320, 240))   # downscale for fast transfer over WiFi
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=60)
            buf.seek(0)
            return Response(
                content=buf.read(),
                media_type='image/jpeg',
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                },
            )
        except Exception:
            return Response(content=b'', media_type='image/jpeg')

    # ── /clear — auto-clears PWA cache on phone ─────────────────────────────
    @app.get("/clear", response_class=HTMLResponse)
    def clear_cache():
        return HTMLResponse(content="""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Clearing cache...</title>
<meta http-equiv="cache-control" content="no-cache,no-store,must-revalidate">
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;
height:100vh;margin:0;background:#f0fdf4}
.box{text-align:center;padding:40px;border-radius:20px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.1)}
h2{color:#059669}p{color:#6b7280;margin-top:8px}</style></head>
<body><div class="box"><h2>&#x1F9F9; Clearing App Cache</h2>
<p>Removing old version, loading fresh app...</p>
<p id="s" style="margin-top:20px;font-size:13px;color:#059669">Working...</p></div>
<script>
async function clear(){
  var s=document.getElementById("s");
  if("serviceWorker" in navigator){
    var regs=await navigator.serviceWorker.getRegistrations();
    for(var r of regs){await r.unregister();}
    s.textContent="Service workers cleared ("+regs.length+")";
  }
  if("caches" in window){
    var keys=await caches.keys();
    for(var k of keys){await caches.delete(k);}
    s.textContent+=" | Caches cleared ("+keys.length+")";
  }
  setTimeout(function(){window.location.replace("/");},1500);
}
clear();
</script></body></html>""")

    # ── Serve React PWA from dist/ ───────────────────────────────────────────
    dist = os.path.join(os.path.dirname(__file__), "dist")
    if os.path.isdir(dist):
        assets = os.path.join(dist, "assets")
        if os.path.isdir(assets):
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        NO_CACHE = {"Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache", "Expires": "0"}

        @app.get("/sw.js")
        def sw():
            return FileResponse(os.path.join(dist, "sw.js"))

        @app.get("/manifest.webmanifest")
        def manifest():
            return FileResponse(os.path.join(dist, "manifest.webmanifest"))

        @app.get("/registerSW.js")
        def register_sw():
            return FileResponse(os.path.join(dist, "registerSW.js"))

        @app.get("/")
        def index():
            return FileResponse(os.path.join(dist, "index.html"), headers=NO_CACHE)

        @app.get("/{path:path}")
        def spa(path: str):
            full = os.path.join(dist, path)
            if os.path.isfile(full):
                return FileResponse(full)
            return FileResponse(os.path.join(dist, "index.html"), headers=NO_CACHE)

        log.info(f"Serving React PWA from: {dist}")
    else:
        log.warning("No dist/ folder found — app not served. Copy dist/ to pi/ folder.")

    return app


# ── Standalone / Pi mode ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")

    pipeline_instance = None
    try:
        from ai_pipeline import AIPipeline
        pipeline_instance = AIPipeline()
        log.info("✅ Real AIPipeline loaded (PiCam v2 + YOLOv11)")
    except Exception as e:
        log.warning(f"⚠️  Running without hardware AI pipeline ({e})")

    app = create_app(pipeline=pipeline_instance)
    log.info("Starting EcoDrop server on 0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
else:
    app = create_app(pipeline=None)