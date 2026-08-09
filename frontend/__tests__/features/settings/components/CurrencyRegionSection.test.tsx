import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrencyRegionSection } from '@/features/settings/components/CurrencyRegionSection';
import { useProfile } from '@/features/settings/hooks/useProfile';

vi.mock('@/features/settings/hooks/useProfile');
vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

const mockUseProfile = vi.mocked(useProfile);

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

describe('CurrencyRegionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons while the profile is loading', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useProfile>);

    render(<CurrencyRegionSection />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('displays the currency and language from the profile', () => {
    mockUseProfile.mockReturnValue({
      data: stubProfile,
      isLoading: false,
    } as ReturnType<typeof useProfile>);

    render(<CurrencyRegionSection />);
    expect(screen.getByText('SGD')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});
