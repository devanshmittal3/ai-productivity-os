import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { TasksView } from '../../views/TasksView';

describe('TasksView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<TasksView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);
    expect(screen.getByText(/Syncing backlog/i)).toBeInTheDocument();
  });

  it('renders tasks checklist after load', async () => {
    const mockTasks = [
      {
        id: 't-1',
        title: 'Learn Vitest',
        description: 'React unit testing description',
        status: 'todo',
        priority: 'high',
        estimatedMinutes: 60,
        tags: ['test', 'react'],
        category: 'Work',
        subtasks: []
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks,
    });

    render(<TasksView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Syncing backlog/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Learn Vitest')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('60m')).toBeInTheDocument();
  });

  it('submits manual task form successfully', async () => {
    const mockTasks: any[] = [];
    const newTask = {
      id: 't-2',
      title: 'Write automation script',
      description: 'A script for pipelines',
      status: 'todo',
      priority: 'high',
      estimatedMinutes: 30,
      tags: ['ci'],
      category: 'Work',
      subtasks: []
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => newTask,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [newTask],
      });

    render(<TasksView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Syncing backlog/i)).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Database assignment/i), { target: { value: 'Write automation script' } });
    fireEvent.change(screen.getByPlaceholderText(/Practice normalization/i), { target: { value: 'A script for pipelines' } });
    
    const submitBtn = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/tasks`, expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  it('handles subtasks rendering, creation and completion toggling', async () => {
    const mockTask = {
      id: 't-1',
      title: 'Learn Vitest',
      description: 'React unit testing description',
      status: 'todo',
      priority: 'high',
      estimatedMinutes: 60,
      tags: ['test', 'react'],
      category: 'Work',
      subtasks: [
        { id: 'sub-1', title: 'Write first test', status: 'todo' }
      ]
    };

    // Use mockImplementation to consistently return the task list when fetching tasks
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (url.endsWith('/tasks') && (!options || options.method === 'GET' || !options.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockTask],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ...mockTask, subtasks: [...mockTask.subtasks, { id: 'sub-2', title: 'Write second test', status: 'todo' }] }),
      });
    });

    const { container } = render(<TasksView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Syncing backlog/i)).not.toBeInTheDocument();
    });

    // Click the task title block to expand details
    fireEvent.click(screen.getByText('Learn Vitest'));

    // Subtask title should now be visible
    expect(screen.getByText('Write first test')).toBeInTheDocument();

    // Toggle subtask status (checkbox click) using class selector
    const toggleSubtaskBtn = container.querySelector('.sub-toggle-btn');
    expect(toggleSubtaskBtn).not.toBeNull();
    fireEvent.click(toggleSubtaskBtn!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/tasks/t-1`, expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"status":"completed"')
      }));
    });

    // Add new subtask
    fireEvent.change(screen.getByPlaceholderText(/Add checklist item/i), { target: { value: 'Write second test' } });
    
    // Find add subtask button (the one inside add-subtask-form)
    const addSubtaskBtn = screen.getByPlaceholderText(/Add checklist item/i).closest('.add-subtask-form')?.querySelector('.add-sub-btn');
    expect(addSubtaskBtn).toBeDefined();
    fireEvent.click(addSubtaskBtn!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/tasks/t-1`, expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"title":"Write second test"')
      }));
    });
  });

  it('handles AI NLP task parsing and approval', async () => {
    const mockTasks: any[] = [];
    const mockNlpResult = {
      reasoning: 'Parsed 1 urgent task from prompt.',
      tasks: [
        {
          id: 't-3',
          title: 'Review production logs',
          description: 'Auto-parsed from NLP',
          priority: 'urgent',
          estimatedMinutes: 30,
          category: 'Operations',
          tags: ['nlp']
        }
      ]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNlpResult,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 't-3' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockNlpResult.tasks[0]],
      });

    render(<TasksView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    await waitFor(() => {
      expect(screen.queryByText(/Syncing backlog/i)).not.toBeInTheDocument();
    });

    // Enter NLP prompt
    fireEvent.change(screen.getByPlaceholderText(/e.g. Schedule database mid-term prep/i), {
      target: { value: 'Need to review production logs urgently for 30m' }
    });

    // Submit NLP form
    const parseBtn = screen.getByRole('button', { name: 'Analyze' });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(screen.getByText('Parsed 1 urgent task from prompt.')).toBeInTheDocument();
      expect(screen.getByText(/Review production logs/i)).toBeInTheDocument();
    });

    // Click Approve & Commit tasks
    const approveBtn = screen.getByRole('button', { name: /Create All Tasks/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/tasks`, expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"title":"Review production logs"')
      }));
    });
  });
});
