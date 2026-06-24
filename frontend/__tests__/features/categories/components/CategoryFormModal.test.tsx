import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';
import { useCreateCategory } from '@/features/categories/hooks/useCreateCategory';
import { useUpdateCategory } from '@/features/categories/hooks/useUpdateCategory';
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
    type,
    label,
    icon,
    onClick,
    disabled,
    loading,
    'aria-label': ariaLabel,
    children,
  }: {
    type?: 'button' | 'submit' | 'reset';
    label?: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    'aria-label'?: string;
    children?: React.ReactNode;
  }) => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {icon && <i className={icon} />}
      {label}
      {children}
    </button>
  ),
}));

vi.mock('primereact/inputtext', () => ({
  InputText: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('@/features/categories/hooks/useCreateCategory');
vi.mock('@/features/categories/hooks/useUpdateCategory');

const mockUseCreate = vi.mocked(useCreateCategory);
const mockUseUpdate = vi.mocked(useUpdateCategory);

const existingCategory: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Coffee',
  icon: 'pi-coffee',
  color: '#F59E0B',
  type: 'EXPENSE',
  isDefault: false,
};

function makeCreateMock(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useCreateCategory>;
}

function makeUpdateMock(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useUpdateCategory>;
}

describe('CategoryFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreate.mockReturnValue(makeCreateMock());
    mockUseUpdate.mockReturnValue(makeUpdateMock());
  });

  it('renders nothing when open is false', () => {
    render(<CategoryFormModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders "New category" heading in create mode', () => {
    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'New category' })
    ).toBeInTheDocument();
  });

  it('renders "Edit category" heading in edit mode', () => {
    render(
      <CategoryFormModal
        open={true}
        onClose={vi.fn()}
        category={existingCategory}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Edit category' })
    ).toBeInTheDocument();
  });

  it('renders both type buttons (Expense and Income)', () => {
    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('renders the name input with placeholder', () => {
    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByPlaceholderText('e.g. Coffee & cafés')
    ).toBeInTheDocument();
  });

  it('pre-fills the name field with existing category name in edit mode', () => {
    render(
      <CategoryFormModal
        open={true}
        onClose={vi.fn()}
        category={existingCategory}
      />
    );
    const nameInput = screen.getByPlaceholderText(
      'e.g. Coffee & cafés'
    ) as HTMLInputElement;
    expect(nameInput.value).toBe('Coffee');
  });

  it('shows "Create category" submit button in create mode', () => {
    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Create category' })
    ).toBeInTheDocument();
  });

  it('shows "Save changes" submit button in edit mode', () => {
    render(
      <CategoryFormModal
        open={true}
        onClose={vi.fn()}
        category={existingCategory}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Save changes' })
    ).toBeInTheDocument();
  });

  it('calls createMutation.mutateAsync and onClose on successful submit', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<CategoryFormModal open={true} onClose={onClose} />);
    await user.type(
      screen.getByPlaceholderText('e.g. Coffee & cafés'),
      'Transport'
    );
    await user.click(screen.getByRole('button', { name: 'Create category' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('passes the category name to createMutation.mutateAsync', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    await user.type(
      screen.getByPlaceholderText('e.g. Coffee & cafés'),
      'Groceries'
    );
    await user.click(screen.getByRole('button', { name: 'Create category' }));

    await waitFor(() => {
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ name: 'Groceries' });
    });
  });

  it('defaults new categories to EXPENSE type', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('e.g. Coffee & cafés'), 'Test');
    await user.click(screen.getByRole('button', { name: 'Create category' }));

    await waitFor(() => {
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ type: 'EXPENSE' });
    });
  });

  it('respects defaultType prop when provided', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(
      <CategoryFormModal open={true} onClose={vi.fn()} defaultType='INCOME' />
    );
    await user.type(
      screen.getByPlaceholderText('e.g. Coffee & cafés'),
      'Salary'
    );
    await user.click(screen.getByRole('button', { name: 'Create category' }));

    await waitFor(() => {
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ type: 'INCOME' });
    });
  });

  it('calls updateMutation.mutateAsync with {id, values} in edit mode', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseUpdate.mockReturnValue(makeUpdateMock({ mutateAsync }));

    render(
      <CategoryFormModal
        open={true}
        onClose={onClose}
        category={existingCategory}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ id: 'cat-1' });
      expect(calledWith.values).toMatchObject({ name: 'Coffee' });
    });
  });

  it('does not call createMutation in edit mode', async () => {
    const user = userEvent.setup();
    const createMutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(
      makeCreateMock({ mutateAsync: createMutateAsync })
    );

    render(
      <CategoryFormModal
        open={true}
        onClose={vi.fn()}
        category={existingCategory}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(createMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('shows an error banner when the mutation fails', () => {
    mockUseCreate.mockReturnValue(
      makeCreateMock({
        isError: true,
        error: new Error('Category name taken'),
      })
    );
    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Category name taken')).toBeInTheDocument();
  });

  it('disables the submit button while the mutation is pending', () => {
    mockUseCreate.mockReturnValue(makeCreateMock({ isPending: true }));
    render(<CategoryFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
  });

  it('calls onClose when the close (×) button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CategoryFormModal open={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
