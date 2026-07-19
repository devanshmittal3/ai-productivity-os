import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { DashboardView } from '../../views/DashboardView';

// Mock Recharts to render without actual canvas dimensions
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
  };
});

describe('DashboardView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', async () => {
    // Hang fetch so it stays loading
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    
    render(
      <DashboardView 
        authToken={authToken} 
        apiBaseUrl={apiBaseUrl} 
        onNavigate={mockOnNavigate} 
      />
    );
    expect(screen.getByText(/Syncing secure workspace telemetry/i)).toBeInTheDocument();
  });

  it('fetches and renders insights data', async () => {
    const mockInsights = {
      focusScore: 88,
      burnoutRisk: 'high',
      timeDistribution: {
        workMinutes: 240,
        focusMinutes: 180,
      },
      productivityScore: 75,
      completionRate: 0.75,
    };

    const mockBriefing = {
      greeting: 'Good morning, Dev!',
      recommendations: [
        'Take a 10 min break after your next session.',
        'Review your visual workflow canvas.',
      ],
      priorities: [
        { title: 'Hardening API Tests', priority: 'high', estimatedMinutes: 45 },
      ],
      events: [
        { title: 'Standup', start: '09:00', end: '09:30' },
      ],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBriefing,
      });

    render(
      <DashboardView 
        authToken={authToken} 
        apiBaseUrl={apiBaseUrl} 
        onNavigate={mockOnNavigate} 
      />
    );

    // Wait for loader to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Syncing secure/i)).not.toBeInTheDocument();
    });

    // Check greeting
    expect(screen.getByText('Good morning, Dev!')).toBeInTheDocument();
    
    // Check metric values
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('240m')).toBeInTheDocument();
    
    // Check priority task title
    expect(screen.getByText('Hardening API Tests')).toBeInTheDocument();
    
    // Check burnout banner
    expect(screen.getByText(/Burnout Risk: HIGH/i)).toBeInTheDocument();
  });
});
