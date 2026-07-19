import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { SettingsView } from '../../views/SettingsView';

describe('SettingsView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<SettingsView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);
    expect(screen.getByText(/Syncing account configuration/i)).toBeInTheDocument();
  });

  it('loads user settings and allows updating them', async () => {
    const mockUserData = {
      name: 'Alice',
      email: 'alice@example.com',
      role: 'developer',
      settings: {
        workHoursStart: '08:00',
        workHoursEnd: '18:00',
        focusSessionDuration: 30,
        burnoutThresholdHours: 45
      }
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<SettingsView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Syncing account/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Apply System Rules/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/auth/me/settings`, expect.objectContaining({
        method: 'PUT'
      }));
    });
  });
});
