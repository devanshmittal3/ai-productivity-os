import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './DashboardView.css';

interface DashboardViewProps {
  authToken: string;
  apiBaseUrl: string;
  onNavigate: (route: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  authToken,
  apiBaseUrl,
  onNavigate
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      
      const [insightsRes, briefingRes] = await Promise.all([
        fetch(`${apiBaseUrl}/analytics/insights`, { headers }),
        fetch(`${apiBaseUrl}/analytics/briefing`, { headers })
      ]);

      if (insightsRes.ok && briefingRes.ok) {
        const insightsData = await insightsRes.json();
        const briefingData = await briefingRes.json();
        setInsights(insightsData);
        setBriefing(briefingData);
      }
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [authToken]);

  if (isLoading) {
    return <div className="loading-state">Syncing secure workspace telemetry...</div>;
  }

  // Sample data for productivity chart
  const chartData = [
    { name: 'Mon', focusMinutes: 45, completionRate: 0.4 },
    { name: 'Tue', focusMinutes: 90, completionRate: 0.6 },
    { name: 'Wed', focusMinutes: 25, completionRate: 0.3 },
    { name: 'Thu', focusMinutes: 120, completionRate: 0.8 },
    { name: 'Fri', focusMinutes: 75, completionRate: 0.7 },
    { name: 'Sat', focusMinutes: insights?.timeDistribution?.focusMinutes || 50, completionRate: insights?.completionRate || 0.5 },
  ];

  return (
    <div className="dashboard-view">
      {/* Burnout Risk Alert Banner */}
      {insights?.burnoutRisk && (insights.burnoutRisk === 'high' || insights.burnoutRisk === 'critical') && (
        <div className={`burnout-alert-banner ${insights.burnoutRisk}`}>
          <AlertTriangle className="alert-icon" />
          <div className="alert-details">
            <span className="alert-title">Burnout Risk: {insights.burnoutRisk.toUpperCase()}</span>
            <p className="alert-message">
              You have {insights.timeDistribution?.workMinutes} work minutes logged with several pending high-priority items. 
              Let Copilot shift your deadlines or schedule a recovery focus block.
            </p>
          </div>
          <button className="btn-secondary alert-action-btn" onClick={() => onNavigate('/calendar')}>
            Adjust Schedule
          </button>
        </div>
      )}

      {/* Daily Briefing Summary */}
      {briefing && (
        <div className="briefing-card glass-card">
          <div className="briefing-header">
            <Award className="briefing-icon" />
            <h2 className="briefing-title">{briefing.greeting}</h2>
          </div>
          <div className="briefing-body">
            <p className="briefing-intro">Here is your customized focus summary for today:</p>
            <div className="briefing-recommendations">
              {briefing.recommendations?.map((rec: string, idx: number) => (
                <div key={idx} className="recommendation-item">
                  <CheckCircle size={14} className="rec-bullet-icon" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass-card">
          <div className="card-top">
            <span className="card-label">Focus Score</span>
            <Activity className="card-icon violet" />
          </div>
          <div className="card-value">{insights?.focusScore || 0}%</div>
          <div className="card-sub">Goal: 85% focus depth</div>
        </div>

        <div className="metric-card glass-card">
          <div className="card-top">
            <span className="card-label">Logged Work</span>
            <Clock className="card-icon pink" />
          </div>
          <div className="card-value">{insights?.timeDistribution?.workMinutes || 0}m</div>
          <div className="card-sub">Focus blocks: {insights?.timeDistribution?.focusMinutes || 0}m</div>
        </div>

        <div className="metric-card glass-card">
          <div className="card-top">
            <span className="card-label">Priorities Pending</span>
            <Zap className="card-icon amber" />
          </div>
          <div className="card-value">{briefing?.priorities?.length || 0}</div>
          <div className="card-sub">Total tasks active: {insights?.productivityScore || 0}% completed</div>
        </div>

        <div className="metric-card glass-card">
          <div className="card-top">
            <span className="card-label">Calendar Events</span>
            <Calendar className="card-icon emerald" />
          </div>
          <div className="card-value">{briefing?.events?.length || 0}</div>
          <div className="card-sub">Next session: 9:00 AM</div>
        </div>
      </div>

      {/* Analytics Graph & List */}
      <div className="dashboard-content-split">
        <div className="chart-panel glass-card">
          <h3 className="section-title">Weekly Productivity Trend</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="focusMinutes" name="Focus Mins" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorFocus)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="priorities-panel glass-card">
          <div className="priorities-header">
            <h3 className="section-title">Today's Priorities</h3>
            <button className="text-link-btn" onClick={() => onNavigate('/tasks')}>View All</button>
          </div>
          <div className="priorities-list">
            {briefing?.priorities && briefing.priorities.length > 0 ? (
              briefing.priorities.map((task: any, idx: number) => (
                <div key={idx} className="priority-task-item">
                  <div className={`priority-tag ${task.priority}`}>{task.priority}</div>
                  <div className="priority-details">
                    <span className="priority-title">{task.title}</span>
                    <span className="priority-duration">{task.estimatedMinutes} mins estimated</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="priorities-empty">No high priority tasks left for today! Keep up the great work.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
