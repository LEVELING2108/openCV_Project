# ExamGuard AI 🛡️
### Online Examination Integrity & Proctoring Platform

ExamGuard AI is a multi-tier, AI-assisted examination monitoring and proctoring platform. It analyzes real-time video feeds and session metrics to generate an **explainable risk score** and structured evidence timeline for examiner review without making unilateral decisions.

---

## 🌟 Key Features

- **Multi-Role Support**: Student exam portal, Examiner live monitoring dashboard, and Admin system management.
- **AI/CV Microservice**:
  - `FACE_MISSING`: Absence detection with persistence threshold.
  - `MULTIPLE_FACES`: Detection of additional persons in frame.
  - `PHONE_DETECTED`: Object detection for unauthorized mobile devices & materials.
  - `EXCESSIVE_LOOKING_AWAY`: Facial landmark & head orientation tracking.
- **Real-Time Proctoring & Risk Engine**:
  - Configurable event weights and cooldown periods.
  - Live alerts streamed to examiners via WebSockets (Socket.IO).
  - Snapshot & metadata evidence archiving.
- **Exam Engine**:
  - Question bank management and randomized question delivery.
  - Server-side countdown timers and answer auto-saving.

---

## 🏗️ Architecture

```
ExamGuard AI
├── frontend/          # React + Vite + Tailwind CSS (Student Exam UI & Examiner Dashboard)
├── backend/           # Node.js + Express + Socket.IO + Mongoose (Auth, Exams, Sessions, Risk)
├── cv-service/        # Python + FastAPI + OpenCV + YOLO (Real-time Vision Analytics)
└── extension/         # Manifest V3 browser extension for focus monitoring (Optional)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB (running locally or MongoDB Atlas URI)

### Setup & Run
*(Detailed setup instructions will be updated as modules are developed)*

---

## 📄 License
MIT License.
