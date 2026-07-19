import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { MeetingsView } from '../../views/MeetingsView';

describe('MeetingsView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders initial state correctly', () => {
    render(<MeetingsView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);
    expect(screen.getByPlaceholderText(/Paste meeting transcript/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop/i)).toBeInTheDocument();
  });

  it('processes transcript successfully', async () => {
    const mockAnalysis = {
      summary: 'Focus for Phase 2 API setup.',
      decisions: ['Standardize headers'],
      actionItems: [{ title: 'Firestore setup', assignee: 'Alex', estimatedMinutes: 60 }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysis,
    });

    render(<MeetingsView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste meeting transcript/i), {
      target: { value: 'Alex: I can do Firestore setup.' }
    });

    const processBtn = screen.getByRole('button', { name: /Extract Decisions/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText('Focus for Phase 2 API setup.')).toBeInTheDocument();
      expect(screen.getByText('Standardize headers')).toBeInTheDocument();
      expect(screen.getByText('Firestore setup')).toBeInTheDocument();
    });
  });

  it('handles drag-and-drop file upload', async () => {
    render(<MeetingsView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);
    
    const dropzone = screen.getByText(/Drag and drop/i).closest('.audio-dropzone');
    expect(dropzone).not.toBeNull();

    // Create a mock file
    const file = new File(['mock content'], 'meeting.mp3', { type: 'audio/mp3' });
    
    // Simulate drop event
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file]
      }
    });

    await waitFor(() => {
      expect(screen.getByText('meeting.mp3')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Sarah: We need to finalize the API schemas/i)).toBeInTheDocument();
    });
  });

  it('allows converting action items to tasks', async () => {
    const mockAnalysis = {
      summary: 'API schemas finalizing.',
      decisions: [],
      actionItems: [{ title: 'Implement Firestore', assignee: 'Alex', estimatedMinutes: 60 }]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-task-id' }),
      });

    render(<MeetingsView authToken={authToken} apiBaseUrl={apiBaseUrl} onRefreshTelemetry={mockRefresh} />);

    // Process transcript first
    fireEvent.change(screen.getByPlaceholderText(/Paste meeting transcript/i), {
      target: { value: 'Alex: Implement Firestore' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Extract Decisions/i }));

    await waitFor(() => {
      expect(screen.getByText('Implement Firestore')).toBeInTheDocument();
    });

    // Click bulk convert button
    const convertBtn = screen.getByRole('button', { name: /Sync Tasks/i });
    fireEvent.click(convertBtn);

    await waitFor(() => {
      expect(screen.getByText(/Successfully synced/i)).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/tasks`, expect.objectContaining({
        method: 'POST'
      }));
    });
  });
});
