import io
import wave
import base64
import unittest
import numpy as np
from app.services.audio_detector import AudioDetector, audio_detector
from app.services.temporal_tracker import TemporalTracker

def generate_synthetic_wav_base64(
    frequency: float = 440.0,
    duration_s: float = 1.0,
    sample_rate: int = 16000,
    amplitude: float = 0.5
) -> str:
    """Generates synthetic sine wave in WAV format and returns base64 string."""
    t = np.linspace(0, duration_s, int(sample_rate * duration_s), endpoint=False)
    # Generate speech-like harmonic tone
    signal = amplitude * np.sin(2 * np.pi * frequency * t)
    # Add a formant harmonic
    signal += (amplitude * 0.3) * np.sin(2 * np.pi * (frequency * 2) * t)

    int_signal = (np.clip(signal, -1.0, 1.0) * 32767).astype(np.int16)

    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(int_signal.tobytes())

    return base64.b64encode(buffer.getvalue()).decode('utf-8')

class TestAudioDetector(unittest.TestCase):
    def setUp(self):
        self.detector = AudioDetector(
            sample_rate=16000,
            silence_threshold_db=-42.0,
            speech_threshold_db=-32.0,
            burst_threshold_db=-12.0
        )
        self.tracker = TemporalTracker()

    def test_silence_detection(self):
        """Test with near-silent audio signal."""
        silent_b64 = generate_synthetic_wav_base64(frequency=200, amplitude=0.001)
        result = self.detector.analyze_audio(silent_b64)

        self.assertFalse(result["voice_detected"])
        self.assertFalse(result["audio_burst"])
        self.assertLess(result["rms_db"], -40.0)
        self.assertIn(result["ambient_noise_level"], ["QUIET", "NORMAL"])

    def test_human_voice_band_detection(self):
        """Test with synthetic vocal tone in human speech frequency range (300 Hz)."""
        voice_b64 = generate_synthetic_wav_base64(frequency=300.0, amplitude=0.45)
        result = self.detector.analyze_audio(voice_b64)

        self.assertTrue(result["voice_detected"])
        self.assertGreater(result["speech_confidence"], 0.5)
        self.assertGreater(result["voice_band_ratio"], 0.5)
        self.assertIn("VOICE_ACTIVITY_DETECTED", result["anomaly_flags"])

    def test_high_frequency_non_vocal_noise(self):
        """Test with high-frequency noise (7000 Hz) outside standard vocal band."""
        high_freq_b64 = generate_synthetic_wav_base64(frequency=7000.0, amplitude=0.3)
        result = self.detector.analyze_audio(high_freq_b64)

        # Should NOT classify high-frequency screech as normal human voice
        self.assertLess(result["voice_band_ratio"], 0.3)

    def test_loud_acoustic_burst(self):
        """Test with very loud acoustic burst near 0 dBFS."""
        burst_b64 = generate_synthetic_wav_base64(frequency=500.0, amplitude=0.98)
        result = self.detector.analyze_audio(burst_b64)

        self.assertTrue(result["audio_burst"])
        self.assertIn("UNUSUAL_AUDIO_BURST", result["anomaly_flags"])

    def test_temporal_tracker_audio_cooldown(self):
        """Verify temporal tracker handles VOICE_DETECTED cooldown and confirmation."""
        session_id = "test_audio_session_1"

        # Frame 1: Not yet confirmed (threshold is 2 chunks)
        events_1 = self.tracker.evaluate_signals(
            session_id=session_id,
            face_missing=False,
            multiple_faces=False,
            phone_detected=False,
            voice_detected=True,
            confidence_map={"VOICE_DETECTED": 0.88}
        )
        self.assertEqual(len(events_1), 0)

        # Frame 2: Confirmed after consecutive detection
        events_2 = self.tracker.evaluate_signals(
            session_id=session_id,
            face_missing=False,
            multiple_faces=False,
            phone_detected=False,
            voice_detected=True,
            confidence_map={"VOICE_DETECTED": 0.88}
        )
        self.assertEqual(len(events_2), 1)
        self.assertEqual(events_2[0]["event_type"], "VOICE_DETECTED")
        self.assertEqual(events_2[0]["risk_weight"], 20)

if __name__ == "__main__":
    unittest.main()
