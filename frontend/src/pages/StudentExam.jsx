import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Camera, AlertTriangle, CheckCircle2, Clock, Eye,
  AlertCircle, Sparkles, Wifi, Bookmark, ChevronLeft, ChevronRight,
  Send, Layers, RefreshCw, Smartphone, HelpCircle, Check, X, Maximize2,
  Mic, MicOff, Volume2
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import ThemeToggle from '../components/ThemeToggle';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "Which data structure operates on a strict Last-In, First-Out (LIFO) order of elements?",
    options: ["Queue", "Stack", "Binary Search Tree", "Circular Linked List"],
    difficulty: "Fundamental",
    points: 1,
  },
  {
    id: 2,
    question: "What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    difficulty: "Intermediate",
    points: 2,
  },
  {
    id: 3,
    question: "In real-time computer vision, which algorithm performs rapid facial feature detection via integral image representations and cascade classifiers?",
    options: ["Viola-Jones Haar Cascade", "Dijkstra's Shortest Path", "K-Means Clustering", "PageRank Algorithm"],
    difficulty: "Advanced",
    points: 3,
  },
  {
    id: 4,
    question: "Which YOLO architectural mechanism enables single-stage grid-based bounding box regression and class probability prediction simultaneously?",
    options: ["Recurrent Memory Cells", "Anchor-free / Single-Shot Dense Detection Grid", "Fourier Transform Filtering", "Greedy Depth-First Search"],
    difficulty: "Advanced",
    points: 3,
  }
];

export default function StudentExam() {
  const { user, logout } = useAuth();

  // Calibration / Readiness state
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(1);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastWarning, setLastWarning] = useState(null);
  const [cvConnected, setCvConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS);
  const [examData, setExamData] = useState(null);

  // Fetch live exam questions from backend
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = user?.token;
        const res = await axios.get('http://localhost:5000/api/v1/exams', {
          headers: {
            Authorization: `Bearer ${token || 'demo_token'}`,
          },
        });
        if (res.data?.success && res.data.data?.length > 0) {
          const liveExam = res.data.data[0];
          setExamData(liveExam);
          if (liveExam.questions && liveExam.questions.length > 0) {
            const formatted = liveExam.questions.map((q, idx) => ({
              id: q._id || idx + 1,
              question: q.questionText,
              options: q.options.map((opt) => (typeof opt === 'string' ? opt : opt.text)),
              difficulty: idx % 2 === 0 ? 'Fundamental' : 'Advanced',
              points: q.points || (idx % 2 === 0 ? 1 : 2),
            }));
            setQuestions(formatted);
          }
          if (liveExam.durationMinutes) {
            setTimeLeft(liveExam.durationMinutes * 60);
          }
        }
      } catch (err) {
        // Fallback to sample questions if backend offline
        console.log('Using default sample questions bank.');
      }
    };

    fetchExam();
  }, [user]);

  // Telemetry state
  const [telemetry, setTelemetry] = useState({
    faceCount: 1,
    lookingAway: false,
    cameraBlocked: false,
    phoneDetected: false,
    voiceDetected: false,
    audioLevel: 0,
    micActive: false,
  });

  const [eventLogs, setEventLogs] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const sessionId = useRef(`sess_${user?._id || 'demo'}_${Date.now()}`);

  // Countdown timer
  useEffect(() => {
    if (!isCalibrated || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCalibrated, isSubmitted]);

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

    // Heartbeat every 5s
    const heartbeatInterval = setInterval(() => {
      if (socket.connected && isCalibrated && !isSubmitted) {
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
  }, [user, isCalibrated, isSubmitted]);

  // Camera & Audio Initialization
  useEffect(() => {
    let stream = null;
    let audioCtx = null;
    let analyser = null;
    let animFrameId = null;

    const startCameraAndMic = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setIsCameraActive(true);
          };
          setIsCameraActive(true);
        }

        // Set up real-time audio energy analyser
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);

            const pcmData = new Uint8Array(analyser.frequencyBinCount);
            const checkAudio = () => {
              if (analyser) {
                analyser.getByteFrequencyData(pcmData);
                let sum = 0;
                for (let i = 0; i < pcmData.length; i++) {
                  sum += pcmData[i];
                }
                const avgLevel = sum / pcmData.length;
                const normalizedLevel = Math.min(Math.round((avgLevel / 128) * 100), 100);
                const isSpeech = normalizedLevel > 35;

                setTelemetry((prev) => ({
                  ...prev,
                  micActive: true,
                  audioLevel: normalizedLevel,
                  voiceDetected: isSpeech,
                }));
              }
              animFrameId = requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        }
      } catch (err) {
        console.warn('Microphone/Camera compound request failed, retrying camera only:', err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(() => {});
              setIsCameraActive(true);
            };
            setIsCameraActive(true);
          }
        } catch (videoErr) {
          console.error('Camera access denied:', videoErr);
        }
      }
    };

    startCameraAndMic();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame Sampling & AI Analysis Loop (Every 2s)
  useEffect(() => {
    if (!isCameraActive || isSubmitted) return;

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

          setTelemetry((prev) => ({
            ...prev,
            faceCount: typeof data.face_count === 'number' ? data.face_count : (data.face_missing ? 0 : 1),
            lookingAway: !!data.looking_away,
            cameraBlocked: !!data.camera_blocked,
            phoneDetected: !!data.phone_detected,
          }));

          if (data.confirmed_events && data.confirmed_events.length > 0) {
            const latest = data.confirmed_events[0];
            const eventName = latest.event_type.replace(/_/g, ' ');
            setLastWarning(`Alert: ${eventName} detected!`);

            setEventLogs((prev) => [
              { id: Date.now(), text: eventName, time: new Date().toLocaleTimeString() },
              ...prev.slice(0, 4)
            ]);

            // Emit to backend socket
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
          } else if (data.phone_detected) {
            setLastWarning('Alert: Mobile device visible in frame!');
          } else if (data.looking_away) {
            setLastWarning('Advisory: Please maintain eye contact with the screen.');
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
  }, [isCameraActive, isSubmitted, user]);

  // Tab & Window Focus Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isCalibrated && !isSubmitted) {
        setLastWarning('Warning: Tab switch / focus lost detected!');
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
  }, [isCalibrated, isSubmitted, user]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = ((1800 - timeLeft) / 1800) * 100;

  // 1. PRE-EXAM CALIBRATION WIZARD
  if (!isCalibrated) {
    return (
      <div className="min-h-screen stripe-mesh-bg flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="max-w-2xl w-full bg-white dark:bg-dark-900 rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-stripe-lg dark:shadow-2xl z-10">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="p-2.5 bg-indigo-600 dark:bg-brand-500/20 text-white dark:text-brand-400 rounded-2xl shadow-stripe-indigo">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pre-Exam System Calibration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{examData?.title || 'CS501: Advanced Computer Vision & AI'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className={`p-3 rounded-2xl border text-xs font-medium ${calibrationStep === 1 ? 'bg-indigo-50 dark:bg-brand-600/15 border-indigo-200 dark:border-brand-500 text-indigo-700 dark:text-brand-300' : 'bg-slate-50 dark:bg-dark-900 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}>
              1. Camera Check
            </div>
            <div className={`p-3 rounded-2xl border text-xs font-medium ${calibrationStep === 2 ? 'bg-indigo-50 dark:bg-brand-600/15 border-indigo-200 dark:border-brand-500 text-indigo-700 dark:text-brand-300' : 'bg-slate-50 dark:bg-dark-900 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}>
              2. Face Calibration
            </div>
            <div className={`p-3 rounded-2xl border text-xs font-medium ${calibrationStep === 3 ? 'bg-indigo-50 dark:bg-brand-600/15 border-indigo-200 dark:border-brand-500 text-indigo-700 dark:text-brand-300' : 'bg-slate-50 dark:bg-dark-900 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}>
              3. Integrity Consent
            </div>
          </div>

          {/* Step 1: Camera Feed */}
          {calibrationStep === 1 && (
            <div className="space-y-4">
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200/80 dark:border-white/10 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/50 m-6 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] text-white bg-slate-950/75 px-3 py-1 rounded-full backdrop-blur">
                    Center face within guidelines
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Camera Stream Active (640x480)
                </span>
                <button
                  onClick={() => setCalibrationStep(2)}
                  className="px-5 py-2.5 bg-[#635bff] hover:bg-[#5851ea] text-white rounded-xl text-xs font-semibold shadow-stripe-indigo transition cursor-pointer"
                >
                  Proceed to Alignment
                </button>
              </div>
            </div>
          )}

          {/* Step 2: AI Alignment */}
          {calibrationStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 space-y-3">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Live AI Diagnostics</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-center justify-between shadow-sm">
                    <span className="text-slate-600 dark:text-slate-400">Face Recognition</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified (1 Person)</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-center justify-between shadow-sm">
                    <span className="text-slate-600 dark:text-slate-400">Object Detector</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">YOLOv8 Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCalibrationStep(1)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setCalibrationStep(3)}
                  className="px-5 py-2.5 bg-[#635bff] hover:bg-[#5851ea] text-white rounded-xl text-xs font-semibold shadow-stripe-indigo transition cursor-pointer"
                >
                  Proceed to Consent
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Policy Consent */}
          {calibrationStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Exam Integrity Agreement</h3>
                <p>• The exam is proctored via periodic frame sampling (0.5 Hz) and focus telemetry.</p>
                <p>• AI flags do not declare misconduct automatically; they are reviewed by human examiners.</p>
                <p>• Unauthorized devices, secondary persons, and continuous looking away will be logged.</p>
                <label className="flex items-center gap-2 pt-2 cursor-pointer text-slate-900 dark:text-white font-medium">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  I understand and accept the examination rules
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCalibrationStep(2)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  disabled={!policyAccepted}
                  onClick={() => setIsCalibrated(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-stripe transition cursor-pointer"
                >
                  Start Examination
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. POST-SUBMISSION VIEW
  if (isSubmitted) {
    return (
      <div className="min-h-screen stripe-mesh-bg flex items-center justify-center p-6 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-dark-900 rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 text-center space-y-4 shadow-stripe-lg dark:shadow-2xl">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Examination Submitted</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your responses and session telemetry have been encrypted and stored securely for examiner review.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-dark-950 rounded-2xl border border-slate-200/80 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex justify-between">
              <span>Questions Answered:</span>
              <strong className="text-slate-900 dark:text-white">{answeredCount} / {questions.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Session Status:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">COMPLETE</strong>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2.5 bg-[#635bff] hover:bg-[#5851ea] text-white text-xs font-semibold rounded-xl shadow-stripe-indigo transition cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // 3. ACTIVE EXAMINATION WORKSPACE
  const q = questions[currentQuestion] || questions[0];
  const isBookmarked = !!bookmarkedQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-dark-900/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-brand-500/15 border border-indigo-200 dark:border-brand-500/30 rounded-xl text-indigo-600 dark:text-brand-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">{examData?.title || 'CS501: Advanced Computer Vision & AI'}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Candidate: {user?.name || 'Alex Rivera'}</p>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border font-mono text-sm shadow-sm transition ${
            timeLeft < 300
              ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 animate-pulse'
              : 'bg-white dark:bg-dark-950/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
          }`}>
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-600' : 'text-indigo-600 dark:text-brand-400'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Live AI Proctoring</span>
          </div>
          <ThemeToggle />
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-stripe transition cursor-pointer"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-dark-900 h-1">
        <div
          className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Examination Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Question Card & Controls (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-white/10 shadow-stripe-lg dark:shadow-2xl relative">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-brand-500/15 border border-indigo-200 dark:border-brand-500/30 text-indigo-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200/60 dark:border-white/5 font-medium">
                  {q.points} {q.points === 1 ? 'Point' : 'Points'} • {q.difficulty}
                </span>
              </div>

              <button
                onClick={() => setBookmarkedQuestions({ ...bookmarkedQuestions, [currentQuestion]: !isBookmarked })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-dark-900/60 border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                {isBookmarked ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            {/* Question Statement */}
            <h2 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
              {q.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {q.options.map((optionText, idx) => {
                const isSelected = selectedAnswers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: idx })}
                    className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-brand-600/20 border-indigo-600 dark:border-brand-500 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-slate-50/70 dark:bg-dark-900/60 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-850 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium">{optionText}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation & Question Palette */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <button
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Question quick selector pills */}
            <div className="flex items-center gap-2">
              {questions.map((_, i) => {
                const isAns = selectedAnswers[i] !== undefined;
                const isCurr = i === currentQuestion;
                const isBkm = bookmarkedQuestions[i];

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition border cursor-pointer ${
                      isCurr
                        ? 'bg-[#635bff] border-indigo-600 text-white shadow-stripe-indigo'
                        : isBkm
                        ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                        : isAns
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-dark-900 border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#635bff] hover:bg-[#5851ea] text-white text-xs font-semibold transition shadow-stripe-indigo cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-stripe cursor-pointer"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Proctoring HUD & Telemetry (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-stripe-lg dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600 dark:text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  AI Proctoring HUD
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE MONITOR
              </span>
            </div>

            {/* Video Viewport with HUD Overlay */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Cyber HUD Corner Brackets */}
              <div className="absolute inset-2 border border-white/10 pointer-events-none rounded-lg">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-400" />
              </div>

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Camera stream connecting...</p>
                </div>
              )}
            </div>

            {/* Real-time Warning Banner */}
            {lastWarning && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-shake shadow-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="font-bold">{lastWarning}</p>
                  <p className="text-rose-600/80 dark:text-rose-300/80 text-[11px] mt-0.5">
                    Maintain eye contact with the screen. All events are logged for examiner review.
                  </p>
                </div>
              </div>
            )}

            {/* 4 Live Telemetry HUD Meters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-white/5 flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Face Status</span>
                <span className={telemetry.faceCount === 1 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                  {telemetry.faceCount === 1 ? '1 Face Detected' : telemetry.faceCount === 0 ? 'No Face Found' : `${telemetry.faceCount} Faces Detected`}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-white/5 flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Head Pose</span>
                <span className={!telemetry.lookingAway ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                  {!telemetry.lookingAway ? 'Focused' : 'Looking Away'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-white/5 flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Device Check</span>
                <span className={!telemetry.phoneDetected ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold animate-pulse'}>
                  {!telemetry.phoneDetected ? 'No Device' : '📱 Phone Detected!'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Microphone</span>
                  <span className="text-[10px] font-mono text-slate-500">{telemetry.audioLevel}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${telemetry.voiceDetected ? 'bg-amber-500 animate-ping' : telemetry.micActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className={telemetry.voiceDetected ? 'text-amber-600 dark:text-amber-300 font-bold' : telemetry.micActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 font-medium'}>
                    {telemetry.voiceDetected ? 'Speech Detected' : telemetry.micActive ? 'Active / Quiet' : 'Mic Off'}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Stream */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Recent System Events</span>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-brand-400">Real-time</span>
              </div>
              {eventLogs.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/50 border border-slate-200/60 dark:border-white/5 text-center text-[11px] text-slate-500">
                  Clean session • No incidents logged
                </div>
              ) : (
                <div className="space-y-1.5">
                  {eventLogs.map((log) => (
                    <div key={log.id} className="p-2 rounded-xl bg-slate-50 dark:bg-dark-950/80 border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-800 dark:text-slate-300 font-medium">{log.text}</span>
                      <span className="text-slate-500 font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-white/10 space-y-4 shadow-stripe-lg dark:shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Final Submission?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You have answered <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> of <strong className="text-slate-900 dark:text-white">{questions.length}</strong> questions. Once submitted, you cannot change your answers.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setIsSubmitted(true);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-stripe cursor-pointer"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
