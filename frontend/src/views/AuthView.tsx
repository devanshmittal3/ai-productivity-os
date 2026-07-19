import React, { useState } from 'react';
import { Zap, Mail, Lock, User, Shield } from 'lucide-react';
import './AuthView.css';

interface AuthViewProps {
  onAuthSuccess: (token: string, userId: string, userName: string) => void;
  apiBaseUrl: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, apiBaseUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('professional');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Fast API standard login expects form URL encoded values
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const res = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params
        });

        const data = await res.json();
        if (res.ok) {
          // Fetch user details
          const meRes = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` }
          });
          const meData = await meRes.json();
          onAuthSuccess(data.access_token, data.user_id, meData.name || 'User');
        } else {
          setErrorMsg(data.detail || 'Login failed. Please verify credentials.');
        }
      } else {
        // Register expects JSON
        const res = await fetch(`${apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, name, role })
        });

        const data = await res.json();
        if (res.ok) {
          onAuthSuccess(data.access_token, data.user_id, name);
        } else {
          setErrorMsg(data.detail || 'Registration failed.');
        }
      }
    } catch (err) {
      setErrorMsg('Could not connect to API server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-view-container">
      <div className="auth-card glass-panel">
        <div className="auth-logo">
          <Zap className="logo-icon-lg" />
          <span className="auth-logo-text glowing-text">Antigravity OS</span>
        </div>

        <p className="auth-subtitle">AI-Powered Workspace & Intelligent Orchestrator</p>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <User className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <Mail className="input-icon" size={16} />
            <input
              type="email"
              className="form-input"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={16} />
            <input
              type="password"
              className="form-input"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group select-group">
              <Shield className="input-icon" size={16} />
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="form-input"
              >
                <option value="professional">Professional</option>
                <option value="developer">Developer</option>
                <option value="freelancer">Freelancer</option>
                <option value="student">Student</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button className="toggle-btn" onClick={() => setIsLogin(false)}>
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button className="toggle-btn" onClick={() => setIsLogin(true)}>
                Sign In instead
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
