import React, { useState } from 'react';
import { CheckCircle2, GraduationCap, Mail, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

export const StudentProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile({ name, phone });
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Profile & Preferences</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your contact credentials for institutional resolution notifications
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile information updated successfully.</span>
        </div>
      )}

      <Card>
        <CardHeader title="Institutional Details" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Roll Number / ID
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  disabled
                  value={currentUser.studentId || 'ENG-2024-CSE-042'}
                  className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Roll number is verified via College Registrar Directory and cannot be altered.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
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

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit" size="sm" variant="primary" isLoading={isUpdating}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
