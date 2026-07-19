import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { WorkflowsView } from '../../views/WorkflowsView';

describe('WorkflowsView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<WorkflowsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);
    expect(screen.getByText(/Loading canvas blocks/i)).toBeInTheDocument();
  });

  it('renders workflow nodes and runs workflow', async () => {
    const mockWorkflows = [
      {
        id: 'wf-1',
        title: 'Weekly Task Sync',
        isActive: true,
        nodes: [
          { id: 'n1', type: 'trigger', config: { event: 'on_new_task' } },
          { id: 'n2', type: 'action', config: { action: 'create_calendar_event' } }
        ]
      }
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflows,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, actions_run: [] }),
      });

    render(<WorkflowsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading canvas blocks/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Weekly Task Sync')).toBeInTheDocument();
    expect(screen.getByText('on_new_task')).toBeInTheDocument();
    expect(screen.getByText('create_calendar_event')).toBeInTheDocument();

    const runBtn = screen.getByRole('button', { name: /Run Automation/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Worker exited with success/i)).toBeInTheDocument();
    });
  });

  it('allows appending a new trigger node to the canvas', async () => {
    const mockWorkflows = [
      {
        id: 'wf-1',
        title: 'Weekly Task Sync',
        isActive: true,
        nodes: [
          { id: 'n1', type: 'trigger', config: { event: 'on_new_task' } }
        ]
      }
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflows,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockWorkflows[0], nodes: [...mockWorkflows[0].nodes, { id: 'n2', type: 'action', config: { action: 'draft_email' } }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockWorkflows[0]],
      });

    render(<WorkflowsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading canvas blocks/i)).not.toBeInTheDocument();
    });

    // Get all select boxes on the page
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3);

    // selects[1] is Node Category
    fireEvent.change(selects[1], { target: { value: 'action' } });

    // selects[2] is Action Name (which is shown when Node Category is 'action')
    fireEvent.change(selects[2], { target: { value: 'draft_email' } });

    // Click Append Node
    const appendBtn = screen.getByRole('button', { name: /Append Node/i });
    fireEvent.click(appendBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/workflows/wf-1`, expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"action":"draft_email"')
      }));
    });
  });
});
