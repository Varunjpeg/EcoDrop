"""
Generate QR code sticker for EcoDrop machines.
The QR contains http://10.42.0.1:8000/connect
User scans this → guided to install the PWA.

Run on laptop:
  python generate_qr.py

Output: machine_qr_sticker.png  (print and stick on the machine)
"""

import urllib.request
import os

MACHINE_ID  = "MACH_001"
CONNECT_URL = "http://10.42.0.1:8000/connect"

# Use qrserver.com (free, no install needed)
qr_url = (
    f"https://api.qrserver.com/v1/create-qr-code/"
    f"?size=400x400&margin=20&data={CONNECT_URL}"
    f"&color=059669&bgcolor=ffffff"
)

out_file = "machine_qr_sticker.png"
print(f"Generating QR for: {CONNECT_URL}")
urllib.request.urlretrieve(qr_url, out_file)
print(f"✅ Saved: {out_file}")
print()
print("Print this and stick it on your EcoDrop machine.")
print("When users scan it, they will be guided to install the app.")
