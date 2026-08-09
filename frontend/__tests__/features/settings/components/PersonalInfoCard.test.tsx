import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonalInfoCard } from '@/features/settings/components/PersonalInfoCard';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile';

vi.mock('@/features/settings/hooks/useProfile');
vi.mock('@/features/settings/hooks/useUpdateProfile');

vi.mock('primereact/inputtext', () => ({
  InputText: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

vi.mock('primereact/button', () => ({
  Button: ({
    type,
    label,
    onClick,
    disabled,
    loading,
  }: {
    type?: 'button' | 'submit' | 'reset';
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {label}
    </button>
  ),
}));

const mockUseProfile = vi.mocked(useProfile);
const mockUseUpdateProfile = vi.mocked(useUpdateProfile);

const stubProfile = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  currency: 'SGD',
  language: 'English',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeMutation(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue(stubProfile),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useUpdateProfile>;
}

describe('PersonalInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateProfile.mockReturnValue(makeMutation());
  });

  it('renders a loading skeleton while the profile is loading', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useProfile>);

    render(<PersonalInfoCard />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('pre-fills the first/last/full name fields and shows the read-only email', () => {
    mockUseProfile.mockReturnValue({
      data: stubProfile,
      isLoading: false,
    } as ReturnType<typeof useProfile>);

    render(<PersonalInfoCard />);

    expect(
      (screen.getByPlaceholderText('First name') as HTMLInputElement).value
    ).toBe('Jane');
    expect(
      (screen.getByPlaceholderText('Last name') as HTMLInputElement).value
    ).toBe('Doe');
    expect(
      (screen.getByPlaceholderText('Full name') as HTMLInputElement).value
    ).toBe('Jane Doe');
    const emailInput = screen.getByDisplayValue(
      'jane@example.com'
    ) as HTMLInputElement;
    expect(emailInput).toBeDisabled();
  });

  it('shows a validation error when the first name is cleared and saved', async () => {
    const user = userEvent.setup();
    mockUseProfile.mockReturnValue({
      data: stubProfile,
      isLoading: false,
    } as ReturnType<typeof useProfile>);

    render(<PersonalInfoCard />);

    await user.clear(screen.getByPlaceholderText('First name'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('calls mutateAsync with the edited first/last/full name on save', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(stubProfile);
    mockUseProfile.mockReturnValue({
      data: stubProfile,
      isLoading: false,
    } as ReturnType<typeof useProfile>);
    mockUseUpdateProfile.mockReturnValue(makeMutation({ mutateAsync }));

    render(<PersonalInfoCard />);

    const lastNameInput = screen.getByPlaceholderText('Last name');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Q. Doe');
    const fullNameInput = screen.getByPlaceholderText('Full name');
    await user.clear(fullNameInput);
    await user.type(fullNameInput, 'Jane Q. Doe');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Q. Doe',
        name: 'Jane Q. Doe',
      });
    });
  });

  it('shows an error banner when the update fails', () => {
    mockUseProfile.mockReturnValue({
      data: stubProfile,
      isLoading: false,
    } as ReturnType<typeof useProfile>);
    mockUseUpdateProfile.mockReturnValue(
      makeMutation({
        isError: true,
        error: new Error('First name is required'),
      })
    );

    render(<PersonalInfoCard />);
    expect(screen.getByText('First name is required')).toBeInTheDocument();
  });

  it('disables the save button while the mutation is pending', () => {
    mockUseProfile.mockReturnValue({
      data: stubProfile,
      isLoading: false,
    } as ReturnType<typeof useProfile>);
    mockUseUpdateProfile.mockReturnValue(makeMutation({ isPending: true }));

    render(<PersonalInfoCard />);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });
});
