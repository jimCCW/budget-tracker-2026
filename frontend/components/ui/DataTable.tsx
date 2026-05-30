'use client';
import { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type Updater,
  type RowData,
} from '@tanstack/react-table';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

// Extend column meta to support text alignment per column
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right' | 'center';
  }
}

export type { ColumnDef };

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  className?: string;
  /** Enable column sorting by clicking headers. */
  enableSorting?: boolean;
  /** Enable built-in pagination controls. */
  enablePagination?: boolean;
  /** Rows per page when pagination is enabled. Defaults to 10. */
  defaultPageSize?: number;
  /** Enable row checkboxes. Fires onRowSelectionChange with selected rows. */
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: T[]) => void;
};

const ALIGN: Record<string, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const checkboxPt = {
  root: { className: 'flex items-center justify-center' },
  box: {
    className:
      'w-4 h-4 rounded border border-border flex items-center justify-center bg-surface transition-colors data-[p-checked=true]:bg-primary data-[p-checked=true]:border-primary cursor-pointer',
  },
  icon: { className: 'text-white text-[10px]' },
  input: { className: 'sr-only' },
};

export function DataTable<T>({
  data,
  columns,
  className,
  enableSorting = false,
  enablePagination = false,
  defaultPageSize = 10,
  enableRowSelection = false,
  onRowSelectionChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectionColumn: ColumnDef<T> = {
    id: '_select',
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.checked ?? false)}
        pt={checkboxPt}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={(e) => row.toggleSelected(e.checked ?? false)}
        pt={checkboxPt}
      />
    ),
  };

  const allColumns: ColumnDef<T>[] = enableRowSelection
    ? [selectionColumn, ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, rowSelection },
    enableSorting,
    enableRowSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      setRowSelection((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    initialState: { pagination: { pageSize: defaultPageSize, pageIndex: 0 } },
  });

  useEffect(() => {
    if (!onRowSelectionChange) return;
    const selected = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((k) => data[parseInt(k)])
      .filter(Boolean);
    onRowSelectionChange(selected);
  }, [rowSelection]);

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div className={className}>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-[13px]'>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const align = header.column.columnDef.meta?.align ?? 'left';
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`pb-2 text-[10.5px] font-bold uppercase tracking-wider text-text-muted border-b border-border pr-4 last:pr-0 ${ALIGN[align]} ${canSort ? 'cursor-pointer select-none hover:text-text transition-colors' : ''}`}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span className='inline-flex items-center gap-1'>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && (
                          <i
                            className={`pi text-[9px] transition-opacity ${
                              sorted === 'asc'
                                ? 'pi-sort-up-fill opacity-100'
                                : sorted === 'desc'
                                  ? 'pi-sort-down-fill opacity-100'
                                  : 'pi-sort-alt opacity-30'
                            }`}
                          />
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={allColumns.length}
                  className='py-10 text-center text-sm text-text-muted'
                >
                  No results.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-b-0 transition-colors ${
                    enableRowSelection && row.getIsSelected()
                      ? 'bg-primary-tint/50'
                      : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = cell.column.columnDef.meta?.align ?? 'left';
                    return (
                      <td
                        key={cell.id}
                        className={`py-3 pr-4 last:pr-0 ${ALIGN[align]}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <div className='flex items-center justify-between pt-4 border-t border-border mt-4'>
          <p className='text-xs text-text-muted'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
            {enableRowSelection && selectedCount > 0
              ? ` · ${selectedCount} selected`
              : ''}
          </p>
          <div className='flex items-center gap-1'>
            <Button
              icon='pi pi-angle-left'
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              aria-label='Previous page'
              pt={{
                root: {
                  className:
                    'w-8 h-8 flex items-center justify-center rounded-md border border-border text-text-muted hover:bg-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                },
                icon: { className: 'text-sm' },
              }}
            />
            <Button
              icon='pi pi-angle-right'
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              aria-label='Next page'
              pt={{
                root: {
                  className:
                    'w-8 h-8 flex items-center justify-center rounded-md border border-border text-text-muted hover:bg-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                },
                icon: { className: 'text-sm' },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
