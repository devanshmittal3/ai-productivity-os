import React, { useState, useEffect } from 'react';
import { Settings, Save, User, Clock, ShieldAlert } from 'lucide-react';
import './SettingsView.css';

interface SettingsViewProps {
  authToken: string;
  apiBaseUrl: string;
  onRefreshTelemetry: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  authToken,
  apiBaseUrl,
  onRefreshTelemetry
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('professional');

  // Time metrics
  const [workHoursStart, setWorkHoursStart] = useState('09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState('17:00');
  const [focusSessionDuration, setFocusSessionDuration] = useState(25);
  const [burnoutThresholdHours, setBurnoutThresholdHours] = useState(40);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setRole(data.role || 'professional');

        // Extract settings
        const settings = data.settings || {};
        setWorkHoursStart(settings.workHoursStart || '09:00');
        setWorkHoursEnd(settings.workHoursEnd || '17:00');
        setFocusSessionDuration(settings.focusSessionDuration || 25);
        setBurnoutThresholdHours(settings.burnoutThresholdHours || 40);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [authToken]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch(`${apiBaseUrl}/auth/me/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          workHoursStart,
          workHoursEnd,
          focusSessionDuration,
          burnoutThresholdHours
        })
      });

      if (res.ok) {
        setSuccessMsg('Settings updated successfully!');
        onRefreshTelemetry();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading-state">Syncing account configuration...</div>;
  }

  return (
    <div className="settings-view">
      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-section-card glass-card">
          <div className="section-header-row">
            <User className="sec-icon" size={16} />
            <h3 className="section-title">Identity & Profile</h3>
          </div>

          <div className="profile-details-display">
            <div className="avatar-circle-large">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-meta-display">
              <span className="profile-name-lbl">{name || 'User Name'}</span>
              <span className="profile-email-lbl">{email}</span>
              <span className="profile-role-tag">{role}</span>
            </div>
          </div>
          <div className="security-notice">
            Your login identity is securely verified using JWT token auth headers.
          </div>
        </div>

        {/* Configurations Form */}
        <div className="settings-section-card glass-card">
          <div className="section-header-row">
            <Settings className="sec-icon" size={16} />
            <h3 className="section-title">Telemetry & Rules</h3>
          </div>

          {successMsg && <div className="settings-success-banner">{successMsg}</div>}

          <form onSubmit={handleSaveSettings} className="settings-form">
            <span className="details-subheading">Core Work Hours</span>
            <div className="form-row">
              <div className="field-group flex-1">
                <label>Start Hour</label>
                <div className="input-with-icon">
                  <Clock className="field-icon" size={14} />
                  <input
                    type="time"
                    value={workHoursStart}
                    onChange={e => setWorkHoursStart(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="field-group flex-1">
                <label>End Hour</label>
                <div className="input-with-icon">
                  <Clock className="field-icon" size={14} />
                  <input
                    type="time"
                    value={workHoursEnd}
                    onChange={e => setWorkHoursEnd(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="divider-line"></div>

            <span className="details-subheading">AI Burnout Protections</span>
            <div className="form-row">
              <div className="field-group flex-1">
                <label>Focus session (mins)</label>
                <input
                  type="number"
                  value={focusSessionDuration}
                  onChange={e => setFocusSessionDuration(parseInt(e.target.value) || 25)}
                  min={10}
                  max={60}
                  className="form-input"
                />
              </div>

              <div className="field-group flex-1">
                <label>Weekly limit (hours)</label>
                <div className="input-with-icon">
                  <ShieldAlert className="field-icon" size={14} />
                  <input
                    type="number"
                    value={burnoutThresholdHours}
                    onChange={e => setBurnoutThresholdHours(parseInt(e.target.value) || 40)}
                    min={10}
                    max={80}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary save-settings-btn" disabled={isSaving}>
              <Save size={14} />
              <span>{isSaving ? 'Saving Configurations...' : 'Apply System Rules'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
