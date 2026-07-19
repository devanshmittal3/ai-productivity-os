import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AuthView } from '../../views/AuthView';

describe('AuthView', () => {
  const mockOnAuthSuccess = vi.fn();
  const apiBaseUrl = 'http://localhost:8000/api/v1';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders login view by default', () => {
    render(<AuthView onAuthSuccess={mockOnAuthSuccess} apiBaseUrl={apiBaseUrl} />);
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Full Name/i)).not.toBeInTheDocument();
  });

  it('toggles between login and register views', () => {
    render(<AuthView onAuthSuccess={mockOnAuthSuccess} apiBaseUrl={apiBaseUrl} />);
    
    // Toggle to Register
    const toggleBtn = screen.getByText(/Register here/i);
    fireEvent.click(toggleBtn);
    
    expect(screen.getByPlaceholderText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();

    // Toggle back to Login
    const toggleBackBtn = screen.getByText(/Sign In instead/i);
    fireEvent.click(toggleBackBtn);

    expect(screen.queryByPlaceholderText(/Full Name/i)).not.toBeInTheDocument();
  });

  it('handles login form submission and success', async () => {
    const mockAccessToken = 'mock-access-token';
    const mockUserId = 'mock-user-id';
    
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockAccessToken, user_id: mockUserId }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'John Doe' }),
      });

    render(<AuthView onAuthSuccess={mockOnAuthSuccess} apiBaseUrl={apiBaseUrl} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockAccessToken, mockUserId, 'John Doe');
    });
  });

  it('handles login form failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Invalid credentials' }),
    });

    render(<AuthView onAuthSuccess={mockOnAuthSuccess} apiBaseUrl={apiBaseUrl} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
