import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { Complaint } from '../../types';

export const EscalationQueuePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [escalatedComplaints, setEscalatedComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEscalated = async () => {
      setIsLoading(true);
      try {
        const data = await complaintRepository.getComplaints({}, currentUser);
        const flagged = data.complaints.filter(
          (c) => c.status === 'escalated' || c.isOverdue
        );
        setEscalatedComplaints(flagged);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEscalated();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>Priority Escalation Watchlist</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Escalation & Overdue Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Tickets that have breached target SLA deadlines or required administrative intervention
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Scanning escalation queue...</div>
          ) : escalatedComplaints.length === 0 ? (
            <EmptyState
              title="Escalation Queue Clear"
              description="No tickets in your department are currently overdue or escalated! All SLA targets are on track."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/60 border-b border-rose-200 text-rose-900 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Subject & Department</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Breach State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {escalatedComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/staff/complaints/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-rose-600 truncate block"
                        >
                          {c.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.departmentName} • {c.location.campusArea}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{c.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.studentRollNo}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        {c.isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Escalated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/staff/complaints/${c.id}`}>
                          <Button variant="danger" size="sm">
                            Resolve Urgently →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
