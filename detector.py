from pathlib import Path
from ultralytics import YOLO


# =========================================================
# PROJECT PATHS
# =========================================================

PROJECT_DIR = Path(__file__).resolve().parents[3]

# Person model
PERSON_MODEL_PATH = PROJECT_DIR / "backend" / "yolo11n.pt"

# Fire + Smoke model
FIRE_MODEL_PATH = (
    PROJECT_DIR.parent
    / "fire-person-detection"
    / "models"
    / "fire-smoke"
    / "best.pt"
)


# =========================================================
# LOAD PERSON MODEL
# =========================================================

print("Loading person model...")
print("Person model:", PERSON_MODEL_PATH)

if not PERSON_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Person model not found: {PERSON_MODEL_PATH}"
    )

person_model = YOLO(str(PERSON_MODEL_PATH))

print("Person model loaded successfully!")


# =========================================================
# LOAD FIRE / SMOKE MODEL
# =========================================================

print("Loading fire/smoke model...")
print("Fire model:", FIRE_MODEL_PATH)

if not FIRE_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Fire/Smoke model not found: {FIRE_MODEL_PATH}"
    )

fire_model = YOLO(str(FIRE_MODEL_PATH))

print("Fire/Smoke model loaded successfully!")
print("Fire/Smoke classes:", fire_model.names)


# =========================================================
# DETECTION FUNCTION
# =========================================================

def detect_image(image):

    # =====================================================
    # PERSON DETECTION
    # =====================================================

    person_results = person_model(
        image,
        conf=0.25,
        classes=[0]
    )

    person_count = 0
    person_detections = []

    for result in person_results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            confidence = float(box.conf[0])

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            person_count += 1

            person_detections.append({
                "class": "person",
                "confidence": round(confidence, 3),
                "box": [x1, y1, x2, y2]
            })


    # =====================================================
    # FIRE / SMOKE DETECTION
    # =====================================================

    fire_results = fire_model(
        image,
        conf=0.25
    )

    fire_detected = False
    smoke_detected = False

    fire_detections = []

    for result in fire_results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            confidence = float(box.conf[0])

            class_id = int(box.cls[0])

            class_name = fire_model.names[class_id]

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            detection = {
                "class": class_name,
                "confidence": round(confidence, 3),
                "box": [x1, y1, x2, y2]
            }

            fire_detections.append(detection)

            if class_name == "fire":
                fire_detected = True

            elif class_name == "smoke":
                smoke_detected = True


    # =====================================================
    # FINAL RESULT
    # =====================================================

    return {
        "success": True,

        "person_count": person_count,

        "fire_detected": fire_detected,

        "smoke_detected": smoke_detected,

        "person_detections": person_detections,

        "fire_detections": fire_detections
    }