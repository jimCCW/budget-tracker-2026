import ExcelJS from 'exceljs';
import type { ActivityItem } from '../services/activityService';

/**
 * Builds an .xlsx workbook buffer for a set of activity rows.
 * Expense amounts are rendered negative so signed totals sum correctly in Excel.
 * @param rows - Activity items to export (already filtered/sorted by the caller).
 */
export async function buildActivityWorkbook(
  rows: ActivityItem[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Activity');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Account', key: 'account', width: 18 },
    { header: 'Note', key: 'note', width: 30 },
    { header: 'Recurring', key: 'recurring', width: 12 },
    { header: 'Amount', key: 'amount', width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      date: row.date.slice(0, 10),
      type: row.type,
      category: row.category.name,
      account: row.account.name,
      note: row.note ?? '',
      recurring: row.isRecurring ? 'Yes' : 'No',
      amount:
        row.type === 'EXPENSE' ? -Math.abs(row.amount) : Math.abs(row.amount),
    });
  }

  sheet.getColumn('amount').numFmt = '#,##0.00;-#,##0.00';

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
