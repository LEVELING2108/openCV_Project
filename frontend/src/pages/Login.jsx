import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, GraduationCap, Lock, Mail } from 'lucide-react';

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
      token: 'demo-jwt-token',
    };
    login(demoUser);
    if (role === 'examiner' || role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/exam');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ExamGuard AI</h1>
            <p className="text-xs text-slate-400">Examination Integrity & Proctoring</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setEmail('student@examguard.io');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition ${
                  role === 'student'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('examiner');
                  setEmail('examiner@examguard.io');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition ${
                  role === 'examiner'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Examiner
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-600/25 transition"
          >
            Enter {role === 'student' ? 'Exam Room' : 'Monitoring Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
