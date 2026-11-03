#!/usr/bin/env python3
"""
EcoDrop-CA — All-In-One Fix & Verification Script for Raspberry Pi 5
Run this directly in ~/pi:
    python3 apply_all_fixes.py
"""
import os
import sys

BASE = os.path.expanduser("~/pi")
os.chdir(BASE)

print("\n" + "="*50)
print("  ♻️  EcoDrop-CA — Applying Pi 5 Fixes")
print("="*50 + "\n")

# ────────────────────────────────────────────────────────────────
# 1. Update config.py with all 22 classes + threshold 0.85
# ────────────────────────────────────────────────────────────────
CONFIG_CONTENT = '''# ═══════════════════════════════════════════════════════════════════
# EcoDrop-CA — Item Classification Configuration
# ═══════════════════════════════════════════════════════════════════

ITEM_CLASSES = {
    # ── Plastic ──────────────────────────────────────────────────
    "plastic_bottle":  {"label": "Plastic Bottle",          "base_coins": 20, "co2_kg": 0.10, "bin": 1, "recyclability": 0.95},
    "plastic_bag":     {"label": "Plastic Bag / Wrapper",   "base_coins": 8,  "co2_kg": 0.05, "bin": 1, "recyclability": 0.70},

    # ── Paper / Books ─────────────────────────────────────────────
    "textbook":        {"label": "Textbook / Book",         "base_coins": 35, "co2_kg": 0.50, "bin": 3, "recyclability": 0.80},
    "notebook":        {"label": "Notebook / Register",     "base_coins": 15, "co2_kg": 0.12, "bin": 3, "recyclability": 0.85},
    "paper_bundle":    {"label": "Paper Bundle / Sheets",   "base_coins": 12, "co2_kg": 0.08, "bin": 3, "recyclability": 0.90},
    "cardboard":       {"label": "Cardboard Box",           "base_coins": 10, "co2_kg": 0.15, "bin": 3, "recyclability": 0.85},
    "newspaper":       {"label": "Newspaper / Magazine",    "base_coins": 8,  "co2_kg": 0.06, "bin": 3, "recyclability": 0.92},

    # ── Stationery ────────────────────────────────────────────────
    "pen":             {"label": "Pen / Marker",            "base_coins": 8,  "co2_kg": 0.02, "bin": 2, "recyclability": 0.60},
    "eraser":          {"label": "Eraser",                  "base_coins": 5,  "co2_kg": 0.01, "bin": 2, "recyclability": 0.40},
    "ruler":           {"label": "Ruler / Scale",           "base_coins": 6,  "co2_kg": 0.03, "bin": 2, "recyclability": 0.50},

    # ── E-Waste ───────────────────────────────────────────────────
    "mobile_phone":    {"label": "Mobile Phone",            "base_coins": 80, "co2_kg": 1.50, "bin": 4, "recyclability": 0.90},
    "charger":         {"label": "Charger / Adapter",       "base_coins": 40, "co2_kg": 0.80, "bin": 4, "recyclability": 0.65},
    "earphones":       {"label": "Earphones / Headphones",  "base_coins": 60, "co2_kg": 1.20, "bin": 4, "recyclability": 0.70},
    "wire_cable":      {"label": "Wire / USB Cable",        "base_coins": 15, "co2_kg": 0.25, "bin": 4, "recyclability": 0.75},
    "mouse":           {"label": "Computer Mouse",          "base_coins": 45, "co2_kg": 0.60, "bin": 4, "recyclability": 0.80},
    "keyboard":        {"label": "Keyboard",                "base_coins": 50, "co2_kg": 0.90, "bin": 4, "recyclability": 0.75},
    "watch":           {"label": "Watch / Smartwatch",      "base_coins": 55, "co2_kg": 0.50, "bin": 4, "recyclability": 0.85},
    "battery":         {"label": "Battery / Power Bank",    "base_coins": 35, "co2_kg": 0.70, "bin": 4, "recyclability": 0.80},
    "electronic_other":{"label": "Electronic Device",       "base_coins": 30, "co2_kg": 0.50, "bin": 4, "recyclability": 0.70},

    # ── Metal ─────────────────────────────────────────────────────
    "metal_can":       {"label": "Metal / Aluminium Can",   "base_coins": 18, "co2_kg": 0.30, "bin": 5, "recyclability": 0.98},
    "metal_object":    {"label": "Metal Object / Scrap",    "base_coins": 12, "co2_kg": 0.20, "bin": 5, "recyclability": 0.90},

    # ── Fabric / Other ────────────────────────────────────────────
    "cloth_fabric":    {"label": "Cloth / Fabric",          "base_coins": 10, "co2_kg": 0.30, "bin": 2, "recyclability": 0.65},
}

CONDITION_MULTIPLIERS = {
    "excellent":    1.00,
    "good":         0.85,
    "fair":         0.65,
    "poor":         0.40,
    "contaminated": 0.10,
}

LOCAL_MODEL_PATH     = "models/ecodrop_yolov8n.pt"
CONFIDENCE_THRESHOLD = 0.85
CAMERA_RESOLUTION    = (640, 480)
CAPTURE_DELAY_MS     = 500
SERVO_PINS           = {1: 17, 2: 27, 3: 22, 4: 23}
LED_PIN_STATUS       = 24
LED_PIN_READY        = 25
BUZZER_PIN           = 18
IR_SENSOR_PIN        = 5
DOOR_SERVO_PIN       = 6
'''

with open("config.py", "w") as f:
    f.write(CONFIG_CONTENT)
print("✅ 1. config.py updated with all 22 classes (confidence threshold = 0.85)")


# ────────────────────────────────────────────────────────────────
# 2. Update ai_pipeline.py
# ────────────────────────────────────────────────────────────────
AI_PIPELINE_CONTENT = '''"""
EcoDrop-CA — AI Pipeline (Final Architecture)
"""
import asyncio
import base64
import logging
import os
import random
import threading
import numpy as np

from config import (
    ITEM_CLASSES, CONDITION_MULTIPLIERS,
    CONFIDENCE_THRESHOLD, LOCAL_MODEL_PATH, CAMERA_RESOLUTION,
)

log = logging.getLogger("ecodrop.ai")


# ── Camera ──────────────────────────────────────────────────────────────
class Camera:
    def __init__(self):
        self._cam = None
        self._lock = threading.Lock()
        try:
            from picamera2 import Picamera2
            self._cam = Picamera2()
            cfg = self._cam.create_still_configuration(
                main={"size": CAMERA_RESOLUTION, "format": "RGB888"}
            )
            self._cam.configure(cfg)
            self._cam.start()
            log.info(f"✅ PiCam v2 ready — {CAMERA_RESOLUTION}")
        except Exception as e:
            log.warning(f"PiCam unavailable ({e}) — using mock frames")

    def capture(self) -> np.ndarray:
        with self._lock:
            if self._cam:
                frame = self._cam.capture_array()
                log.info("📷 Frame captured from PiCam v2")
                return frame
            log.info("📷 Mock frame (no camera)")
            return np.random.randint(80, 180, (480, 640, 3), dtype=np.uint8)

    def close(self):
        with self._lock:
            if self._cam:
                try:
                    self._cam.close()
                except Exception:
                    pass


# ── YOLOv8 Classifier ────────────────────────────────────────────────────
class YOLOClassifier:
    COCO_MAP = {
        # Plastic
        "bottle":           "plastic_bottle",
        "cup":              "plastic_bottle",
        "wine glass":       "plastic_bottle",

        # Paper / Books
        "book":             "textbook",
        "newspaper":        "newspaper",

        # Electronics — E-Waste
        "cell phone":       "mobile_phone",
        "remote":           "electronic_other",
        "keyboard":         "keyboard",
        "mouse":            "mouse",
        "laptop":           "electronic_other",
        "tv":               "electronic_other",
        "monitor":          "electronic_other",
        "clock":            "watch",
        "hair drier":       "electronic_other",
        "microwave":        "electronic_other",
        "toaster":          "electronic_other",

        # Bags / Fabric
        "backpack":         "cloth_fabric",
        "handbag":          "cloth_fabric",
        "suitcase":         "cardboard",
        "tie":              "cloth_fabric",

        # Stationery / Tools
        "scissors":         "pen",
        "knife":            "metal_object",
        "spoon":            "metal_object",
        "fork":             "metal_object",

        # Cans / Metal
        "can":              "metal_can",
        "bowl":             "metal_can",

        # Cardboard / Box
        "box":              "cardboard",
        "carton":           "cardboard",

        # Misc
        "banana":           "plastic_bag",
        "sports ball":      "electronic_other",
        "frisbee":          "plastic_bottle",
    }

    def __init__(self):
        self._model = None
        try:
            from ultralytics import YOLO
            path = LOCAL_MODEL_PATH if os.path.exists(LOCAL_MODEL_PATH) else "yolov8n.pt"
            self._model = YOLO(path)
            log.info(f"✅ YOLOv8 loaded: {path}")
        except Exception as e:
            log.warning(f"YOLOv8 unavailable ({e}) — using mock results")

    def classify(self, image: np.ndarray) -> dict:
        if self._model:
            try:
                results = self._model(image, verbose=False)
                if results and len(results[0].boxes) > 0:
                    boxes    = results[0].boxes
                    best_idx = int(boxes.conf.argmax().item())
                    cls_id   = int(boxes.cls[best_idx].item())
                    conf     = float(boxes.conf[best_idx].item())
                    coco     = results[0].names.get(cls_id, "bottle")
                    item     = self.COCO_MAP.get(coco, "electronic_other")
                    cond     = self._assess_condition(image)
                    log.info(f"🤖 YOLOv8: {item} {conf:.0%} [{cond}]")
                    return {
                        "item_type":  item,
                        "display":    ITEM_CLASSES.get(item, {}).get("label", item),
                        "confidence": round(conf, 4),
                        "condition":  cond,
                        "model_used": "yolov8-nano",
                    }
                else:
                    log.info("🤖 YOLOv8: no object detected with high confidence → triggering Gemini")
                    cond = self._assess_condition(image)
                    return {
                        "item_type":  "electronic_other",
                        "display":    "Scanning Item...",
                        "confidence": 0.10,
                        "condition":  cond,
                        "model_used": "yolov8-nano",
                    }
            except Exception as e:
                log.error(f"YOLOv8 error: {e}")
                return {
                    "item_type":  "electronic_other",
                    "display":    "Scanning Item...",
                    "confidence": 0.10,
                    "condition":  "good",
                    "model_used": "yolov8-nano",
                }
        return self._mock()

    def _assess_condition(self, image: np.ndarray) -> str:
        try:
            import cv2
            gray   = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            blur   = cv2.Laplacian(gray, cv2.CV_64F).var()
            bright = np.mean(gray)
            edges  = np.mean(cv2.Canny(gray, 50, 150)) / 255.0
            score  = int(blur > 100) + int(60 < bright < 200) + int(edges > 0.05)
            return ["poor", "fair", "good", "excellent"][min(score, 3)]
        except Exception:
            return "good"

    def _mock(self) -> dict:
        item = random.choice(list(ITEM_CLASSES.keys()))
        return {
            "item_type":  item,
            "display":    ITEM_CLASSES[item]["label"],
            "confidence": round(random.uniform(0.75, 0.97), 4),
            "condition":  random.choice(["excellent", "good", "fair"]),
            "model_used": "mock",
        }


def encode_image(image: np.ndarray) -> str:
    try:
        import cv2
        _, buf = cv2.imencode(".jpg", cv2.cvtColor(image, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 70])
        return base64.b64encode(buf).decode("utf-8")
    except Exception as e:
        log.error(f"Image encode failed: {e}")
        return ""


def calculate_coins(item_type: str, condition: str) -> dict:
    item = ITEM_CLASSES.get(item_type, ITEM_CLASSES["plastic_bottle"])
    mult = CONDITION_MULTIPLIERS.get(condition, 0.65)
    coins = round(item["base_coins"] * mult * item["recyclability"])
    return {
        "base_coins":           item["base_coins"],
        "condition_multiplier": mult,
        "recyclability_factor": item["recyclability"],
        "calculated_coins":     coins,
        "co2_kg":               item["co2_kg"],
    }


class AIPipeline:
    def __init__(self):
        self.camera     = Camera()
        self.classifier = YOLOClassifier()

    async def run(self, status_cb=None) -> dict:
        loop = asyncio.get_event_loop()

        async def emit(msg: str, phase: int):
            log.info(f"[Phase {phase}] {msg}")
            if status_cb:
                await status_cb({"phase": phase, "msg": msg})

        # Phase 1: Capture
        await emit("PiCam v2 capturing image...", 1)
        image = await loop.run_in_executor(None, self.camera.capture)

        # Phase 2: Local AI
        await emit("YOLOv8-nano running on Pi 5 (edge AI)...", 2)
        ai = await loop.run_in_executor(None, self.classifier.classify, image)

        needs_cloud = ai["confidence"] < CONFIDENCE_THRESHOLD

        if needs_cloud:
            await emit(f"Confidence {ai['confidence']:.0%} < 85% — sending to phone for Gemini...", 3)
            image_b64 = await loop.run_in_executor(None, encode_image, image)
            coins = calculate_coins(ai["item_type"], ai["condition"])
            return {
                **ai,
                **coins,
                "needs_cloud": True,
                "image_b64":   image_b64,
            }

        await emit("Calculating E-Coins...", 4)
        coins = calculate_coins(ai["item_type"], ai["condition"])
        result = {**ai, **coins, "needs_cloud": False}
        await emit("Analysis complete! (100% offline)", 5)
        return result

    def apply_cloud_result(self, cloud: dict, local: dict) -> dict:
        item_type = cloud.get("item_type", local["item_type"])
        if item_type not in ITEM_CLASSES:
            item_type = local["item_type"]

        condition  = cloud.get("condition", local["condition"])
        confidence = cloud.get("confidence", local["confidence"])
        coins      = calculate_coins(item_type, condition)
        return {
            "item_type":  item_type,
            "display":    ITEM_CLASSES[item_type]["label"],
            "condition":  condition,
            "confidence": confidence,
            "model_used": "gemini-2.0-flash-lite",
            "needs_cloud": False,
            **coins,
        }

    def close(self):
        self.camera.close()
'''

with open("ai_pipeline.py", "w") as f:
    f.write(AI_PIPELINE_CONTENT)
print("✅ 2. ai_pipeline.py updated (PiCam lock + 30+ COCO classes + Gemini trigger)")


# ────────────────────────────────────────────────────────────────
# 3. Update server.py with preview.jpg and real pipeline init
# ────────────────────────────────────────────────────────────────
SERVER_CONTENT = '''"""
EcoDrop-CA — HTTP API Server (FastAPI)
"""
import asyncio
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
sessions: Dict[str, dict] = {}


def create_app(pipeline=None):
    app = FastAPI(title="EcoDrop-CA", version="3.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

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
            "location": "Engineering Block, Campus",
            "bins": [
                {"id": 1, "type": "plastic",    "label": "Plastic",    "capacity_pct": 28},
                {"id": 2, "type": "stationery", "label": "Stationery", "capacity_pct": 14},
                {"id": 3, "type": "paper",      "label": "Paper",      "capacity_pct": 45},
                {"id": 4, "type": "e-waste",    "label": "E-Waste",    "capacity_pct": 18},
                {"id": 5, "type": "metal",      "label": "Metal",      "capacity_pct": 10},
            ],
        }

    @app.get("/connect", response_class=HTMLResponse)
    def connect_page():
        return HTMLResponse("""<!DOCTYPE html>
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
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:52px">♻️</div>
    <h1>EcoDrop Machine</h1>
    <p>Recycle smart. Earn E-Coins.<br>Redeem at campus canteens.</p>
    <a class="btn" href="http://10.42.0.1:8000">▶&nbsp; Open EcoDrop App</a>
  </div>
</body>
</html>""")

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
        if sid not in sessions:
            raise HTTPException(404, "Session not found")

        sessions[sid]["status"] = "analyzing"

        if pipeline:
            result = await pipeline.run()
        else:
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

        sessions[sid]["local_result"] = result
        sessions[sid]["status"] = "awaiting_cloud" if result.get("needs_cloud") else "analyzed"

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
        if sid not in sessions:
            raise HTTPException(404, "Session not found")

        local = sessions[sid].get("local_result", {})

        if pipeline:
            final = pipeline.apply_cloud_result(req.dict(), local)
        else:
            from config import ITEM_CLASSES, CONDITION_MULTIPLIERS
            item  = req.item_type if req.item_type in ITEM_CLASSES else local.get("item_type", "plastic_bottle")
            cond  = req.condition
            mult  = CONDITION_MULTIPLIERS.get(cond, 0.65)
            idata = ITEM_CLASSES[item]
            coins = round(idata["base_coins"] * mult * idata["recyclability"])
            final = {
                "item_type":            item,
                "display":              idata["label"],
                "condition":            cond,
                "confidence":           req.confidence,
                "model_used":           "gemini-2.0-flash-lite",
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
        import io
        from fastapi.responses import Response
        from PIL import Image
        import numpy as np

        if pipeline:
            try:
                loop = asyncio.get_event_loop()
                frame = await loop.run_in_executor(None, pipeline.camera.capture)
            except Exception as e:
                log.error(f"Preview capture error: {e}")
                frame = np.zeros((240, 320, 3), dtype=np.uint8)
        else:
            frame = np.zeros((240, 320, 3), dtype=np.uint8)
            frame[:, :, 1] = 80

        try:
            img = Image.fromarray(frame)
            img = img.resize((320, 240))
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

    # ── Serve React PWA from dist/ ────────────────────────────────────
    dist = os.path.join(os.path.dirname(__file__), "dist")
    if os.path.isdir(dist):
        assets = os.path.join(dist, "assets")
        if os.path.isdir(assets):
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

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
            return FileResponse(os.path.join(dist, "index.html"))

        @app.get("/{path:path}")
        def spa(path: str):
            full = os.path.join(dist, path)
            if os.path.isfile(full):
                return FileResponse(full)
            return FileResponse(os.path.join(dist, "index.html"))

        log.info(f"🌐 Serving React PWA from: {dist}")
    else:
        log.warning("⚠️  No dist/ folder found — app not served.")

    return app


if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")

    pipeline_instance = None
    try:
        from ai_pipeline import AIPipeline
        pipeline_instance = AIPipeline()
        log.info("✅ Real AIPipeline initialized (PiCam v2 + YOLOv8)")
    except Exception as e:
        log.warning(f"⚠️ Running without hardware AI pipeline ({e})")

    app = create_app(pipeline=pipeline_instance)
    log.info("🚀 Starting EcoDrop server on 0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
else:
    app = create_app(pipeline=None)
'''

with open("server.py", "w") as f:
    f.write(SERVER_CONTENT)
print("✅ 3. server.py updated (real AIPipeline init on startup + /preview.jpg endpoint)")

# ────────────────────────────────────────────────────────────────
# 4. Diagnostic Self-Check
# ────────────────────────────────────────────────────────────────
print("\n--- Diagnostic Self-Check ---")
try:
    from config import ITEM_CLASSES, CONFIDENCE_THRESHOLD
    print(f"✅ config.py: {len(ITEM_CLASSES)} item classes loaded. Threshold: {CONFIDENCE_THRESHOLD}")
except Exception as e:
    print(f"❌ config.py error: {e}")

try:
    from ai_pipeline import Camera, YOLOClassifier
    c = Camera()
    print("✅ Camera:", "REAL PiCam v2" if c._cam else "MOCK (no hardware detected)")
    y = YOLOClassifier()
    print("✅ YOLOv8:", "REAL model loaded" if y._model else "MOCK")
    img = c.capture()
    print(f"✅ Test capture frame shape: {img.shape}")
    c.close()
except Exception as e:
    print(f"⚠️ Pipeline check error: {e}")

print("\n🎉 All fixes applied successfully! Now you can start the server:")
print("    python3 server.py\n")
