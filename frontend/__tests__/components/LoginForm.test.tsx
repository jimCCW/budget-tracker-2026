import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { createWrapper } from '../helpers/createWrapper';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/features/auth/hooks/useLogin');

vi.mock('primereact/inputtext', () => ({
  InputText: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('primereact/password', () => ({
  Password: ({
    value,
    onChange,
    onBlur,
    inputRef,
    placeholder,
    autoComplete,
  }: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
    inputRef: React.Ref<HTMLInputElement>;
    placeholder: string;
    autoComplete?: string;
  }) => (
    <input
      ref={inputRef}
      type='password'
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  ),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    label,
    type,
    disabled,
    loading,
    onClick,
  }: {
    label?: string;
    type?: 'submit' | 'button' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
  }) => (
    <button
      type={type ?? 'button'}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {label}
    </button>
  ),
}));

import { useLogin } from '@/features/auth/hooks/useLogin';
const mockUseLogin = vi.mocked(useLogin);

function makeMutation(overrides = {}) {
  return {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
    ...overrides,
  };
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockUseLogin.mockReturnValue(makeMutation() as ReturnType<typeof useLogin>);
  });

  it('renders email and password inputs', () => {
    render(<LoginForm />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows invalid email error for bad format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('Email address'), 'notanemail');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('shows error banner when login fails', () => {
    mockUseLogin.mockReturnValue(
      makeMutation({
        isError: true,
        error: new Error('Invalid email or password. Please try again.'),
      }) as ReturnType<typeof useLogin>
    );

    render(<LoginForm />, { wrapper: createWrapper() });

    expect(screen.getByText('Sign-in failed')).toBeInTheDocument();
    expect(
      screen.getByText('Invalid email or password. Please try again.')
    ).toBeInTheDocument();
  });

  it('disables the submit button while pending', () => {
    mockUseLogin.mockReturnValue(
      makeMutation({ isPending: true, label: 'Signing in…' }) as ReturnType<
        typeof useLogin
      >
    );

    render(<LoginForm />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /signing in/i });
    expect(button).toBeDisabled();
  });
});
