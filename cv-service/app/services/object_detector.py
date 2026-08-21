import numpy as np
from typing import List, Dict, Any
from app.core.config import settings

class ObjectDetector:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.YOLO_MODEL
        self._model = None
        # COCO class IDs: 0: person, 67: cell phone, 63: laptop, 73: book
        self.target_classes = {
            67: "cell phone",
            0: "person",
            63: "laptop",
            73: "book"
        }

    @property
    def model(self):
        if self._model is None:
            try:
                from ultralytics import YOLO
                self._model = YOLO(self.model_name)
            except Exception as e:
                print(f"⚠️ Warning: YOLO model '{self.model_name}' could not be loaded: {e}")
                self._model = None
        return self._model

    def detect_objects(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Run YOLO inference to detect cell phones, laptops, and count people in frame.
        """
        if self.model is None or frame is None or frame.size == 0:
            return {
                "phone_detected": False,
                "person_count": 1,
                "detections": []
            }

        results = self.model(frame, verbose=False)
        detections = []
        phone_detected = False
        person_count = 0

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())

                if cls_id in self.target_classes:
                    label = self.target_classes[cls_id]
                    threshold = (
                        settings.PHONE_CONF_THRESHOLD
                        if label == "cell phone"
                        else settings.PERSON_CONF_THRESHOLD
                    )

                    if conf >= threshold:
                        xyxy = box.xyxy[0].tolist()
                        detection_info = {
                            "label": label,
                            "confidence": round(conf, 3),
                            "box": {
                                "x1": int(xyxy[0]),
                                "y1": int(xyxy[1]),
                                "x2": int(xyxy[2]),
                                "y2": int(xyxy[3]),
                            }
                        }
                        detections.append(detection_info)

                        if label == "cell phone":
                            phone_detected = True
                        elif label == "person":
                            person_count += 1

        return {
            "phone_detected": phone_detected,
            "person_count": person_count,
            "detections": detections
        }
