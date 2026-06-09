import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// A mock component that throws an error during render
const BuggyComponent = () => {
  throw new Error('Render crash simulation');
};

describe('ErrorBoundary Component Resilience', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="safe-child">System Operational</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('safe-child').textContent).toBe('System Operational');
  });

  it('catches render errors and displays fallback UI', () => {
    // Prevent vitest from logging the expected mock console error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    // Assert that the recovery dialog structure is successfully drawn with crash messages
    expect(screen.getByText('System Boundary Intercept')).not.toBeNull();
    expect(screen.getByText('Render crash simulation')).not.toBeNull();
    
    spy.mockRestore();
  });

  it('resets error state when restore button is pressed', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window.location.reload to capture reset flow
    const reloadMock = vi.fn();
    vi.stubGlobal('location', { reload: reloadMock });

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    const restoreButton = screen.getByText('Restore Active Context');
    expect(restoreButton).not.toBeNull();
    
    fireEvent.click(restoreButton);
    expect(reloadMock).toHaveBeenCalledTimes(1);

    spy.mockRestore();
    vi.unstubAllGlobals();
  });
});
