import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, loginAsDemoUser, isLoading: ctxLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectForRole = (role: Role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'staff') navigate('/staff/dashboard');
    else navigate('/student/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your institutional email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithCredentials(email, password);
      // Retrieve the role from the stored user after login
      const saved = localStorage.getItem('ccms_session_user');
      if (saved) {
        const user = JSON.parse(saved);
        redirectForRole(user.role as Role);
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, path: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDemoUser(demoEmail, 'password123');
      navigate(path);
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const busy = isLoading || ctxLoading;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2.5 text-white">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-2xl font-black tracking-tight">CCMS</span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">
          College Complaint Management Portal
        </h2>
        <p className="text-xs text-slate-400">
          Sign in to report campus issues or track department resolution workflows
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <Button type="submit" size="md" className="w-full font-semibold" isLoading={busy}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Demo Accounts (password: password123)
            </p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleQuickDemo('rahul.sharma@college.edu', '/student/dashboard')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    S
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Rahul Sharma (Student)</p>
                    <p className="text-[10px] text-slate-500">rahul.sharma@college.edu</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Demo Student →
                </span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleQuickDemo('it.staff@college.edu', '/staff/dashboard')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    IT
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Vikram Verma (IT Staff)</p>
                    <p className="text-[10px] text-slate-500">it.staff@college.edu</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Demo Staff →
                </span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleQuickDemo('admin@college.edu', '/admin/dashboard')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Prof. David Miller (Admin)</p>
                    <p className="text-[10px] text-slate-500">admin@college.edu</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Demo Admin →
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Don't have an account? Register as a Student
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
