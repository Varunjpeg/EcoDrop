"""
═══════════════════════════════════════════════════════════════════════════
EcoDrop-CA — Gemini Cloud Fallback
═══════════════════════════════════════════════════════════════════════════
When local YOLOv8 confidence < 85%, the mobile app calls this endpoint
to classify the image using Google Gemini 1.5 Flash (free tier).

Flow:
  1. Pi server detects low confidence → sets needs_cloud = true
  2. Mobile app receives this via WebSocket
  3. App sends image to this script (runs on phone's network via BLE bridge)
  4. This script calls Gemini API → returns classification
  5. App sends result back to Pi via POST /session/{sid}/cloud-result

FREE TIER: Gemini 1.5 Flash — 15 RPM, 1 million tokens/day (more than enough)
API KEY: Get free at https://aistudio.google.com/apikey
═══════════════════════════════════════════════════════════════════════════
"""

import aiohttp
import base64
import json
import logging
from typing import Optional

log = logging.getLogger("ecodrop.gemini")

# Free Gemini API endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

CLASSIFICATION_PROMPT = """You are an AI waste classification system for a campus reverse vending machine called EcoDrop-CA.

Analyze this image and classify the waste item. Respond ONLY with a JSON object (no markdown, no explanation):

{
  "item_type": "<one of: plastic_bottle, textbook, pen, cardboard, paper_bundle, notebook, earphones, charger, eraser, ruler>",
  "condition": "<one of: excellent, good, fair, poor, contaminated>",
  "confidence": <number between 0 and 1>,
  "details": "<brief 1-sentence description>"
}

Rules:
- "excellent": Like new, clean, fully intact
- "good": Minor wear, still functional/recyclable  
- "fair": Visible damage, partially usable
- "poor": Heavily damaged, barely recyclable
- "contaminated": Food/chemical contamination

If the image doesn't show a recognizable waste item, use: {"item_type": "plastic_bottle", "condition": "fair", "confidence": 0.3, "details": "Unrecognized item"}
"""

async def classify_with_gemini(image_bytes: bytes, api_key: str) -> Optional[dict]:
    """
    Send image to Gemini 1.5 Flash for classification.
    Returns: { item_type, condition, confidence, details }
    """
    if not api_key:
        log.warning("No Gemini API key provided")
        return None

    # Encode image as base64
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "contents": [{
            "parts": [
                {"text": CLASSIFICATION_PROMPT},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_image
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 256,
        }
    }

    try:
        async with aiohttp.ClientSession() as session:
            url = f"{GEMINI_API_URL}?key={api_key}"
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    log.error(f"Gemini API error {resp.status}: {error_text}")
                    return None

                data = await resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]

                # Parse JSON from response (strip markdown if present)
                text = text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    text = text.rsplit("```", 1)[0]

                result = json.loads(text)
                log.info(f"☁️ Gemini: {result.get('item_type')} ({result.get('condition')}) "
                         f"conf={result.get('confidence')}")
                return result

    except json.JSONDecodeError as e:
        log.error(f"Gemini response parse error: {e}")
        return None
    except Exception as e:
        log.error(f"Gemini API call failed: {e}")
        return None


# ── Standalone test ──────────────────────────────────────────────
if __name__ == "__main__":
    import asyncio
    import sys

    if len(sys.argv) < 3:
        print("Usage: python gemini_fallback.py <api_key> <image_path>")
        print("Get your free API key at: https://aistudio.google.com/apikey")
        sys.exit(1)

    api_key = sys.argv[1]
    image_path = sys.argv[2]

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    result = asyncio.run(classify_with_gemini(img_bytes, api_key))
    print(json.dumps(result, indent=2))
