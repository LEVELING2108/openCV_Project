import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  Shield, UserCheck, GraduationCap, Lock, Mail, Cpu, Eye,
  CheckCircle2, ArrowRight, Activity, Sparkles, Zap, KeyRound
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('student@examguard.io');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('student');
  const { login, authLoading, authError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password, role);
    if (result && result.success) {
      if (role === 'examiner' || role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/exam');
      }
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
    <div className="min-h-screen stripe-mesh-bg flex items-center justify-center p-4 lg:p-8 relative overflow-hidden transition-colors duration-200">
      {/* Top Floating Bar with Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Stripe Subtle Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 dark:bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-stripe-lg dark:shadow-2xl overflow-hidden z-10">
        {/* Left Hero & Technology Showcase (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white dark:from-brand-900/40 dark:via-dark-900/80 dark:to-dark-950 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-indigo-600 dark:bg-brand-500/20 text-white dark:text-brand-400 rounded-2xl shadow-stripe-indigo">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  ExamGuard <span className="text-indigo-600 dark:text-brand-400 font-mono text-xs px-2 py-0.5 bg-indigo-50 dark:bg-brand-500/10 border border-indigo-200 dark:border-brand-500/30 rounded-md">AI 2.0</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent Examination Integrity</p>
              </div>
            </div>

            <div className="space-y-3.5 my-8">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 shadow-sm">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">YOLOv8 + Hybrid Multi-Cascade</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sub-50ms neural inference with multi-stage lighting adaptive face fusion.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 shadow-sm">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Acoustic FFT & Dynamic Scoring</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time RMS decibel voice activity detection with priority risk queue.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 shadow-sm">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Tamper-Evident Vector PDF Audit</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Instant PDF certificate generation with chronological incident timeline.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">Stripe Edition • 2026</span>
          </div>
        </div>

        {/* Right Authentication Form (7 Cols) */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-dark-900">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-brand-500/10 border border-indigo-200 dark:border-brand-500/20 text-indigo-600 dark:text-brand-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Proctoring Engine</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sign in to your portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your account role or choose a pre-configured quick login.
              </p>
            </div>

            {/* Quick Role Switcher Buttons */}
            <div className="grid grid-cols-3 gap-2.5 p-1.5 bg-slate-100 dark:bg-dark-950/70 rounded-2xl border border-slate-200/80 dark:border-white/5">
              <button
                type="button"
                onClick={() => setDemoRole('student')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  role === 'student'
                    ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-transparent font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('examiner')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  role === 'examiner'
                    ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-transparent font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Examiner</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('admin')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-transparent font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Error banner if any */}
            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {authError}
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Security Password
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-brand-400 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#635bff] hover:bg-[#5851ea] text-white text-xs font-semibold rounded-xl shadow-stripe-indigo hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                <span>{authLoading ? 'Verifying Credentials...' : `Enter as ${role.toUpperCase()}`}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            <div className="p-3 bg-slate-50 dark:bg-dark-950/50 rounded-2xl border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                Default password: <strong className="text-slate-700 dark:text-slate-200 font-mono">password123</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bcrypt Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
