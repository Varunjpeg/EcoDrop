"""
EcoDrop-CA — BLE GATT Server (Raspberry Pi 5)
Handles both old and new bless API versions.
"""

import asyncio
import json
import logging

log = logging.getLogger("ecodrop.ble")

SERVICE_UUID = "4ec9e900-87d6-4c5a-a1b2-34f0e3a72d8a"
CMD_CHAR     = "4ec9e901-87d6-4c5a-a1b2-34f0e3a72d8a"
STATUS_CHAR  = "4ec9e902-87d6-4c5a-a1b2-34f0e3a72d8a"
RESULT_CHAR  = "4ec9e903-87d6-4c5a-a1b2-34f0e3a72d8a"
BLE_NAME     = "EcoDrop-Machine"

try:
    from bless import (
        BlessServer,
        BlessGATTCharacteristic,
        GATTCharacteristicProperties,
        GATTAttributePermissions,
    )
    BLESS_AVAILABLE = True
except ImportError:
    BLESS_AVAILABLE = False
    log.warning("bless not installed — BLE disabled")


class EcoDropBLE:
    def __init__(self, pipeline):
        self.pipeline = pipeline
        self._server  = None
        self._loop    = None
        self._stopped = asyncio.Event()
        self._started = False

    async def start(self):
        self._loop = asyncio.get_event_loop()

        if not BLESS_AVAILABLE:
            log.warning("BLE not available — running HTTP only")
            return

        try:
            self._server = BlessServer(name=BLE_NAME)
            self._server.read_request_func  = self._on_read
            self._server.write_request_func = self._on_write

            gatt_profile = {
                SERVICE_UUID: {
                    CMD_CHAR: {
                        "Properties": (
                            GATTCharacteristicProperties.write
                            | GATTCharacteristicProperties.write_without_response
                        ),
                        "Permissions": GATTAttributePermissions.writeable,
                        "Value": None,
                    },
                    STATUS_CHAR: {
                        "Properties": (
                            GATTCharacteristicProperties.notify
                            | GATTCharacteristicProperties.read
                        ),
                        "Permissions": GATTAttributePermissions.readable,
                        "Value": b"",
                    },
                    RESULT_CHAR: {
                        "Properties": (
                            GATTCharacteristicProperties.notify
                            | GATTCharacteristicProperties.read
                        ),
                        "Permissions": GATTAttributePermissions.readable,
                        "Value": b"",
                    },
                }
            }

            # ── Handle different bless API versions ──────────────────
            if hasattr(self._server, "setup_gatt"):
                # bless >= 0.2.x (older API)
                await self._server.setup_gatt(gatt_profile)
                await self._server.start_advertising(BLE_NAME)

            elif hasattr(self._server, "add_new_service"):
                # bless newer API
                for svc_uuid, chars in gatt_profile.items():
                    await self._server.add_new_service(svc_uuid)
                    for char_uuid, props in chars.items():
                        await self._server.add_new_characteristic(
                            svc_uuid,
                            char_uuid,
                            props["Properties"],
                            props["Value"],
                            props["Permissions"],
                        )
                await self._server.start_advertising(BLE_NAME)
            else:
                raise RuntimeError("Incompatible bless version — no setup_gatt or add_new_service")

            self._started = True
            log.info(f"📡 BLE advertising as '{BLE_NAME}'")

        except Exception as e:
            log.error(f"BLE start failed: {e}")
            log.warning("Continuing without BLE — use HTTP API instead")
            self._server = None

    async def run_forever(self):
        await self._stopped.wait()

    def stop(self):
        self._stopped.set()

    async def push_status(self, data: dict):
        if not self._server:
            return
        payload = json.dumps(data).encode()
        try:
            char = self._server.get_characteristic(STATUS_CHAR)
            if char:
                char.value = bytearray(payload)
                self._server.update_value(SERVICE_UUID, STATUS_CHAR)
        except Exception as e:
            log.debug(f"push_status error: {e}")

    async def push_result(self, data: dict):
        if not self._server:
            return
        payload = json.dumps(data).encode()
        try:
            char = self._server.get_characteristic(RESULT_CHAR)
            if char:
                char.value = bytearray(payload)
                self._server.update_value(SERVICE_UUID, RESULT_CHAR)
        except Exception as e:
            log.debug(f"push_result error: {e}")

    def _on_read(self, characteristic: "BlessGATTCharacteristic", **kwargs):
        return characteristic.value or bytearray()

    def _on_write(self, characteristic: "BlessGATTCharacteristic", value: bytearray, **kwargs):
        if characteristic.uuid.lower() != CMD_CHAR.lower():
            return
        try:
            cmd = json.loads(value.decode())
            asyncio.run_coroutine_threadsafe(
                self._handle_command(cmd), self._loop
            )
        except Exception as e:
            log.error(f"BLE write error: {e}")

    async def _handle_command(self, cmd: dict):
        action = cmd.get("cmd", "").upper()
        log.info(f"📲 BLE CMD: {action}")

        if action == "START":
            await self.push_status({"status": "connected", "machine": "MACH_001",
                                     "msg": "Session started. Place item in front of camera."})
        elif action == "CAPTURE":
            await self.push_status({"status": "analyzing", "phase": 1, "msg": "Starting..."})
            try:
                result = await self.pipeline.run(status_cb=self._status_cb)
                await self.push_result({"status": "result", **result})
            except Exception as e:
                log.error(f"Pipeline error: {e}")
                await self.push_status({"status": "error", "msg": str(e)})
        elif action == "CONFIRM":
            await self.push_status({"status": "confirmed"})
        elif action == "REJECT":
            await self.push_status({"status": "rejected"})

    async def _status_cb(self, data: dict):
        await self.push_status({"status": "analyzing", **data})
