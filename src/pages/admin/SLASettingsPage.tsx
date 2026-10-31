import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Save, Shield } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { SLARule } from '../../types';

export const SLASettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [rules, setRules] = useState<SLARule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      setIsLoading(true);
      try {
        const list = await complaintRepository.getSLARules();
        setRules(list);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRules();
  }, []);

  const handleFieldChange = (priority: string, field: keyof SLARule, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.priority === priority ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await complaintRepository.updateSLARules(rules, currentUser);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading SLA rules...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SLA Deadlines & Escalation Thresholds</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional service level agreements, turnaround targets, and automated escalation timers
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          icon={<Save className="w-3.5 h-3.5" />}
        >
          Save SLA Configuration
        </Button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>SLA policies updated successfully across all department queues.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <Card key={rule.priority} className="overflow-hidden">
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        rule.priority === 'critical'
                          ? 'bg-rose-600'
                          : rule.priority === 'high'
                          ? 'bg-amber-500'
                          : rule.priority === 'medium'
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="capitalize font-bold text-slate-900">
                      {rule.priority} Priority SLA
                    </span>
                  </div>
                }
              />
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Acknowledgement Target (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={rule.acknowledgementTargetHours}
                    onChange={(e) =>
                      handleFieldChange(rule.priority, 'acknowledgementTargetHours', Number(e.target.value))
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Maximum time permitted for department staff to acknowledge receipt.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Resolution Target Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={240}
                    value={rule.resolutionTargetHours}
                    onChange={(e) =>
                      handleFieldChange(rule.priority, 'resolutionTargetHours', Number(e.target.value))
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Standard turnaround deadline before ticket is considered overdue.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Escalation Breach Threshold (Hours)
                  </label>
                  <input
                    type="number"
                    min={rule.resolutionTargetHours}
                    max={300}
                    value={rule.escalationThresholdHours}
                    onChange={(e) =>
                      handleFieldChange(rule.priority, 'escalationThresholdHours', Number(e.target.value))
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Duration after which ticket triggers immediate Dean / Administrator alert.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={rule.autoEscalate}
                      onChange={(e) =>
                        handleFieldChange(rule.priority, 'autoEscalate', e.target.checked)
                      }
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Enable Automated System Escalation on Breach
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </form>
    </div>
  );
};
