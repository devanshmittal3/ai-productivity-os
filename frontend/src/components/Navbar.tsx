import React from 'react';
import { Search, Bell, Shield, BookOpen } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  return (
    <header className="app-navbar glass-panel">
      <div className="navbar-left">
        <h1 className="page-title glowing-text">{title}</h1>
      </div>

      <div className="navbar-right">
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search tasks, docs, meetings..."
            className="navbar-search-input"
          />
        </div>

        <button className="nav-action-btn" title="Focus Session Activity">
          <BookOpen size={20} />
        </button>

        <button className="nav-action-btn" title="System Security Status">
          <Shield size={20} className="security-icon-emerald" />
        </button>

        <div className="notification-bell-container">
          <button className="nav-action-btn" title="Notifications">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>
    </header>
  );
};
