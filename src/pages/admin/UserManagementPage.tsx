import React, { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Search, Shield, UserCheck, UserX, Users } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { Department, Role, User } from '../../types';

export const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('student');
  const [newStudentId, setNewStudentId] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deactivate User Dialog
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        complaintRepository.getUsers(),
        complaintRepository.getDepartments(),
      ]);
      setUsers(uList);
      setDepartments(dList);
      if (dList.length > 0) setNewDeptId(dList[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setIsSubmitting(true);
    try {
      const dept = departments.find((d) => d.id === newDeptId);
      await complaintRepository.createUser(
        {
          name: newName,
          email: newEmail,
          role: newRole,
          studentId: newRole === 'student' ? newStudentId : undefined,
          departmentId: newRole === 'staff' ? newDeptId : undefined,
          departmentName: newRole === 'staff' ? dept?.name : undefined,
          phone: newPhone,
          isActive: true,
        },
        currentUser
      );
      setIsAddUserOpen(false);
      setNewName('');
      setNewEmail('');
      setNewStudentId('');
      setNewPhone('');
      await fetchUsers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!deactivateUser) return;
    await complaintRepository.updateUser(
      deactivateUser.id,
      { isActive: !deactivateUser.isActive },
      currentUser
    );
    setDeactivateUser(null);
    await fetchUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User & Role Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student directories, departmental staff accounts, and administrator privileges
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddUserOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add New User Account
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, institutional email, roll number, or department..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="student">Students ({users.filter((u) => u.role === 'student').length})</option>
              <option value="staff">Staff ({users.filter((u) => u.role === 'staff').length})</option>
              <option value="admin">Administrators ({users.filter((u) => u.role === 'admin').length})</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department / Roll No</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : u.role === 'staff'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'student' ? (
                        <span className="font-mono text-slate-600">{u.studentId || 'N/A'}</span>
                      ) : (
                        <span className="text-slate-600">{u.departmentName || 'Administration'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivateUser(u)}
                          className={u.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600'}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Provision New User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['student', 'staff', 'admin'] as Role[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setNewRole(r)}
                  className={`py-2 text-xs font-medium rounded-lg border capitalize cursor-pointer ${
                    newRole === r
                      ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Dr. Rajesh Saxena"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="r.saxena@college.edu"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {newRole === 'student' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Roll Number</label>
              <input
                type="text"
                required
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                placeholder="ENG-2024-MECH-022"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {newRole === 'staff' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
              <select
                value={newDeptId}
                onChange={(e) => setNewDeptId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 98000 11223"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate User Dialog */}
      <ConfirmDialog
        isOpen={!!deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onConfirm={handleToggleActive}
        title={`${deactivateUser?.isActive ? 'Deactivate' : 'Reactivate'} User Account?`}
        description={`Are you sure you want to ${
          deactivateUser?.isActive ? 'deactivate' : 'reactivate'
        } ${deactivateUser?.name} (${deactivateUser?.email})?`}
        confirmLabel={deactivateUser?.isActive ? 'Deactivate User' : 'Reactivate User'}
        isDestructive={deactivateUser?.isActive}
      />
    </div>
  );
};
