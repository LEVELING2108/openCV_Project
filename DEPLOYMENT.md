# ExamGuard AI — Deployment & Production Guide 🛡️

This document outlines the architecture, setup instructions, and deployment workflow for the **ExamGuard AI Examination Integrity & Proctoring Platform**.

---

## 🏛️ System Architecture

```
                                  [ Browser Clients ]
                 Student Exam UI (/exam)  &  Examiner Console (/dashboard)
                                       |          |
                      WebSockets / HTTP|          | HTTP REST (Sampled Frames)
                                       v          v
                 +---------------------------------------------------+
                 |           Node.js & Express API Gateway           |
                 |               (Port 5000 / REST & WSS)             |
                 +-------------------------+-------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
        +-----------------------+                    +---------------------------+
        |   MongoDB Database    |                    | Python FastAPI CV Service |
        |      (Port 27017)     |                    |        (Port 8000)        |
        +-----------------------+                    +-------------+-------------+
                                                                   |
                                                      +------------+------------+
                                                      | OpenCV Face & Pose Check|
                                                      | YOLOv8 Object Detection |
                                                      | Temporal False-Pos Suppr|
                                                      +-------------------------+
```

---

## ⚡ Service Port Allocation

| Service | Technology | Port | Health Check |
| :--- | :--- | :--- | :--- |
| **Frontend Portal** | React + Vite + Tailwind CSS | `5173` | `http://localhost:5173/` |
| **Backend API Gateway** | Node.js + Express + Socket.IO | `5000` | `GET http://localhost:5000/api/v1/health` |
| **AI / CV Microservice** | Python 3.12 + FastAPI + YOLO | `8000` | `GET http://localhost:8000/cv/v1/health` |
| **Database** | MongoDB | `27017` | `mongodb://localhost:27017/examguard` |

---

## 🚀 Quick Local Development Setup

### 1. Backend Service
```bash
cd backend
npm install
npm run dev # Starts server on http://localhost:5000
```

### 2. Python CV Microservice
```bash
cd cv-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Frontend Web Application
```bash
cd frontend
npm install
npm run dev # Starts Vite server on http://localhost:5173
```

---

## 🐳 Production Deployment with Docker Compose

Deploy the entire stack with a single command:

```bash
# Build and launch all services in detached mode
docker compose up --build -d

# Verify all containers are healthy
docker compose ps

# View unified service logs
docker compose logs -f
```

---

## 🧪 Automated Testing & Simulation

Run the unit and integration test suite:

```bash
# Run CV Service Unit Tests
cd cv-service
python -m unittest discover -s tests -p "test_*.py"

# Run End-to-End Simulation Script
cd ..
python scripts/simulate_exam_session.py
```

---

## 🔒 Security & Privacy Practices
- Frame sampling rate is capped at `0.5 Hz` (1 frame every 2s) to minimize compute and network bandwidth.
- Raw video feeds are never permanently persisted; only metadata, timestamps, and thumbnail evidence snapshots are logged.
- All AI incidents require examiner human verification (**Confirm** / **Dismiss**).
