import React, { useEffect, useState } from 'react';
import { Building2, Edit, Mail, Phone, Plus, UserCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { Department } from '../../types';

export const DepartmentManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const list = await complaintRepository.getDepartments();
      setDepartments(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setHeadOfDepartment('');
    setContactEmail('');
    setContactPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description);
    setHeadOfDepartment(dept.headOfDepartment);
    setContactEmail(dept.contactEmail);
    setContactPhone(dept.contactPhone);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !contactEmail) return;

    if (editingDept) {
      await complaintRepository.updateDepartment(
        editingDept.id,
        {
          name,
          code,
          description,
          headOfDepartment,
          contactEmail,
          contactPhone,
        },
        currentUser
      );
    } else {
      await complaintRepository.createDepartment(
        {
          name,
          code,
          description,
          headOfDepartment,
          contactEmail,
          contactPhone,
          isActive: true,
          staffCount: 1,
        },
        currentUser
      );
    }
    setIsModalOpen(false);
    await fetchDepartments();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">College Departments & Authorities</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure department queues, HOD leadership, and contact escalation channels
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />}>
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader
              title={dept.name}
              subtitle={`Code: ${dept.code} • ${dept.staffCount} Staff Members`}
              action={
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
              }
            />
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">{dept.description}</p>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Head of Dept: <strong>{dept.headOfDepartment}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{dept.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{dept.contactPhone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Central Library Services"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="DEPT-LIB"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Scope</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities and services managed..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Head of Department / Lead</label>
            <input
              type="text"
              required
              value={headOfDepartment}
              onChange={(e) => setHeadOfDepartment(e.target.value)}
              placeholder="Dr. Meenakshi Sundaram"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="library@college.edu"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Helpline Phone Number</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98765 43214"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
