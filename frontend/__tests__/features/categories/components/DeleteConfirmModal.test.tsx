import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmModal } from '@/features/categories/components/DeleteConfirmModal';
import { useDeleteCategory } from '@/features/categories/hooks/useDeleteCategory';
import type { Category } from '@/types/category';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
    onClose: () => void;
    maxWidth?: string;
  }) => (open ? <div data-testid='modal'>{children}</div> : null),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    label,
    onClick,
    disabled,
    loading,
  }: {
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled || loading}>
      {label}
    </button>
  ),
}));

vi.mock('@/features/categories/hooks/useDeleteCategory');

const mockUseDeleteCategory = vi.mocked(useDeleteCategory);

const category: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Coffee',
  icon: 'pi-coffee',
  color: '#F59E0B',
  type: 'EXPENSE',
  isDefault: false,
};

describe('DeleteConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteCategory>);
  });

  it('renders nothing when open is false', () => {
    render(
      <DeleteConfirmModal open={false} onClose={vi.fn()} category={category} />
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders the category name in the confirmation message', () => {
    render(
      <DeleteConfirmModal open={true} onClose={vi.fn()} category={category} />
    );
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('renders the "Delete category?" heading', () => {
    render(
      <DeleteConfirmModal open={true} onClose={vi.fn()} category={category} />
    );
    expect(
      screen.getByRole('heading', { name: 'Delete category?' })
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DeleteConfirmModal open={true} onClose={onClose} category={category} />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls mutateAsync with the category id then onClose when Delete is clicked', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseDeleteCategory.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteCategory>);

    render(
      <DeleteConfirmModal open={true} onClose={onClose} category={category} />
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('cat-1');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('disables the Delete button while the mutation is pending', () => {
    mockUseDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteCategory>);

    render(
      <DeleteConfirmModal open={true} onClose={vi.fn()} category={category} />
    );
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });

  it('shows an error message when the mutation fails with an Error', () => {
    mockUseDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('Delete failed'),
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteCategory>);

    render(
      <DeleteConfirmModal open={true} onClose={vi.fn()} category={category} />
    );
    expect(screen.getByText('Delete failed')).toBeInTheDocument();
  });

  it('shows a generic error message for non-Error failures', () => {
    mockUseDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: true,
      error: 'unknown' as unknown as Error,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteCategory>);

    render(
      <DeleteConfirmModal open={true} onClose={vi.fn()} category={category} />
    );
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('handles null category gracefully (no crash)', () => {
    render(
      <DeleteConfirmModal open={true} onClose={vi.fn()} category={null} />
    );
    expect(
      screen.getByRole('heading', { name: 'Delete category?' })
    ).toBeInTheDocument();
  });
});
