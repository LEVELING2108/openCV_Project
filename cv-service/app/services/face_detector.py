import cv2
import numpy as np
from typing import List, Dict, Any

class FaceDetector:
    def __init__(self):
        # Load multiple OpenCV cascades for robust multi-angle and lighting detection
        self.frontal_default = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.frontal_alt2 = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
        self.profile = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    def detect_faces(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Robust multi-stage face detection using cascaded OpenCV classifiers with adaptive contrast.
        Returns face count, bounding boxes, and status flags.
        """
        if frame is None or frame.size == 0:
            return {
                "face_count": 0,
                "boxes": [],
                "face_missing": True,
                "multiple_faces": False,
            }

        # Convert to grayscale
        if len(frame.shape) == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame.copy()

        # Pass 1: Standard Histogram Equalization with Primary Frontal Cascade
        gray_eq = cv2.equalizeHist(gray)
        faces = self.frontal_default.detectMultiScale(
            gray_eq,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        # Pass 2: If no face found, try Frontal Alt2 (higher recall for tilted/softer faces)
        if len(faces) == 0:
            faces = self.frontal_alt2.detectMultiScale(
                gray_eq,
                scaleFactor=1.08,
                minNeighbors=3,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )

        # Pass 3: If still no face found, try CLAHE (Adaptive Histogram Equalization)
        if len(faces) == 0:
            gray_clahe = self.clahe.apply(gray)
            faces = self.frontal_alt2.detectMultiScale(
                gray_clahe,
                scaleFactor=1.08,
                minNeighbors=3,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )

        # Pass 4: Check for Profile Face (if user is turned sideways)
        if len(faces) == 0:
            faces = self.profile.detectMultiScale(
                gray_eq,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(30, 30),
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
