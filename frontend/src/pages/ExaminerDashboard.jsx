import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, AlertTriangle, CheckCircle, XCircle, Search, Filter, Plus, Clock, BookOpen, Trash2 } from 'lucide-react';

const INITIAL_CANDIDATES = [
  {
    id: 'cand_1',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    status: 'ACTIVE',
    riskScore: 40,
    lastEvent: 'PHONE_DETECTED',
    lastEventTime: '2 mins ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    history: [
      { id: 'ev_1', type: 'PHONE_DETECTED', weight: 40, time: '10:42:15 AM', status: 'UNREVIEWED' }
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
      { id: 'ev_2', type: 'MULTIPLE_FACES', weight: 30, time: '10:39:00 AM', status: 'UNREVIEWED' }
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
      { id: 'ev_3', type: 'FACE_MISSING', weight: 15, time: '10:32:10 AM', status: 'CONFIRMED' }
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Exam Form State
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

  const getRiskBadge = (score) => {
    if (score >= 40) {
      return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold">High Risk ({score} pts)</span>;
    }
    if (score >= 20) {
      return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold">Medium Risk ({score} pts)</span>;
    }
    if (score > 0) {
      return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold">Low Risk ({score} pts)</span>;
    }
    return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold">Normal (0 pts)</span>;
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
    alert(`Exam "${examForm.title}" created successfully with ${examForm.questions.length} questions!`);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Examiner Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Examiner Command Console</h1>
            <p className="text-xs text-slate-400">Exam: CS402 Data Structures & Algorithms</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Exam
          </button>

          <div className="text-right">
            <p className="text-xs font-medium text-slate-200">{user?.name || 'Examiner Marcus'}</p>
            <p className="text-[11px] text-slate-400">Role: Senior Proctor</p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 max-w-7xl mx-auto w-full">
        {/* Candidates Live Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Active Exam Sessions ({candidates.length})</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterRisk(filterRisk === 'ALL' ? 'HIGH' : 'ALL')}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filter: {filterRisk}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidates.map((candidate) => {
              const isSelected = selectedCandidate.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{candidate.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{candidate.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-xs text-slate-400">{candidate.lastEventTime}</span>
                    {getRiskBadge(candidate.riskScore)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Candidate Audit & Review Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedCandidate.name}</h3>
                <p className="text-xs text-slate-400">Session ID: {selectedCandidate.id}</p>
              </div>
              {getRiskBadge(selectedCandidate.riskScore)}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Proctoring Event Timeline
                </h4>
                {selectedCandidate.history.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                    No suspicious anomalies detected in this session.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCandidate.history.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-slate-200">
                              {ev.type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{ev.time}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                          <span className="text-[11px] text-slate-400">
                            Status: <strong className={ev.status === 'CONFIRMED' ? 'text-rose-400' : ev.status === 'DISMISSED' ? 'text-emerald-400' : 'text-amber-400'}>{ev.status}</strong>
                          </span>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReviewAction(ev.id, 'CONFIRMED')}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium transition"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleReviewAction(ev.id, 'DISMISSED')}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px] font-medium transition"
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
          </div>

          <div className="pt-4 border-t border-slate-800 mt-6 text-xs text-slate-500 text-center">
            ExamGuard AI Risk Engine • Human-in-the-loop review policy
          </div>
        </div>
      </div>

      {/* Create Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Create New Examination</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                    min="5"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.randomizeQuestions}
                      onChange={(e) => setExamForm({ ...examForm, randomizeQuestions: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    Randomize Question Sequence
                  </label>
                </div>
              </div>

              {/* Questions Section */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Question Bank ({examForm.questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {examForm.questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-indigo-400">Question {qIndex + 1}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter question statement..."
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...examForm.questions];
                          updated[qIndex].questionText = e.target.value;
                          setExamForm({ ...examForm, questions: updated });
                        }}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm"
                >
                  Save & Publish Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
