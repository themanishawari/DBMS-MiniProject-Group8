import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { registerStudent, isLoading: ctxLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !studentId) {
      setError('Name, college email, and student roll number are required.');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await registerStudent(name, email, studentId, phone || undefined, password || undefined);
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
          Student Account Enrollment
        </h2>
        <p className="text-xs text-slate-400">
          Create your verified student profile to submit grievances and track resolutions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional College Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="r.sharma@college.edu"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID / Roll Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="ENG-2024-CSE-042"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-slate-400 font-normal">(leave blank for default: password123)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {password && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <Button type="submit" size="md" className="w-full font-semibold" isLoading={busy}>
              Complete Enrollment
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500">Already have an institutional account? </span>
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
