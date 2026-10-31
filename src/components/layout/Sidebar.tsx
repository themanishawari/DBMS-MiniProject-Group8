import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertOctagon,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CheckSquare,
  Clock,
  FileCheck2,
  FilePlus2,
  FolderTree,
  History,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/student/submit', label: 'Submit Complaint', icon: <FilePlus2 className="w-4 h-4" /> },
    { to: '/student/complaints', label: 'My Complaints', icon: <FileCheck2 className="w-4 h-4" /> },
    { to: '/student/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { to: '/student/profile', label: 'Student Profile', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const staffLinks = [
    { to: '/staff/dashboard', label: 'Dept Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/staff/assigned', label: 'Assigned Complaints', icon: <CheckSquare className="w-4 h-4" /> },
    { to: '/staff/escalations', label: 'Escalation Queue', icon: <AlertOctagon className="w-4 h-4" /> },
    { to: '/staff/reports', label: 'Department Reports', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/admin/complaints', label: 'All Complaints', icon: <FileCheck2 className="w-4 h-4" /> },
    { to: '/admin/analytics', label: 'Institutional Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/admin/departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { to: '/admin/categories', label: 'Categories & Subcategories', icon: <FolderTree className="w-4 h-4" /> },
    { to: '/admin/users', label: 'User & Role Permissions', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/sla', label: 'SLA & Escalation Rules', icon: <Clock className="w-4 h-4" /> },
    { to: '/admin/audit-logs', label: 'Audit & History Logs', icon: <History className="w-4 h-4" /> },
    { to: '/admin/settings', label: 'System & Data Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const links =
    currentUser.role === 'admin'
      ? adminLinks
      : currentUser.role === 'staff'
      ? staffLinks
      : studentLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-5 px-3">
      <div>
        {/* User Role Banner */}
        <div className="px-3 mb-4">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              Active Portal
            </span>
            <h4 className="text-sm font-semibold text-white capitalize mt-0.5">
              {currentUser.role === 'admin'
                ? 'College Administrator'
                : currentUser.role === 'staff'
                ? `${currentUser.departmentName || 'Department Staff'}`
                : 'Student Portal'}
            </h4>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <span className="shrink-0">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sensitive Portal Notice for Proctors/Admins */}
      <div className="px-3 pt-4 border-t border-slate-800">
        <div className="bg-rose-950/30 border border-rose-800/30 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Confidential Channel</p>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Harassment & safety complaints route through restricted protocols.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
