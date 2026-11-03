#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  EcoDrop-CA — Raspberry Pi 5 Final Startup Script
#  Run this every time you want to start the machine.
#
#  Network Architecture (Final Deployment):
#    eth0  → Campus/home internet  (for Gemini API fallback)
#    wlan0 → "EcoDrop-Machine" WiFi hotspot  (for user phone)
#
#  User's phone:
#    Connects to "EcoDrop-Machine" WiFi
#    Opens http://10.42.0.1:8000
#    App served directly from Pi — no laptop, no internet needed
# ═══════════════════════════════════════════════════════════════════

set -e
ECODROP_DIR="$HOME/pi"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      EcoDrop-CA — Starting Machine       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Make sure we're in the right directory ────────────────────────
cd "$ECODROP_DIR"

# ── Activate Python venv ──────────────────────────────────────────
if [ ! -d "venv" ]; then
  echo "❌ venv not found! Run the setup steps first."
  exit 1
fi
source venv/bin/activate

# ── Make sure eth0 has internet (for Gemini API) ──────────────────
echo "🌐 Requesting internet on eth0..."
sudo dhclient eth0 2>/dev/null || echo "   (eth0 may already be configured — continuing)"

# ── Start WiFi Hotspot on wlan0 ───────────────────────────────────
echo "📡 Starting WiFi hotspot: EcoDrop-Machine..."
sudo nmcli dev wifi hotspot ifname wlan0 ssid "EcoDrop-Machine" password "ecodrop123" 2>/dev/null || \
  echo "   (Hotspot may already be running — continuing)"

echo ""
echo "   ✅ Hotspot ready: 'EcoDrop-Machine' (password: ecodrop123)"
echo "   ✅ Machine IP:     10.42.0.1"
echo "   ✅ Internet:       via eth0 (for Gemini fallback)"
echo ""

# ── Start the Python HTTP + AI server ────────────────────────────
echo "🚀 Starting EcoDrop server on port 8000..."
echo ""
echo "   Phone steps:"
echo "   1. WiFi → Connect to 'EcoDrop-Machine'"
echo "   2. Open Chrome → type: http://10.42.0.1:8000"
echo "   3. Tap Scan & Deposit → Connect → place item → done!"
echo ""
echo "   Press Ctrl+C to stop."
echo ""

python3 server.py
