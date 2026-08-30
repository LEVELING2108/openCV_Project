import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, GraduationCap, Lock, Mail, Cpu, Eye, CheckCircle2, ArrowRight, Activity, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('student@examguard.io');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('student');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const demoUser = {
      _id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: role === 'student' ? 'Alex Rivera' : 'Prof. Marcus Vance',
      email,
      role,
      token: 'jwt_secure_session_token_' + Date.now(),
    };
    login(demoUser);
    if (role === 'examiner' || role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/exam');
    }
  };

  const setDemoRole = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'student') {
      setEmail('student@examguard.io');
    } else if (selectedRole === 'examiner') {
      setEmail('examiner@examguard.io');
    } else {
      setEmail('admin@examguard.io');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10">
        {/* Left Hero & Technology Showcase (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-brand-900/40 via-dark-900/80 to-dark-950 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-brand-500/20 border border-brand-500/40 rounded-xl text-brand-400 shadow-glow-indigo">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  ExamGuard <span className="text-brand-400 font-mono text-xs px-2 py-0.5 bg-brand-500/10 border border-brand-500/30 rounded-md">AI 2.0</span>
                </h1>
                <p className="text-xs text-slate-400">Examination Integrity & Proctoring</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">YOLOv8 + OpenCV AI Engine</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Multi-tier computer vision with temporal false-positive confirmation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Real-Time Risk Scoring</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Explainable telemetry with decay rules and live WebSockets stream.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0 mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Human-In-The-Loop Review</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Examiner verification workflows with thumbnail evidence logs.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Microservices Online
            </span>
            <span className="font-mono text-[11px] text-slate-500">v1.2.0 • Secure</span>
          </div>
        </div>

        {/* Right Authentication Form (7 Cols) */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-dark-900/60">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Access Control Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Select your account role and authenticate to proceed.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Persona / Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDemoRole('student')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    role === 'student'
                      ? 'bg-brand-600/15 border-brand-500 text-white shadow-glow-indigo ring-1 ring-brand-500/50'
                      : 'bg-dark-850/60 border-white/5 text-slate-400 hover:bg-dark-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'student' ? 'bg-brand-600 text-white' : 'bg-dark-800 text-slate-400'}`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Student Portal</p>
                    <p className="text-[11px] text-slate-400">Join & Take Exams</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoRole('examiner')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    role === 'examiner'
                      ? 'bg-brand-600/15 border-brand-500 text-white shadow-glow-indigo ring-1 ring-brand-500/50'
                      : 'bg-dark-850/60 border-white/5 text-slate-400 hover:bg-dark-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'examiner' ? 'bg-brand-600 text-white' : 'bg-dark-800 text-slate-400'}`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Examiner Console</p>
                    <p className="text-[11px] text-slate-400">Live Surveillance</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl shadow-glow-indigo transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Launch {role === 'student' ? 'Examination Room' : 'Command Center'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
