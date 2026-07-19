import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CopilotPanel } from './CopilotPanel';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  activeTitle: string;
  userName: string;
  authToken: string;
  apiBaseUrl: string;
  onLogout: () => void;
  onApplyScheduleBlock: (payload: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTitle,
  userName,
  authToken,
  apiBaseUrl,
  onLogout,
  onApplyScheduleBlock
}) => {
  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <Sidebar userName={userName} onLogout={onLogout} />

      {/* Center Main Viewport */}
      <div className="app-main-container">
        <Navbar title={activeTitle} />
        <main className="app-content-body">
          {children}
        </main>
      </div>

      {/* Right Copilot Sidebar */}
      <CopilotPanel
        authToken={authToken}
        apiBaseUrl={apiBaseUrl}
        onApplyScheduleBlock={onApplyScheduleBlock}
      />
    </div>
  );
};
