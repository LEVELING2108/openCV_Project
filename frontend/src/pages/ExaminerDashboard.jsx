import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Users, AlertTriangle, CheckCircle, XCircle, Search, Filter,
  Plus, Clock, BookOpen, Trash2, Bell, Radio, LayoutGrid, List,
  Send, UserX, Smartphone, EyeOff, Check, X, ShieldAlert, Sparkles, ExternalLink
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
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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
    lastEventTime: '5 mins ago',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_2', type: 'MULTIPLE_FACES', weight: 30, confidence: 0.88, time: '10:39:00 AM', status: 'UNREVIEWED' }
    ]
  },
  {
    id: 'cand_3',
    name: 'David Miller',
    email: 'david.m@university.edu',
    status: 'ACTIVE',
    riskScore: 15,
    lastEvent: 'FACE_MISSING',
    lastEventTime: '12 mins ago',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_3', type: 'FACE_MISSING', weight: 15, confidence: 0.99, time: '10:32:10 AM', status: 'CONFIRMED' }
    ]
  },
  {
    id: 'cand_4',
    name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    status: 'ACTIVE',
    riskScore: 0,
    lastEvent: 'None',
    lastEventTime: 'Clean Session',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    history: []
  },
];

export default function ExaminerDashboard() {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState(INITIAL_CANDIDATES[0]);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState('Connecting');
  const [warningMessage, setWarningMessage] = useState('');

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
            if (selectedCandidate.id === c.id) {
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
  }, [selectedCandidate.id, user]);

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

  const filteredCandidates = candidates.filter((c) => {
    const matchesRisk =
      filterRisk === 'ALL'
        ? true
        : filterRisk === 'HIGH'
        ? c.riskScore >= 40
        : filterRisk === 'MEDIUM'
        ? c.riskScore >= 20 && c.riskScore < 40
        : c.riskScore === 0;

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  const highRiskCount = candidates.filter((c) => c.riskScore >= 40).length;
  const normalCount = candidates.filter((c) => c.riskScore === 0).length;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Console Navigation Bar */}
      <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
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
            <p className="text-[11px] text-slate-400">Exam: CS402 Data Structures & Algorithms</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-dark-950/80 border border-white/10 text-xs">
            <Radio className={`w-3.5 h-3.5 ${socketStatus === 'Live' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              Gateway: <strong className={socketStatus === 'Live' ? 'text-emerald-400' : 'text-amber-400'}>{socketStatus}</strong>
            </span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-indigo transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </button>

          <div className="text-right border-l border-white/10 pl-4">
            <p className="text-xs font-semibold text-white">{user?.name || 'Prof. Marcus Vance'}</p>
            <p className="text-[11px] text-brand-400 font-medium">Chief Examiner</p>
          </div>

          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:bg-dark-800 transition cursor-pointer"
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
              <p className="text-xs text-slate-400 font-medium">Active Sessions</p>
              <h3 className="text-2xl font-bold text-white mt-1">{candidates.length}</h3>
            </div>
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">High Risk Alerts</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{highRiskCount}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Clean Sessions</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{normalCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">AI Inference Rate</p>
              <h3 className="text-2xl font-bold text-indigo-300 mt-1">0.5 Hz</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by candidate name, email, or session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterRisk('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterRisk === 'ALL' ? 'bg-brand-600 text-white shadow-glow-indigo' : 'bg-dark-900 text-slate-400 hover:bg-dark-800'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilterRisk('HIGH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterRisk === 'HIGH' ? 'bg-rose-600 text-white shadow-glow-rose' : 'bg-dark-900 text-slate-400 hover:bg-dark-800'
              }`}
            >
              High Risk ({highRiskCount})
            </button>
            <button
              onClick={() => setFilterRisk('NORMAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterRisk === 'NORMAL' ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'bg-dark-900 text-slate-400 hover:bg-dark-800'
              }`}
            >
              Clean ({normalCount})
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <div className="flex rounded-xl bg-dark-950/80 border border-white/10 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-dark-800 text-white' : 'text-slate-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-dark-800 text-white' : 'text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Candidate Grid (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCandidates.map((candidate) => {
                  const isSelected = selectedCandidate.id === candidate.id;
                  const isHighRisk = candidate.riskScore >= 40;

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`p-5 rounded-3xl border cursor-pointer transition relative overflow-hidden ${
                        isSelected
                          ? 'bg-dark-900/90 border-brand-500 shadow-glow-indigo ring-1 ring-brand-500/50'
                          : 'glass-panel hover:border-white/20'
                      }`}
                    >
                      {/* Risk glow indicator banner */}
                      {isHighRisk && (
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse" />
                      )}

                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="relative">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className={`w-12 h-12 rounded-2xl object-cover border-2 ${
                              isHighRisk ? 'border-rose-500 shadow-glow-rose' : 'border-white/10'
                            }`}
                          />
                          <span className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-dark-950 ${
                            candidate.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{candidate.name}</h3>
                          <p className="text-xs text-slate-400 truncate">{candidate.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                        <span className="text-slate-400 text-[11px] font-mono">{candidate.lastEventTime}</span>
                        {getRiskBadge(candidate.riskScore)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table Mode */
              <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-4">Candidate</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Last Event</th>
                      <th className="p-4">Risk Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredCandidates.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidate(c)}
                        className={`hover:bg-dark-850/80 cursor-pointer transition ${selectedCandidate.id === c.id ? 'bg-brand-600/10' : ''}`}
                      >
                        <td className="p-4 font-medium text-white">{c.name}</td>
                        <td className="p-4">
                          <span className="text-emerald-400 font-medium">ACTIVE</span>
                        </td>
                        <td className="p-4 text-slate-400">{c.lastEvent}</td>
                        <td className="p-4">{getRiskBadge(c.riskScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Incident Audit & Inspection Drawer (5 Cols) */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Session ID: {selectedCandidate.id}</p>
                </div>
                {getRiskBadge(selectedCandidate.riskScore)}
              </div>

              {/* In-Exam Warning Broadcast Form */}
              <form onSubmit={handleSendWarning} className="mb-6 p-3.5 bg-dark-950/70 border border-white/10 rounded-2xl space-y-2.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Send Instant In-Exam Notice
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Please put away your mobile device..."
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </form>

              {/* Incident Event Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Proctoring Incident Stream
                </h4>
                {selectedCandidate.history.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-dark-950/50 border border-white/5 text-center text-xs text-slate-500">
                    No suspicious anomalies detected in this session.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedCandidate.history.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl bg-dark-950/90 border border-white/10 space-y-3 shadow-sm"
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
      </div>

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
