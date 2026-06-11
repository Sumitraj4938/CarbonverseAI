import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../components/LoginPage';

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn().mockImplementation(async ({ email }) => {
          if (email === 'error@earth.org') {
            return { data: { user: null, session: null }, error: new Error('Signup failed') };
          }
          return { data: { user: { id: "u1" }, session: { access_token: "t1" } }, error: null };
        }),
        signInWithPassword: vi.fn().mockImplementation(async ({ email }) => {
          if (email === 'errorlogin@earth.org') {
            return { data: { user: null, session: null }, error: new Error('Login failed') };
          }
          return { data: { user: { id: "u1" }, session: { access_token: "t1" } }, error: null };
        })
      }
    }
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

describe('LoginPage Supabase Flow', () => {
  const mockOnLoginSuccess = vi.fn();

  it('handles sign in success', async () => {
    const { container } = render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);
    const emailInput = screen.getByPlaceholderText('Email Address');
    const pwdInput = screen.getByPlaceholderText('Secure Password (min. 6 characters)');
    const loginButton = container.querySelector('button[type="submit"]');

    fireEvent.change(emailInput, { target: { value: 'user@earth.org' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton!);

    const successMsg = await screen.findByText('Successfully logged in!');
    expect(successMsg).not.toBeNull();
    expect(mockOnLoginSuccess).toHaveBeenCalled();
  });

  it('handles sign in error', async () => {
    const { container } = render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'errorlogin@earth.org' } });
    fireEvent.change(screen.getByPlaceholderText('Secure Password (min. 6 characters)'), { target: { value: 'password123' } });
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    const errorMsg = await screen.findByText(/Login failed/);
    expect(errorMsg).not.toBeNull();
  });

  it('handles sign up success', async () => {
    const { container } = render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);
    fireEvent.click(screen.getByText(/Don't have an environmental profile yet\?/i).closest('button')!);

    fireEvent.change(screen.getByPlaceholderText('Full Name (e.g. Raj Sumit)'), { target: { value: 'Hero' } });
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'hero@earth.org' } });
    fireEvent.change(screen.getByPlaceholderText('Secure Password (min. 6 characters)'), { target: { value: 'password123' } });
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    const successMsg = await screen.findByText('Account created successfully!');
    expect(successMsg).not.toBeNull();
  });

  it('handles sign up error', async () => {
    const { container } = render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);
    fireEvent.click(screen.getByText(/Don't have an environmental profile yet\?/i).closest('button')!);

    fireEvent.change(screen.getByPlaceholderText('Full Name (e.g. Raj Sumit)'), { target: { value: 'Error Name' } });
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'error@earth.org' } });
    fireEvent.change(screen.getByPlaceholderText('Secure Password (min. 6 characters)'), { target: { value: 'password123' } });
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    const errorMsg = await screen.findByText(/Signup failed/);
    expect(errorMsg).not.toBeNull();
  });
});
