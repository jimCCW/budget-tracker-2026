import { useState } from 'react';
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

  describe('manual (server-side) pagination', () => {
    function ControlledManualTable({
      initialPageIndex = 0,
      totalCount,
    }: {
      initialPageIndex?: number;
      totalCount?: number;
    }) {
      const [pageIndex, setPageIndex] = useState(initialPageIndex);
      return (
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          defaultPageSize={1}
          pageIndex={pageIndex}
          pageCount={3}
          totalCount={totalCount}
          onPageChange={setPageIndex}
        />
      );
    }

    it('renders every row passed in data, without slicing by defaultPageSize', () => {
      // data has 2 rows; defaultPageSize is 1 — client mode would show only 1,
      // but manual mode must treat `data` as an already-fetched page.
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          defaultPageSize={1}
          pageIndex={0}
          pageCount={5}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows "Page X of Y" using the provided pageCount, not data.length', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={0}
          pageCount={5}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    });

    it('shows a "Showing X-Y of Z" label when totalCount is provided', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          defaultPageSize={10}
          pageIndex={0}
          pageCount={1}
          totalCount={6}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText('Showing 1–6 of 6')).toBeInTheDocument();
    });

    it('shows "Showing 0 of 0" when totalCount is 0', () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={0}
          pageCount={0}
          totalCount={0}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText('Showing 0 of 0')).toBeInTheDocument();
    });

    it('falls back to "Page X of Y" (no "Showing" label) when totalCount is omitted', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={0}
          pageCount={2}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    it('disables the previous button on the first page', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={0}
          pageCount={3}
          onPageChange={vi.fn()}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Previous page' })
      ).toBeDisabled();
    });

    it('disables the next button on the last page (per the provided pageCount)', () => {
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={2}
          pageCount={3}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('calls onPageChange with pageIndex + 1 when next is clicked, without mutating pageIndex itself', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={0}
          pageCount={3}
          onPageChange={onPageChange}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with pageIndex - 1 when previous is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <DataTable
          data={rows}
          columns={columns}
          enablePagination
          manualPagination
          pageIndex={1}
          pageCount={3}
          onPageChange={onPageChange}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(onPageChange).toHaveBeenCalledWith(0);
    });

    it('advances the displayed page when the parent updates the controlled pageIndex prop', async () => {
      const user = userEvent.setup();
      render(<ControlledManualTable />);
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    });
  });
});
