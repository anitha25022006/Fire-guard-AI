from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import base64

from app.api.detection.detector import detect_image


app = FastAPI(
    title="FireGuard AI Live Detection API",
    description="Live fire, smoke and person detection system",
    version="2.0.0"
)


# ==============================
# CORS
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# HOME
# ==============================

@app.get("/")
def home():

    return {
        "message": "FireGuard AI Live Detection API is running"
    }


# ==============================
# HEALTH CHECK
# ==============================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# ==============================
# IMAGE DETECTION
# ==============================

@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    image_bytes = await file.read()

    try:

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

    except Exception:

        return {
            "success": False,
            "error": "Invalid image file"
        }

    try:

        result = detect_image(image)

        return {
            "success": True,
            **result
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


# ==============================
# LIVE WEBSOCKET DETECTION
# ==============================

@app.websocket("/ws/live")
async def live_detection(websocket: WebSocket):

    await websocket.accept()

    print("Live camera connected")

    try:

        while True:

            # Receive frame from React
            data = await websocket.receive_text()

            try:

                # Remove:
                # data:image/jpeg;base64,
                if "," in data:

                    data = data.split(",", 1)[1]


                # Base64 → bytes
                image_bytes = base64.b64decode(data)


                # Bytes → PIL image
                image = Image.open(
                    io.BytesIO(image_bytes)
                ).convert("RGB")


                # Run YOLO detection
                result = detect_image(image)


                # Send result to React
                response = {

                    "success": True,

                    "person_count":
                        result.get(
                            "person_count",
                            0
                        ),

                    "fire_detected":
                        result.get(
                            "fire_detected",
                            False
                        ),

                    "smoke_detected":
                        result.get(
                            "smoke_detected",
                            False
                        ),

                    "person_detections":
                        result.get(
                            "person_detections",
                            []
                        ),

                    "fire_detections":
                        result.get(
                            "fire_detections",
                            []
                        )
                }


                await websocket.send_json(
                    response
                )


            except Exception as e:

                print(
                    "Frame detection error:",
                    e
                )

                await websocket.send_json({

                    "success": False,

                    "error": str(e)

                })


    except WebSocketDisconnect:

        print(
            "Live camera disconnected"
        )


    except Exception as e:

        print(
            "WebSocket error:",
            e
        )


# ==============================
# RUN
# ==============================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )