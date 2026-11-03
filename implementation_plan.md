# EcoDrop-CA — Full Implementation Plan (Revised)

> **Goal**: Build an AI-powered Reverse Vending Machine (RVM) for academic institutions.
> Patent/Paper quality. Zero ongoing cost. Real-world deployable.

---

## 🏗️ Final System Architecture

```
╔══════════════════════════════════════════════════════════╗
║               CLOUD (Supabase — Free Tier)               ║
║   PostgreSQL DB  •  Auth  •  Realtime  •  Edge Functions  ║
╚══════════════════╦═══════════════════════════════════════╝
                   ║  HTTPS (Only when phone has internet)
╔══════════════════╩══════════════════════════════════════════════╗
║                     MOBILE APP (Flutter)                         ║
║  Auth • Wallet • Scan • Redeem • Leaderboard • Forums • Profile ║
╚══════════════════╦══════════════════════════════════════════════╝
                   ║  BLE 5.0  (Primary Link — No WiFi needed)
╔══════════════════╩══════════════════════════════════════════════╗
║              RASPBERRY PI 5  (Edge Brain)                        ║
║  PiCam 3 ──► YOLOv8-nano (Local AI)  ──► FastAPI Local Server  ║
║                  │ (confidence < 85%)                            ║
║                  └──► BLE ──► Phone ──► Gemini API ──► back     ║
║                                                                   ║
║  Result ──► UART/Serial ──► ESP32 (Controller)                  ║
╚══════════════════════════════════════════════════════════════════╝
                   ║  UART (2 wires)
╔══════════════════╩════════════════╗
║         ESP32 (Physical Control)  ║
║  LCD Screen • Servos • LEDs • GPIO║
╚═══════════════════════════════════╝
```

---

## 📡 Communication — Explained Plainly

### 1. PiCam 3 → Raspberry Pi 5
- **How**: Ribbon cable directly into Pi's **CSI port** (Camera Serial Interface).
- **Why this matters**: This is NOT WiFi or USB. The camera is electrically wired into the Pi. Zero latency, zero network.
- **Code**: Python `picamera2` library — just call `camera.capture_array()`.

### 2. Raspberry Pi 5 → ESP32 (UART Serial)
- **How**: Two wires: TX (Pi) → RX (ESP32), RX (Pi) → TX (ESP32). Direct wiring.
- **Pi sends JSON over serial**:
  ```json
  { "item": "plastic_bottle", "condition": "good", "ecoins": 15, "bin": 1, "display": "15 E-Coins Earned!" }
  ```
- **ESP32 reads it**: Updates LCD screen, controls servo to open bin 1, flashes green LED.
- **Why UART not WiFi**: No IP stack, no router dependency, instant, deterministic. Perfect for hardware control.

### 3. Machine ↔ Mobile App (BLE — Bluetooth Low Energy)
- **How**: Pi 5 has **built-in Bluetooth 5.0**. It advertises itself as a BLE peripheral named `EcoDrop-001`.
- **Session Flow**:
  1. User opens app → taps Scan → camera opens.
  2. QR code on machine encodes: `ecodrop://connect?machine=MACH_001&ble=AA:BB:CC:DD:EE:FF`
  3. App reads QR → connects to Pi via BLE automatically.
  4. User places item → machine door closes (servo via ESP32).
  5. Pi captures image → runs **YOLOv8-nano locally** → gets result + confidence %.
  6. **If confidence ≥ 85%**: Pi sends result JSON to app via BLE. Done.
  7. **If confidence < 85%**: Pi **compresses image to ~20KB** → sends to app via BLE (chunked packets) → App calls **Gemini Vision API** using phone's internet → result sent back to Pi via BLE.
  8. Pi calculates E-Coins → sends final result to App (BLE) + ESP32 (UART).
  9. User sees result on both app screen and machine LCD.
  10. User taps **Confirm & Deposit** on app → BLE signal to Pi → Pi tells ESP32 → bin opens.
  11. App immediately credits E-Coins to user's Supabase account.
  12. Pi logs transaction locally (SQLite) for audit/backup.

### 4. Cloud Sync Strategy
- The **phone is the internet gateway**. The Pi never needs its own internet.
- The app pushes all transaction data to Supabase (cloud DB) using the phone's internet after each session.
- This means the machine is **100% edge-operated**. No SIM card, no WiFi router dependency.

---

## 🆓 Tech Stack — All Free, Fully Justified

| Component | Choice | Why This, Not Others |
|-----------|--------|----------------------|
| **Mobile App** | Flutter (Dart) | iOS + Android from one codebase. `flutter_blue_plus` for BLE. Best-in-class animations. Free. **React Native** has worse BLE libraries. **Ionic** is too slow. |
| **Cloud DB + Auth** | Supabase (Free tier) | 500MB PostgreSQL, Auth, Realtime, Storage, Edge Functions — ALL free. **Firebase** requires paid Blaze plan for Cloud Functions. Supabase is open-source and SQL-based — better for complex leaderboard/analytics queries. |
| **Local AI (Pi)** | YOLOv8-nano | Fastest YOLO variant, runs on Pi 5 without GPU. Fine-tuned via transfer learning on waste datasets. Free (Ultralytics). **MobileNet** is less accurate. **Full YOLOv8** is too heavy for Pi. |
| **AI Fallback** | Gemini 1.5 Flash API | **Completely free**: 15 requests/min, 1M tokens/day. GPT-4V costs money. Gemini Flash is multimodal — reads images and gives structured JSON responses. |
| **Pi Local Server** | FastAPI (Python) | Async, lightweight, handles BLE + camera + serial simultaneously. Already in Python ecosystem for YOLOv8. |
| **Admin Dashboard** | React + Vite | Deployed free on Vercel/Netlify. Simple SPA is better than Next.js for a dashboard. |
| **Model Training** | Roboflow Free | Free tier: dataset hosting, annotation, export to YOLOv8 format. No GPU cost for training (use Google Colab free). |
| **BLE Protocol** | Custom GATT Profile | Custom BLE characteristics for: session control, image chunks, result data, confirmation signals. |

---

## 🪙 E-Coin Valuation System

### Formula
```
E-Coins = Base_Value × Condition_Multiplier × Recyclability_Factor
```

### Base Values (by item type)
| Item | Base Coins | Recyclability Factor |
|------|-----------|----------------------|
| Plastic Bottle (PET) | 20 | 0.95 (highly recyclable) |
| Plastic Bottle (other) | 15 | 0.75 |
| A4 Paper (per sheet) | 2 | 0.90 |
| Paper Bundle (~100g) | 12 | 0.90 |
| Cardboard (~100g) | 10 | 0.85 |
| Ballpoint Pen | 8 | 0.60 |
| Sketch/Marker Pen | 6 | 0.55 |
| Textbook / Notebook | 35 | 0.80 |
| E-waste — Earphones | 60 | 0.70 |
| E-waste — Charger/Cable | 50 | 0.70 |
| E-waste — Small electronics | 80 | 0.75 |
| Stationery (rulers, erasers) | 5 | 0.65 |

### Condition Multipliers (AI-assessed)
| Condition | Multiplier | AI Criteria |
|-----------|-----------|-------------|
| Excellent | 1.0 | No visible damage, original shape |
| Good | 0.85 | Minor wear, functional |
| Fair | 0.65 | Visible damage but recyclable |
| Poor | 0.40 | Heavy damage, crushed |
| Contaminated | 0.10 | Stained, cannot be recycled well |

### Example Calculations
- Plastic Bottle (Good): `20 × 0.85 × 0.95 = 16 coins`
- Textbook (Fair): `35 × 0.65 × 0.80 = 18 coins`
- Earphones (Excellent): `60 × 1.0 × 0.70 = 42 coins`

---

## 🎁 Redemption Partners

All vouchers are digital QR codes delivered in-app.

| Partner | Voucher Types | Min Coins |
|---------|--------------|-----------|
| 🍔 **Gazebo** | ₹20/₹50/₹100 off | 50 / 120 / 220 |
| 🍕 **North Square** | ₹20/₹50/₹100 off | 50 / 120 / 220 |
| 🥗 **Hunger** | ₹20/₹50/₹100 off | 50 / 120 / 220 |
| 🏋️ **Gymkhana** | 1-day / 3-day pass | 150 / 400 |
| 🍱 **AB3 Canteen** | ₹20/₹50 off | 50 / 120 |
| 📚 **Library** | Fine waiver (₹50) | 100 |
| 🛒 **Campus Store** | ₹50/₹100 off stationery | 100 / 200 |

---

## 📱 Full Mobile App Feature List

### Authentication
- Email + password registration
- Google OAuth (free via Supabase)
- College email domain validation (e.g. `@university.edu.in`)
- Onboarding tutorial (3 slides)

### Home Dashboard
- E-Coin balance (animated counter)
- Quick Scan button
- Recent 3 transactions
- Campus impact stats (total kg recycled today)
- Nearby machines map (Leaflet.js / Flutter Map)
- Daily streak indicator

### 📷 Scan & Deposit (Core Flow)
- QR scanner (machine pairing)
- BLE connection status indicator
- Real-time session screen:
  - "Place your item..." waiting state
  - AI processing animation
  - Result card: item type, photo, condition badge, coins breakdown
  - AI confidence meter
  - "Confirm & Deposit" / "Reject" buttons
- Confetti animation on success

### 💰 Wallet
- Current E-Coin balance
- Full transaction history (earned / spent / expired)
- Filter by date, type, item category
- Detailed receipt for each deposit (item photo, coins formula breakdown)
- Monthly/weekly charts (coins earned vs spent)
- Export history as PDF

### 🏪 Rewards Store
- Browse by partner (Gazebo, North Square, etc.)
- Browse by coin range
- Voucher detail page (terms, expiry, QR)
- My Vouchers (active, used, expired)
- Favorite rewards

### 🏆 Leaderboard
- All-time campus leaderboard
- Weekly leaderboard (resets every Monday)
- Department leaderboard (CS, ECE, Mech, etc.)
- Friends leaderboard
- Rank badge (Bronze, Silver, Gold, Platinum, Eco-Champion)
- Animated rank card to share on social

### 🌍 Impact Dashboard
- Personal stats: total items, total kg, CO2 saved (kg), trees saved equivalent
- Campus collective stats (all users combined)
- Item breakdown pie chart (what you've recycled most)
- Month-over-month comparison
- Impact certificate (PDF/image export — shareable)

### 💬 Community Forums
- Posts, comments, likes
- Topics: Eco Tips, Campus News, Challenges, General
- Post images
- Trending posts
- Report/flag system
- Weekly eco challenge (e.g. "Recycle 5 bottles this week")
- Challenge leaderboard

### 👤 Profile
- Display name, avatar, department, year
- Stats overview (coins earned, items deposited, CO2 saved)
- Achievement badges collection
- Referral code (earn 10 coins per friend who joins)
- Account settings
- Notification preferences
- Dark/Light mode toggle
- Logout

### 🔔 Notifications
- E-Coins credited
- Voucher about to expire (24h warning)
- New reward added
- Leaderboard rank change
- Forum reply / like
- Weekly summary ("You recycled X items this week!")
- Challenge updates

### 🎓 Learn
- Waste category guide (what goes where)
- How recyclability is calculated
- EcoDrop impact reports
- Sustainability articles (static content)

---

## 🖥️ Admin Dashboard (React + Vite)

- Machine management (add, edit, status, last ping)
- User management (search, ban, view history)
- Transaction log (filterable, exportable)
- Reward management (add/edit/deactivate vouchers)
- Analytics: coins issued per day, top items, top users
- Forum moderation
- Push notification sender

---

## 🗄️ Supabase Database Schema (Key Tables)

```
users           — id, email, name, department, year, coins_balance, streak
machines        — id, name, location, campus, ble_mac, status, last_sync
transactions    — id, user_id, machine_id, item_type, condition, coins_earned, timestamp, image_url
redemptions     — id, user_id, reward_id, coins_spent, voucher_code, status, expires_at
rewards         — id, partner_name, description, coin_cost, category, active
forum_posts     — id, user_id, title, body, topic, likes, timestamp
forum_comments  — id, post_id, user_id, body, timestamp
achievements    — id, user_id, badge_type, earned_at
challenges      — id, title, description, target, start_date, end_date
leaderboard     — (view) aggregated from transactions by week/all-time
```

---

## 📅 Execution Plan — Review 1 (Software Only)

### Phase 1 — Foundation (Days 1–2)
- [ ] Monorepo project structure
- [ ] Supabase project setup (schema, RLS policies, auth)
- [ ] Flutter app skeleton + navigation shell
- [ ] Mock Pi server (FastAPI, simulates BLE + AI responses)

### Phase 2 — Auth + Profile (Days 3–4)
- [ ] Login / Register / Google OAuth
- [ ] Onboarding flow
- [ ] Profile screen + settings

### Phase 3 — Core Scan Flow (Days 5–7)
- [ ] QR scanner + BLE mock connection
- [ ] Session screen with AI result (mocked)
- [ ] E-Coin credit logic
- [ ] Transaction history

### Phase 4 — Wallet + Rewards (Days 8–10)
- [ ] Wallet screen + charts
- [ ] Rewards store
- [ ] Voucher generation + My Vouchers

### Phase 5 — Social Features (Days 11–13)
- [ ] Leaderboard (all views)
- [ ] Forums (posts, comments, likes)
- [ ] Achievements + badges
- [ ] Impact dashboard

### Phase 6 — Polish + Admin (Days 14–15)
- [ ] Push notifications
- [ ] Admin dashboard (React)
- [ ] Animations, dark mode
- [ ] End-to-end demo walkthrough

---

## ✅ Verification Plan (Review 1)

A complete demo where:
1. User registers with college email
2. Scans mock QR → BLE session starts (simulated)
3. "Deposits" a plastic bottle → AI result shown (mocked from server)
4. 15 E-Coins credited to wallet
5. User redeems a Gazebo ₹20 voucher
6. Leaderboard updates
7. Forum post created
8. Admin dashboard shows the transaction

---

## 🔬 Why This Is Patent/Paper Worthy

1. **Novel BLE-mediated edge-cloud hybrid AI pipeline** — using phone as internet relay for AI fallback is a new architecture not seen in existing RVM literature.
2. **Dynamic E-Coin valuation** using multi-factor condition assessment via CV — not just binary accept/reject like existing machines.
3. **Gamified waste management** with real-time leaderboards and community forums at campus scale.
4. **Zero-infrastructure-cost deployment** — no internet required on the machine; entire edge compute on Pi 5 with transfer-learned lightweight model.
5. **Multi-material RVM** — existing machines handle only one material type (bottles only). EcoDrop handles 6+ categories.
