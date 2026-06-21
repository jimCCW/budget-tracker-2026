import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyShort } from '@/lib/formatCurrency';

// Use Intl at runtime so tests pass across environments (Node/jsdom format SGD differently than macOS)
const sgd = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
});

describe('formatCurrency', () => {
  it('formats a positive amount in SGD by default', () => {
    expect(formatCurrency(1000)).toBe(sgd.format(1000));
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe(sgd.format(0));
  });

  it('formats a negative amount', () => {
    expect(formatCurrency(-250.5)).toBe(sgd.format(-250.5));
  });

  it('formats with two decimal places', () => {
    expect(formatCurrency(9.9)).toBe(sgd.format(9.9));
  });
});

describe('formatCurrencyShort', () => {
  it('uses short k notation for amounts >= 1000', () => {
    expect(formatCurrencyShort(1000)).toBe('S$1k');
  });

  it('shows one decimal when needed', () => {
    expect(formatCurrencyShort(1500)).toBe('S$1.5k');
  });

  it('drops trailing .0 in k notation', () => {
    expect(formatCurrencyShort(2000)).toBe('S$2k');
  });

  it('handles negative amounts >= 1000 in absolute value', () => {
    expect(formatCurrencyShort(-1500)).toBe('-S$1.5k');
  });

  it('falls back to full currency format for amounts under 1000', () => {
    expect(formatCurrencyShort(999)).toBe(sgd.format(999));
  });

  it('falls back to full format for zero', () => {
    expect(formatCurrencyShort(0)).toBe(sgd.format(0));
  });
});
