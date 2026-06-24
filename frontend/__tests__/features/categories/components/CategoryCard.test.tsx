import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import type { Category } from '@/types/category';

vi.mock('primereact/button', () => ({
  Button: ({
    icon,
    onClick,
    'aria-label': ariaLabel,
    children,
  }: {
    icon?: string;
    onClick?: (e: React.MouseEvent) => void;
    'aria-label'?: string;
    children?: React.ReactNode;
  }) => (
    <button onClick={onClick as React.MouseEventHandler} aria-label={ariaLabel}>
      {icon && <i className={icon} />}
      {children}
    </button>
  ),
}));

vi.mock('primereact/menu', () => ({
  Menu: ({
    model,
  }: {
    model?: Array<{ label?: string; command?: (...args: unknown[]) => void }>;
  }) => (
    <div data-testid='menu'>
      {model?.map((item, i) => (
        <button key={i} onClick={() => item.command?.()}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

const customCategory: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Coffee',
  icon: 'pi-coffee',
  color: '#F59E0B',
  type: 'EXPENSE',
  isDefault: false,
};

const defaultCategory: Category = {
  id: 'cat-2',
  userId: null,
  name: 'Food & Dining',
  icon: 'pi-shopping-cart',
  color: '#6366F1',
  type: 'EXPENSE',
  isDefault: true,
};

describe('CategoryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the category name', () => {
    render(
      <CategoryCard
        category={customCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('renders "Custom category" label for non-default categories', () => {
    render(
      <CategoryCard
        category={customCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Custom category')).toBeInTheDocument();
  });

  it('renders "Default category" label for default categories', () => {
    render(
      <CategoryCard
        category={defaultCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Default category')).toBeInTheDocument();
  });

  it('does not render the options menu for default categories', () => {
    render(
      <CategoryCard
        category={defaultCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByTestId('menu')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Category options' })
    ).not.toBeInTheDocument();
  });

  it('renders the options menu for custom categories', () => {
    render(
      <CategoryCard
        category={customCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByTestId('menu')).toBeInTheDocument();
  });

  it('uses the category icon when provided', () => {
    const { container } = render(
      <CategoryCard
        category={customCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(container.querySelector('.pi-coffee')).toBeInTheDocument();
  });

  it('falls back to the default icon when category.icon is null', () => {
    const noIcon: Category = { ...customCategory, icon: null };
    const { container } = render(
      <CategoryCard category={noIcon} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(container.querySelector('.pi-tag')).toBeInTheDocument();
  });

  it('applies the category color to the icon container', () => {
    const { container } = render(
      <CategoryCard
        category={customCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const iconEl = container.querySelector('.w-11.h-11') as HTMLElement;
    // #F59E0B → rgb(245, 158, 11)
    expect(iconEl.style.backgroundColor).toBe('rgb(245, 158, 11)');
  });

  it('falls back to #6366F1 when category.color is null', () => {
    const noColor: Category = { ...customCategory, color: null };
    const { container } = render(
      <CategoryCard category={noColor} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const iconEl = container.querySelector('.w-11.h-11') as HTMLElement;
    // #6366F1 → rgb(99, 102, 241)
    expect(iconEl.style.backgroundColor).toBe('rgb(99, 102, 241)');
  });

  it('calls onEdit with the category when Edit menu item is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <CategoryCard
        category={customCategory}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );
    await user.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(customCategory);
  });

  it('calls onDelete with the category when Delete menu item is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <CategoryCard
        category={customCategory}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(customCategory);
  });
});
