"""
EcoDrop-CA v2 — Updated ai_pipeline.py for custom YOLOv11 model
After training, update LOCAL_MODEL_PATH in config.py to:
    LOCAL_MODEL_PATH = "models/ecodrop_yolo11n.pt"
This script uses the 7 custom classes instead of COCO.
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

# ── Custom model class names → EcoDrop item_type ─────────────────────────────
# These are the 7 classes our custom YOLOv11 is trained to detect.
# Class IDs match ecodrop_v2.yaml:
#   0=pen, 1=book, 2=cardboard, 3=wire_cable, 4=plastic_bottle, 5=mouse, 6=mobile_phone

CUSTOM_MODEL_MAP = {
    "pen":            "pen",
    "book":           "textbook",
    "cardboard":      "cardboard",
    "wire_cable":     "wire_cable",
    "plastic_bottle": "plastic_bottle",
    "mouse":          "mouse",
    "mobile_phone":   "mobile_phone",
}

# ── Fallback COCO map (used if custom model is not available) ─────────────────
COCO_MAP = {
    "bottle":       "plastic_bottle",
    "cup":          "plastic_bottle",
    "book":         "textbook",
    "cell phone":   "mobile_phone",
    "mouse":        "mouse",
    "keyboard":     "keyboard",
    "laptop":       "electronic_other",
    "clock":        "watch",
    "tv":           "electronic_other",
    "remote":       "electronic_other",
    "scissors":     "pen",
    "backpack":     "cloth_fabric",
    "handbag":      "cloth_fabric",
    "knife":        "metal_object",
    "fork":         "metal_object",
    "spoon":        "metal_object",
    "can":          "metal_can",
    "bowl":         "metal_can",
    "suitcase":     "cardboard",
    "hair drier":   "electronic_other",
    "microwave":    "electronic_other",
    "toaster":      "electronic_other",
}


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


# ── YOLOv11 Classifier ────────────────────────────────────────────────────────
class YOLOClassifier:
    """
    Loads custom-trained EcoDrop YOLOv11 if available.
    Falls back to pretrained COCO YOLOv11 with mapping.
    Falls back to mock if no model found.
    """
    def __init__(self):
        self._model = None
        self._is_custom = False

        try:
            from ultralytics import YOLO

            # Try custom trained model first
            custom_path = LOCAL_MODEL_PATH   # e.g. "models/ecodrop_yolo11n.pt"
            if os.path.exists(custom_path):
                self._model = YOLO(custom_path)
                self._is_custom = True
                log.info(f"✅ Custom YOLOv11 loaded: {custom_path}")
            else:
                # Fallback: use pretrained COCO YOLOv11 nano with class mapping
                self._model = YOLO("yolo11n.pt")
                self._is_custom = False
                log.warning(f"⚠️  Custom model not found at {custom_path}")
                log.warning("   Using COCO YOLOv11 fallback with class mapping.")
                log.warning("   Train custom model for better accuracy!")
        except Exception as e:
            log.warning(f"YOLOv11 unavailable ({e}) — using mock results")

    def classify(self, image: np.ndarray) -> dict:
        """Run YOLOv11 inference on a numpy image (RGB format)."""
        if self._model:
            try:
                results = self._model(image, verbose=False)

                if results and len(results[0].boxes) > 0:
                    boxes    = results[0].boxes
                    best_idx = int(boxes.conf.argmax().item())
                    cls_id   = int(boxes.cls[best_idx].item())
                    conf     = float(boxes.conf[best_idx].item())
                    cls_name = results[0].names.get(cls_id, "unknown")

                    # Map class name → EcoDrop item_type
                    if self._is_custom:
                        item = CUSTOM_MODEL_MAP.get(cls_name, "electronic_other")
                    else:
                        item = COCO_MAP.get(cls_name, "electronic_other")

                    cond = self._assess_condition(image)
                    log.info(f"🤖 YOLOv11 ({'custom' if self._is_custom else 'COCO'}): "
                             f"{cls_name} → {item} {conf:.0%} [{cond}]")

                    return {
                        "item_type":  item,
                        "display":    ITEM_CLASSES.get(item, {}).get("label", item),
                        "confidence": round(conf, 4),
                        "condition":  cond,
                        "model_used": f"yolo11n-{'custom' if self._is_custom else 'coco'}",
                    }

                else:
                    # No boxes detected — low confidence → trigger Gemini
                    log.info("🤖 YOLOv11: no object detected → triggering Gemini cloud fallback")
                    return {
                        "item_type":  "electronic_other",
                        "display":    "Scanning Item...",
                        "confidence": 0.10,
                        "condition":  self._assess_condition(image),
                        "model_used": "yolo11n",
                    }

            except Exception as e:
                log.error(f"YOLOv11 inference error: {e}")
                return {
                    "item_type":  "electronic_other",
                    "display":    "Scanning Item...",
                    "confidence": 0.10,
                    "condition":  "good",
                    "model_used": "yolo11n",
                }

        return self._mock()

    def _assess_condition(self, image: np.ndarray) -> str:
        """Estimate item condition using Laplacian sharpness + edge density."""
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
        """Mock classifier for laptop testing without Pi hardware."""
        item = random.choice(list(ITEM_CLASSES.keys()))
        return {
            "item_type":  item,
            "display":    ITEM_CLASSES[item]["label"],
            "confidence": round(random.uniform(0.75, 0.97), 4),
            "condition":  random.choice(["excellent", "good", "fair"]),
            "model_used": "mock",
        }


# ── Image Encoder ─────────────────────────────────────────────────────────────
def encode_image(image: np.ndarray) -> str:
    """Encode numpy image to base64 JPEG for Gemini phone-bridge."""
    try:
        import cv2
        _, buf = cv2.imencode(
            ".jpg",
            cv2.cvtColor(image, cv2.COLOR_RGB2BGR),
            [cv2.IMWRITE_JPEG_QUALITY, 70],
        )
        return base64.b64encode(buf).decode("utf-8")
    except Exception as e:
        log.error(f"Image encode failed: {e}")
        return ""


# ── Coins Calculator ──────────────────────────────────────────────────────────
def calculate_coins(item_type: str, condition: str) -> dict:
    """Calculate E-Coins from item type and condition."""
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


# ── Pipeline Orchestrator ─────────────────────────────────────────────────────
class AIPipeline:
    """
    Pi-side AI. Never calls internet APIs.
    When confidence < threshold, returns image to phone for Gemini fallback.
    """
    def __init__(self):
        self.camera     = Camera()
        self.classifier = YOLOClassifier()

    async def run(self, status_cb=None) -> dict:
        loop = asyncio.get_event_loop()

        async def emit(msg: str, phase: int):
            log.info(f"[Phase {phase}] {msg}")
            if status_cb:
                await status_cb({"phase": phase, "msg": msg})

        await emit("PiCam v2 capturing image...", 1)
        image = await loop.run_in_executor(None, self.camera.capture)

        await emit("YOLOv11-nano running on Pi 5 (edge AI)...", 2)
        ai = await loop.run_in_executor(None, self.classifier.classify, image)

        needs_cloud = ai["confidence"] < CONFIDENCE_THRESHOLD

        if needs_cloud:
            await emit(
                f"Confidence {ai['confidence']:.0%} < {int(CONFIDENCE_THRESHOLD*100)}% "
                f"— sending to phone for Gemini...", 3
            )
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
        """Apply Gemini result from phone, recalculate coins."""
        item_type = cloud.get("item_type", local["item_type"])
        if item_type not in ITEM_CLASSES:
            item_type = local["item_type"]

        condition  = cloud.get("condition", local["condition"])
        confidence = cloud.get("confidence", local["confidence"])
        coins      = calculate_coins(item_type, condition)

        return {
            "item_type":   item_type,
            "display":     ITEM_CLASSES[item_type]["label"],
            "condition":   condition,
            "confidence":  confidence,
            "model_used":  "gemini-2.0-flash-lite",
            "needs_cloud": False,
            **coins,
        }

    def close(self):
        self.camera.close()
