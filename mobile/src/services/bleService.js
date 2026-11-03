/**
 * EcoDrop-CA — Web Bluetooth (BLE) Service
 * ==========================================
 * Phone connects to Pi's BLE GATT server.
 *
 * GATT Profile (must match pi/ble_server.py EXACTLY):
 *   Service:     4ec9e900-87d6-4c5a-a1b2-34f0e3a72d8a
 *   CMD_CHAR:    4ec9e901-...  (Write)   — phone → Pi
 *   STATUS_CHAR: 4ec9e902-...  (Notify)  — Pi → phone (progress)
 *   RESULT_CHAR: 4ec9e903-...  (Notify)  — Pi → phone (final result)
 *
 * Requires Chrome Android with Web Bluetooth enabled.
 * Works on HTTP if you enable chrome://flags/#unsafely-treat-insecure-origin-as-secure
 */

// ── BLE UUIDs (must match pi/ble_server.py) ──────────────────────────
const SERVICE_UUID  = '4ec9e900-87d6-4c5a-a1b2-34f0e3a72d8a';
const CMD_CHAR      = '4ec9e901-87d6-4c5a-a1b2-34f0e3a72d8a';
const STATUS_CHAR   = '4ec9e902-87d6-4c5a-a1b2-34f0e3a72d8a';
const RESULT_CHAR   = '4ec9e903-87d6-4c5a-a1b2-34f0e3a72d8a';

const BLE_NAME = 'EcoDrop-Machine';

const enc = new TextEncoder();
const dec = new TextDecoder();

export class BLEService {
  constructor() {
    this._device       = null;
    this._server       = null;
    this._service      = null;
    this._cmdChar      = null;
    this._statusChar   = null;
    this._resultChar   = null;
    this._onStatus     = null;   // (data: object) => void
    this._onResult     = null;   // (data: object) => void
    this._onDisconnect = null;   // () => void
  }

  /** Check if Web Bluetooth is available on this browser */
  static isAvailable() {
    return (
      typeof navigator !== 'undefined' &&
      navigator.bluetooth !== undefined &&
      typeof navigator.bluetooth.requestDevice === 'function'
    );
  }

  /**
   * Open the BLE device picker and connect to EcoDrop machine.
   * Must be called from a user gesture (button click).
   * @param {Function} onStatus - called with progress updates {phase, msg, status}
   * @param {Function} onResult - called with final result object
   * @param {Function} onDisconnect - called when device disconnects
   */
  async connect(onStatus, onResult, onDisconnect) {
    if (!BLEService.isAvailable()) {
      throw new Error('Web Bluetooth not supported. Use Chrome on Android.');
    }

    this._onStatus     = onStatus;
    this._onResult     = onResult;
    this._onDisconnect = onDisconnect;

    // Show Chrome's native BLE device picker
    this._device = await navigator.bluetooth.requestDevice({
      filters: [{ name: BLE_NAME }],
      optionalServices: [SERVICE_UUID],
    });

    this._device.addEventListener('gattserverdisconnected', () => {
      console.warn('[BLE] Disconnected');
      this._cleanup();
      if (this._onDisconnect) this._onDisconnect();
    });

    // Connect to GATT server on Pi
    this._server  = await this._device.gatt.connect();
    this._service = await this._server.getPrimaryService(SERVICE_UUID);

    // Get characteristics
    this._cmdChar    = await this._service.getCharacteristic(CMD_CHAR);
    this._statusChar = await this._service.getCharacteristic(STATUS_CHAR);
    this._resultChar = await this._service.getCharacteristic(RESULT_CHAR);

    // Subscribe to Pi notifications
    await this._statusChar.startNotifications();
    this._statusChar.addEventListener('characteristicvaluechanged', (e) => {
      try {
        const data = JSON.parse(dec.decode(e.target.value));
        console.log('[BLE] Status:', data);
        if (this._onStatus) this._onStatus(data);
      } catch (err) {
        console.error('[BLE] Status parse error:', err);
      }
    });

    await this._resultChar.startNotifications();
    this._resultChar.addEventListener('characteristicvaluechanged', (e) => {
      try {
        const data = JSON.parse(dec.decode(e.target.value));
        console.log('[BLE] Result:', data);
        if (this._onResult) this._onResult(data);
      } catch (err) {
        console.error('[BLE] Result parse error:', err);
      }
    });

    console.log('[BLE] Connected to', this._device.name);
    return this._device.name;
  }

  /** Send a command to Pi */
  async sendCommand(cmd, extra = {}) {
    if (!this._cmdChar) throw new Error('BLE not connected');
    const payload = enc.encode(JSON.stringify({ cmd, ...extra }));
    await this._cmdChar.writeValueWithoutResponse(payload);
    console.log('[BLE] CMD sent:', cmd);
  }

  async start()   { await this.sendCommand('START'); }
  async capture() { await this.sendCommand('CAPTURE'); }
  async confirm() { await this.sendCommand('CONFIRM'); }
  async reject()  { await this.sendCommand('REJECT'); }

  isConnected() {
    return this._device?.gatt?.connected ?? false;
  }

  disconnect() {
    if (this._device?.gatt?.connected) {
      this._device.gatt.disconnect();
    }
    this._cleanup();
  }

  _cleanup() {
    this._server      = null;
    this._service     = null;
    this._cmdChar     = null;
    this._statusChar  = null;
    this._resultChar  = null;
  }
}

// Singleton
export const bleService = new BLEService();
export { BLE_NAME, SERVICE_UUID };
