import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { CalendarView } from './views/CalendarView';
import { MeetingsView } from './views/MeetingsView';
import { DocumentsView } from './views/DocumentsView';
import { WorkflowsView } from './views/WorkflowsView';
import { SettingsView } from './views/SettingsView';
import { resolveApiBaseUrl } from './config/api';

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('authUserId'));
  const [userName, setUserName] = useState<string>(localStorage.getItem('authUserName') || '');
  const [telemetryTrigger, setTelemetryTrigger] = useState(0);

  const location = useLocation();

  useEffect(() => {
    if (userId) {
      console.log("Session verified for user:", userId);
    }
  }, [userId]);

  // Clear or Set Auth State
  const handleAuthSuccess = (newToken: string, newUserId: string, newUserName: string) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUserId', newUserId);
    localStorage.setItem('authUserName', newUserName);
    setToken(newToken);
    setUserId(newUserId);
    setUserName(newUserName);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserId');
    localStorage.removeItem('authUserName');
    setToken(null);
    setUserId(null);
    setUserName('');
  };

  const handleRefreshTelemetry = () => {
    setTelemetryTrigger(prev => prev + 1);
  };

  // Right panel callback to place recommended calendar block
  const handleApplyScheduleBlock = async (payload: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: payload.title || 'Focus Period Block',
          startTime: payload.startTime,
          endTime: payload.endTime,
          isFocusBlock: true
        })
      });
      if (res.ok) {
        handleRefreshTelemetry();
      }
    } catch (err) {
      console.error("Failed to apply recommendation block", err);
    }
  };

  // Determine current page title
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard Overview';
      case '/tasks': return 'Workspace Task Backlog';
      case '/calendar': return 'AI Smart Scheduler';
      case '/meetings': return 'Meeting Scribe';
      case '/documents': return 'Study Desk & Document Intelligence';
      case '/workflows': return 'Visual Automation Canvas';
      case '/settings': return 'System Settings';
      default: return 'Antigravity OS';
    }
  };

  if (!token) {
    return <AuthView onAuthSuccess={handleAuthSuccess} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <Layout
      activeTitle={getPageTitle(location.pathname)}
      userName={userName}
      authToken={token}
      apiBaseUrl={API_BASE_URL}
      onLogout={handleLogout}
      onApplyScheduleBlock={handleApplyScheduleBlock}
    >
      <Routes>
        <Route
          path="/dashboard"
          element={
            <DashboardView
              key={telemetryTrigger}
              authToken={token}
              apiBaseUrl={API_BASE_URL}
              onNavigate={(route) => window.history.pushState(null, '', route)}
            />
          }
        />
        <Route
          path="/tasks"
          element={
            <TasksView
              authToken={token}
              apiBaseUrl={API_BASE_URL}
              onRefreshTelemetry={handleRefreshTelemetry}
            />
          }
        />
        <Route
          path="/calendar"
          element={
            <CalendarView
              authToken={token}
              apiBaseUrl={API_BASE_URL}
              onRefreshTelemetry={handleRefreshTelemetry}
            />
          }
        />
        <Route
          path="/meetings"
          element={
            <MeetingsView
              authToken={token}
              apiBaseUrl={API_BASE_URL}
              onRefreshTelemetry={handleRefreshTelemetry}
            />
          }
        />
        <Route
          path="/documents"
          element={
            <DocumentsView
              authToken={token}
              apiBaseUrl={API_BASE_URL}
            />
          }
        />
        <Route
          path="/workflows"
          element={
            <WorkflowsView
              authToken={token}
              apiBaseUrl={API_BASE_URL}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsView
              authToken={token}
              apiBaseUrl={API_BASE_URL}
              onRefreshTelemetry={handleRefreshTelemetry}
            />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
