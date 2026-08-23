import time
from typing import Dict, Any, List, Optional
from collections import defaultdict
from app.core.config import settings

class TemporalTracker:
    """
    Tracks session anomalies across consecutive frames to prevent false positive bursts.
    Maintains per-session violation counters, cooldowns, and event states.
    """
    def __init__(self):
        # sessionId -> eventType -> count of consecutive frames
        self.violation_counts = defaultdict(lambda: defaultdict(int))
        # sessionId -> eventType -> timestamp of last fired event
        self.last_event_times = defaultdict(lambda: defaultdict(float))

    def evaluate_signals(
        self,
        session_id: str,
        face_missing: bool,
        multiple_faces: bool,
        phone_detected: bool,
        looking_away: bool = False,
        camera_blocked: bool = False,
        confidence_map: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        now = time.time()
        confirmed_events = []
        conf_map = confidence_map or {}

        signals = {
            "PHONE_DETECTED": phone_detected,
            "MULTIPLE_FACES": multiple_faces,
            "CAMERA_BLOCKED": camera_blocked,
            "FACE_MISSING": face_missing,
            "EXCESSIVE_LOOKING_AWAY": looking_away,
        }

        # Cooldown intervals in seconds from specification
        cooldowns = {
            "PHONE_DETECTED": 20,
            "MULTIPLE_FACES": 20,
            "CAMERA_BLOCKED": 60,
            "FACE_MISSING": 15,
            "EXCESSIVE_LOOKING_AWAY": 30,
        }

        # Consecutive frames required before trigger
        trigger_thresholds = {
            "PHONE_DETECTED": 2,
            "MULTIPLE_FACES": 3,
            "CAMERA_BLOCKED": 3,
            "FACE_MISSING": 4,
            "EXCESSIVE_LOOKING_AWAY": 4,
        }

        for event_type, is_active in signals.items():
            if is_active:
                self.violation_counts[session_id][event_type] += 1
                threshold = trigger_thresholds.get(event_type, settings.TEMPORAL_CONFIRMATION_FRAMES)
                
                # Check if threshold reached
                if self.violation_counts[session_id][event_type] >= threshold:
                    last_fired = self.last_event_times[session_id][event_type]
                    cooldown = cooldowns.get(event_type, 15)

                    # Only emit if outside cooldown period
                    if now - last_fired >= cooldown:
                        self.last_event_times[session_id][event_type] = now
                        risk_score = settings.RISK_WEIGHTS.get(event_type, 10)
                        confidence = conf_map.get(event_type, 0.85)

                        confirmed_events.append({
                            "event_type": event_type,
                            "risk_weight": risk_score,
                            "confidence": confidence,
                            "consecutive_frames": self.violation_counts[session_id][event_type],
                            "timestamp": now,
                        })
            else:
                # Reset consecutive count when condition clears
                self.violation_counts[session_id][event_type] = 0

        return confirmed_events

    def clear_session(self, session_id: str):
        if session_id in self.violation_counts:
            del self.violation_counts[session_id]
        if session_id in self.last_event_times:
            del self.last_event_times[session_id]

temporal_tracker = TemporalTracker()
