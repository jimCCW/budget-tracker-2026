import ExcelJS from 'exceljs';
import { buildActivityWorkbook } from '../../../src/utils/activityExport';
import type { ActivityItem } from '../../../src/services/activityService';

const makeItem = (overrides: Partial<ActivityItem> = {}): ActivityItem => ({
  id: 'exp-1',
  type: 'EXPENSE',
  date: '2026-01-05T00:00:00.000Z',
  amount: 50,
  note: 'Lunch',
  isRecurring: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  category: {
    id: 'cat-1',
    name: 'Food & Dining',
    icon: 'pi-shop',
    color: '#ff0000',
  },
  account: { id: 'acc-1', name: 'Main bank' },
  ...overrides,
});

describe('buildActivityWorkbook', () => {
  it('produces a workbook with the expected header row', async () => {
    const buffer = await buildActivityWorkbook([makeItem()]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Activity')!;

    const header = sheet.getRow(1).values as unknown[];
    expect(header.slice(1)).toEqual([
      'Date',
      'Type',
      'Category',
      'Account',
      'Note',
      'Recurring',
      'Amount',
    ]);
    expect(sheet.getRow(1).getCell(1).font?.bold).toBe(true);
  });

  it('renders expense amounts as negative and income as positive', async () => {
    const buffer = await buildActivityWorkbook([
      makeItem({ type: 'EXPENSE', amount: 50 }),
      makeItem({ id: 'inc-1', type: 'INCOME', amount: 5200, note: 'Salary' }),
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Activity')!;

    expect(sheet.getRow(2).getCell(7).value).toBe(-50);
    expect(sheet.getRow(3).getCell(7).value).toBe(5200);
  });

  it('renders the recurring flag as Yes/No', async () => {
    const buffer = await buildActivityWorkbook([
      makeItem({ isRecurring: true }),
      makeItem({ id: 'exp-2', isRecurring: false }),
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Activity')!;

    expect(sheet.getRow(2).getCell(6).value).toBe('Yes');
    expect(sheet.getRow(3).getCell(6).value).toBe('No');
  });

  it('produces an empty (header-only) sheet for no rows', async () => {
    const buffer = await buildActivityWorkbook([]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Activity')!;

    expect(sheet.rowCount).toBe(1);
  });
});
