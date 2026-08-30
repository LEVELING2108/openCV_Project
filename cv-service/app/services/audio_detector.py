import io
import wave
import base64
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings

class AudioDetector:
    """
    Acoustic & Voice Anomaly Detection Service.
    Analyzes audio signals for vocal activity, whispered prompts, secondary voices,
    and elevated environmental noise using signal processing (RMS, ZCR, Spectral Energy).
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        silence_threshold_db: float = -42.0,
        speech_threshold_db: float = -32.0,
        burst_threshold_db: float = -12.0
    ):
        self.sample_rate = sample_rate
        self.silence_threshold_db = silence_threshold_db
        self.speech_threshold_db = speech_threshold_db
        self.burst_threshold_db = burst_threshold_db

    def decode_audio_payload(self, audio_base64: str) -> Tuple[np.ndarray, int]:
        """
        Decodes base64-encoded audio (WAV container or raw PCM 16-bit) to normalized float32 numpy array.
        """
        if "," in audio_base64:
            audio_base64 = audio_base64.split(",", 1)[1]

        raw_bytes = base64.b64decode(audio_base64)

        # Check if payload contains WAV header (RIFF)
        if len(raw_bytes) >= 12 and raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WAVE":
            with io.BytesIO(raw_bytes) as wav_file:
                with wave.open(wav_file, 'rb') as wav:
                    sr = wav.getframerate()
                    n_channels = wav.getnchannels()
                    sampwidth = wav.getsampwidth()
                    frames = wav.readframes(wav.getnframes())

                    if sampwidth == 2:
                        dtype = np.int16
                        max_val = 32768.0
                    elif sampwidth == 1:
                        dtype = np.uint8
                        max_val = 128.0
                    elif sampwidth == 4:
                        dtype = np.int32
                        max_val = 2147483648.0
                    else:
                        dtype = np.int16
                        max_val = 32768.0

                    audio_data = np.frombuffer(frames, dtype=dtype).astype(np.float32) / max_val
                    if n_channels > 1:
                        audio_data = audio_data.reshape(-1, n_channels).mean(axis=1)
                    return audio_data, sr
        else:
            # Assume 16-bit linear PCM at default sample rate
            audio_data = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            return audio_data, self.sample_rate

    def compute_rms_db(self, signal: np.ndarray) -> float:
        """Calculates Root Mean Square level in dBFS."""
        if len(signal) == 0:
            return -100.0
        rms = np.sqrt(np.mean(signal ** 2))
        return float(20.0 * np.log10(rms + 1e-9))

    def compute_zcr(self, signal: np.ndarray) -> float:
        """Calculates Zero-Crossing Rate."""
        if len(signal) < 2:
            return 0.0
        signs = np.sign(signal)
        signs[signs == 0] = 1
        zero_crossings = np.sum(np.abs(np.diff(signs))) / (2.0 * len(signal))
        return float(zero_crossings)

    def compute_voice_band_energy_ratio(
        self,
        signal: np.ndarray,
        sample_rate: int,
        voice_low_hz: float = 100.0,
        voice_high_hz: float = 3500.0
    ) -> float:
        """
        Computes the ratio of spectral energy within the typical human vocal range (100Hz - 3500Hz)
        versus total frequency energy.
        """
        if len(signal) < 32:
            return 0.0

        fft_magnitudes = np.abs(np.fft.rfft(signal))
        freqs = np.fft.rfftfreq(len(signal), d=1.0 / sample_rate)

        total_energy = np.sum(fft_magnitudes ** 2) + 1e-9
        voice_mask = (freqs >= voice_low_hz) & (freqs <= voice_high_hz)
        voice_energy = np.sum(fft_magnitudes[voice_mask] ** 2)

        return float(np.clip(voice_energy / total_energy, 0.0, 1.0))

    def analyze_audio(
        self,
        audio_payload: str,
        sample_rate_override: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyzes audio chunk and returns vocal presence confidence, RMS decibels, and anomaly flags.
        """
        try:
            signal, detected_sr = self.decode_audio_payload(audio_payload)
            sr = sample_rate_override or detected_sr or self.sample_rate

            if len(signal) == 0:
                return {
                    "voice_detected": False,
                    "speech_confidence": 0.0,
                    "audio_burst": False,
                    "rms_db": -100.0,
                    "zero_crossing_rate": 0.0,
                    "voice_band_ratio": 0.0,
                    "ambient_noise_level": "SILENT",
                    "anomaly_flags": []
                }

            rms_db = self.compute_rms_db(signal)
            zcr = self.compute_zcr(signal)
            voice_ratio = self.compute_voice_band_energy_ratio(signal, sr)

            anomaly_flags = []
            voice_detected = False
            speech_confidence = 0.0
            audio_burst = False

            # Environmental Ambient Noise Classification
            if rms_db < self.silence_threshold_db:
                ambient_level = "QUIET"
            elif rms_db < self.speech_threshold_db:
                ambient_level = "NORMAL"
            elif rms_db < self.burst_threshold_db:
                ambient_level = "ELEVATED"
            else:
                ambient_level = "LOUD"

            # 1. Voice Activity Detection (VAD) Logic
            # Human speech presents elevated RMS and high vocal band concentration with moderate ZCR (0.02 - 0.35)
            if rms_db > self.speech_threshold_db and voice_ratio > 0.40 and (0.01 <= zcr <= 0.45):
                voice_detected = True
                # Scale confidence based on energy and vocal frequency concentration
                energy_factor = np.clip((rms_db - self.speech_threshold_db) / 20.0, 0.2, 1.0)
                speech_confidence = float(np.clip(0.5 * voice_ratio + 0.5 * energy_factor, 0.55, 0.98))
                anomaly_flags.append("VOICE_ACTIVITY_DETECTED")

            # 2. Sudden Loud Acoustic Burst
            if rms_db >= self.burst_threshold_db:
                audio_burst = True
                anomaly_flags.append("UNUSUAL_AUDIO_BURST")

            return {
                "voice_detected": voice_detected,
                "speech_confidence": round(speech_confidence, 3),
                "audio_burst": audio_burst,
                "rms_db": round(rms_db, 2),
                "zero_crossing_rate": round(zcr, 4),
                "voice_band_ratio": round(voice_ratio, 3),
                "ambient_noise_level": ambient_level,
                "anomaly_flags": anomaly_flags
            }

        except Exception as e:
            return {
                "voice_detected": False,
                "speech_confidence": 0.0,
                "audio_burst": False,
                "rms_db": -100.0,
                "zero_crossing_rate": 0.0,
                "voice_band_ratio": 0.0,
                "ambient_noise_level": "ERROR",
                "anomaly_flags": [f"DECODE_ERROR: {str(e)}"]
            }

audio_detector = AudioDetector()
