# ♻️ EcoDrop — AI-Based Smart Reverse Vending Machine

<div align="center">

![EcoDrop Banner](https://img.shields.io/badge/EcoDrop-AI%20Smart%20RVM-059669?style=for-the-badge&logo=leaf&logoColor=white)
![YOLOv11](https://img.shields.io/badge/YOLOv11-Custom%20Model-F59E0B?style=for-the-badge)
![Raspberry Pi 5](https://img.shields.io/badge/Raspberry%20Pi%205-Edge%20AI-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white)
![React PWA](https://img.shields.io/badge/React-PWA-3B82F6?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-059669?style=for-the-badge&logo=fastapi&logoColor=white)

**Varun U | 24BVD1024 | Computer Architecture**

*Smarter Recycling. Edge AI meets Sustainability.*

</div>

---

## 📖 Project Overview

EcoDrop is a next-generation **Reverse Vending Machine (RVM)** that combines on-device YOLOv11 AI with a Gemini Flash cloud fallback, gamified E-Coin rewards, and a React Progressive Web App — all hosted locally on a Raspberry Pi 5 with **zero internet required on the machine**.

### 🌍 Problem Statement
The world generates **2.01 billion tonnes** of municipal solid waste annually, with over 33% mismanaged. Campus environments lack smart, incentivised recycling infrastructure. Existing RVMs (like TOMRA) are industrial-scale, internet-dependent, narrow in scope, and unaffordable for institutions.

### ✅ Our Solution
EcoDrop deploys a low-cost (~₹8,000), AI-powered vending machine that:
- Identifies 6 categories of recyclables **entirely on-device** using YOLOv11
- Falls back to **Gemini Flash Vision** via the user's phone when confidence < 85%
- Rewards users with **E-Coins** redeemable at campus canteens
- Serves a full **React PWA** from the Pi itself — no app store, no download

---

## 🏗️ Repository Structure

```
EcoDrop/
├── mobile/                      # React PWA (Frontend)
│   ├── src/
│   │   ├── pages/               # Scan, Home, Wallet, Profile, etc.
│   │   ├── services/            # geminiService.js, syncService.js, piService.js
│   │   ├── context/             # AppContext (global state)
│   │   └── styles/              # global.css (dark + light theme)
│   ├── public/                  # Icons, manifest, admin panel
│   ├── vite.config.js
│   └── package.json
│
├── pi/                          # Raspberry Pi 5 Backend
│   ├── server.py                # FastAPI HTTP server (main entry point)
│   ├── ai_pipeline.py           # YOLOv11 + camera + Gemini fallback logic
│   ├── config.py                # Item classes, coins, bins, thresholds
│   ├── requirements.txt         # Python dependencies
│   ├── setup_hotspot.sh         # Creates EcoDrop-Machine WiFi hotspot
│   ├── start.sh                 # One-command Pi startup script
│   ├── train_yolo11_colab.py    # Model training script (Google Colab)
│   └── datasets/
│       └── ecodrop_v2.yaml      # Roboflow dataset config
│
├── backend/
│   ├── supabase_schema.sql      # Full Supabase DB schema
│   └── mock-pi/                 # Laptop mock server for testing
│
├── EcoDrop_Presentation_VarunU.pptx   # Full project presentation
├── deploy-to-pi.bat             # Windows SCP deploy script
└── README.md
```

---

## 🧠 Dual-Mode AI Architecture

```
OBJECT PLACED
     │
     ▼
📷 PiCam v2 captures image
     │
     ▼
🧠 YOLOv11 (on-device, Raspberry Pi 5)
     │
     ├──── Confidence ≥ 85% ────────────► ✅ Result finalised (0ms internet)
     │
     └──── Confidence < 85% ──────────────────────────────────────────────┐
                                                                           │
                         📱 Phone (on EcoDrop-Machine WiFi)               │
                              │                                            │
                              ◄───────── Pi sends JPEG (~100KB) ──────────┘
                              │
                              ▼
                        ☁️ Gemini Flash API (via phone's 4G)
                              │
                              ▼
                        📩 Phone POSTs result back to Pi
                              │
                              ▼
                        🎯 Coins calculated → Servo routes waste
```

> **Key Innovation:** The Raspberry Pi itself has **zero internet** — the user's phone acts as the cellular bridge for Gemini calls only when needed.

---

## 🤖 AI Model — YOLOv11 Custom

| Property | Value |
|----------|-------|
| Framework | Ultralytics YOLOv11 (PyTorch) |
| Training Platform | Roboflow Universe |
| Dataset | 24,600 images (public datasets) |
| Epochs | 10 |
| Classes | 6 custom |
| **mAP@50** | **76.8%** |
| **Precision** | **82.5%** |
| **Recall** | **76.2%** |
| **F1 Score** | **78.9%** |

### 📂 Detection Classes

| Class ID | Raw Label | EcoDrop Category |
|----------|-----------|-----------------|
| 0 | Computer Mouse | 🖱️ mouse |
| 1 | Mobile Phone | 📱 mobile_phone |
| 2 | Notebook | 📓 notebook |
| 3 | box | 📦 cardboard |
| 4 | pen | 🖊️ pen |
| 5 | water bottle | 🍶 plastic_bottle |

> **Model weights** (`ecodrop_yolov11.pt`) are excluded from this repo due to size (18MB). Download from Roboflow or contact the author.

---

## 🪙 E-Coin Reward Formula

```
E-Coins = base_coins × condition_multiplier × recyclability_factor
```

| Item | Base Coins | Recyclability |
|------|-----------|---------------|
| Water Bottle | 15 | 0.90 |
| Mobile Phone | 50 | 0.95 |
| Computer Mouse | 40 | 0.90 |
| Pen / Marker | 8 | 0.70 |
| Notebook | 20 | 0.85 |
| Cardboard Box | 12 | 0.95 |

| Condition | Multiplier |
|-----------|-----------|
| Excellent | 1.00 |
| Good | 0.85 |
| Fair | 0.65 |
| Poor | 0.40 |

---

## 💻 Tech Stack

### Frontend (mobile/)
- **React 18** + **Vite 5** — Progressive Web App
- **Supabase JS** — Auth + real-time wallet sync
- **react-hot-toast** — Toast notifications
- **html5-qrcode** — QR machine pairing
- **react-confetti** — Celebration on deposit
- Served directly from Pi at `http://10.42.0.1:8000`

### Backend (pi/)
- **FastAPI** — Async REST API
- **Uvicorn** — ASGI server
- **Picamera2** — PiCam v2 capture
- **Ultralytics** — YOLOv11 inference
- **OpenCV / Pillow** — Image processing
- **Supabase Python** — Cloud DB sync

### Cloud
- **Supabase** — PostgreSQL, Auth, Row-Level Security
- **Gemini Flash (gemini-3.5-flash-lite)** — Vision fallback via Google AI Studio

---

## 🚀 Setup & Deployment

### Prerequisites
- Raspberry Pi 5 (4GB+) running Raspberry Pi OS 64-bit
- Pi Camera Module V2
- Windows laptop for development

### 1. Clone the Repo
```bash
git clone https://github.com/Varunjpeg/EcoDrop.git
cd EcoDrop
```

### 2. Set Up Pi Hotspot
```bash
ssh pi@<ip> "bash -s" < pi/setup_hotspot.sh
```

### 3. Install Pi Dependencies
```bash
ssh re@10.42.0.1
cd ~/pi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Add Model Weights
```bash
# Copy ecodrop_yolov11.pt to ~/pi/models/ on the Pi
scp ecodrop_yolov11.pt re@10.42.0.1:~/pi/models/
```

### 5. Build & Deploy Frontend
```bash
cd mobile
cp .env.example .env          # Add your VITE_GEMINI_KEY and Supabase keys
npm install
npm run build
# Deploy dist/ to Pi
scp -r dist/ re@10.42.0.1:~/pi/dist/
```

### 6. Start the Server
```bash
ssh re@10.42.0.1 "cd ~/pi && source venv/bin/activate && python3 server.py"
```

### 7. Connect Phone
1. Connect phone WiFi to **EcoDrop-Machine** (password: `ecodrop123`)
2. Open Chrome → `http://10.42.0.1:8000`
3. Install PWA: Chrome menu → **Add to Home Screen**
4. To clear PWA cache: `http://10.42.0.1:8000/clear`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Machine status check |
| POST | `/session/start` | Begin a new recycling session |
| POST | `/session/{sid}/item-detected` | Capture + run YOLO inference |
| POST | `/session/{sid}/cloud-result` | Phone posts Gemini result back |
| POST | `/session/{sid}/confirm` | User confirms deposit |
| GET | `/preview.jpg` | Live PiCam JPEG frame |
| GET | `/clear` | Clear PWA cache on phone |

---

## 🌱 SDG Alignment

| Goal | How EcoDrop Contributes |
|------|------------------------|
| **SDG 11** — Sustainable Cities | Smart waste infrastructure for campus communities |
| **SDG 12** — Responsible Consumption | Incentivised, automated recyclable sorting |
| **SDG 13** — Climate Action | Reduces landfill → lowers methane/CO₂ emissions |

---

## 🔭 Future Scope

- **ESP32 MCU** — Motor control, bin-full sensor, LED feedback
- **Servo Motor** — Automated bin routing after classification
- **360° Spinner** — Turntable for better camera coverage
- **Multi-machine fleet** — Admin dashboard for campus-wide monitoring
- **NFC tap-to-earn** — Instant coin credit via student NFC cards

---

## 👨‍💻 Author

**Varun U**  
Registration: 24BVD1024  
Subject: Computer Architecture  

---

<div align="center">
Made with ♻️ and 🧠 | EcoDrop 2026
</div>
