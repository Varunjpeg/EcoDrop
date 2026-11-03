/*
 * Pi Service — connects the mobile app to the EcoDrop Pi server
 * In production: Pi runs on local network, phone connects via BLE → WiFi bridge
 * In dev: connects to the FastAPI mock server at localhost:8000
 */

// Default to localhost for dev; in production this would come from BLE discovery
const PI_BASE_URL = import.meta.env.VITE_PI_URL || 'http://localhost:8000';

export class PiService {
  constructor() {
    this.baseUrl = PI_BASE_URL;
    this.sessionId = null;
    this.ws = null;
    this.listeners = [];
  }

  // ─── Health Check ──────────────────────────
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return await res.json();
    } catch {
      return null; // Pi not reachable
    }
  }

  // ─── Machine Info ──────────────────────────
  async getMachineInfo() {
    const res = await fetch(`${this.baseUrl}/machine/info`);
    if (!res.ok) throw new Error('Failed to get machine info');
    return await res.json();
  }

  // ─── Start Session ─────────────────────────
  async startSession(machineId = 'MACH_001', userId = null) {
    const res = await fetch(`${this.baseUrl}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machineId, user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to start session');
    const data = await res.json();
    this.sessionId = data.session_id;
    return data;
  }

  // ─── Connect WebSocket for live updates ────
  connectWebSocket(sessionId, onMessage) {
    const wsUrl = this.baseUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws/${sessionId || this.sessionId}`);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.warn('WS parse error:', e);
      }
    };

    this.ws.onerror = (err) => console.warn('WS error:', err);
    this.ws.onclose = () => console.log('WS closed');

    return this.ws;
  }

  // ─── Trigger Item Detection (AI analysis) ──
  async triggerItemDetection(sessionId) {
    const sid = sessionId || this.sessionId;
    const res = await fetch(`${this.baseUrl}/session/${sid}/item-detected`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger detection');
    return await res.json();
  }

  // ─── Get Result ────────────────────────────
  async getResult(sessionId) {
    const sid = sessionId || this.sessionId;
    const res = await fetch(`${this.baseUrl}/session/${sid}/result`);
    if (!res.ok) throw new Error('Failed to get result');
    return await res.json();
  }

  // ─── Confirm Deposit ──────────────────────
  async confirmDeposit(sessionId) {
    const sid = sessionId || this.sessionId;
    const res = await fetch(`${this.baseUrl}/session/${sid}/confirm`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to confirm');
    return await res.json();
  }

  // ─── Reject / Cancel ─────────────────────
  async rejectDeposit(sessionId) {
    const sid = sessionId || this.sessionId;
    const res = await fetch(`${this.baseUrl}/session/${sid}/reject`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reject');
    return await res.json();
  }

  // ─── Get Session Status ───────────────────
  async getStatus(sessionId) {
    const sid = sessionId || this.sessionId;
    const res = await fetch(`${this.baseUrl}/session/${sid}/status`);
    if (!res.ok) throw new Error('Failed to get status');
    return await res.json();
  }

  // ─── Cleanup ──────────────────────────────
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
  }
}

// Singleton instance
export const piService = new PiService();
