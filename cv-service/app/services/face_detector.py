import cv2
import numpy as np
from typing import List, Dict, Any

class FaceDetector:
    def __init__(self):
        # Load OpenCV's pre-trained Haar Cascade for fast facial detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def detect_faces(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Fast face detection using OpenCV.
        Returns face count, bounding boxes, and status flags.
        """
        if frame is None or frame.size == 0:
            return {
                "face_count": 0,
                "boxes": [],
                "face_missing": True,
                "multiple_faces": False,
            }

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # Equalize histogram for robustness against varying lighting conditions
        gray = cv2.equalizeHist(gray)

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        face_count = len(faces)
        boxes = []
        for (x, y, w, h) in faces:
            boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            })

        return {
            "face_count": face_count,
            "boxes": boxes,
            "face_missing": (face_count == 0),
            "multiple_faces": (face_count > 1),
        }
