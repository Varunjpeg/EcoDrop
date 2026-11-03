"""
═══════════════════════════════════════════════════════════════════════════
EcoDrop-CA — YOLOv8 Custom Training Script (Transfer Learning)
═══════════════════════════════════════════════════════════════════════════
Train a lightweight YOLOv8-nano model to classify campus waste items.

DATASET STRUCTURE (create this on your Pi or laptop):
  datasets/
    ecodrop/
      images/
        train/     ← 80% of images
        val/       ← 20% of images
      labels/
        train/     ← YOLO format .txt files
        val/       ← YOLO format .txt files
      ecodrop.yaml ← Dataset config (auto-generated below)

HOW TO COLLECT DATA:
  1. Use the PiCam or phone camera
  2. Take 50-100 images per class (can start with 30)
  3. Label using LabelImg (free) or Roboflow (free tier, 3 projects)
  4. Export in YOLO format

CLASSES (10):
  0: plastic_bottle
  1: textbook
  2: pen
  3: cardboard
  4: paper_bundle
  5: notebook
  6: earphones
  7: charger
  8: eraser
  9: ruler

RUN: python train_model.py
═══════════════════════════════════════════════════════════════════════════
"""

import os
import yaml

# ── Generate dataset YAML ─────────────────────────────────────────
DATASET_DIR = os.path.join(os.path.dirname(__file__), "datasets", "ecodrop")
YAML_PATH   = os.path.join(DATASET_DIR, "ecodrop.yaml")

CLASSES = [
    "plastic_bottle", "textbook", "pen", "cardboard", "paper_bundle",
    "notebook", "earphones", "charger", "eraser", "ruler"
]

dataset_config = {
    "path": DATASET_DIR,
    "train": "images/train",
    "val": "images/val",
    "nc": len(CLASSES),
    "names": CLASSES,
}

def setup_dataset():
    """Create dataset directory structure."""
    for split in ["train", "val"]:
        os.makedirs(os.path.join(DATASET_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(DATASET_DIR, "labels", split), exist_ok=True)

    with open(YAML_PATH, "w") as f:
        yaml.dump(dataset_config, f, default_flow_style=False)

    print(f"✅ Dataset structure created at: {DATASET_DIR}")
    print(f"✅ Config written to: {YAML_PATH}")
    print(f"\n📸 Next steps:")
    print(f"  1. Add training images to: {DATASET_DIR}/images/train/")
    print(f"  2. Add labels (.txt YOLO format) to: {DATASET_DIR}/labels/train/")
    print(f"  3. Add validation images/labels to the val/ folders")
    print(f"  4. Run this script again to start training")

def train():
    """Train YOLOv8-nano with transfer learning."""
    from ultralytics import YOLO

    # Check if dataset exists
    if not os.path.exists(YAML_PATH):
        print("⚠️  Dataset not found. Setting up directory structure...")
        setup_dataset()
        return

    train_imgs = os.path.join(DATASET_DIR, "images", "train")
    if len(os.listdir(train_imgs)) == 0:
        print("⚠️  No training images found. Add images first.")
        print(f"    Put images in: {train_imgs}")
        setup_dataset()
        return

    print("🚀 Starting YOLOv8-nano transfer learning...")
    print(f"   Dataset: {YAML_PATH}")
    print(f"   Classes: {CLASSES}")
    print(f"   Images:  {len(os.listdir(train_imgs))}")
    print()

    # Load pretrained YOLOv8-nano (fastest, smallest — perfect for Pi 5)
    model = YOLO("yolov8n.pt")

    # Train with transfer learning
    # Key settings for Pi 5 (limited RAM/GPU):
    #   - imgsz=416: smaller than default 640, faster inference
    #   - batch=8: small batch for 8GB RAM
    #   - epochs=50: enough for transfer learning with small dataset
    #   - patience=10: early stopping if no improvement
    results = model.train(
        data=YAML_PATH,
        epochs=50,
        imgsz=416,
        batch=8,
        patience=10,
        device="cpu",       # Pi 5 has no CUDA GPU, uses CPU
        workers=2,          # Don't overload Pi's 4 cores
        project="runs",
        name="ecodrop_v1",
        exist_ok=True,
        # Transfer learning happens automatically —
        # the pretrained COCO weights are fine-tuned on our custom classes
        pretrained=True,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        # Data augmentation (helps with small datasets)
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10,
        translate=0.1,
        scale=0.5,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
    )

    print("\n✅ Training complete!")
    print(f"   Best model: runs/ecodrop_v1/weights/best.pt")
    print(f"   Last model: runs/ecodrop_v1/weights/last.pt")

    # Copy best model to the expected path
    best_path = "runs/ecodrop_v1/weights/best.pt"
    target_path = os.path.join(os.path.dirname(__file__), "models", "ecodrop_yolov8n.pt")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)

    if os.path.exists(best_path):
        import shutil
        shutil.copy2(best_path, target_path)
        print(f"   ✅ Copied to: {target_path}")

    # Run validation
    print("\n📊 Validation results:")
    metrics = model.val()
    print(f"   mAP50: {metrics.box.map50:.3f}")
    print(f"   mAP50-95: {metrics.box.map:.3f}")

    return results

def test_inference():
    """Quick test — capture an image and classify it."""
    from ultralytics import YOLO

    model_path = os.path.join(os.path.dirname(__file__), "models", "ecodrop_yolov8n.pt")
    if not os.path.exists(model_path):
        print("⚠️  No trained model found. Train first!")
        return

    model = YOLO(model_path)
    print(f"✅ Model loaded: {model_path}")

    # Try to capture from camera
    try:
        from picamera2 import Picamera2
        cam = Picamera2()
        cam.configure(cam.create_still_configuration(main={"size": (640, 480)}))
        cam.start()
        import time; time.sleep(1)
        image = cam.capture_array()
        cam.close()
        print("📷 Captured from PiCam")
    except Exception:
        import numpy as np
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        print("📷 Using mock image (no camera)")

    results = model(image, verbose=False)
    if results and len(results[0].boxes) > 0:
        for box in results[0].boxes:
            cls = int(box.cls.item())
            conf = float(box.conf.item())
            name = results[0].names.get(cls, "unknown")
            print(f"   → {name}: {conf:.1%}")
    else:
        print("   No objects detected")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_inference()
    elif len(sys.argv) > 1 and sys.argv[1] == "setup":
        setup_dataset()
    else:
        train()
