import React, { useEffect, useState } from 'react';
import { complaintRepository } from '../../repositories';
import { Complaint, Department, User } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface AssignHandlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint;
  onAssign: (departmentId: string, departmentName: string, staffId?: string, staffName?: string, remarks?: string) => Promise<void>;
}

export const AssignHandlerModal: React.FC<AssignHandlerModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onAssign,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState(complaint.departmentId);
  const [selectedStaffId, setSelectedStaffId] = useState(complaint.assignedStaffId || '');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [depts, users] = await Promise.all([
        complaintRepository.getDepartments(),
        complaintRepository.getUsers(),
      ]);
      setDepartments(depts.filter((d) => d.isActive));
      setAllUsers(users);
    };
    if (isOpen) {
      fetchData();
      setSelectedDeptId(complaint.departmentId);
      setSelectedStaffId(complaint.assignedStaffId || '');
    }
  }, [isOpen, complaint]);

  const departmentStaff = allUsers.filter(
    (u) => u.role === 'staff' && u.departmentId === selectedDeptId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dept = departments.find((d) => d.id === selectedDeptId);
      const staff = allUsers.find((u) => u.id === selectedStaffId);

      await onAssign(
        selectedDeptId,
        dept?.name || complaint.departmentName,
        staff?.id,
        staff?.name,
        remarks
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign / Reassign Complaint" subtitle={`Ticket: ${complaint.id}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Department
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setSelectedStaffId(''); // reset staff selection
            }}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Specific Staff Handler
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Unassigned (Department Queue) --</option>
            {departmentStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          {departmentStaff.length === 0 && (
            <p className="text-[10px] text-amber-600 mt-1">
              No staff members explicitly mapped to this department yet. Will route to department lead.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Assignment Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add handover instructions or reason for reassignment..."
            rows={2}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
