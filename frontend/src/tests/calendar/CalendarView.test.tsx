import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { CalendarView } from '../../views/CalendarView';

describe('CalendarView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<CalendarView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);
    expect(screen.getByText(/Downloading events/i)).toBeInTheDocument();
  });

  it('renders events list after load', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        title: 'Focus Hour',
        startTime: '2026-07-20T09:00:00',
        endTime: '2026-07-20T10:00:00',
        isFocusBlock: true
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    });

    render(<CalendarView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Downloading events/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Focus Hour')).toBeInTheDocument();
  });

  it('submits manual event successfully', async () => {
    const mockEvents: any[] = [];
    const newEvent = {
      id: 'evt-2',
      title: 'Review PRs',
      startTime: '2026-07-20T11:00:00',
      endTime: '2026-07-20T12:00:00',
      isFocusBlock: false
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => newEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [newEvent],
      });

    render(<CalendarView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Downloading events/i)).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Product strategy sync/i), { target: { value: 'Review PRs' } });
    
    const submitBtn = screen.getByRole('button', { name: /Create Event/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/calendar/events`, expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  it('runs AI auto-scheduler successfully and renders execution report', async () => {
    const mockEvents: any[] = [];
    const mockReport = {
      scheduledBlocksCount: 3,
      unresolvedTasksCount: 1,
      warnings: ['Could not place all events due to overlap']
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      });

    render(<CalendarView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Downloading events/i)).not.toBeInTheDocument();
    });

    // Trigger auto-schedule
    const autoScheduleBtn = screen.getByRole('button', { name: /Auto-Schedule Calendar/i });
    fireEvent.click(autoScheduleBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/calendar/auto-schedule`, expect.objectContaining({
        method: 'POST'
      }));
    });

    await waitFor(() => {
      expect(screen.getByText('Optimizer Run Execution Successful')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Could not place all events due to overlap')).toBeInTheDocument();
    });
  });
});
