import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Layout } from '../../components/Layout';

// Mock CopilotPanel to avoid fetch during layout render
vi.mock('../CopilotPanel', () => {
  return {
    CopilotPanel: () => <div data-testid="copilot-panel">Mock Copilot Panel</div>
  };
});

describe('Layout', () => {
  const mockLogout = vi.fn();
  const mockApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Sidebar, Navbar and children content', () => {
    render(
      <MemoryRouter>
        <Layout
          activeTitle="Test Page"
          userName="Alice"
          authToken="token"
          apiBaseUrl="http://localhost:8000"
          onLogout={mockLogout}
          onApplyScheduleBlock={mockApply}
        >
          <div>Main Content View</div>
        </Layout>
      </MemoryRouter>
    );

    // Verify main components render
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Main Content View')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByTestId('copilot-panel')).toBeInTheDocument();
  });
});
