import numpy as np
from typing import List, Dict, Any
from app.core.config import settings

class ObjectDetector:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.YOLO_MODEL
        self._model = None
        try:
            from ultralytics import YOLO
            self._model = YOLO(self.model_name)
            print(f"✅ YOLO model '{self.model_name}' successfully loaded and ready for inference!")
        except Exception as e:
            print(f"⚠️ Warning: YOLO model '{self.model_name}' could not be loaded: {e}")

    @property
    def model(self):
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

        # Run YOLO with lower internal threshold to capture candidates
        results = self.model(frame, conf=0.25, verbose=False)
        detections = []
        phone_detected = False
        person_count = 0

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                class_name = self.model.names.get(cls_id, "").lower()

                is_phone = "phone" in class_name or "cell" in class_name
                is_person = class_name == "person"
                is_laptop = class_name == "laptop"
                is_book = class_name == "book"

                if is_phone or is_person or is_laptop or is_book:
                    threshold = (
                        settings.PHONE_CONF_THRESHOLD
                        if is_phone
                        else settings.PERSON_CONF_THRESHOLD
                    )

                    if conf >= threshold:
                        xyxy = box.xyxy[0].tolist()
                        detection_info = {
                            "label": "cell phone" if is_phone else class_name,
                            "confidence": round(conf, 3),
                            "box": {
                                "x1": int(xyxy[0]),
                                "y1": int(xyxy[1]),
                                "x2": int(xyxy[2]),
                                "y2": int(xyxy[3]),
                            }
                        }
                        detections.append(detection_info)

                        if is_phone:
                            phone_detected = True
                        elif is_person:
                            person_count += 1

        return {
            "phone_detected": phone_detected,
            "person_count": person_count,
            "detections": detections
        }
