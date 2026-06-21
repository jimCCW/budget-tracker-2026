import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '@/features/auth/components/LoginPage';

vi.mock('@/features/auth/components/LoginForm', () => ({
  LoginForm: () => <div data-testid='login-form' />,
}));

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button>Toggle theme</button>,
}));

describe('LoginPage', () => {
  it('renders without crashing', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('renders a sign-in instruction sub-heading', () => {
    render(<LoginPage />);
    expect(
      screen.getByText(/sign in to your budget tracker account/i)
    ).toBeInTheDocument();
  });

  it('renders the theme toggle', () => {
    render(<LoginPage />);
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });
});
