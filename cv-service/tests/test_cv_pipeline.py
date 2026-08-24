import unittest
import numpy as np
import base64
import cv2
from fastapi.testclient import TestClient

from app.main import app
from app.services.face_detector import FaceDetector
from app.services.pose_and_quality_detector import PoseAndQualityDetector
from app.services.temporal_tracker import TemporalTracker

class TestCVPipeline(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.face_detector = FaceDetector()
        self.quality_detector = PoseAndQualityDetector()
        self.tracker = TemporalTracker()

    def test_health_endpoint(self):
        response = self.client.get("/cv/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("models", data)

    def test_empty_frame_face_detection(self):
        # Blank black frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = self.face_detector.detect_faces(frame)
        self.assertEqual(result["face_count"], 0)
        self.assertTrue(result["face_missing"])
        self.assertFalse(result["multiple_faces"])

    def test_camera_quality_detection(self):
        # Pitch black frame should be detected as blocked / low light
        dark_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = self.quality_detector.check_camera_quality(dark_frame)
        self.assertTrue(result["camera_blocked"])

        # Normal textured frame should pass
        normal_frame = np.random.randint(50, 200, (480, 640, 3), dtype=np.uint8)
        normal_result = self.quality_detector.check_camera_quality(normal_frame)
        self.assertFalse(normal_result["camera_blocked"])

    def test_temporal_tracker_phone_alert(self):
        session_id = "test_sess_001"
        self.tracker.clear_session(session_id)

        # First detection of phone should trigger confirmed event
        events = self.tracker.evaluate_signals(
            session_id=session_id,
            face_missing=False,
            multiple_faces=False,
            phone_detected=True,
            confidence_map={"PHONE_DETECTED": 0.92}
        )
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_type"], "PHONE_DETECTED")
        self.assertEqual(events[0]["risk_weight"], 40)

        # Immediate second evaluation should be suppressed by cooldown
        events_cooldown = self.tracker.evaluate_signals(
            session_id=session_id,
            face_missing=False,
            multiple_faces=False,
            phone_detected=True
        )
        self.assertEqual(len(events_cooldown), 0)

    def test_analyze_frame_api(self):
        # Create a sample test frame encoded as base64
        test_frame = np.full((300, 300, 3), 128, dtype=np.uint8)
        _, buffer = cv2.imencode('.jpg', test_frame)
        base64_str = base64.b64encode(buffer).decode('utf-8')

        payload = {
            "session_id": "test_api_session",
            "image_base64": f"data:image/jpeg;base64,{base64_str}"
        }

        response = self.client.post("/cv/v1/analyze/frame", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("face_count", data)
        self.assertIn("phone_detected", data)

if __name__ == "__main__":
    unittest.main()
