import React, { useEffect, useState } from 'react';
import { History, Search, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { complaintRepository } from '../../repositories';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const list = await complaintRepository.getAuditLogs();
        setLogs(list);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-semibold mb-1">
          <History className="w-4 h-4" />
          <span>Security & Compliance Trail</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Institutional Audit & Activity Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Tamper-evident system activity records, status changes, assignments, and access checkpoints
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by actor, action code, ticket ID, or details..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading audit records...</div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              title="No Audit Records Found"
              description="No logs matching your current search criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Audit Details</th>
                    <th className="py-3 px-4 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-sans font-semibold text-slate-800">{log.userName}</span>{' '}
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 max-w-sm truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
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
