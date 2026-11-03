# EcoDrop-CA v2 — Custom YOLOv11 Training
## Google Colab Notebook — Run this cell by cell

# ─────────────────────────────────────────────────────────────────────────────
# CELL 1: Install dependencies
# ─────────────────────────────────────────────────────────────────────────────
!pip install ultralytics roboflow onnx onnxruntime -q

from ultralytics import YOLO
import os

print("✅ Ultralytics YOLOv11 ready:", YOLO.__version__ if hasattr(YOLO, '__version__') else "loaded")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 2: Download dataset from Roboflow
# Replace YOUR_API_KEY with your free Roboflow API key (roboflow.com → free account)
# ─────────────────────────────────────────────────────────────────────────────
from roboflow import Roboflow

# Option A: Merge multiple public Roboflow datasets for each class
# These are publicly available on Roboflow Universe (no login needed for download links)
# We'll download them and merge into a single dataset.

API_KEY = "YOUR_ROBOFLOW_API_KEY"   # ← paste your free API key here
rf = Roboflow(api_key=API_KEY)

datasets_to_merge = [
    # (workspace, project, version)
    # Plastic bottles
    ("roboflow-100", "drinking-waste-classification", 1),
    # Books
    ("roboflow-100", "book-store", 1),
    # Cardboard boxes
    ("roboflow-100", "cardboard-vs-bottle", 1),
    # Mobile phones
    ("roboflow-100", "mobile-phone-detection-fgfbc", 1),
    # Computer mouse
    ("robowflow-100", "computer-hardware-jvy27", 1),
]

# ─────────────────────────────────────────────────────────────────────────────
# CELL 3: Setup merged dataset directory structure
# ─────────────────────────────────────────────────────────────────────────────
import os, shutil, random, yaml
from pathlib import Path

DATASET_ROOT = Path("datasets/ecodrop_v2")
for split in ["train", "val", "test"]:
    (DATASET_ROOT / "images" / split).mkdir(parents=True, exist_ok=True)
    (DATASET_ROOT / "labels" / split).mkdir(parents=True, exist_ok=True)

# Class names and their ID in our merged dataset
CLASS_MAP = {
    "pen":            0,
    "marker":         0,   # same as pen
    "book":           1,
    "textbook":       1,
    "notebook":       1,
    "cardboard":      2,
    "cardboard_box":  2,
    "box":            2,
    "wire":           3,
    "cable":          3,
    "charger":        3,
    "adapter":        3,
    "plastic_bottle": 4,
    "bottle":         4,
    "mouse":          5,
    "computer_mouse": 5,
    "mobile_phone":   6,
    "phone":          6,
    "cell_phone":     6,
    "smartphone":     6,
}

FINAL_CLASSES = ["pen", "book", "cardboard", "wire_cable", "plastic_bottle", "mouse", "mobile_phone"]

print("Dataset structure created ✅")
print(f"Classes: {FINAL_CLASSES}")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 4: Write dataset YAML config
# ─────────────────────────────────────────────────────────────────────────────
dataset_yaml = {
    "path": str(DATASET_ROOT.absolute()),
    "train": "images/train",
    "val":   "images/val",
    "test":  "images/test",
    "nc":    len(FINAL_CLASSES),
    "names": FINAL_CLASSES,
}

yaml_path = DATASET_ROOT / "ecodrop_v2.yaml"
with open(yaml_path, "w") as f:
    yaml.dump(dataset_yaml, f, default_flow_style=False)

print(f"Dataset YAML written: {yaml_path} ✅")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 5: Upload YOUR OWN images (if you have any from the PiCam)
# ─────────────────────────────────────────────────────────────────────────────
# If you've taken photos of pens, bottles, phones, mice, books etc. with your
# PiCam or phone camera, upload a .zip file and extract here.
# Otherwise, the script will use the Roboflow public datasets above.

# from google.colab import files
# uploaded = files.upload()  # upload your ZIP
# !unzip your_images.zip -d /tmp/custom_images/

# ─────────────────────────────────────────────────────────────────────────────
# CELL 6: AUTO-LABEL images using YOLOv11 pre-trained COCO + manual correction
# ─────────────────────────────────────────────────────────────────────────────
# COCO classes that map to our 7 EcoDrop classes:
COCO_TO_ECODROP = {
    # COCO name:     (EcoDrop class id, EcoDrop class name)
    "bottle":        (4, "plastic_bottle"),
    "cup":           (4, "plastic_bottle"),
    "cell phone":    (6, "mobile_phone"),
    "mouse":         (5, "mouse"),
    "keyboard":      (5, "mouse"),   # nearest match we have
    "book":          (1, "book"),
    "scissors":      (0, "pen"),
    "laptop":        (6, "mobile_phone"),  # reclassify as mobile
    "remote":        (3, "wire_cable"),
    "backpack":      (2, "cardboard"),   # fallback
}

def auto_label_with_coco(img_dir: Path, label_dir: Path, split: str = "train"):
    """Use base YOLO COCO model to auto-generate YOLO labels for our classes."""
    base_model = YOLO("yolo11n.pt")   # pretrained COCO yolov11 nano
    
    img_dir = img_dir / split
    label_dir = label_dir / split
    
    if not img_dir.exists():
        print(f"No images found in {img_dir}")
        return
    
    imgs = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.png")) + list(img_dir.glob("*.jpeg"))
    print(f"Auto-labeling {len(imgs)} images in {split}...")
    
    labeled = 0
    for img_path in imgs:
        results = base_model(str(img_path), verbose=False)[0]
        label_path = label_dir / (img_path.stem + ".txt")
        
        lines = []
        for box in results.boxes:
            cls_id   = int(box.cls.item())
            coco_name = results.names[cls_id]
            
            if coco_name in COCO_TO_ECODROP:
                eco_cls_id, eco_name = COCO_TO_ECODROP[coco_name]
                conf = float(box.conf.item())
                if conf < 0.35:
                    continue    # skip low confidence
                
                # Convert from xyxy to YOLO xywh normalized
                x1, y1, x2, y2 = box.xyxyn[0].tolist()
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2
                w  = x2 - x1
                h  = y2 - y1
                lines.append(f"{eco_cls_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
        
        if lines:
            with open(label_path, "w") as f:
                f.write("\n".join(lines))
            labeled += 1
    
    print(f"  ✅ Auto-labeled {labeled}/{len(imgs)} images")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 7: Download public domain images (no Roboflow key needed)
# ─────────────────────────────────────────────────────────────────────────────
import urllib.request, json, random, time
from pathlib import Path

def download_open_images(class_query: str, target_dir: Path, count: int = 80):
    """
    Download images from OpenImages / COCO-style public sources.
    Uses Ultralytics dataset download utilities.
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {count} images for '{class_query}' → {target_dir}")
    
    # Use DuckDuckGo image search (public, no key needed)
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.images(class_query + " recycling isolated white background", max_results=count))
        
        downloaded = 0
        for i, r in enumerate(results):
            try:
                url = r["image"]
                ext = url.split(".")[-1].lower().split("?")[0]
                if ext not in ["jpg", "jpeg", "png"]:
                    ext = "jpg"
                fname = target_dir / f"{class_query.replace(' ', '_')}_{i:04d}.{ext}"
                urllib.request.urlretrieve(url, fname)
                downloaded += 1
                if downloaded % 20 == 0:
                    print(f"  {downloaded}/{count} downloaded...")
                time.sleep(0.3)   # polite rate limit
            except Exception:
                pass
        print(f"  ✅ Downloaded {downloaded} images")
    except Exception as e:
        print(f"  ⚠️ Download failed: {e}. Proceed with manual upload.")

# Only run if duckduckgo_search is installed
try:
    !pip install duckduckgo-search -q
    # Download images for each class
    img_train = DATASET_ROOT / "images" / "train"
    img_val   = DATASET_ROOT / "images" / "val"
    
    QUERIES = {
        "pen":            ("pen marker stationery", 100),
        "book":           ("textbook notebook book", 100),
        "cardboard":      ("cardboard box packaging", 100),
        "wire_cable":     ("usb cable charger adapter wire", 100),
        "plastic_bottle": ("plastic bottle recycling", 100),
        "mouse":          ("computer mouse optical", 100),
        "mobile_phone":   ("smartphone mobile phone", 100),
    }
    
    for cls_name, (query, count) in QUERIES.items():
        cls_dir = img_train / cls_name
        download_open_images(query, cls_dir, count)
except Exception as e:
    print(f"Skipping auto-download: {e}")
    print("Manually upload your images (50-100 per class) to datasets/ecodrop_v2/images/train/")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 8: Flatten any class-subfoldered images to flat train/ folder with labels
# ─────────────────────────────────────────────────────────────────────────────
# If images are in subfolders by class name, create YOLO labels and flatten them.

from PIL import Image as PILImage

def create_labels_from_class_folders(split="train"):
    """
    For images in datasets/ecodrop_v2/images/train/<classname>/*.jpg
    creates a corresponding label file treating the whole image as one bounding box.
    Then moves everything to flat images/train/ and labels/train/
    """
    img_split = DATASET_ROOT / "images" / split
    lbl_split = DATASET_ROOT / "labels" / split
    
    for cls_idx, cls_name in enumerate(FINAL_CLASSES):
        cls_dir = img_split / cls_name
        if not cls_dir.exists():
            continue
        
        imgs = list(cls_dir.glob("*.jpg")) + list(cls_dir.glob("*.png")) + list(cls_dir.glob("*.jpeg"))
        print(f"  Processing {len(imgs)} images for class {cls_name} (id={cls_idx})")
        
        for img_path in imgs:
            # Create a full-image bounding box label (0 0.5 0.5 1.0 1.0 = center, full size)
            dest_img = img_split / img_path.name
            dest_lbl = lbl_split / (img_path.stem + ".txt")
            
            # Skip if filename collision
            if dest_img.exists():
                img_path = img_path.rename(img_path.parent / (cls_name + "_" + img_path.name))
                dest_img = img_split / img_path.name
                dest_lbl = lbl_split / (img_path.stem + ".txt")
            
            shutil.move(str(img_path), str(dest_img))
            with open(dest_lbl, "w") as f:
                f.write(f"{cls_idx} 0.500000 0.500000 1.000000 1.000000\n")

print("Creating labels from class subfolders...")
create_labels_from_class_folders("train")
create_labels_from_class_folders("val")
print("✅ Labels created")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 9: Train-val split (if you only have train images)
# ─────────────────────────────────────────────────────────────────────────────
def train_val_split(val_ratio=0.20, seed=42):
    """Move val_ratio of training images+labels into val/ folders."""
    random.seed(seed)
    
    img_train = DATASET_ROOT / "images" / "train"
    lbl_train = DATASET_ROOT / "labels" / "train"
    img_val   = DATASET_ROOT / "images" / "val"
    lbl_val   = DATASET_ROOT / "labels" / "val"
    
    imgs = [f for f in img_train.iterdir() if f.suffix.lower() in [".jpg", ".jpeg", ".png"]]
    val_imgs = random.sample(imgs, int(len(imgs) * val_ratio))
    
    for img in val_imgs:
        lbl = lbl_train / (img.stem + ".txt")
        shutil.move(str(img), str(img_val / img.name))
        if lbl.exists():
            shutil.move(str(lbl), str(lbl_val / lbl.name))
    
    print(f"✅ Split done: {len(imgs) - len(val_imgs)} train, {len(val_imgs)} val")

train_val_split()

# ─────────────────────────────────────────────────────────────────────────────
# CELL 10: TRAIN YOLOv11 — the actual training
# ─────────────────────────────────────────────────────────────────────────────
from ultralytics import YOLO

# Use YOLOv11 nano — smallest, fastest, perfect for Raspberry Pi 5
# yolo11n.pt = 2.6M params, runs at ~40ms per frame on Pi 5
model = YOLO("yolo11n.pt")

results = model.train(
    data=str(yaml_path),
    epochs=100,            # 100 epochs for good accuracy
    imgsz=640,             # 640x640 input resolution
    batch=16,              # batch size — reduce to 8 if Colab runs out of RAM
    patience=20,           # early stopping patience
    device=0,              # GPU (Colab has T4 GPU = fast). Change to "cpu" if no GPU.
    workers=4,
    project="runs",
    name="ecodrop_yolo11n",
    exist_ok=True,
    pretrained=True,       # transfer learning from COCO pretrained weights
    optimizer="AdamW",
    lr0=0.001,
    lrf=0.01,
    cos_lr=True,           # cosine LR schedule
    weight_decay=0.0005,
    # ── Augmentations (helps a lot with small datasets) ─────────────
    hsv_h=0.015,           # hue shift
    hsv_s=0.7,             # saturation
    hsv_v=0.4,             # value (brightness)
    degrees=10.0,          # rotation ±10°
    translate=0.1,         # translate ±10%
    scale=0.5,             # scale ±50%
    flipud=0.0,            # no vertical flip (objects have orientation)
    fliplr=0.5,            # horizontal flip 50%
    mosaic=1.0,            # mosaic augmentation
    mixup=0.1,             # mixup augmentation
    copy_paste=0.1,        # copy-paste augmentation (good for small objects)
    # ── Anchor-free (YOLOv11 is anchor-free by default) ─────────────
    close_mosaic=10,       # disable mosaic last 10 epochs for stability
    label_smoothing=0.05,  # label smoothing for generalization
    verbose=True,
)

print("\n🎉 Training complete!")
print(f"Best mAP50: {results.results_dict.get('metrics/mAP50(B)', 0):.3f}")
print(f"Best mAP50-95: {results.results_dict.get('metrics/mAP50-95(B)', 0):.3f}")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 11: Validate and inspect results
# ─────────────────────────────────────────────────────────────────────────────
best_model = YOLO("runs/ecodrop_yolo11n/weights/best.pt")
metrics = best_model.val(data=str(yaml_path))

print("\n📊 Per-class results:")
for i, cls in enumerate(FINAL_CLASSES):
    if i < len(metrics.box.ap50):
        print(f"   {cls:<18} mAP50={metrics.box.ap50[i]:.3f}")

print(f"\n🏆 Overall mAP50:    {metrics.box.map50:.3f}")
print(f"🏆 Overall mAP50-95: {metrics.box.map:.3f}")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 12: Export to ONNX (for fastest inference on Raspberry Pi 5)
# ─────────────────────────────────────────────────────────────────────────────
print("\n📦 Exporting to ONNX...")
onnx_path = best_model.export(
    format="onnx",
    imgsz=640,
    simplify=True,
    opset=17,
    dynamic=False,
    half=False,     # Pi 5 CPU doesn't support FP16
)
print(f"✅ ONNX model: {onnx_path}")

# Also keep PyTorch format for Ultralytics API
print("\n📦 Models ready for Pi:")
print(f"   PyTorch (.pt):  runs/ecodrop_yolo11n/weights/best.pt")
print(f"   ONNX (.onnx):   {onnx_path}")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 13: Download model to your computer
# ─────────────────────────────────────────────────────────────────────────────
# Run this in Colab to download the trained model:
from google.colab import files
import shutil

# Create a zip with both formats
shutil.copy("runs/ecodrop_yolo11n/weights/best.pt", "ecodrop_yolo11n.pt")
files.download("ecodrop_yolo11n.pt")

# Optionally download ONNX too
# files.download("runs/ecodrop_yolo11n/weights/best.onnx")

print("✅ Download triggered — check your browser Downloads folder!")
print("\nNext: copy ecodrop_yolo11n.pt to ~/pi/models/ on your Pi")
