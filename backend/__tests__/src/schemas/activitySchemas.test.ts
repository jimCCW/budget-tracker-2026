import {
  activityQuerySchema,
  activityExportQuerySchema,
} from '../../../src/schemas/activitySchemas';

describe('activityQuerySchema', () => {
  it('accepts an empty query and applies defaults', () => {
    const r = activityQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.type).toBe('ALL');
      expect(r.data.pageSize).toBe(10);
      expect(r.data.cursor).toBeUndefined();
    }
  });

  it('accepts a fully specified query', () => {
    const r = activityQuerySchema.safeParse({
      type: 'EXPENSE',
      categoryId: 'cat-1',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      search: 'lunch',
      cursor: 'abc123',
      pageSize: '25',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.pageSize).toBe(25);
    }
  });

  it('rejects an invalid type enum value', () => {
    expect(activityQuerySchema.safeParse({ type: 'BOGUS' }).success).toBe(
      false
    );
  });

  it('rejects an invalid startDate', () => {
    expect(
      activityQuerySchema.safeParse({ startDate: 'not-a-date' }).success
    ).toBe(false);
  });

  it('rejects an invalid endDate', () => {
    expect(
      activityQuerySchema.safeParse({ endDate: 'not-a-date' }).success
    ).toBe(false);
  });

  it('rejects pageSize above 100', () => {
    expect(activityQuerySchema.safeParse({ pageSize: '101' }).success).toBe(
      false
    );
  });

  it('rejects pageSize below 1', () => {
    expect(activityQuerySchema.safeParse({ pageSize: '0' }).success).toBe(
      false
    );
  });
});

describe('activityExportQuerySchema', () => {
  it('has no cursor or pageSize fields', () => {
    const r = activityExportQuerySchema.safeParse({ type: 'INCOME' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect('cursor' in r.data).toBe(false);
      expect('pageSize' in r.data).toBe(false);
    }
  });
});
