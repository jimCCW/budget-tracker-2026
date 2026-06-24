import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringPage } from '@/features/recurring/components/RecurringPage';
import { useRecurringRules } from '@/features/recurring/hooks/useRecurringRules';
import { useSetRuleActive } from '@/features/recurring/hooks/useSetRuleActive';
import { useDeleteRule } from '@/features/recurring/hooks/useDeleteRule';
import { useRunCatchup } from '@/features/recurring/hooks/useRunCatchup';
import type { RecurringRule } from '@/types/recurring';

vi.mock('@/components/AppShell', () => ({
  AppShell: ({
    children,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => <div data-testid='app-shell'>{children}</div>,
}));

vi.mock('primereact/button', () => ({
  Button: ({
    type,
    label,
    icon,
    onClick,
    disabled,
    loading,
    children,
  }: {
    type?: 'button' | 'submit' | 'reset';
    label?: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    children?: React.ReactNode;
  }) => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {icon && <i className={icon} />}
      {label}
      {children}
    </button>
  ),
}));

vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

vi.mock('@/features/recurring/hooks/useRecurringRules');
vi.mock('@/features/recurring/hooks/useSetRuleActive');
vi.mock('@/features/recurring/hooks/useDeleteRule');
vi.mock('@/features/recurring/hooks/useRunCatchup');

vi.mock('@/features/recurring/components/RecurringRuleModal', () => ({
  RecurringRuleModal: ({
    open,
    rule,
  }: {
    open: boolean;
    rule?: RecurringRule;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid='rule-modal'>{rule ? `Edit: ${rule.id}` : 'Create'}</div>
    ) : null,
}));

const mockUseRules = vi.mocked(useRecurringRules);
const mockUseSetActive = vi.mocked(useSetRuleActive);
const mockUseDeleteRule = vi.mocked(useDeleteRule);
const mockUseRunCatchup = vi.mocked(useRunCatchup);

const makeRule = (overrides: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 'rule-1',
  userId: 'u1',
  kind: 'EXPENSE',
  amount: 1500,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  note: 'Monthly rent',
  frequency: 'MONTHLY',
  interval: 1,
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: null,
  anchorDay: 1,
  nextRunDate: '2026-07-01T00:00:00.000Z',
  lastRunDate: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  account: {
    id: 'acc-1',
    userId: 'u1',
    name: 'DBS Bank',
    type: 'BANK',
    balance: 5000,
    icon: null,
    color: null,
    createdAt: '',
    updatedAt: '',
  },
  category: {
    id: 'cat-1',
    userId: 'u1',
    name: 'Rent',
    icon: 'pi-home',
    color: '#6366F1',
    type: 'EXPENSE',
    isDefault: false,
  },
  ...overrides,
});

function setupMocks({
  rules = [] as RecurringRule[],
  isLoading = false,
  runCatchupPending = false,
} = {}) {
  mockUseRules.mockReturnValue({
    data: rules,
    isLoading,
  } as ReturnType<typeof useRecurringRules>);

  mockUseSetActive.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as ReturnType<typeof useSetRuleActive>);

  mockUseDeleteRule.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as ReturnType<typeof useDeleteRule>);

  mockUseRunCatchup.mockReturnValue({
    mutate: vi.fn(),
    isPending: runCatchupPending,
  } as ReturnType<typeof useRunCatchup>);
}

describe('RecurringPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders skeleton placeholders while loading', () => {
      setupMocks({ isLoading: true });
      render(<RecurringPage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('does not render the empty state while loading', () => {
      setupMocks({ isLoading: true });
      render(<RecurringPage />);
      expect(
        screen.queryByText('Create your first recurring rule')
      ).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders the empty state prompt when there are no rules', () => {
      setupMocks({ rules: [] });
      render(<RecurringPage />);
      expect(
        screen.getByText('Create your first recurring rule')
      ).toBeInTheDocument();
    });

    it('shows "0 rules" in the count label', () => {
      setupMocks({ rules: [] });
      render(<RecurringPage />);
      expect(screen.getByText('0 rules')).toBeInTheDocument();
    });
  });

  describe('rule list', () => {
    it('renders the rule note as the primary label', () => {
      setupMocks({ rules: [makeRule()] });
      render(<RecurringPage />);
      expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    });

    it('falls back to category name when note is null', () => {
      setupMocks({ rules: [makeRule({ note: null })] });
      render(<RecurringPage />);
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });

    it('falls back to "Expense" when both note and category are null', () => {
      setupMocks({ rules: [makeRule({ note: null, category: null })] });
      render(<RecurringPage />);
      expect(screen.getByText('Expense')).toBeInTheDocument();
    });

    it('renders the frequency label in the sub-label', () => {
      setupMocks({ rules: [makeRule()] });
      render(<RecurringPage />);
      // Sub-label: "Monthly · Next <date> · DBS Bank"
      expect(screen.getByText(/Monthly ·/)).toBeInTheDocument();
    });

    it('renders the account name in the sub-label', () => {
      setupMocks({ rules: [makeRule()] });
      render(<RecurringPage />);
      expect(screen.getByText(/DBS Bank/)).toBeInTheDocument();
    });

    it('renders the formatted amount with a minus sign for expenses', () => {
      setupMocks({ rules: [makeRule({ kind: 'EXPENSE', amount: 1500 })] });
      render(<RecurringPage />);
      expect(screen.getByText(/-/)).toBeInTheDocument();
      expect(screen.getByText(/1,500/)).toBeInTheDocument();
    });

    it('renders the amount with a plus sign for income rules', () => {
      setupMocks({
        rules: [
          makeRule({
            kind: 'INCOME',
            amount: 3000,
            category: {
              id: 'cat-2',
              userId: 'u1',
              name: 'Salary',
              icon: null,
              color: null,
              type: 'INCOME',
              isDefault: false,
            },
          }),
        ],
      });
      render(<RecurringPage />);
      expect(screen.getByText(/\+/)).toBeInTheDocument();
    });

    it('shows "1 rule" (singular) when there is exactly one rule', () => {
      setupMocks({ rules: [makeRule()] });
      render(<RecurringPage />);
      expect(screen.getByText('1 rule')).toBeInTheDocument();
    });

    it('shows the pause icon for an active rule', () => {
      setupMocks({ rules: [makeRule({ isActive: true })] });
      const { container } = render(<RecurringPage />);
      expect(container.querySelector('.pi-pause')).toBeInTheDocument();
    });

    it('shows the play icon for an inactive rule', () => {
      setupMocks({ rules: [makeRule({ isActive: false })] });
      const { container } = render(<RecurringPage />);
      expect(container.querySelector('.pi-play')).toBeInTheDocument();
    });

    it('reduces opacity for inactive rules', () => {
      setupMocks({ rules: [makeRule({ isActive: false })] });
      const { container } = render(<RecurringPage />);
      expect(container.querySelector('.opacity-60')).toBeInTheDocument();
    });
  });

  describe('rule actions', () => {
    it('calls setActive.mutate with toggled isActive when pause/resume clicked', async () => {
      const user = userEvent.setup();
      const mutate = vi.fn();
      mockUseSetActive.mockReturnValue({
        mutate,
        isPending: false,
      } as ReturnType<typeof useSetRuleActive>);
      setupMocks({ rules: [makeRule({ isActive: true })] });
      mockUseSetActive.mockReturnValue({
        mutate,
        isPending: false,
      } as ReturnType<typeof useSetRuleActive>);

      const { container } = render(<RecurringPage />);
      const pauseBtn = container.querySelector('.pi-pause')!.closest('button')!;
      await user.click(pauseBtn);

      expect(mutate).toHaveBeenCalledWith({ id: 'rule-1', isActive: false });
    });

    it('opens the edit modal with the rule when the edit button is clicked', async () => {
      const user = userEvent.setup();
      setupMocks({ rules: [makeRule()] });

      const { container } = render(<RecurringPage />);
      const editBtn = container.querySelector('.pi-pencil')!.closest('button')!;
      await user.click(editBtn);

      expect(screen.getByTestId('rule-modal')).toHaveTextContent(
        'Edit: rule-1'
      );
    });

    it('calls deleteRule.mutateAsync with the rule id when delete is clicked', async () => {
      const user = userEvent.setup();
      const mutateAsync = vi.fn().mockResolvedValue({});
      mockUseDeleteRule.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as ReturnType<typeof useDeleteRule>);
      setupMocks({ rules: [makeRule()] });
      mockUseDeleteRule.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as ReturnType<typeof useDeleteRule>);

      const { container } = render(<RecurringPage />);
      const deleteBtn = container
        .querySelector('.pi-trash')!
        .closest('button')!;
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith('rule-1');
      });
    });
  });

  describe('toolbar', () => {
    it('always renders the "New rule" button', () => {
      setupMocks({ rules: [] });
      render(<RecurringPage />);
      expect(
        screen.getByRole('button', { name: /New rule/ })
      ).toBeInTheDocument();
    });

    it('opens the create modal when "New rule" is clicked', async () => {
      const user = userEvent.setup();
      setupMocks({ rules: [] });
      render(<RecurringPage />);
      await user.click(screen.getByRole('button', { name: /New rule/ }));
      expect(screen.getByTestId('rule-modal')).toHaveTextContent('Create');
    });

    it('renders the "Run now" button', () => {
      setupMocks();
      render(<RecurringPage />);
      expect(
        screen.getByRole('button', { name: /Run now/ })
      ).toBeInTheDocument();
    });

    it('calls runCatchup.mutate when "Run now" is clicked', async () => {
      const user = userEvent.setup();
      const mutate = vi.fn();
      setupMocks();
      mockUseRunCatchup.mockReturnValue({
        mutate,
        isPending: false,
      } as ReturnType<typeof useRunCatchup>);

      render(<RecurringPage />);
      await user.click(screen.getByRole('button', { name: /Run now/ }));
      expect(mutate).toHaveBeenCalledOnce();
    });

    it('disables "Run now" while runCatchup is pending', () => {
      setupMocks({ runCatchupPending: true });
      render(<RecurringPage />);
      expect(screen.getByRole('button', { name: /Run now/ })).toBeDisabled();
    });
  });
});
