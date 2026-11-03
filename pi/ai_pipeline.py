"""
EcoDrop-CA — AI Pipeline
========================
Flow:
  1. PiCam v2 captures image
  2. YOLOv11 (custom model) classifies locally
     - Confidence >= 50%  → return result immediately (no internet needed)
     - Confidence <  50%  → send image to phone → phone calls Gemini API
  3. Phone posts Gemini result back → Pi calculates coins

Custom model classes (exact strings from Roboflow model):
  {0: 'Computer Mouse', 1: 'Mobile Phone', 2: 'Notebook',
   3: 'box', 4: 'pen', 5: 'water bottle'}
"""

import asyncio
import base64
import logging
import os
import threading
import time

import numpy as np

from config import (
    ITEM_CLASSES, CONDITION_MULTIPLIERS,
    CONFIDENCE_THRESHOLD, LOCAL_MODEL_PATH, CAMERA_RESOLUTION,
)

log = logging.getLogger("ecodrop.ai")

# First valid ITEM_CLASSES key (used as neutral fallback only for coin calc)
_FIRST_ITEM = list(ITEM_CLASSES.keys())[0]


# ── Camera ───────────────────────────────────────────────────────────────────
class Camera:
    def __init__(self):
        self._cam        = None
        self._lock       = threading.Lock()
        self._last_frame = None
        self._is_mock    = True
        self._init_camera()

    def _init_camera(self):
        """Attempt to start PiCam v2. Retries up to 3 times (2 s apart)."""
        for attempt in range(1, 4):
            try:
                from picamera2 import Picamera2
                cam = Picamera2()
                cfg = cam.create_still_configuration(
                    main={"size": CAMERA_RESOLUTION, "format": "RGB888"}
                )
                cam.configure(cfg)
                cam.start()
                time.sleep(0.5)
                self._cam     = cam
                self._is_mock = False
                log.info(f"✅ PiCam v2 ready — {CAMERA_RESOLUTION} (attempt {attempt})")
                return
            except Exception as e:
                log.warning(f"PiCam attempt {attempt}/3 failed: {e}")
                if attempt < 3:
                    time.sleep(2)
        log.error("❌ PiCam unavailable after 3 attempts — camera is in mock mode")

    def capture(self) -> np.ndarray:
        """Capture a frame. Returns real frame or raises RuntimeError if camera broken."""
        with self._lock:
            if self._cam:
                try:
                    frame = self._cam.capture_array()
                    self._last_frame = frame.copy()
                    log.info("📷 PiCam frame captured")
                    return frame
                except Exception as e:
                    log.error(f"📷 Capture failed: {e}")
                    self._cam     = None
                    self._is_mock = True
            # Return mock grey frame — caller should check camera.is_mock
            log.warning("⚠️  MOCK frame — camera unavailable")
            frame = np.full((480, 640, 3), 100, dtype=np.uint8)
            self._last_frame = frame
            return frame

    def get_preview_frame(self) -> np.ndarray:
        """Return the last captured frame for /preview.jpg (no new capture)."""
        if self._last_frame is not None:
            return self._last_frame
        return self.capture()

    def close(self):
        with self._lock:
            if self._cam:
                try:
                    self._cam.close()
                except Exception:
                    pass


# ── YOLOv11 Classifier ───────────────────────────────────────────────────────
class YOLOClassifier:
    """
    Maps exact Roboflow model class names → EcoDrop ITEM_CLASSES keys.
    Model classes: 'Computer Mouse', 'Mobile Phone', 'Notebook',
                   'box', 'pen', 'water bottle'
    """
    CUSTOM_MAP = {
        "Computer Mouse": "mouse",
        "Mobile Phone":   "mobile_phone",
        "Notebook":       "notebook",
        "box":            "cardboard",
        "pen":            "pen",
        "water bottle":   "plastic_bottle",
    }

    def __init__(self):
        self._model     = None
        self._is_custom = False
        try:
            from ultralytics import YOLO
            for candidate in [LOCAL_MODEL_PATH, "models/ecodrop_yolov11.pt", "best.pt"]:
                if os.path.exists(candidate):
                    self._model     = YOLO(candidate)
                    self._is_custom = True
                    log.info(f"✅ YOLO loaded: {candidate}")
                    if hasattr(self._model, "names"):
                        log.info(f"   Model classes: {self._model.names}")
                    break
            if not self._model:
                log.error("❌ No custom model found at any path — YOLO disabled")
        except Exception as e:
            log.error(f"❌ YOLO load failed: {e}")

    def classify(self, image: np.ndarray) -> dict:
        """
        Returns:
          confidence >= THRESHOLD  → high-confidence local result
          confidence <  THRESHOLD  → low-confidence, needs_cloud=True, image sent to Gemini
        """
        # ── Detect blank/mock frame ──
        if np.std(image) < 5.0:
            log.warning("⚠️  Blank/grey frame — camera not working, triggering Gemini")
            return {
                "item_type":  None,          # Gemini will decide
                "display":    "Awaiting Gemini...",
                "confidence": 0.0,
                "condition":  "good",
                "model_used": "no-camera",
            }

        # ── Run YOLO ──
        if self._model:
            try:
                results = self._model(image, verbose=False)
                if results and len(results[0].boxes) > 0:
                    boxes    = results[0].boxes
                    best_idx = int(boxes.conf.argmax().item())
                    cls_id   = int(boxes.cls[best_idx].item())
                    conf     = float(boxes.conf[best_idx].item())
                    raw_name = results[0].names.get(cls_id, "unknown")

                    # Map exact model class name → EcoDrop key
                    item = self.CUSTOM_MAP.get(raw_name)
                    if item is None:
                        # Case-insensitive fallback
                        for k, v in self.CUSTOM_MAP.items():
                            if k.lower() == raw_name.lower():
                                item = v
                                break

                    if item is None or item not in ITEM_CLASSES:
                        # Model detected something outside our 6 classes → Gemini
                        log.warning(f"⚠️  Unknown model class '{raw_name}' → sending to Gemini")
                        cond = self._assess_condition(image)
                        return {
                            "item_type":  None,
                            "display":    "Awaiting Gemini...",
                            "confidence": 0.0,
                            "condition":  cond,
                            "model_used": "custom-yolov11",
                        }

                    cond = self._assess_condition(image)
                    log.info(f"🔍 YOLO: '{raw_name}' → '{item}'  conf={conf:.0%}  cond={cond}")
                    return {
                        "item_type":  item,
                        "display":    ITEM_CLASSES[item]["label"],
                        "confidence": round(conf, 4),
                        "condition":  cond,
                        "model_used": "custom-yolov11",
                    }

                else:
                    # No boxes detected → Gemini
                    log.info("🔍 YOLO: no detection → triggering Gemini")
                    return {
                        "item_type":  None,
                        "display":    "Awaiting Gemini...",
                        "confidence": 0.0,
                        "condition":  self._assess_condition(image),
                        "model_used": "custom-yolov11",
                    }

            except Exception as e:
                log.error(f"YOLO error: {e} → triggering Gemini")
                return {
                    "item_type":  None,
                    "display":    "Awaiting Gemini...",
                    "confidence": 0.0,
                    "condition":  "good",
                    "model_used": "custom-yolov11",
                }

        # No model loaded
        log.error("No YOLO model loaded → triggering Gemini")
        return {
            "item_type":  None,
            "display":    "Awaiting Gemini...",
            "confidence": 0.0,
            "condition":  "good",
            "model_used": "no-model",
        }

    def _assess_condition(self, image: np.ndarray) -> str:
        try:
            import cv2
            gray  = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            blur  = cv2.Laplacian(gray, cv2.CV_64F).var()
            bright = np.mean(gray)
            edges = np.mean(cv2.Canny(gray, 50, 150)) / 255.0
            score = int(blur > 100) + int(60 < bright < 200) + int(edges > 0.05)
            return ["poor", "fair", "good", "excellent"][min(score, 3)]
        except Exception:
            return "good"


# ── Image Encoder ─────────────────────────────────────────────────────────────
def encode_image(image: np.ndarray) -> str:
    try:
        import cv2
        _, buf = cv2.imencode(
            ".jpg",
            cv2.cvtColor(image, cv2.COLOR_RGB2BGR),
            [cv2.IMWRITE_JPEG_QUALITY, 75],
        )
        return base64.b64encode(buf.tobytes()).decode()
    except Exception as e:
        log.error(f"Image encode error: {e}")
        return ""


# ── Coin Calculator ───────────────────────────────────────────────────────────
def calculate_coins(item_type: str, condition: str) -> dict:
    item  = ITEM_CLASSES.get(item_type, ITEM_CLASSES[_FIRST_ITEM])
    cond  = CONDITION_MULTIPLIERS.get(condition, 0.65)
    coins = round(item["base_coins"] * cond * item["recyclability"])
    return {
        "base_coins":           item["base_coins"],
        "condition_multiplier": cond,
        "recyclability_factor": item["recyclability"],
        "calculated_coins":     max(coins, 1),
        "co2_kg":               item["co2_kg"],
        "bin":                  item["bin"],
    }


# ── Pipeline Orchestrator ─────────────────────────────────────────────────────
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

        # Phase 2: YOLO
        await emit("YOLOv11 running on Pi (edge AI)...", 2)
        ai = await loop.run_in_executor(None, self.classifier.classify, image)

        # confidence=0.0 or item_type=None → always go to Gemini
        needs_cloud = (ai["confidence"] < CONFIDENCE_THRESHOLD) or (ai["item_type"] is None)

        if needs_cloud:
            await emit(
                f"Confidence {ai['confidence']:.0%} — sending image to Gemini via phone...", 3
            )
            image_b64 = await loop.run_in_executor(None, encode_image, image)
            log.info("📤 Image sent to phone for Gemini classification")

            # Use first valid class as placeholder — Gemini WILL override this
            placeholder = ai["item_type"] or _FIRST_ITEM
            if placeholder not in ITEM_CLASSES:
                placeholder = _FIRST_ITEM
            coins = calculate_coins(placeholder, ai["condition"])
            return {
                **ai,
                "item_type":   placeholder,
                **coins,
                "needs_cloud": True,
                "image_b64":   image_b64,
            }

        # High confidence — done locally
        await emit("Calculating E-Coins...", 4)
        coins = calculate_coins(ai["item_type"], ai["condition"])
        result = {**ai, **coins, "needs_cloud": False}
        await emit("Done — 100% offline", 5)
        return result

    def apply_cloud_result(self, cloud: dict, local: dict) -> dict:
        """Called when phone posts Gemini result back to Pi."""
        item_type  = cloud.get("item_type", "")
        condition  = cloud.get("condition", "good")
        confidence = float(cloud.get("confidence", 0.9))

        # Validate item_type against ITEM_CLASSES
        if item_type not in ITEM_CLASSES:
            # Try legacy name mapping
            legacy = {
                "textbook": "notebook", "paper_bundle": "notebook",
                "plastic_bag": "plastic_bottle",
                "charger": "mobile_phone", "earphones": "mobile_phone",
                "wire_cable": "mobile_phone", "keyboard": "mouse",
                "electronic_other": "mobile_phone",
                "eraser": "pen", "ruler": "pen",
            }
            item_type = legacy.get(item_type)

        if not item_type or item_type not in ITEM_CLASSES:
            log.error(f"Gemini returned unknown item_type '{cloud.get('item_type')}' — no valid fallback")
            item_type = _FIRST_ITEM   # last resort

        if condition not in CONDITION_MULTIPLIERS:
            condition = "good"

        coins = calculate_coins(item_type, condition)
        log.info(f"✅ Gemini result applied: {item_type} [{condition}] conf={confidence:.0%}")
        return {
            "item_type":  item_type,
            "display":    ITEM_CLASSES[item_type]["label"],
            "condition":  condition,
            "confidence": confidence,
            "model_used": "gemini-3.5-flash-lite",
            "needs_cloud": False,
            **coins,
        }

    def close(self):
        self.camera.close()
