import cv2
import numpy as np
from typing import Dict, Any, Tuple

class PoseAndQualityDetector:
    """
    Analyzes camera stream quality (occlusion, darkness, blur)
    and estimates approximate head orientation (looking away detection).
    """
    def __init__(self):
        # Load Haar cascade for eye detection within face region
        eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
        self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)

    def check_camera_quality(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Check if camera is blocked, extremely dark, or obstructed.
        """
        if frame is None or frame.size == 0:
            return {"camera_blocked": True, "reason": "Empty frame"}

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # 1. Mean brightness
        mean_brightness = np.mean(gray)
        if mean_brightness < 12:  # Extremely dark / covered lens
            return {
                "camera_blocked": True,
                "reason": "Excessive darkness or covered camera",
                "brightness": round(float(mean_brightness), 2),
            }

        # 2. Variance of Laplacian (focus/contrast check for solid obstruction)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 5.0:  # Flat image, likely obstructed by object
            return {
                "camera_blocked": True,
                "reason": "Camera lens obstructed or solid color cover",
                "laplacian_var": round(float(laplacian_var), 2),
            }

        return {
            "camera_blocked": False,
            "brightness": round(float(mean_brightness), 2),
            "laplacian_var": round(float(laplacian_var), 2),
        }

    def estimate_looking_away(self, frame: np.ndarray, face_box: Dict[str, int]) -> Dict[str, Any]:
        """
        Estimates gaze & head orientation using eye positioning relative to face bounding box.
        """
        if not face_box or frame is None:
            return {"looking_away": False, "yaw_offset": 0.0}

        x = face_box["x"]
        y = face_box["y"]
        w = face_box["width"]
        h = face_box["height"]

        # Extract face ROI
        face_roi = frame[y:y+h, x:x+w]
        if face_roi.size == 0:
            return {"looking_away": False, "yaw_offset": 0.0}

        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        eyes = self.eye_cascade.detectMultiScale(gray_roi, scaleFactor=1.1, minNeighbors=4, minSize=(15, 15))

        if len(eyes) == 0:
            # If face is detected but zero eyes visible, head is likely turned significantly
            return {
                "looking_away": True,
                "confidence": 0.75,
                "reason": "Eyes not visible (significant head rotation)",
            }

        # If eyes are detected, check their horizontal centroid relative to face center
        eye_centers = []
        for (ex, ey, ew, eh) in eyes:
            eye_centers.append(ex + ew / 2.0)

        avg_eye_x = sum(eye_centers) / len(eye_centers)
        face_center_x = w / 2.0
        yaw_offset = (avg_eye_x - face_center_x) / (w / 2.0)

        # Significant deviation left or right
        if abs(yaw_offset) > 0.45:
            return {
                "looking_away": True,
                "confidence": 0.85,
                "yaw_offset": round(float(yaw_offset), 2),
                "reason": "Head orientation deviated from screen",
            }

        return {
            "looking_away": False,
            "yaw_offset": round(float(yaw_offset), 2),
        }
