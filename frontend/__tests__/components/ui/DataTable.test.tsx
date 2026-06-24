import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '@/components/ui/DataTable';
import type { ColumnDef } from '@/components/ui/DataTable';

vi.mock('primereact/button', () => ({
  Button: ({
    icon,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: {
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      <i className={icon} />
    </button>
  ),
}));

vi.mock('primereact/checkbox', () => ({
  Checkbox: ({
    checked,
    disabled,
    onChange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (e: { checked: boolean }) => void;
  }) => (
    <input
      type='checkbox'
      checked={!!checked}
      disabled={disabled}
      readOnly={!onChange}
      onChange={(e) => onChange?.({ checked: e.target.checked })}
    />
  ),
}));

type Row = { id: string; name: string; amount: number };

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount', meta: { align: 'right' } },
];

const rows: Row[] = [
  { id: '1', name: 'Alice', amount: 100 },
  { id: '2', name: 'Bob', amount: 200 },
];

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders column headers', () => {
      render(<DataTable data={rows} columns={columns} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('renders all row data', () => {
      render(<DataTable data={rows} columns={columns} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('shows "No results." when data is empty', () => {
      render(<DataTable data={[]} columns={columns} />);
      expect(screen.getByText('No results.')).toBeInTheDocument();
    });

    it('applies the optional className to the outer wrapper', () => {
      const { container } = render(
        <DataTable data={rows} columns={columns} className='custom-table' />
      );
      expect(container.firstChild).toHaveClass('custom-table');
    });
  });

  describe('pagination', () => {
    it('does not render pagination controls by default', () => {
      render(<DataTable data={rows} columns={columns} />);
      expect(
        screen.queryByRole('button', { name: 'Previous page' })
      ).not.toBeInTheDocument();
    });

    it('shows page indicator when pagination is enabled', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          defaultPageSize={1}
        />
      );
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    it('disables the previous page button on the first page', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          defaultPageSize={1}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Previous page' })
      ).toBeDisabled();
    });

    it('enables the next page button when more pages exist', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          defaultPageSize={1}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Next page' })
      ).not.toBeDisabled();
    });

    it('advances to page 2 when next page is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          defaultPageSize={1}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    });

    it('disables next button and enables previous on the last page', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          defaultPageSize={1}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Previous page' })
      ).not.toBeDisabled();
    });

    it('goes back to page 1 when previous page is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          defaultPageSize={1}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('does not render sort icons when sorting is disabled', () => {
      render(<DataTable data={rows} columns={columns} />);
      expect(document.querySelector('.pi-sort-alt')).not.toBeInTheDocument();
    });

    it('renders sort icons on sortable headers when enabled', () => {
      render(<DataTable data={rows} columns={columns} enableSorting />);
      const sortIcons = document.querySelectorAll('.pi-sort-alt');
      expect(sortIcons.length).toBeGreaterThan(0);
    });

    it('shows ascending icon after clicking a sortable header once', async () => {
      const user = userEvent.setup();
      render(<DataTable data={rows} columns={columns} enableSorting />);
      await user.click(screen.getByText('Name'));
      expect(document.querySelector('.pi-sort-up-fill')).toBeInTheDocument();
    });

    it('shows descending icon after clicking a sortable header twice', async () => {
      const user = userEvent.setup();
      render(<DataTable data={rows} columns={columns} enableSorting />);
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      await user.click(nameHeader);
      expect(document.querySelector('.pi-sort-down-fill')).toBeInTheDocument();
    });

    it('clears sort and returns to unsorted icon after clicking three times', async () => {
      const user = userEvent.setup();
      render(<DataTable data={rows} columns={columns} enableSorting />);
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      await user.click(nameHeader);
      await user.click(nameHeader);
      expect(
        document.querySelector('.pi-sort-up-fill')
      ).not.toBeInTheDocument();
      expect(
        document.querySelector('.pi-sort-down-fill')
      ).not.toBeInTheDocument();
    });
  });

  describe('row selection', () => {
    it('does not render checkboxes when row selection is disabled', () => {
      render(<DataTable data={rows} columns={columns} />);
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('renders a select-all header checkbox and one checkbox per row', () => {
      render(<DataTable data={rows} columns={columns} enableRowSelection />);
      expect(screen.getAllByRole('checkbox')).toHaveLength(3); // 1 header + 2 rows
    });

    it('calls onRowSelectionChange with the selected row when a row is checked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enableRowSelection
          onRowSelectionChange={onSelectionChange}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // first row
      expect(onSelectionChange).toHaveBeenCalledWith([rows[0]]);
    });

    it('shows selected count in pagination info when both features are enabled', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enableRowSelection
          enablePagination
          onRowSelectionChange={vi.fn()}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      expect(screen.getByText(/1 selected/)).toBeInTheDocument();
    });
  });
});
