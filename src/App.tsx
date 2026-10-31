import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Student Pages
import { MyComplaintsPage } from './pages/student/MyComplaintsPage';
import { StudentComplaintDetailPage } from './pages/student/StudentComplaintDetailPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { SubmitComplaintPage } from './pages/student/SubmitComplaintPage';

// Staff Pages
import { AssignedComplaintsPage } from './pages/staff/AssignedComplaintsPage';
import { DepartmentReportsPage } from './pages/staff/DepartmentReportsPage';
import { EscalationQueuePage } from './pages/staff/EscalationQueuePage';
import { StaffComplaintDetailPage } from './pages/staff/StaffComplaintDetailPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';

// Admin Pages
import { AdminComplaintDetailPage } from './pages/admin/AdminComplaintDetailPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllComplaintsPage } from './pages/admin/AllComplaintsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { CategoryManagementPage } from './pages/admin/CategoryManagementPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { SLASettingsPage } from './pages/admin/SLASettingsPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Dashboard Shell Layout */}
            <Route element={<AppLayout />}>
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/submit" element={<SubmitComplaintPage />} />
              <Route path="/student/complaints" element={<MyComplaintsPage />} />
              <Route path="/student/complaints/:id" element={<StudentComplaintDetailPage />} />
              <Route path="/student/notifications" element={<StudentNotificationsPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />

              {/* Department Staff Routes */}
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/assigned" element={<AssignedComplaintsPage />} />
              <Route path="/staff/complaints/:id" element={<StaffComplaintDetailPage />} />
              <Route path="/staff/escalations" element={<EscalationQueuePage />} />
              <Route path="/staff/reports" element={<DepartmentReportsPage />} />

              {/* Administrator Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<AllComplaintsPage />} />
              <Route path="/admin/complaints/:id" element={<AdminComplaintDetailPage />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/departments" element={<DepartmentManagementPage />} />
              <Route path="/admin/categories" element={<CategoryManagementPage />} />
              <Route path="/admin/sla" element={<SLASettingsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/settings" element={<SystemSettingsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
