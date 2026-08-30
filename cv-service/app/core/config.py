import os

class Settings:
    PROJECT_NAME: str = "ExamGuard AI - CV Microservice"
    API_V1_STR: str = "/cv/v1"
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Model configs
    YOLO_MODEL: str = os.getenv("YOLO_MODEL", "yolov8n.pt")
    PHONE_CONF_THRESHOLD: float = float(os.getenv("PHONE_CONF_THRESHOLD", 0.30))
    PERSON_CONF_THRESHOLD: float = float(os.getenv("PERSON_CONF_THRESHOLD", 0.45))
    
    # Temporal confirmation window (number of consecutive violations before triggering event)
    TEMPORAL_CONFIRMATION_FRAMES: int = int(os.getenv("TEMPORAL_CONFIRMATION_FRAMES", 3))
    
    # Audio anomaly detection configs
    AUDIO_SAMPLE_RATE: int = int(os.getenv("AUDIO_SAMPLE_RATE", 16000))
    AUDIO_SILENCE_THRESHOLD_DB: float = float(os.getenv("AUDIO_SILENCE_THRESHOLD_DB", -42.0))
    AUDIO_SPEECH_THRESHOLD_DB: float = float(os.getenv("AUDIO_SPEECH_THRESHOLD_DB", -32.0))
    AUDIO_BURST_THRESHOLD_DB: float = float(os.getenv("AUDIO_BURST_THRESHOLD_DB", -12.0))

    # Risk weights as specified in documentation
    RISK_WEIGHTS = {
        "PHONE_DETECTED": 40,
        "MULTIPLE_FACES": 30,
        "CAMERA_DISABLED": 30,
        "CAMERA_BLOCKED": 30,
        "VOICE_DETECTED": 20,
        "UNUSUAL_AUDIO_BURST": 15,
        "FACE_MISSING": 15,
        "EXCESSIVE_LOOKING_AWAY": 10,
        "TAB_FOCUS_LOST": 10,
        "NETWORK_DISCONNECTED": 5,
    }

settings = Settings()
