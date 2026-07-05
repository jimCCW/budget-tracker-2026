import { dashboardTrendQuerySchema } from '../../../src/schemas/dashboardSchemas';

describe('dashboardTrendQuerySchema', () => {
  it('defaults range to 1Y when omitted', () => {
    const r = dashboardTrendQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.range).toBe('1Y');
    }
  });

  it.each(['6M', '1Y', 'All'])('accepts range=%s', (range) => {
    const r = dashboardTrendQuerySchema.safeParse({ range });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.range).toBe(range);
    }
  });

  it('rejects an invalid range value', () => {
    expect(
      dashboardTrendQuerySchema.safeParse({ range: 'BOGUS' }).success
    ).toBe(false);
  });
});
