import React, { useState } from 'react';
import { Database, Mail, RefreshCw, RotateCcw, Server, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { complaintRepository } from '../../repositories';

export const SystemSettingsPage: React.FC = () => {
  const currentProvider = (import.meta as any).env?.VITE_DATA_PROVIDER || 'mock';
  const currentApiUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  const [providerMode, setProviderMode] = useState<'mock' | 'api'>(currentProvider);
  const [apiUrl, setApiUrl] = useState(currentApiUrl);
  const [isResetting, setIsResetting] = useState(false);
  const [emailStubEnabled, setEmailStubEnabled] = useState(true);

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all data back to the clean 22 demonstration complaints and default categories?')) {
      setIsResetting(true);
      await complaintRepository.resetToInitialSeed();
      setIsResetting(false);
      alert('Demonstration database reset to initial seed state.');
      window.location.reload();
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Configuration noted. In production, configure environment variables in your .env file:
VITE_DATA_PROVIDER=${providerMode}
VITE_API_BASE_URL=${apiUrl}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Architecture & Data Provider Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure backend API endpoints, persistent storage layers, and development fixtures
        </p>
      </div>

      {/* Data Provider Configuration */}
      <Card>
        <CardHeader
          title="Data Access Layer Configuration"
          subtitle="Switch between local offline mock repository and production REST API client"
        />
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Active Data Provider Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProviderMode('mock')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    providerMode === 'mock'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">MOCK Mode (Active)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Seeded demonstration records persisted in browser localStorage with instantaneous state changes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProviderMode('api')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    providerMode === 'api'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900">REST API Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Connects directly to external FastAPI backend with PostgreSQL relational tables.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Backend API Base URL (For API Mode)
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" variant="primary">
                Save Provider Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email Notification Simulation */}
      <Card>
        <CardHeader
          title="Email Notification Delivery"
          subtitle="Notification pipeline status for status changes and ticket updates"
        />
        <CardContent className="space-y-3 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Simulated Email Logger Active</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                In this development prototype, in-app notifications are delivered immediately in real time, while email notifications are routed to the simulated console logger. Configure SMTP/SendGrid credentials when deploying to production.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={emailStubEnabled}
              onChange={(e) => setEmailStubEnabled(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-800">
              Output simulated email payloads to browser developer console
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Demonstration Data Maintenance */}
      <Card className="border-rose-200">
        <CardHeader
          title="Reset Demonstration Data"
          subtitle="Restore all complaint queues, comments, and audit logs to the initial 22 seed records"
        />
        <CardContent className="space-y-3 text-xs">
          <p className="text-slate-600">
            Use this action anytime duringPair-programming evaluations to reset the test database back to a clean initial state with verified data across all categories, departments, and priority levels.
          </p>

          <Button
            variant="danger"
            size="sm"
            onClick={handleResetData}
            isLoading={isResetting}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset to Initial Seed Data (22 Complaints)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
