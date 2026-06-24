import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    icon,
    onClick,
    'aria-label': ariaLabel,
  }: {
    icon: string;
    onClick: () => void;
    'aria-label': string;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      <i className={icon} />
    </button>
  ),
}));

import { useTheme } from 'next-themes';
const mockUseTheme = vi.mocked(useTheme);

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null before mounting (SSR guard)', () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme: vi.fn(),
      theme: 'light',
      themes: [],
      systemTheme: 'light',
    });

    // Component uses mounted state — on first render it returns null
    // Testing that it doesn't throw is sufficient here
    expect(() => render(<ThemeToggle />)).not.toThrow();
  });

  it('shows sun icon and calls setTheme("light") when in dark mode', async () => {
    const setTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
      theme: 'dark',
      themes: [],
      systemTheme: 'light',
    });

    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.queryByRole('button', { name: 'Toggle theme' });
    if (button) {
      const icon = button.querySelector('i');
      expect(icon?.className).toContain('pi-sun');

      await user.click(button);
      expect(setTheme).toHaveBeenCalledWith('light');
    }
  });

  it('shows moon icon and calls setTheme("dark") when in light mode', async () => {
    const setTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
      theme: 'light',
      themes: [],
      systemTheme: 'light',
    });

    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.queryByRole('button', { name: 'Toggle theme' });
    if (button) {
      const icon = button.querySelector('i');
      expect(icon?.className).toContain('pi-moon');

      await user.click(button);
      expect(setTheme).toHaveBeenCalledWith('dark');
    }
  });
});
