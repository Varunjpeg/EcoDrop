# ════════════════════════════════════════════════════════════════════════════
# EcoDrop-CA — Item Classification Configuration
# Aligned with custom YOLOv11 model (ecodrop_yolov11.pt)
# Model classes: Computer Mouse, Mobile Phone, Notebook, box, pen, water bottle
# ════════════════════════════════════════════════════════════════════════════

# ── Classes the model recognizes ────────────────────────────────────────────
# bin: 1=plastic, 2=stationery, 3=paper, 4=e-waste
ITEM_CLASSES = {
    # Model class: 'water bottle'
    "plastic_bottle": {
        "label": "Water Bottle",
        "base_coins": 20, "co2_kg": 0.10, "bin": 1, "recyclability": 0.95,
    },
    # Model class: 'Notebook'
    "notebook": {
        "label": "Notebook",
        "base_coins": 15, "co2_kg": 0.12, "bin": 3, "recyclability": 0.85,
    },
    # Model class: 'box'
    "cardboard": {
        "label": "Cardboard Box",
        "base_coins": 10, "co2_kg": 0.15, "bin": 3, "recyclability": 0.85,
    },
    # Model class: 'pen'
    "pen": {
        "label": "Pen / Marker",
        "base_coins": 8, "co2_kg": 0.02, "bin": 2, "recyclability": 0.60,
    },
    # Model class: 'Mobile Phone'
    "mobile_phone": {
        "label": "Mobile Phone",
        "base_coins": 80, "co2_kg": 1.50, "bin": 4, "recyclability": 0.90,
    },
    # Model class: 'Computer Mouse'
    "mouse": {
        "label": "Computer Mouse",
        "base_coins": 45, "co2_kg": 0.60, "bin": 4, "recyclability": 0.80,
    },
}

# ── Condition Assessment ──────────────────────────────────────────────────────
# Multiplier applied to base_coins based on physical condition
CONDITION_MULTIPLIERS = {
    "excellent":    1.00,   # Like new, clean, fully intact
    "good":         0.85,   # Minor wear, still functional
    "fair":         0.65,   # Visible damage, partially usable
    "poor":         0.40,   # Heavily damaged, barely recyclable
    "contaminated": 0.10,   # Food/chemical contamination — minimal reward
}

# ── Coin Calculation Formula ──────────────────────────────────────────────────
# final_coins = round(base_coins × condition_multiplier × recyclability)

# ── AI Settings ──────────────────────────────────────────────────────────────
LOCAL_MODEL_PATH     = "models/ecodrop_yolov11.pt"
CONFIDENCE_THRESHOLD = 0.50     # Below this → Gemini fallback via phone cellular

# ── Hardware Config ───────────────────────────────────────────────────────────
CAMERA_RESOLUTION = (640, 480)
CAPTURE_DELAY_MS  = 500       # Wait after door closes before capturing
SERVO_PINS = {               # GPIO BCM pin numbers for bin sorter servos
    1: 17,
    2: 27,
    3: 22,
    4: 23,
}
LED_PIN_STATUS  = 24          # Status LED
LED_PIN_READY   = 25          # Ready LED (green)
BUZZER_PIN      = 18          # Piezo buzzer for audio feedback
IR_SENSOR_PIN   = 5           # IR break-beam sensor to detect item insertion
DOOR_SERVO_PIN  = 6           # Door open/close servo
