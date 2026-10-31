import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Engineering College Complaint Management System (CCMS). All rights reserved.</p>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>SLA Monitored</span>
          <span>•</span>
          <span>Confidential Redressal</span>
          <span>•</span>
          <span className="text-indigo-600 font-medium">PostgreSQL Ready v1.0</span>
        </div>
      </div>
    </footer>
  );
};
