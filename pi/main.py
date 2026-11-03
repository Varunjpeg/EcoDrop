"""
EcoDrop-CA — Pi 5 Main Entry Point
====================================
Runs BLE GATT server + optional HTTP API server together.

Start with:
  python3 main.py

On Pi 5:
  - BLE advertises as "EcoDrop-Machine" (Bluetooth)
  - HTTP API on port 8000 (local network, for testing)
  - Serves built React app from dist/ folder
"""

import asyncio
import logging
import os
import signal
import sys

import uvicorn
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("ecodrop.log"),
    ],
)
log = logging.getLogger("ecodrop.main")

from ai_pipeline import AIPipeline
from ble_server import EcoDropBLE


async def main():
    log.info("=" * 50)
    log.info("  EcoDrop-CA — Starting up")
    log.info("=" * 50)

    # Shared pipeline (used by both BLE and HTTP)
    pipeline = AIPipeline()

    # BLE Server
    ble = EcoDropBLE(pipeline)
    await ble.start()

    # HTTP API (FastAPI) — for testing from browser/laptop
    # Import here to avoid circular deps
    from server import create_app
    http_app = create_app(pipeline)

    # Run both concurrently
    config = uvicorn.Config(http_app, host="0.0.0.0", port=8000, log_level="warning")
    http_server = uvicorn.Server(config)

    log.info("🚀 EcoDrop-CA is running!")
    log.info("   📡 BLE:  Advertising as 'EcoDrop-Machine'")
    log.info("   🌐 HTTP: http://0.0.0.0:8000")
    log.info("")
    log.info("   Phone: Open Chrome → chrome://flags → enable 'Experimental Web Platform features'")
    log.info("   Then open the EcoDrop app and tap Scan → it will find the BLE device")
    log.info("")
    log.info("   Press Ctrl+C to stop")

    # Graceful shutdown
    loop = asyncio.get_event_loop()

    def shutdown(*_):
        log.info("🛑 Shutting down...")
        ble.stop()
        pipeline.close()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    await asyncio.gather(
        http_server.serve(),
        ble.run_forever(),
    )


if __name__ == "__main__":
    asyncio.run(main())
