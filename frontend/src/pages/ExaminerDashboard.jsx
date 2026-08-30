import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Users, AlertTriangle, CheckCircle, XCircle, Search, Filter,
  Plus, Clock, BookOpen, Trash2, Bell, Radio, LayoutGrid, List,
  Send, UserX, Smartphone, EyeOff, Check, X, ShieldAlert, Sparkles, ExternalLink,
  Download, FileText, Megaphone, ArrowUpDown, Volume2, Mic, Eye, AlertOctagon,
  Maximize2, Play, RefreshCw, UserCheck
} from 'lucide-react';
import { io } from 'socket.io-client';

const INITIAL_CANDIDATES = [
  {
    id: 'cand_1',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    status: 'ACTIVE',
    riskScore: 40,
    lastEvent: 'PHONE_DETECTED',
    lastEventTime: 'Just now',
    audioLevel: 18,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_1', type: 'PHONE_DETECTED', weight: 40, confidence: 0.94, time: '10:42:15 AM', status: 'UNREVIEWED' }
    ]
  },
  {
    id: 'cand_2',
    name: 'Sarah Chen',
    email: 'sarah.chen@university.edu',
    status: 'ACTIVE',
    riskScore: 30,
    lastEvent: 'MULTIPLE_FACES',
    lastEventTime: '3 mins ago',
    audioLevel: 42,
    micStatus: 'VOICE_ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_2', type: 'MULTIPLE_FACES', weight: 30, confidence: 0.88, time: '10:39:00 AM', status: 'UNREVIEWED' }
    ]
  },
  {
    id: 'cand_3',
    name: 'Marcus Brody',
    email: 'm.brody@university.edu',
    status: 'ACTIVE',
    riskScore: 35,
    lastEvent: 'VOICE_DETECTED',
    lastEventTime: '4 mins ago',
    audioLevel: 68,
    micStatus: 'SPEECH_DETECTED',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_v1', type: 'VOICE_DETECTED', weight: 20, confidence: 0.91, time: '10:38:12 AM', status: 'UNREVIEWED' },
      { id: 'ev_v2', type: 'UNUSUAL_AUDIO_BURST', weight: 15, confidence: 0.85, time: '10:37:45 AM', status: 'UNREVIEWED' }
    ]
  },
  {
    id: 'cand_4',
    name: 'David Miller',
    email: 'david.m@university.edu',
    status: 'ACTIVE',
    riskScore: 15,
    lastEvent: 'FACE_MISSING',
    lastEventTime: '12 mins ago',
    audioLevel: 12,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_3', type: 'FACE_MISSING', weight: 15, confidence: 0.99, time: '10:32:10 AM', status: 'CONFIRMED' }
    ]
  },
  {
    id: 'cand_5',
    name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    status: 'ACTIVE',
    riskScore: 0,
    lastEvent: 'None',
    lastEventTime: 'Clean Session',
    audioLevel: 8,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    history: []
  },
  {
    id: 'cand_6',
    name: 'Liam Zhang',
    email: 'liam.z@university.edu',
    status: 'ACTIVE',
    riskScore: 10,
    lastEvent: 'EXCESSIVE_LOOKING_AWAY',
    lastEventTime: '15 mins ago',
    audioLevel: 14,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_6', type: 'EXCESSIVE_LOOKING_AWAY', weight: 10, confidence: 0.82, time: '10:28:40 AM', status: 'DISMISSED' }
    ]
  },
  {
    id: 'cand_7',
    name: 'Sophia Patel',
    email: 'sophia.p@university.edu',
    status: 'ACTIVE',
    riskScore: 0,
    lastEvent: 'None',
    lastEventTime: 'Clean Session',
    audioLevel: 6,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    history: []
  },
  {
    id: 'cand_8',
    name: 'Julian Vance',
    email: 'julian.v@university.edu',
    status: 'ACTIVE',
    riskScore: 10,
    lastEvent: 'TAB_FOCUS_LOST',
    lastEventTime: '18 mins ago',
    audioLevel: 9,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_8', type: 'TAB_FOCUS_LOST', weight: 10, confidence: 1.0, time: '10:24:10 AM', status: 'UNREVIEWED' }
    ]
  },
  {
    id: 'cand_9',
    name: 'Amara Okafor',
    email: 'amara.o@university.edu',
    status: 'ACTIVE',
    riskScore: 0,
    lastEvent: 'None',
    lastEventTime: 'Clean Session',
    audioLevel: 10,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
    history: []
  },
  {
    id: 'cand_10',
    name: 'Noah Bennett',
    email: 'noah.b@university.edu',
    status: 'ACTIVE',
    riskScore: 0,
    lastEvent: 'None',
    lastEventTime: 'Clean Session',
    audioLevel: 7,
    micStatus: 'ACTIVE',
    cameraStatus: 'CLEAR',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    history: []
  }
];

export default function ExaminerDashboard() {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState(INITIAL_CANDIDATES[0]);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [sortBy, setSortBy] = useState('RISK_DESC'); // 'RISK_DESC' | 'RISK_ASC' | 'NAME_ASC' | 'RECENT'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'grid' | 'table'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState('Unauthorized mobile device & secondary assistance detected.');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [socketStatus, setSocketStatus] = useState('Connecting');
  const [warningMessage, setWarningMessage] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Exam Builder State
  const [examForm, setExamForm] = useState({
    title: 'CS501: Advanced Computer Vision & Deep Learning',
    description: 'Midterm Examination covering OpenCV, YOLO, and Neural Architectures.',
    durationMinutes: 45,
    randomizeQuestions: true,
    questions: [
      {
        questionText: 'Which algorithm is commonly used for real-time face detection with Haar feature cascades?',
        options: [
          { text: 'Viola-Jones', isCorrect: true },
          { text: 'Dijkstra', isCorrect: false },
          { text: 'K-Means', isCorrect: false },
          { text: 'PageRank', isCorrect: false },
        ]
      }
    ]
  });

  // Socket.IO Real-Time Listener
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketStatus('Live');
      socket.emit('session:join', {
        sessionId: 'global_examiner',
        role: 'examiner',
        userId: user?._id || 'examiner_1',
      });
    });

    socket.on('disconnect', () => {
      setSocketStatus('Offline');
    });

    // Real-time alert listener
    socket.on('proctor:alert', (alertData) => {
      setCandidates((prev) => {
        const targetId = alertData.candidateId || 'cand_1';
        return prev.map((c) => {
          if (c.id === targetId || c.name === alertData.studentName) {
            const newEvent = {
              id: 'ev_' + Date.now(),
              type: alertData.eventType,
              weight: alertData.riskScore || alertData.riskWeight || 10,
              confidence: alertData.confidence || 0.90,
              time: new Date().toLocaleTimeString(),
              status: 'UNREVIEWED',
            };
            const updatedCand = {
              ...c,
              riskScore: c.riskScore + (alertData.riskScore || alertData.riskWeight || 10),
              lastEvent: alertData.eventType,
              lastEventTime: 'Just now',
              history: [newEvent, ...c.history],
            };
            if (selectedCandidate?.id === c.id) {
              setSelectedCandidate(updatedCand);
            }
            return updatedCand;
          }
          return c;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedCandidate?.id, user]);

  const getRiskBadge = (score) => {
    if (score >= 40) {
      return (
        <span className="px-2.5 py-1 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold shadow-glow-rose">
          High Risk ({score} pts)
        </span>
      );
    }
    if (score >= 20) {
      return (
        <span className="px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold">
          Medium Risk ({score} pts)
        </span>
      );
    }
    if (score > 0) {
      return (
        <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold">
          Low Risk ({score} pts)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold shadow-glow-emerald">
        Normal (0 pts)
      </span>
    );
  };

  const handleReviewAction = (eventId, action) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === selectedCandidate.id) {
          const updatedHistory = c.history.map((h) =>
            h.id === eventId ? { ...h, status: action } : h
          );
          const updatedCand = { ...c, history: updatedHistory };
          setSelectedCandidate(updatedCand);
          return updatedCand;
        }
        return c;
      })
    );
  };

  const handleSendWarning = (e) => {
    e.preventDefault();
    if (!warningMessage.trim()) return;
    alert(`In-exam advisory warning sent to candidate ${selectedCandidate.name}: "${warningMessage}"`);
    setWarningMessage('');
  };

  const handleBroadcastAnnouncement = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    alert(`Broadcast announcement transmitted to ALL ${candidates.length} candidates: "${broadcastMessage}"`);
    setBroadcastMessage('');
    setIsBroadcastModalOpen(false);
  };

  const handleTerminateCandidate = () => {
    if (!selectedCandidate) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidate.id
          ? { ...c, status: 'DISQUALIFIED', lastEvent: 'SESSION_TERMINATED', lastEventTime: 'Just now' }
          : c
      )
    );
    setSelectedCandidate({
      ...selectedCandidate,
      status: 'DISQUALIFIED',
      lastEvent: 'SESSION_TERMINATED',
      lastEventTime: 'Just now',
    });
    alert(`Session for candidate ${selectedCandidate.name} has been remotely TERMINATED. Penalty reason logged: "${terminateReason}"`);
    setIsTerminateModalOpen(false);
  };

  const handleDownloadPDFReport = async (candidateId, candidateName) => {
    try {
      setIsExportingPDF(true);
      const token = user?.token;
      const response = await fetch(`http://localhost:5000/api/v1/sessions/${candidateId}/report/pdf`, {
        headers: {
          Authorization: `Bearer ${token || 'demo_token'}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ExamGuard_Audit_${candidateName.replace(/\s+/g, '_')}_${candidateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Generating audit report for ${candidateName}... The PDF microservice is ready at /api/v1/sessions/:id/report/pdf.`);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      alert(`Report download requested for ${candidateName}. Ensure Backend server is running.`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleAddQuestion = () => {
    setExamForm({
      ...examForm,
      questions: [
        ...examForm.questions,
        {
          questionText: '',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ]
        }
      ]
    });
  };

  const handleCreateExam = (e) => {
    e.preventDefault();
    alert(`Exam "${examForm.title}" published with ${examForm.questions.length} questions!`);
    setIsCreateModalOpen(false);
  };

  // Filter & Sort Priority Engine
  const processedCandidates = candidates
    .filter((c) => {
      const matchesRisk =
        filterRisk === 'ALL'
          ? true
          : filterRisk === 'HIGH'
          ? c.riskScore >= 40
          : filterRisk === 'MEDIUM'
          ? c.riskScore >= 20 && c.riskScore < 40
          : filterRisk === 'NORMAL'
          ? c.riskScore === 0
          : filterRisk === 'DISQUALIFIED'
          ? c.status === 'DISQUALIFIED'
          : true;

      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesRisk && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'RISK_DESC') return b.riskScore - a.riskScore;
      if (sortBy === 'RISK_ASC') return a.riskScore - b.riskScore;
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      return 0;
    });

  const highRiskCount = candidates.filter((c) => c.riskScore >= 40).length;
  const mediumRiskCount = candidates.filter((c) => c.riskScore >= 20 && c.riskScore < 40).length;
  const normalCount = candidates.filter((c) => c.riskScore === 0 && c.status === 'ACTIVE').length;
  const disqualifiedCount = candidates.filter((c) => c.status === 'DISQUALIFIED').length;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Console Navigation Bar */}
      <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/15 border border-brand-500/30 rounded-xl text-brand-400 shadow-glow-indigo">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Examiner Command Console
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                PROCTOR ACTIVE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Exam: CS501 Advanced Computer Vision & AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-dark-950/80 border border-white/10 text-xs">
            <Radio className={`w-3.5 h-3.5 ${socketStatus === 'Live' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              Gateway: <strong className={socketStatus === 'Live' ? 'text-emerald-400' : 'text-amber-400'}>{socketStatus}</strong>
            </span>
          </div>

          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            Broadcast Notice
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-indigo transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </button>

          <div className="hidden md:block text-right border-l border-white/10 pl-4">
            <p className="text-xs font-semibold text-white">{user?.name || 'Prof. Marcus Vance'}</p>
            <p className="text-[11px] text-brand-400 font-medium">Chief Examiner</p>
          </div>

          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:bg-dark-800 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Analytics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Cohort</p>
              <h3 className="text-2xl font-bold text-white mt-1">{candidates.length} Students</h3>
            </div>
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">High Risk Alerts</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{highRiskCount} Flagged</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Moderate Attention</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{mediumRiskCount} Under Watch</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Verified Clean Sessions</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{normalCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter, Sort & View Density Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Risk Category Filters */}
            <div className="flex items-center gap-1.5 p-1 bg-dark-900 rounded-xl border border-white/5 text-xs">
              {['ALL', 'HIGH', 'MEDIUM', 'NORMAL'].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setFilterRisk(risk)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    filterRisk === risk
                      ? 'bg-brand-600 text-white shadow-glow-indigo'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>

            {/* Priority Queue Sorting */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="RISK_DESC">Highest Risk First (Priority Queue)</option>
                <option value="RISK_ASC">Lowest Risk First</option>
                <option value="NAME_ASC">Candidate Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 p-1 bg-dark-900 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'split' ? 'bg-brand-600 text-white shadow-glow-indigo' : 'text-slate-400 hover:text-white'
              }`}
              title="Split Inspector View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-brand-600 text-white shadow-glow-indigo' : 'text-slate-400 hover:text-white'
              }`}
              title="Full Multi-Student Matrix Grid"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-brand-600 text-white shadow-glow-indigo' : 'text-slate-400 hover:text-white'
              }`}
              title="Table Audit List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode 1: Split Inspector Mode (Default) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Candidate Queue (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Candidate Stream Matrix ({processedCandidates.length})
                </h3>
                <span className="text-[11px] font-mono text-brand-400">Auto-Sorted by Priority</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[780px] overflow-y-auto pr-1">
                {processedCandidates.map((candidate) => {
                  const isSelected = selectedCandidate?.id === candidate.id;
                  const isHighRisk = candidate.riskScore >= 40;
                  const isDisqualified = candidate.status === 'DISQUALIFIED';

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`glass-panel p-4 rounded-2xl border transition relative group cursor-pointer flex flex-col justify-between space-y-3 ${
                        isDisqualified
                          ? 'border-rose-900/50 bg-rose-950/20 opacity-70'
                          : isSelected
                          ? 'border-brand-500 bg-brand-900/20 shadow-glow-indigo ring-1 ring-brand-400/50'
                          : isHighRisk
                          ? 'border-rose-500/50 bg-rose-950/20 hover:border-rose-500 shadow-glow-rose'
                          : 'border-white/10 hover:border-white/20 hover:bg-dark-850/60'
                      }`}
                    >
                      {/* Top Bar with Avatar & Live HUD badges */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`w-3 h-3 rounded-full absolute bottom-0.5 right-0.5 border-2 border-dark-950 ${
                              isDisqualified
                                ? 'bg-rose-600'
                                : candidate.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : 'bg-slate-500'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate">{candidate.name}</h4>
                            {isDisqualified ? (
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold">
                                VOID
                              </span>
                            ) : (
                              getRiskBadge(candidate.riskScore)
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{candidate.email}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {candidate.id}</p>
                        </div>
                      </div>

                      {/* Mini Live Signal HUD */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-2 border-t border-white/5">
                        <div className="p-1.5 rounded-lg bg-dark-950/80 flex items-center justify-between">
                          <span className="text-slate-400">Audio:</span>
                          <span className={candidate.audioLevel > 35 ? 'text-amber-300 font-semibold' : 'text-emerald-400'}>
                            {candidate.audioLevel}% dB
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-dark-950/80 flex items-center justify-between">
                          <span className="text-slate-400">Recent:</span>
                          <span className="text-slate-300 truncate max-w-[70px]">{candidate.lastEvent.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                        <span className="text-[11px] text-slate-400 font-mono">{candidate.lastEventTime}</span>
                        <span className="text-brand-400 text-[11px] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                          Inspect <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Candidate Inspection & Incident Audit Pane (5 Cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between space-y-6">
              <div>
                {/* Candidate Header with PDF Export & Disqualify Button */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedCandidate?.name}
                      {selectedCandidate?.status === 'DISQUALIFIED' && (
                        <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold">
                          DISQUALIFIED
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">Session ID: {selectedCandidate?.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPDFReport(selectedCandidate.id, selectedCandidate.name)}
                      disabled={isExportingPDF}
                      className="px-3 py-1.5 bg-dark-800 hover:bg-dark-750 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Download Official PDF Proctoring Audit Certificate"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-400" />
                      {isExportingPDF ? 'Generating...' : 'Export PDF'}
                    </button>

                    <button
                      onClick={() => setIsTerminateModalOpen(true)}
                      className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Disqualify Candidate"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Simulated Live Video Feed & Camera Tile */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-dark-950 border border-white/10 mb-5 group">
                  <img
                    src={selectedCandidate?.avatar}
                    alt={selectedCandidate?.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-black/40 pointer-events-none" />

                  {/* Corner Brackets */}
                  <div className="absolute inset-2 border border-white/10 pointer-events-none rounded-lg">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-400" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-400" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-400" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-400" />
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-600/90 text-white rounded text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE STREAM
                    </span>
                    <span className="px-2 py-0.5 bg-dark-900/80 backdrop-blur border border-white/10 text-slate-300 rounded text-[10px] font-mono">
                      MIC: {selectedCandidate?.audioLevel}% dB
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold drop-shadow">{selectedCandidate?.name}</span>
                    {getRiskBadge(selectedCandidate?.riskScore || 0)}
                  </div>
                </div>

                {/* Instant In-Exam Notice Form */}
                <form onSubmit={handleSendWarning} className="mb-5 p-3.5 bg-dark-950/70 border border-white/10 rounded-2xl space-y-2.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Direct Candidate Notice
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Please look directly at your monitor..."
                      value={warningMessage}
                      onChange={(e) => setWarningMessage(e.target.value)}
                      className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-glow-indigo"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </form>

                {/* Incident Event Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Proctoring Incident Timeline ({selectedCandidate?.history.length})
                  </h4>

                  {selectedCandidate?.history.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-dark-950/50 border border-white/5 text-center text-xs text-slate-500">
                      Clean Session • No anomalies logged.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {selectedCandidate?.history.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-2xl bg-dark-950/90 border border-white/10 space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-bold text-white">
                                {ev.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">{ev.time}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                            <span className="text-[11px] text-slate-400">
                              Status: <strong className={
                                ev.status === 'CONFIRMED' ? 'text-rose-400' : ev.status === 'DISMISSED' ? 'text-emerald-400' : 'text-amber-400'
                              }>{ev.status}</strong>
                            </span>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewAction(ev.id, 'CONFIRMED')}
                                className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleReviewAction(ev.id, 'DISMISSED')}
                                className="px-2.5 py-1 bg-dark-800 hover:bg-dark-750 text-slate-300 border border-white/10 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-center text-[11px] text-slate-500">
                ExamGuard AI Risk Engine • Strict Human-in-the-Loop Protocol
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Multi-Student Matrix Grid (3-4 Cols Full Screen) */}
        {viewMode === 'grid' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Video Monitoring Grid ({processedCandidates.length} Active Feeds)
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">Synchronized Stream Matrix</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {processedCandidates.map((candidate) => {
                const isHighRisk = candidate.riskScore >= 40;
                const isDisqualified = candidate.status === 'DISQUALIFIED';

                return (
                  <div
                    key={candidate.id}
                    className={`glass-panel rounded-3xl overflow-hidden border transition relative group flex flex-col justify-between ${
                      isDisqualified
                        ? 'border-rose-900/50 bg-rose-950/20 opacity-60'
                        : isHighRisk
                        ? 'border-rose-500 shadow-glow-rose bg-rose-950/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Simulated Candidate Video Feed */}
                    <div className="relative aspect-video bg-dark-950 overflow-hidden">
                      <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-transparent to-black/40 pointer-events-none" />

                      {/* Corner Brackets */}
                      <div className="absolute inset-2 border border-white/10 pointer-events-none rounded-lg">
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-brand-400" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-brand-400" />
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-brand-400" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-brand-400" />
                      </div>

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="px-1.5 py-0.5 bg-dark-900/80 backdrop-blur rounded text-[9px] font-mono text-slate-300">
                          {candidate.id}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        {isDisqualified ? (
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                            TERMINATED
                          </span>
                        ) : (
                          getRiskBadge(candidate.riskScore)
                        )}
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
                        <span className="font-bold truncate max-w-[130px] drop-shadow">{candidate.name}</span>
                        <span className="text-[10px] font-mono text-slate-300">Mic: {candidate.audioLevel}%</span>
                      </div>
                    </div>

                    {/* Quick Action Matrix Footer */}
                    <div className="p-3.5 space-y-3 bg-dark-900/90">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Last Incident:</span>
                        <span className="text-slate-200 font-semibold">{candidate.lastEvent.replace(/_/g, ' ')}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setViewMode('split');
                          }}
                          className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>

                        <button
                          onClick={() => handleDownloadPDFReport(candidate.id, candidate.name)}
                          className="p-1.5 bg-dark-800 hover:bg-dark-750 text-slate-300 border border-white/10 rounded-xl transition cursor-pointer"
                          title="Export PDF Report"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 3: Compliance Table Mode */}
        {viewMode === 'table' && (
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Mic / Audio Level</th>
                  <th className="p-4">Last Detected Incident</th>
                  <th className="p-4">Risk Evaluation</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {processedCandidates.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-dark-850/80 transition"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${c.status === 'DISQUALIFIED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {c.audioLevel}% dB
                    </td>
                    <td className="p-4 text-slate-300">{c.lastEvent.replace(/_/g, ' ')}</td>
                    <td className="p-4">{getRiskBadge(c.riskScore)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCandidate(c);
                          setViewMode('split');
                        }}
                        className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleDownloadPDFReport(c.id, c.name)}
                        className="px-2.5 py-1 bg-dark-800 hover:bg-dark-750 text-slate-300 border border-white/10 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mass Broadcast Announcement Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Broadcast Announcement</h3>
                  <p className="text-xs text-slate-400">Transmits to all {candidates.length} active exam sessions</p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Announcement Message
                </label>
                <textarea
                  rows="3"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. 10 minutes remaining. Ensure your video stream is unblocked."
                  required
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-dark-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disqualification / Session Termination Modal */}
      {isTerminateModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 border border-rose-500/30 shadow-2xl space-y-4 shadow-glow-rose">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Disqualify & Terminate Session?</h3>
                <p className="text-xs text-slate-400">Candidate: {selectedCandidate?.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will immediately lock candidate <strong className="text-white">{selectedCandidate?.name}</strong> out of their exam session, revoke submission privileges, and log a permanent integrity penalty.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Integrity Infraction Reason
              </label>
              <textarea
                rows="2"
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsTerminateModalOpen(false)}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminateCandidate}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-glow-rose"
              >
                Confirm Termination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Studio Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/15 rounded-xl text-brand-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Create Examination & Question Bank</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  required
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                    min="5"
                    required
                    className="w-full bg-dark-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.randomizeQuestions}
                      onChange={(e) => setExamForm({ ...examForm, randomizeQuestions: e.target.checked })}
                      className="rounded bg-dark-950 border-white/10 text-brand-600 focus:ring-brand-500"
                    />
                    Randomize Question Shuffling
                  </label>
                </div>
              </div>

              {/* Question Bank */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Questions ({examForm.questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {examForm.questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-dark-950/80 border border-white/10 rounded-2xl space-y-3">
                      <span className="text-xs font-semibold text-brand-400">Question {qIndex + 1}</span>
                      <input
                        type="text"
                        placeholder="Enter statement..."
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...examForm.questions];
                          updated[qIndex].questionText = e.target.value;
                          setExamForm({ ...examForm, questions: updated });
                        }}
                        required
                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-dark-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-indigo transition cursor-pointer"
                >
                  Publish Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
