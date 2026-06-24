import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/features/auth/hooks/useRegister');

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

vi.mock('primereact/checkbox', () => ({
  Checkbox: ({
    checked,
    onChange,
    inputId,
  }: {
    checked: boolean;
    onChange: (e: { checked: boolean }) => void;
    inputId?: string;
  }) => (
    <input
      id={inputId}
      type='checkbox'
      checked={checked ?? false}
      onChange={(e) => onChange({ checked: e.target.checked })}
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

import { useRegister } from '@/features/auth/hooks/useRegister';
const mockUseRegister = vi.mocked(useRegister);

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

describe('RegisterForm', () => {
  beforeEach(() => {
    mockUseRegister.mockReturnValue(
      makeMutation() as ReturnType<typeof useRegister>
    );
  });

  it('renders all form fields', () => {
    render(<RegisterForm />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Password (8+ characters)')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
  });

  it('shows required error for empty name on submit', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('Full name'), 'Alice');
    await user.type(
      screen.getByPlaceholderText('Email address'),
      'alice@example.com'
    );
    await user.type(
      screen.getByPlaceholderText('Password (8+ characters)'),
      'Pass1word!'
    );
    await user.type(
      screen.getByPlaceholderText('Confirm password'),
      'Different1!'
    );
    // Check terms so the ONLY validation error is the password mismatch
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('shows terms error when checkbox unchecked on submit', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('Full name'), 'Alice');
    await user.type(
      screen.getByPlaceholderText('Email address'),
      'alice@example.com'
    );
    await user.type(
      screen.getByPlaceholderText('Password (8+ characters)'),
      'Pass1word!'
    );
    await user.type(
      screen.getByPlaceholderText('Confirm password'),
      'Pass1word!'
    );
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText('You must accept the terms to continue')
      ).toBeInTheDocument();
    });
  });

  it('shows error banner when registration fails', () => {
    mockUseRegister.mockReturnValue(
      makeMutation({
        isError: true,
        error: new Error('Email already in use.'),
      }) as ReturnType<typeof useRegister>
    );

    render(<RegisterForm />, { wrapper: createWrapper() });

    expect(screen.getByText('Registration failed')).toBeInTheDocument();
    expect(screen.getByText('Email already in use.')).toBeInTheDocument();
  });

  it('disables the submit button while pending', () => {
    mockUseRegister.mockReturnValue(
      makeMutation({ isPending: true }) as ReturnType<typeof useRegister>
    );

    render(<RegisterForm />, { wrapper: createWrapper() });

    expect(
      screen.getByRole('button', { name: /creating account/i })
    ).toBeDisabled();
  });
});
