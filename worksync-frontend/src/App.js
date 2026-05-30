import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { useDarkMode } from './hooks/useDarkMode';

import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import DashboardPage     from './pages/DashboardPage';
import ProjectsPage      from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskDetailPage    from './pages/TaskDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage     from './pages/AnalyticsPage';
import ProfilePage       from './pages/ProfilePage';
import LeaderboardPage   from './pages/LeaderboardPage';
import AppLayout         from './components/layout/AppLayout';

// Applies data-theme to <html> once on mount, keeps in sync
function ThemeInit() {
  const [dark] = useDarkMode();
  useEffect(() => {
    if (dark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [dark]);
  return null;
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-base)' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <CommandPaletteProvider>
        <ThemeInit />
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"                           element={<DashboardPage />} />
              <Route path="projects"                            element={<ProjectsPage />} />
              <Route path="projects/:projectId"                 element={<ProjectDetailPage />} />
              <Route path="projects/:projectId/tasks/:taskId"   element={<TaskDetailPage />} />
              <Route path="notifications"                       element={<NotificationsPage />} />
              <Route path="analytics/:projectId"                element={<AnalyticsPage />} />
              <Route path="leaderboard/:projectId"              element={<LeaderboardPage />} />
              <Route path="profile"                             element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-layer)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-bright)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                padding: '12px 16px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: 'rgba(16,185,129,0.15)' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: 'rgba(239,68,68,0.15)' } },
            }}
          />
        </BrowserRouter>
      </CommandPaletteProvider>
    </AuthProvider>
  );
}
