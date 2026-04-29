import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// User
import UserDashboard from './components/user/UserDashboard';
import ReportFaultForm from './components/user/ReportFaultForm';
import MyReports from './components/user/MyReports';
import EditReport from './components/user/EditReport';
import ReportDetailUser from './components/user/ReportDetailUser';

// Manager
import ManagerDashboard from './components/manager/ManagerDashboard';
import AssignedIssues from './components/manager/AssignedIssues';
import IssueDetailManager from './components/manager/IssueDetailManager';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AllIssues from './components/admin/AllIssues';
import IssueDetailAdmin from './components/admin/IssueDetailAdmin';
import UserManagement from './components/admin/UserManagement';
import ReportsDashboard from './components/admin/ReportsDashboard';

const RoleRedirect = () => {
  const { currentUser, userProfile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userProfile) return <Navigate to="/login" replace />;
  if (userProfile.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (userProfile.role === 'facility_manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* User routes */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/reports" element={<MyReports />} />
        <Route path="/user/reports/new" element={<ReportFaultForm />} />
        <Route path="/user/reports/:id" element={<ReportDetailUser />} />
        <Route path="/user/reports/:id/edit" element={<EditReport />} />
      </Route>

      {/* Manager routes */}
      <Route element={<ProtectedRoute allowedRoles={['facility_manager']} />}>
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/issues" element={<AssignedIssues />} />
        <Route path="/manager/issues/:id" element={<IssueDetailManager />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/issues" element={<AllIssues />} />
        <Route path="/admin/issues/:id" element={<IssueDetailAdmin />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/reports" element={<ReportsDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
