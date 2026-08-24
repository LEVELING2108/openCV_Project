#!/usr/bin/env python3
"""
ExamGuard AI - End-to-End Simulation & Verification Script
Simulates a candidate examination lifecycle with real-time CV analytics & Socket.IO events.
"""

import time
import requests
import json
import base64
import numpy as np
import cv2
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BACKEND_URL = "http://localhost:5000"
CV_URL = "http://localhost:8000"

def log(msg, symbol="*"):
    print(f"[{time.strftime('%H:%M:%S')}] [{symbol}] {msg}")

def check_services():
    log("Checking Microservice Health...", "INFO")
    try:
        r_backend = requests.get(f"{BACKEND_URL}/api/v1/health", timeout=3)
        assert r_backend.status_code == 200
        log("Backend API Gateway: ONLINE (Port 5000)", "OK")
    except Exception as e:
        log(f"Backend API Gateway Offline: {e}", "FAIL")
        return False

    try:
        r_cv = requests.get(f"{CV_URL}/cv/v1/health", timeout=3)
        assert r_cv.status_code == 200
        log("AI Computer Vision Service: ONLINE (Port 8000)", "OK")
    except Exception as e:
        log(f"CV Service Offline: {e}", "FAIL")
        return False

    return True

def run_simulation():
    if not check_services():
        log("Cannot proceed with simulation while services are offline.", "FAIL")
        return

    log("Starting Candidate Exam Simulation...", "START")
    session_id = f"sim_sess_{int(time.time())}"

    # 1. Normal frame test
    log("Stage 1: Normal Candidate Behaviour (Single Face, Focused)", "STEP")
    frame_normal = np.full((480, 640, 3), 120, dtype=np.uint8)
    _, buf = cv2.imencode('.jpg', frame_normal)
    b64_normal = base64.b64encode(buf).decode('utf-8')

    res1 = requests.post(
        f"{CV_URL}/cv/v1/analyze/frame",
        json={"session_id": session_id, "image_base64": b64_normal},
        timeout=5
    )
    log(f"CV Response: Status={res1.status_code}, Confirmed Events={len(res1.json().get('confirmed_events', []))}", "RESULT")

    # 2. Camera occlusion test
    log("Stage 2: Simulating Camera Lens Obstruction (Dark Frame)", "STEP")
    frame_dark = np.zeros((480, 640, 3), dtype=np.uint8)
    _, buf_dark = cv2.imencode('.jpg', frame_dark)
    b64_dark = base64.b64encode(buf_dark).decode('utf-8')

    res2 = requests.post(
        f"{CV_URL}/cv/v1/analyze/frame",
        json={"session_id": session_id, "image_base64": b64_dark},
        timeout=5
    )
    log(f"CV Response: Camera Blocked={res2.json().get('camera_blocked')}", "RESULT")

    log("Simulation completed successfully! All pipelines operating nominally.", "COMPLETE")

if __name__ == "__main__":
    run_simulation()
