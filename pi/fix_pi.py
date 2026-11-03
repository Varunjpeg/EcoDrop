#!/usr/bin/env python3
"""
EcoDrop Pi Fix Script
Run this on your Pi via SSH:
  python3 ~/pi/fix_pi.py

Fixes:
  1. Lowers confidence threshold 0.85 → 0.50 (more items go to Gemini)
  2. Updates COCO_MAP with correct mappings (watch, mouse, phone etc.)
  3. Adds /preview.jpg endpoint so phone can see live PiCam feed
"""
import os, re

BASE = os.path.expanduser('~/pi')

# ────────────────────────────────────────────────────────────────
# Fix 1: Lower confidence threshold
# 0.85 was too strict → many correct results were never tried via Gemini
# 0.50 means: only use local result if YOLOv8 is >50% confident AND maps correctly
# ────────────────────────────────────────────────────────────────
cfg_path = f'{BASE}/config.py'
cfg = open(cfg_path).read()
cfg = re.sub(r'CONFIDENCE_THRESHOLD\s*=\s*[\d.]+', 'CONFIDENCE_THRESHOLD = 0.50', cfg)
open(cfg_path, 'w').write(cfg)
print('✅ Fix 1: Confidence threshold → 0.50')

# ────────────────────────────────────────────────────────────────
# Fix 2: Rewrite COCO_MAP with correct mappings
# Old code mapped mouse→earphones, clock→nothing, etc.
# ────────────────────────────────────────────────────────────────
NEW_COCO_MAP = '''    COCO_MAP = {
        # Plastic
        "bottle":       "plastic_bottle",
        "cup":          "plastic_bottle",
        "wine glass":   "plastic_bottle",
        # Paper / Books
        "book":         "textbook",
        # Electronics — correctly mapped now
        "cell phone":   "mobile_phone",
        "remote":       "electronic_other",
        "keyboard":     "keyboard",
        "mouse":        "mouse",
        "laptop":       "electronic_other",
        "tv":           "electronic_other",
        "clock":        "watch",
        "hair drier":   "electronic_other",
        "microwave":    "electronic_other",
        "toaster":      "electronic_other",
        # Bags / Fabric
        "backpack":     "cloth_fabric",
        "handbag":      "cloth_fabric",
        "suitcase":     "cardboard",
        # Stationery / Tools
        "scissors":     "pen",
        "knife":        "metal_object",
        "spoon":        "metal_object",
        "fork":         "metal_object",
        # Metal / Cans
        "can":          "metal_can",
        "bowl":         "metal_can",
        # Cardboard
        "box":          "cardboard",
        "umbrella":     "cloth_fabric",
    }'''

ai_path = f'{BASE}/ai_pipeline.py'
ai = open(ai_path).read()
ai_new = re.sub(r'    COCO_MAP\s*=\s*\{.*?\}', NEW_COCO_MAP, ai, flags=re.DOTALL)
if ai_new == ai:
    print('⚠️  Fix 2: COCO_MAP not found — check ai_pipeline.py manually')
else:
    open(ai_path, 'w').write(ai_new)
    print('✅ Fix 2: COCO_MAP updated with correct mappings')

# ────────────────────────────────────────────────────────────────
# Fix 3: Add /preview.jpg endpoint to server.py
# Phone polls this every 500ms to show live PiCam view
# ────────────────────────────────────────────────────────────────
PREVIEW_CODE = '''
    # ── Live Camera Preview (phone polls every 500ms) ────────────────────
    @app.get("/preview.jpg")
    async def preview_jpg():
        """Returns latest PiCam frame as JPEG. Phone refreshes this every 500ms."""
        import io
        from fastapi.responses import Response
        from PIL import Image
        import numpy as np
        if pipeline:
            loop = asyncio.get_event_loop()
            frame = await loop.run_in_executor(None, pipeline.camera.capture)
        else:
            # Mock colourful gradient frame for laptop testing
            frame = np.zeros((240, 320, 3), dtype=np.uint8)
            frame[:, :, 1] = 60   # green tint
            frame[:80, :, 0] = 40
        try:
            img = Image.fromarray(frame)
            img = img.resize((320, 240))   # downscale for speed
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=55)
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
        except Exception as e:
            return Response(content=b'', media_type='image/jpeg')

'''

srv_path = f'{BASE}/server.py'
srv = open(srv_path).read()
if '/preview.jpg' in srv:
    print('✅ Fix 3: /preview.jpg already exists in server.py')
else:
    # Insert before the dist/PWA serving section
    marker = '    # ── Serve React PWA from dist/'
    if marker in srv:
        srv = srv.replace(marker, PREVIEW_CODE + marker)
        open(srv_path, 'w').write(srv)
        print('✅ Fix 3: /preview.jpg endpoint added to server.py')
    else:
        # Fallback: insert before the last return statement or standalone mode section
        marker2 = '# ── Standalone mode'
        if marker2 in srv:
            srv = srv.replace(marker2, PREVIEW_CODE + '\n' + marker2)
            open(srv_path, 'w').write(srv)
            print('✅ Fix 3: /preview.jpg endpoint added to server.py')
        else:
            print('⚠️  Fix 3: Could not auto-insert — add /preview.jpg manually')

print('\n🎉 All fixes done! Now restart server:')
print('   Ctrl+C to stop current server')
print('   python3 server.py')
