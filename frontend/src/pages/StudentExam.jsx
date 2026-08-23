import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Camera, AlertTriangle, CheckCircle2, Clock, Eye, AlertCircle, Sparkles, Wifi } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "Which data structure operates on a Last In First Out (LIFO) basis?",
    options: ["Queue", "Stack", "Binary Tree", "Linked List"],
  },
  {
    id: 2,
    question: "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
  },
  {
    id: 3,
    question: "In computer vision, what is the primary role of the Haar Cascade classifier?",
    options: ["Image segmentation", "Object & feature detection", "Style transfer", "Color correction"],
  },
];

export default function StudentExam() {
  const { user, logout } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastWarning, setLastWarning] = useState(null);
  const [cvConnected, setCvConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    faceCount: 1,
    lookingAway: false,
    cameraBlocked: false,
    phoneDetected: false,
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const sessionId = useRef(`sess_${user?._id || 'demo'}_${Date.now()}`);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket.IO Setup & Heartbeat
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('session:join', {
        sessionId: sessionId.current,
        role: 'student',
        userId: user?._id || 'demo_student',
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Send heartbeat every 5 seconds
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('session:heartbeat', {
          sessionId: sessionId.current,
          timestamp: new Date().toISOString(),
          status: 'ACTIVE',
        });
      }
    }, 5000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [user]);

  // Initialize Camera
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame Sampling & AI Analysis Loop (Every 2 seconds)
  useEffect(() => {
    if (!isCameraActive) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL('image/jpeg', 0.6);

        try {
          const res = await axios.post('http://localhost:8000/cv/v1/analyze/frame', {
            session_id: sessionId.current,
            image_base64: base64Image,
            student_id: user?._id,
          });

          setCvConnected(true);
          const data = res.data;

          setTelemetry({
            faceCount: data.face_count,
            lookingAway: data.looking_away,
            cameraBlocked: data.camera_blocked,
            phoneDetected: data.phone_detected,
          });

          // If events confirmed, broadcast to examiner and display warning
          if (data.confirmed_events && data.confirmed_events.length > 0) {
            const latest = data.confirmed_events[0];
            setLastWarning(`Alert: ${latest.event_type.replace(/_/g, ' ')} detected!`);

            // Emit to backend socket for real-time examiner notification
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('proctor:event', {
                sessionId: sessionId.current,
                eventType: latest.event_type,
                confidence: latest.confidence,
                riskScore: latest.risk_weight,
                studentName: user?.name || 'Alex Rivera',
                evidence: {
                  snapshotThumbnail: base64Image.substring(0, 100) + '...',
                  timestamp: new Date().toISOString(),
                }
              });
            }
          } else if (data.looking_away) {
            setLastWarning('Advisory: Please look directly at your screen.');
          } else if (data.camera_blocked) {
            setLastWarning('Warning: Camera obstructed or lighting too low.');
          } else {
            setLastWarning(null);
          }
        } catch (err) {
          setCvConnected(false);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCameraActive, user]);

  // Track Tab / Window Focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLastWarning('Warning: Tab switch / browser window lost focus!');
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('proctor:event', {
            sessionId: sessionId.current,
            eventType: 'TAB_FOCUS_LOST',
            confidence: 1.0,
            riskScore: 10,
            studentName: user?.name || 'Alex Rivera',
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">CS402: Advanced Algorithms & Data Structures</h1>
            <p className="text-xs text-slate-400">Candidate: {user?.name || 'Student'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-sm">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-slate-200">{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Exit Exam
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Exam Questions Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}
              </span>
              <span className="text-xs text-slate-400">Single Choice (1 Point)</span>
            </div>

            <h2 className="text-lg font-medium text-slate-100 mb-6">
              {SAMPLE_QUESTIONS[currentQuestion].question}
            </h2>

            <div className="space-y-3">
              {SAMPLE_QUESTIONS[currentQuestion].options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: idx })}
                    className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{option}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
            <button
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              Previous
            </button>

            <div className="flex gap-1.5">
              {SAMPLE_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedAnswers[i] !== undefined
                      ? 'bg-indigo-500'
                      : i === currentQuestion
                      ? 'bg-slate-400'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {currentQuestion < SAMPLE_QUESTIONS.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition shadow-sm"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => alert('Exam submitted successfully!')}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition shadow-sm"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Proctoring Video & Real-time CV Feed (1 Col) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  AI Proctoring Feed
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>

            {/* Video Stream */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Camera stream not active</p>
                </div>
              )}
            </div>

            {/* Real-time Warning Banner */}
            {lastWarning && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{lastWarning}</p>
                  <p className="text-rose-400/80 text-[11px] mt-0.5">
                    Maintain eye contact with the screen. Suspicious events are logged for examiner review.
                  </p>
                </div>
              </div>
            )}

            {/* Telemetry & Signal Badges */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Face Status</span>
                <span className={telemetry.faceCount === 1 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {telemetry.faceCount === 1 ? '1 Face Detected' : telemetry.faceCount === 0 ? 'No Face Found' : `${telemetry.faceCount} Faces Detected`}
                </span>
              </div>
              <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Head Pose</span>
                <span className={!telemetry.lookingAway ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {!telemetry.lookingAway ? 'Facing Screen' : 'Looking Away'}
                </span>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>CV Microservice:</span>
                <span className={cvConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {cvConnected ? 'Connected (FastAPI + YOLO)' : 'Connecting...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Real-time Gateway:</span>
                <span className={socketConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {socketConnected ? 'Connected (Socket.IO)' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
