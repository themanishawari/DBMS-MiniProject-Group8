import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  GraduationCap,
  LogOut,
  RefreshCw,
  RotateCcw,
  Shield,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { complaintRepository } from '../../repositories';

export const Navbar: React.FC = () => {
  const { currentUser, loginAsDemoUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleResetData = async () => {
    if (confirm('Reset all complaints, notifications, and demo records to initial seed data?')) {
      setIsResetting(true);
      await complaintRepository.resetToInitialSeed();
      setIsResetting(false);
      window.location.reload();
    }
  };

  const handleNotificationClick = async (notifId: string, complaintId?: string) => {
    await markAsRead(notifId);
    setShowNotifications(false);
    if (complaintId) {
      if (currentUser.role === 'student') {
        navigate(`/student/complaints/${complaintId}`);
      } else if (currentUser.role === 'staff') {
        navigate(`/staff/complaints/${complaintId}`);
      } else {
        navigate(`/admin/complaints/${complaintId}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-indigo-500 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight flex items-center gap-2">
                <span>CCMS</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.5 rounded">
                  Engineering Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                College Complaint Management System
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Fast Demo Switcher Bar */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
          <span className="text-slate-400 font-medium">Demo Mode:</span>
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-400'
                    : currentUser.role === 'staff'
                    ? 'bg-blue-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>{currentUser.name}</span>
              <span className="text-slate-400 text-[10px] uppercase">({currentUser.role})</span>
            </button>

            {showRoleSwitcher && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 z-50 text-slate-200">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Switch Active Role
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      loginAsDemoUser('student');
                      setShowRoleSwitcher(false);
                      navigate('/student/dashboard');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-700 cursor-pointer ${
                      currentUser.role === 'student' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">Rahul Sharma</p>
                      <p className="text-[10px] text-slate-400">Student (CSE Roll 042)</p>
                    </div>
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    onClick={() => {
                      loginAsDemoUser('it.staff@college.edu');
                      setShowRoleSwitcher(false);
                      navigate('/staff/dashboard');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-700 cursor-pointer ${
                      currentUser.email === 'it.staff@college.edu'
                        ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                        : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">Vikram Verma</p>
                      <p className="text-[10px] text-slate-400">IT Department Staff</p>
                    </div>
                    <Wrench className="w-4 h-4 text-blue-400" />
                  </button>

                  <button
                    onClick={() => {
                      loginAsDemoUser('maint.staff@college.edu');
                      setShowRoleSwitcher(false);
                      navigate('/staff/dashboard');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-700 cursor-pointer ${
                      currentUser.email === 'maint.staff@college.edu'
                        ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                        : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">Ramesh Chander</p>
                      <p className="text-[10px] text-slate-400">Maintenance Lead</p>
                    </div>
                    <Wrench className="w-4 h-4 text-amber-400" />
                  </button>

                  <button
                    onClick={() => {
                      loginAsDemoUser('admin');
                      setShowRoleSwitcher(false);
                      navigate('/admin/dashboard');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-700 cursor-pointer ${
                      currentUser.role === 'admin' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">Prof. David Miller</p>
                      <p className="text-[10px] text-slate-400">Dean / Administrator</p>
                    </div>
                    <Shield className="w-4 h-4 text-purple-400" />
                  </button>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-700">
                  <button
                    onClick={handleResetData}
                    disabled={isResetting}
                    className="w-full text-left px-2 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 hover:bg-slate-700 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>Reset Seed Data (22 Records)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.complaintId)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                          !notif.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <span
                          className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            !notif.isRead ? 'bg-indigo-600' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    to={
                      currentUser.role === 'student'
                        ? '/student/notifications'
                        : currentUser.role === 'staff'
                        ? '/staff/dashboard'
                        : '/admin/dashboard'
                    }
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View All Activity Updates →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Link
              to={
                currentUser.role === 'student'
                  ? '/student/profile'
                  : currentUser.role === 'staff'
                  ? '/staff/dashboard'
                  : '/admin/settings'
              }
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-semibold text-xs">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-medium text-slate-200 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{currentUser.role}</p>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Switch / Log out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
