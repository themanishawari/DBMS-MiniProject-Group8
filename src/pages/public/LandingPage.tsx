import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  Lock,
  RotateCcw,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { loginAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = (role: string, targetPath: string) => {
    loginAsDemoUser(role);
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-indigo-600/90 text-white text-xs py-2 px-4 text-center font-medium">
        <span>Engineering College Complaint Management System (CCMS) — Production-Ready Prototype</span>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs px-3.5 py-1.5 rounded-full font-medium">
            <GraduationCap className="w-4 h-4" />
            <span>Digital Campus Redressal & Institutional Accountability</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Transparent, SLA-Driven Complaint Resolution for Modern Colleges
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Empower students to log campus grievances, trace real-time investigation timelines, and
            provide resolution ratings. Equip departments and administrative deans with centralized
            analytics, priority management, and automated SLA tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/login">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                Access Portal Login <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-slate-200 border-slate-700 hover:bg-slate-800">
                Student Registration
              </Button>
            </Link>
          </div>
        </div>

        {/* 1-Click Interactive Role Launcher for Demo Testing */}
        <div className="mt-16 pt-12 border-t border-slate-800/80">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white">Instant One-Click Role Demos</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any role below to instantly explore corresponding dashboards and workflows with pre-seeded data:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Student Role Card */}
            <div
              onClick={() => handleDemoLogin('student', '/student/dashboard')}
              className="bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500/80 hover:bg-slate-800 rounded-2xl p-6 text-left cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Student Portal</h3>
                <span className="text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                  Student
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Log Wi-Fi, lab, hostel, or exam complaints. Monitor timeline updates, chat with handlers,
                and give resolution star ratings.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Demo as Rahul Sharma</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Department Staff Card */}
            <div
              onClick={() => handleDemoLogin('it.staff@college.edu', '/staff/dashboard')}
              className="bg-slate-800/60 border border-slate-700/80 hover:border-blue-500/80 hover:bg-slate-800 rounded-2xl p-6 text-left cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Department Staff</h3>
                <span className="text-[10px] font-semibold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                  Staff / Handler
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                View department ticket queue, acknowledge complaints, record internal investigation notes,
                and submit verified resolution actions.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-blue-400">
                <span>Demo as Vikram Verma (IT)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Administrator Card */}
            <div
              onClick={() => handleDemoLogin('admin', '/admin/dashboard')}
              className="bg-slate-800/60 border border-slate-700/80 hover:border-purple-500/80 hover:bg-slate-800 rounded-2xl p-6 text-left cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">College Admin</h3>
                <span className="text-[10px] font-semibold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  Dean / Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Oversee campus-wide SLA metrics, reassign departments, configure escalation targets,
                audit activity logs, and export CSV reports.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-purple-400">
                <span>Demo as Prof. David Miller</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">Priority & SLA Targets</h4>
            <p className="text-xs text-slate-400 mt-1">
              Configurable 24h, 48h, 72h, and 120h target resolution clocks with auto-escalation alerts.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <Lock className="w-5 h-5 text-rose-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">Confidential Safeguards</h4>
            <p className="text-xs text-slate-400 mt-1">
              Safety & harassment grievances route through isolated permissions invisible to normal queues.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <BarChart3 className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">Institutional Analytics</h4>
            <p className="text-xs text-slate-400 mt-1">
              Identify recurring infrastructure hotspots, department resolution speeds, and student satisfaction.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <RotateCcw className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">PostgreSQL Ready</h4>
            <p className="text-xs text-slate-400 mt-1">
              Decoupled repository architecture with included migration schema script for instant FastAPI integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
