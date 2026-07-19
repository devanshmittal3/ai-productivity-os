import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { CopilotPanel } from '../../components/CopilotPanel';

describe('CopilotPanel', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  const mockApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders default assistant message', () => {
    render(<CopilotPanel authToken={authToken} apiBaseUrl={apiBaseUrl} onApplyScheduleBlock={mockApply} />);
    expect(screen.getByText(/AI Copilot/i)).toBeInTheDocument();
  });

  it('generates an email draft successfully', async () => {
    const mockEmailResult = {
      subject: 'Out of office',
      body: 'I will be out tomorrow.'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmailResult,
    });

    render(<CopilotPanel authToken={authToken} apiBaseUrl={apiBaseUrl} onApplyScheduleBlock={mockApply} />);

    // Click Email Draft tab
    const emailTab = screen.getByText('Email Draft');
    fireEvent.click(emailTab);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/HR/i), {
      target: { value: 'Draft a quick sick leave application' }
    });

    const composeBtn = screen.getByRole('button', { name: /Compose Email/i });
    fireEvent.click(composeBtn);

    await waitFor(() => {
      expect(screen.getByText('Out of office')).toBeInTheDocument();
      expect(screen.getByText('I will be out tomorrow.')).toBeInTheDocument();
    });
  });

  it('fetches and displays schedule recommendations in advice tab and allows scheduling them', async () => {
    const mockRecs = {
      recommendations: [
        {
          title: 'Burnout Danger',
          description: 'You have 6 hours of back-to-back meetings.',
          actionType: 'schedule_block',
          actionPayload: { duration: 60 }
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecs,
    });

    render(<CopilotPanel authToken={authToken} apiBaseUrl={apiBaseUrl} onApplyScheduleBlock={mockApply} />);

    // Click Advice tab
    const adviceTab = screen.getByText('Advice');
    fireEvent.click(adviceTab);

    await waitFor(() => {
      expect(screen.getByText('Burnout Danger')).toBeInTheDocument();
      expect(screen.getByText('You have 6 hours of back-to-back meetings.')).toBeInTheDocument();
    });

    // Click "Schedule Block" button
    const scheduleBtn = screen.getByRole('button', { name: /Schedule Block/i });
    fireEvent.click(scheduleBtn);

    expect(mockApply).toHaveBeenCalledWith({ duration: 60 });
  });
});
