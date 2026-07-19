import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Video,
  FileText,
  GitBranch,
  Settings,
  Zap,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  onLogout: () => void;
  userName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, userName }) => {
  return (
    <aside className="app-sidebar glass-panel">
      <div className="sidebar-logo">
        <Zap className="logo-icon" />
        <span className="logo-text glowing-text">Antigravity OS</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare className="nav-icon" />
          <span>Task Manager</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar className="nav-icon" />
          <span>AI Scheduler</span>
        </NavLink>
        <NavLink to="/meetings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video className="nav-icon" />
          <span>Meeting Scribe</span>
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText className="nav-icon" />
          <span>Study Desk</span>
        </NavLink>
        <NavLink to="/workflows" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <GitBranch className="nav-icon" />
          <span>Node Canvas</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `nav-item settings-item ${isActive ? 'active' : ''}`}>
          <Settings className="nav-icon" />
          <span>Settings</span>
        </NavLink>
        <div className="user-profile-badge">
          <div className="avatar-circle">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{userName || 'User'}</span>
            <span className="user-status">Online</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
