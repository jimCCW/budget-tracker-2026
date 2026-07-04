import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivitySearchExportBar } from '@/features/activity/components/ActivitySearchExportBar';

vi.mock('primereact/inputtext', () => ({
  InputText: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    label,
    onClick,
    disabled,
  }: {
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

describe('ActivitySearchExportBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input with its placeholder', () => {
    render(
      <ActivitySearchExportBar
        onSearchChange={vi.fn()}
        onExport={vi.fn()}
        exporting={false}
      />
    );
    expect(
      screen.getByPlaceholderText('Search transactions...')
    ).toBeInTheDocument();
  });

  it('renders the Export button', () => {
    render(
      <ActivitySearchExportBar
        onSearchChange={vi.fn()}
        onExport={vi.fn()}
        exporting={false}
      />
    );
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  describe('search debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not call onSearchChange immediately on keystroke', () => {
      const onSearchChange = vi.fn();
      render(
        <ActivitySearchExportBar
          onSearchChange={onSearchChange}
          onExport={vi.fn()}
          exporting={false}
        />
      );
      fireEvent.change(screen.getByPlaceholderText('Search transactions...'), {
        target: { value: 'lunch' },
      });
      expect(onSearchChange).not.toHaveBeenCalled();
    });

    it('calls onSearchChange with the typed value after the debounce delay', () => {
      const onSearchChange = vi.fn();
      render(
        <ActivitySearchExportBar
          onSearchChange={onSearchChange}
          onExport={vi.fn()}
          exporting={false}
        />
      );
      fireEvent.change(screen.getByPlaceholderText('Search transactions...'), {
        target: { value: 'lunch' },
      });
      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(onSearchChange).toHaveBeenCalledWith('lunch');
    });

    it('only fires once with the final value when typed rapidly', () => {
      const onSearchChange = vi.fn();
      const input = render(
        <ActivitySearchExportBar
          onSearchChange={onSearchChange}
          onExport={vi.fn()}
          exporting={false}
        />
      );
      const el = input.getByPlaceholderText('Search transactions...');
      fireEvent.change(el, { target: { value: 'l' } });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.change(el, { target: { value: 'lu' } });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.change(el, { target: { value: 'lunch' } });
      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(onSearchChange).toHaveBeenCalledOnce();
      expect(onSearchChange).toHaveBeenCalledWith('lunch');
    });
  });

  it('calls onExport when the Export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <ActivitySearchExportBar
        onSearchChange={vi.fn()}
        onExport={onExport}
        exporting={false}
      />
    );
    await user.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledOnce();
  });

  it('disables the Export button while exporting', () => {
    render(
      <ActivitySearchExportBar
        onSearchChange={vi.fn()}
        onExport={vi.fn()}
        exporting={true}
      />
    );
    expect(screen.getByText('Export').closest('button')).toBeDisabled();
  });
});
