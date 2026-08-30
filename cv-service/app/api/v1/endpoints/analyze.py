import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.services.face_detector import FaceDetector
from app.services.object_detector import ObjectDetector
from app.services.pose_and_quality_detector import PoseAndQualityDetector
from app.services.audio_detector import audio_detector
from app.services.temporal_tracker import temporal_tracker
from app.core.config import settings

router = APIRouter()

face_detector = FaceDetector()
object_detector = ObjectDetector()
pose_quality_detector = PoseAndQualityDetector()

class FrameAnalysisRequest(BaseModel):
    session_id: str = Field(..., description="Unique exam session identifier")
    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG frame")
    audio_base64: Optional[str] = Field(None, description="Optional Base64-encoded WAV/PCM audio chunk")
    student_id: Optional[str] = None
    exam_id: Optional[str] = None

class AudioAnalysisRequest(BaseModel):
    session_id: str = Field(..., description="Unique exam session identifier")
    audio_base64: str = Field(..., description="Base64-encoded WAV or PCM 16-bit audio chunk")
    sample_rate: Optional[int] = Field(16000, description="Sampling rate in Hz")
    student_id: Optional[str] = None
    exam_id: Optional[str] = None

class DetectionItem(BaseModel):
    label: str
    confidence: float
    box: Dict[str, int]

class ConfirmedEvent(BaseModel):
    event_type: str
    risk_weight: int
    confidence: float
    consecutive_frames: int
    timestamp: float

class AudioAnalysisResponse(BaseModel):
    session_id: str
    voice_detected: bool
    speech_confidence: float
    audio_burst: bool
    rms_db: float
    zero_crossing_rate: float
    voice_band_ratio: float
    ambient_noise_level: str
    anomaly_flags: List[str]
    confirmed_events: List[ConfirmedEvent]
    status: str

class FrameAnalysisResponse(BaseModel):
    session_id: str
    face_count: int
    face_missing: bool
    multiple_faces: bool
    phone_detected: bool
    looking_away: bool
    camera_blocked: bool
    voice_detected: bool = False
    audio_burst: bool = False
    rms_db: Optional[float] = None
    detections: List[DetectionItem]
    confirmed_events: List[ConfirmedEvent]
    status: str

def decode_base64_image(base64_str: str) -> np.ndarray:
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        image_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Decoded frame is empty")
        return frame
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format or decoding failed: {str(e)}")

@router.post("/analyze/frame", response_model=FrameAnalysisResponse)
async def analyze_frame(payload: FrameAnalysisRequest):
    frame = decode_base64_image(payload.image_base64)

    # 1. Camera Quality & Occlusion Check
    quality_result = pose_quality_detector.check_camera_quality(frame)
    camera_blocked = quality_result["camera_blocked"]

    # 2. Fast OpenCV Face Detection
    face_results = face_detector.detect_faces(frame)
    face_missing = face_results["face_missing"]
    multiple_faces = face_results["multiple_faces"]

    # 3. Head Pose / Looking Away Deviation
    looking_away = False
    if face_results["face_count"] == 1:
        pose_result = pose_quality_detector.estimate_looking_away(frame, face_results["boxes"][0])
        looking_away = pose_result.get("looking_away", False)

    # 4. YOLO Object & Person Detection
    obj_results = object_detector.detect_objects(frame)
    phone_detected = obj_results["phone_detected"]
    if obj_results["person_count"] > 1:
        multiple_faces = True

    # 5. Optional Audio Chunk Analysis in Frame Request
    voice_detected = False
    audio_burst = False
    rms_db = None
    confidence_map = {}

    if payload.audio_base64:
        audio_res = audio_detector.analyze_audio(payload.audio_base64)
        voice_detected = audio_res["voice_detected"]
        audio_burst = audio_res["audio_burst"]
        rms_db = audio_res["rms_db"]
        if voice_detected:
            confidence_map["VOICE_DETECTED"] = audio_res["speech_confidence"]
        if audio_burst:
            confidence_map["UNUSUAL_AUDIO_BURST"] = 0.90

    if phone_detected:
        for d in obj_results["detections"]:
            if d["label"] == "cell phone":
                confidence_map["PHONE_DETECTED"] = d["confidence"]
    if looking_away:
        confidence_map["EXCESSIVE_LOOKING_AWAY"] = 0.85
    if camera_blocked:
        confidence_map["CAMERA_BLOCKED"] = 0.95

    # 6. Temporal Confirmation & Cooldowns
    confirmed = temporal_tracker.evaluate_signals(
        session_id=payload.session_id,
        face_missing=face_missing,
        multiple_faces=multiple_faces,
        phone_detected=phone_detected,
        looking_away=looking_away,
        camera_blocked=camera_blocked,
        voice_detected=voice_detected,
        audio_burst=audio_burst,
        confidence_map=confidence_map
    )

    formatted_detections = [
        DetectionItem(label=d["label"], confidence=d["confidence"], box=d["box"])
        for d in obj_results["detections"]
    ]

    formatted_events = [
        ConfirmedEvent(
            event_type=e["event_type"],
            risk_weight=e["risk_weight"],
            confidence=e["confidence"],
            consecutive_frames=e["consecutive_frames"],
            timestamp=e["timestamp"]
        )
        for e in confirmed
    ]

    return FrameAnalysisResponse(
        session_id=payload.session_id,
        face_count=face_results["face_count"],
        face_missing=face_missing,
        multiple_faces=multiple_faces,
        phone_detected=phone_detected,
        looking_away=looking_away,
        camera_blocked=camera_blocked,
        voice_detected=voice_detected,
        audio_burst=audio_burst,
        rms_db=rms_db,
        detections=formatted_detections,
        confirmed_events=formatted_events,
        status="success"
    )

@router.post("/analyze/audio", response_model=AudioAnalysisResponse)
async def analyze_audio_chunk(payload: AudioAnalysisRequest):
    """
    Dedicated endpoint for analyzing streaming audio chunks from candidate microphones.
    Evaluates speech presence, decibel levels, and spectral anomalies.
    """
    audio_res = audio_detector.analyze_audio(
        payload.audio_base64,
        sample_rate_override=payload.sample_rate
    )

    confidence_map = {}
    if audio_res["voice_detected"]:
        confidence_map["VOICE_DETECTED"] = audio_res["speech_confidence"]
    if audio_res["audio_burst"]:
        confidence_map["UNUSUAL_AUDIO_BURST"] = 0.90

    confirmed = temporal_tracker.evaluate_signals(
        session_id=payload.session_id,
        face_missing=False,
        multiple_faces=False,
        phone_detected=False,
        looking_away=False,
        camera_blocked=False,
        voice_detected=audio_res["voice_detected"],
        audio_burst=audio_res["audio_burst"],
        confidence_map=confidence_map
    )

    formatted_events = [
        ConfirmedEvent(
            event_type=e["event_type"],
            risk_weight=e["risk_weight"],
            confidence=e["confidence"],
            consecutive_frames=e["consecutive_frames"],
            timestamp=e["timestamp"]
        )
        for e in confirmed
    ]

    return AudioAnalysisResponse(
        session_id=payload.session_id,
        voice_detected=audio_res["voice_detected"],
        speech_confidence=audio_res["speech_confidence"],
        audio_burst=audio_res["audio_burst"],
        rms_db=audio_res["rms_db"],
        zero_crossing_rate=audio_res["zero_crossing_rate"],
        voice_band_ratio=audio_res["voice_band_ratio"],
        ambient_noise_level=audio_res["ambient_noise_level"],
        anomaly_flags=audio_res["anomaly_flags"],
        confirmed_events=formatted_events,
        status="success"
    )

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "models": {
            "yolo": settings.YOLO_MODEL,
            "face_cascade": "OpenCV Haar Cascade",
            "eye_cascade": "OpenCV Eye Haar Cascade",
            "audio_analyzer": "FFT + RMS + ZCR VAD Pipeline"
        }
    }
