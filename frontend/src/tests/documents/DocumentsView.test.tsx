import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { DocumentsView } from '../../views/DocumentsView';

describe('DocumentsView', () => {
  const authToken = 'mock-token';
  const apiBaseUrl = 'http://localhost:8000/api/v1';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders initial list and forms', async () => {
    const mockDocs = [{ id: 'doc-1', title: 'Calculus Notes', wordCount: 1000 }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    render(<DocumentsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Calculus Notes/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Topic Title/i)).toBeInTheDocument();
  });

  it('allows uploading a new document', async () => {
    const mockDocs: any[] = [];
    const newDoc = { id: 'doc-2', title: 'Biology Notes', wordCount: 500 };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => newDoc,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [newDoc],
      });

    render(<DocumentsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    fireEvent.change(screen.getByPlaceholderText(/Topic Title/i), { target: { value: 'Biology Notes' } });
    fireEvent.change(screen.getByPlaceholderText(/Paste study material/i), { target: { value: 'Photosynthesis is the process...' } });
    
    const uploadBtn = screen.getByRole('button', { name: /Save reference/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}/documents/upload-text`, expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  it('allows analyzing a selected document for summary', async () => {
    const mockDocs = [{ id: 'doc-1', title: 'Calculus Notes', wordCount: 1000 }];
    const mockSummary = { summary: 'This is a summary of Calculus.' };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

    render(<DocumentsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText(/Calculus Notes/i)).toBeInTheDocument();
    });

    // Select document using combobox
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doc-1' } });

    // Click summarize
    fireEvent.click(screen.getByRole('button', { name: /Summarize/i }));

    await waitFor(() => {
      expect(screen.getByText('This is a summary of Calculus.')).toBeInTheDocument();
    });
  });

  it('allows analyzing a selected document for flashcards and interactive playing', async () => {
    const mockDocs = [{ id: 'doc-1', title: 'Calculus Notes', wordCount: 1000 }];
    const mockFlashcards = {
      flashcards: [
        { front: 'What is derivative?', back: 'Rate of change.' },
        { front: 'What is integral?', back: 'Area under curve.' }
      ]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlashcards,
      });

    render(<DocumentsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText(/Calculus Notes/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doc-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate Flashcards/i }));

    await waitFor(() => {
      expect(screen.getByText('What is derivative?')).toBeInTheDocument();
    });

    // Click card to flip
    fireEvent.click(screen.getByText('What is derivative?'));
    expect(screen.getByText('Rate of change.')).toBeInTheDocument();

    // Click Next
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText('What is integral?')).toBeInTheDocument();
    });
  });

  it('allows analyzing a selected document for quiz and playing/submitting/resetting quiz', async () => {
    const mockDocs = [{ id: 'doc-1', title: 'Calculus Notes', wordCount: 1000 }];
    const mockQuiz = {
      quiz: [
        {
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          explanation: 'Standard addition.'
        }
      ]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuiz,
      });

    render(<DocumentsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText(/Calculus Notes/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doc-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate Quiz/i }));

    await waitFor(() => {
      expect(screen.getByText(/1. What is 2\+2\?/i)).toBeInTheDocument();
    });

    // Select option '4'
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    // Click Submit Answers
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz Answers/i }));

    await waitFor(() => {
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
      expect(screen.getByText(/Standard addition/i)).toBeInTheDocument();
    });

    // Reset quiz
    fireEvent.click(screen.getByRole('button', { name: /Retry Quiz/i }));
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('allows searching using RAG query', async () => {
    const mockDocs = [{ id: 'doc-1', title: 'Calculus Notes', wordCount: 1000 }];
    const mockRagResults = {
      results: [
        { documentTitle: 'Calculus Notes', text: 'Derivatives are basic tools', score: 0.95 }
      ]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRagResults,
      });

    render(<DocumentsView authToken={authToken} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText(/Calculus Notes/i)).toBeInTheDocument();
    });

    // Switch to RAG tab
    fireEvent.click(screen.getByText('Ask PDF (RAG)'));
    
    // Type query
    fireEvent.change(screen.getByPlaceholderText(/Ask the AI about your reference documents/i), {
      target: { value: 'derivative definition' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText('Calculus Notes')).toBeInTheDocument();
      expect(screen.getByText(/"\.\.\.Derivatives are basic tools\.\.\."/i)).toBeInTheDocument();
    });
  });
});
