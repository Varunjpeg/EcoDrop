#!/bin/bash
# ═══════════════════════════════════════════════════════
# EcoDrop-CA — Raspberry Pi 5 WiFi Hotspot Setup
# ═══════════════════════════════════════════════════════
# This makes the Pi CREATE its own WiFi network.
# Your phone connects directly to the Pi's hotspot.
# NO router needed. Works anywhere — classroom, lab, demo.
#
# Network name (SSID): EcoDrop-Machine
# Password:            ecodrop123
# Pi's IP will be:     10.42.0.1
# App URL on phone:    http://10.42.0.1:8000
# ═══════════════════════════════════════════════════════

set -e

echo "🌿 EcoDrop-CA — Setting up Pi as WiFi Hotspot..."
echo ""

# Install required packages
echo "📦 Installing hostapd and dnsmasq..."
sudo apt-get update -q
sudo apt-get install -y hostapd dnsmasq iptables

# Stop services before configuring
sudo systemctl stop hostapd 2>/dev/null || true
sudo systemctl stop dnsmasq 2>/dev/null || true

# ── Configure hostapd (WiFi Access Point) ────────────
echo "📡 Configuring WiFi Access Point..."
sudo tee /etc/hostapd/hostapd.conf > /dev/null <<EOF
interface=wlan0
driver=nl80211
ssid=EcoDrop-Machine
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=ecodrop123
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Point hostapd at config
sudo sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd

# ── Configure dnsmasq (DHCP server) ──────────────────
echo "🌐 Configuring DHCP server..."
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.backup 2>/dev/null || true
sudo tee /etc/dnsmasq.conf > /dev/null <<EOF
interface=wlan0
dhcp-range=10.42.0.2,10.42.0.20,255.255.255.0,24h
domain=local
address=/ecodrop.local/10.42.0.1
EOF

# ── Set static IP for wlan0 ───────────────────────────
echo "🔧 Setting static IP 10.42.0.1 for Pi..."
sudo tee /etc/network/interfaces.d/wlan0-hotspot > /dev/null <<EOF
auto wlan0
iface wlan0 inet static
    address 10.42.0.1
    netmask 255.255.255.0
EOF

# ── Enable IP forwarding ──────────────────────────────
sudo sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sudo sysctl -p

# ── Enable and start services ─────────────────────────
echo "🚀 Starting Access Point..."
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

sudo ifconfig wlan0 10.42.0.1
sudo systemctl start hostapd
sudo systemctl start dnsmasq

echo ""
echo "✅ EcoDrop WiFi Hotspot is LIVE!"
echo ""
echo "   📱 On your phone:"
echo "   1. Go to WiFi Settings"
echo "   2. Connect to: EcoDrop-Machine"
echo "   3. Password:   ecodrop123"
echo "   4. Open browser → http://10.42.0.1:5173"
echo ""
echo "   🤖 Starting EcoDrop server..."
cd ~/pi 2>/dev/null || cd ~/ecodrop 2>/dev/null || true
source venv/bin/activate 2>/dev/null || true
echo "   Run: python3 server.py"
