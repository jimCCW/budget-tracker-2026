import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_TYPE_META,
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
} from '@/features/accounts/constants';

describe('ACCOUNT_TYPE_META', () => {
  it('has an entry for each of the 5 account types', () => {
    const types = ['BANK', 'CASH', 'INVESTMENT', 'CRYPTO', 'CREDIT'] as const;
    for (const type of types) {
      expect(ACCOUNT_TYPE_META[type]).toBeDefined();
    }
  });

  it('every entry has label, icon, color, and group', () => {
    for (const entry of Object.values(ACCOUNT_TYPE_META)) {
      expect(entry.label).toBeTruthy();
      expect(entry.icon).toBeTruthy();
      expect(entry.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(['liquid', 'investment', 'credit']).toContain(entry.group);
    }
  });

  it('BANK and CASH are in the liquid group', () => {
    expect(ACCOUNT_TYPE_META.BANK.group).toBe('liquid');
    expect(ACCOUNT_TYPE_META.CASH.group).toBe('liquid');
  });

  it('INVESTMENT and CRYPTO are in the investment group', () => {
    expect(ACCOUNT_TYPE_META.INVESTMENT.group).toBe('investment');
    expect(ACCOUNT_TYPE_META.CRYPTO.group).toBe('investment');
  });

  it('CREDIT is in the credit group', () => {
    expect(ACCOUNT_TYPE_META.CREDIT.group).toBe('credit');
  });

  it('CREDIT label is "Credit Card"', () => {
    expect(ACCOUNT_TYPE_META.CREDIT.label).toBe('Credit Card');
  });

  it('BANK label is "Bank"', () => {
    expect(ACCOUNT_TYPE_META.BANK.label).toBe('Bank');
  });
});

describe('ACCOUNT_COLORS', () => {
  it('contains 12 entries', () => {
    expect(ACCOUNT_COLORS).toHaveLength(12);
  });

  it('all entries are valid 6-digit hex colors', () => {
    for (const color of ACCOUNT_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('has no duplicate values', () => {
    const unique = new Set(ACCOUNT_COLORS);
    expect(unique.size).toBe(ACCOUNT_COLORS.length);
  });
});

describe('DEFAULT_ACCOUNT_COLOR', () => {
  it('is a valid hex color', () => {
    expect(DEFAULT_ACCOUNT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('matches the BANK type color', () => {
    expect(DEFAULT_ACCOUNT_COLOR).toBe(ACCOUNT_TYPE_META.BANK.color);
  });

  it('is included in ACCOUNT_COLORS', () => {
    expect(ACCOUNT_COLORS).toContain(DEFAULT_ACCOUNT_COLOR);
  });
});
