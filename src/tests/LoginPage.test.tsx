import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../components/LoginPage';

vi.mock('../lib/supabase', () => {
  return {
    supabase: null
  };
});

vi.mock('motion/react', () => {
  const dummyComp = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  return {
    motion: {
      div: dummyComp,
      button: dummyComp,
      span: dummyComp
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
  };
});

describe('LoginPage Component (Authentication Flow)', () => {
  const mockOnLoginSuccess = vi.fn();

  it('renders sign-in form elements of portal by default', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);

    expect(screen.getByText('Portal Sign In')).not.toBeNull();
    expect(screen.getByPlaceholderText('Email Address')).not.toBeNull();
    expect(screen.getByPlaceholderText('Secure Password (min. 6 characters)')).not.toBeNull();
    expect(screen.getByText('Access Portal Dashboard')).not.toBeNull();
  });

  it('allows user to switch between Sign In and Sign Up modes', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);

    // Click on toggle to Switch to Sign Up
    const signUpToggle = screen.getByText(/Don't have an environmental profile yet\?/i).closest('button');
    expect(signUpToggle).not.toBeNull();
    fireEvent.click(signUpToggle!);

    // Should render the Create Account form
    expect(screen.getByText('Create Environment Account')).not.toBeNull();
    expect(screen.getByPlaceholderText('Full Name (e.g. Raj Sumit)')).not.toBeNull();

    // Toggle back
    const signInToggle = screen.getByText(/Already have an account\?/i).closest('button');
    expect(signInToggle).not.toBeNull();
    fireEvent.click(signInToggle!);

    expect(screen.getByText('Portal Sign In')).not.toBeNull();
  });

  it('simulates a password reset email triggered message', async () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);

    const forgotBtn = screen.getByRole('button', { name: /forgot password\?/i });
    expect(forgotBtn).not.toBeNull();

    fireEvent.click(forgotBtn);

    const checkMsg = await screen.findByText('Simulated password reset email sent successfully!');
    expect(checkMsg).not.toBeNull();
  });

  it('handles offline simulation login fallback perfectly when Supabase is unconfigured', async () => {
    vi.stubGlobal('fetch', vi.fn()); // Avoid fetching real network
    
    const { container } = render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByPlaceholderText('Email Address');
    const pwdInput = screen.getByPlaceholderText('Secure Password (min. 6 characters)');
    const loginButton = container.querySelector('button[type="submit"]');

    fireEvent.change(emailInput, { target: { value: 'pioneer@earth.org' } });
    fireEvent.change(pwdInput, { target: { value: 'gogreen123' } });
    fireEvent.click(loginButton!);

    const successMsg = await screen.findByText('Successfully logged in!');
    expect(successMsg).not.toBeNull();

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'pioneer@earth.org'
          })
        })
      );
    }, { timeout: 1000 });

    vi.unstubAllGlobals();
  });
});
