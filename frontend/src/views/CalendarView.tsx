import React, { useState, useEffect } from 'react';
import {
  Plus,
  Zap,
  Clock,
  Trash2,
  AlertCircle
} from 'lucide-react';
import './CalendarView.css';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isFocusBlock: boolean;
  taskId?: string;
}

interface CalendarViewProps {
  authToken: string;
  apiBaseUrl: string;
  onRefreshTelemetry: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  authToken,
  apiBaseUrl,
  onRefreshTelemetry
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleReport, setScheduleReport] = useState<any>(null);

  // Manual Event Form
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-07-20');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isFocusBlock, setIsFocusBlock] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/calendar/events`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [authToken]);

  // Create Manual Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    try {
      const res = await fetch(`${apiBaseUrl}/calendar/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          startTime: startISO,
          endTime: endISO,
          isFocusBlock
        })
      });
      if (res.ok) {
        setTitle('');
        fetchEvents();
        onRefreshTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Intelligent Auto-Schedule
  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    setScheduleReport(null);
    try {
      const res = await fetch(`${apiBaseUrl}/calendar/auto-schedule`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const report = await res.json();
        setScheduleReport(report);
        fetchEvents();
        onRefreshTelemetry();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/calendar/events/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchEvents();
        onRefreshTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format date/time helper
  const formatTimeRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };

    return `${s.toLocaleDateString(undefined, dateOptions)} | ${s.toLocaleTimeString(undefined, timeOptions)} - ${e.toLocaleTimeString(undefined, timeOptions)}`;
  };

  return (
    <div className="calendar-view">
      {/* Auto-Schedule Trigger card */}
      <div className="scheduler-trigger-card glass-panel">
        <div className="scheduler-header">
          <Zap className="scheduler-icon" size={16} />
          <span>AI Schedule Optimizer</span>
        </div>
        <p className="scheduler-desc">
          Automate your day! The optimizer scans your backlog, identifies high priority items, 
          respects configured work hours, and schedules focus blocks to dodge meeting fatigue.
        </p>
        <button
          className="btn-primary auto-sched-btn"
          onClick={handleAutoSchedule}
          disabled={isScheduling}
        >
          {isScheduling ? 'Recalculating calendar matrix...' : 'Auto-Schedule Calendar'}
        </button>

        {scheduleReport && (
          <div className="scheduler-report-card glass-card">
            <h4 className="report-title">Optimizer Run Execution Successful</h4>
            <div className="report-stats">
              <div className="report-stat-item">
                <span className="stat-num">{scheduleReport.scheduledBlocksCount}</span>
                <span className="stat-lbl">Focus Blocks Placed</span>
              </div>
              <div className="report-stat-item">
                <span className="stat-num">{scheduleReport.unresolvedTasksCount}</span>
                <span className="stat-lbl">Unscheduled Backlog</span>
              </div>
            </div>
            {scheduleReport.warnings && scheduleReport.warnings.length > 0 && (
              <div className="report-warnings">
                <AlertCircle size={14} className="warning-icon" />
                <span>{scheduleReport.warnings[0]}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="calendar-layout-split">
        {/* Events list */}
        <div className="calendar-events-panel glass-card">
          <h3 className="section-title">Schedule Agenda</h3>

          {isLoading ? (
            <div className="list-loading">Downloading events...</div>
          ) : events.length === 0 ? (
            <div className="list-empty">No events on your calendar. Create one manually or click Auto-Schedule!</div>
          ) : (
            <div className="events-list">
              {events
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(event => (
                  <div
                    key={event.id}
                    className={`event-card ${event.isFocusBlock ? 'focus-block' : 'meeting-block'}`}
                  >
                    <div className="event-info">
                      <span className="event-title-text">{event.title}</span>
                      <div className="event-meta">
                        <Clock size={12} className="meta-icon" />
                        <span>{formatTimeRange(event.startTime, event.endTime)}</span>
                        <span className={`block-badge ${event.isFocusBlock ? 'focus' : 'meeting'}`}>
                          {event.isFocusBlock ? 'Focus Period' : 'Meeting'}
                        </span>
                      </div>
                    </div>
                    <button className="delete-event-btn" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Manual event creator */}
        <div className="event-creator-panel glass-card">
          <h3 className="section-title">New Calendar Block</h3>
          <form onSubmit={handleCreateEvent} className="event-form">
            <div className="field-group">
              <label>Event Name</label>
              <input
                type="text"
                placeholder="Product strategy sync..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="field-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="field-group flex-1">
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="field-group flex-1">
                <label>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="checkbox-field-group">
              <input
                type="checkbox"
                id="isFocusBlock"
                checked={isFocusBlock}
                onChange={e => setIsFocusBlock(e.target.checked)}
              />
              <label htmlFor="isFocusBlock">Mark as Focus Time Block</label>
            </div>

            <button type="submit" className="btn-primary submit-event-btn">
              <Plus size={16} />
              <span>Create Event</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
