import { describe, it, expect } from 'vitest';
import { FREQUENCIES } from '@/features/recurring/constants/frequencies';

describe('FREQUENCIES', () => {
  it('contains exactly 4 entries', () => {
    expect(FREQUENCIES).toHaveLength(4);
  });

  it('every entry has a value, label, and icon', () => {
    for (const f of FREQUENCIES) {
      expect(f.value).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(f.icon).toBeTruthy();
    }
  });

  it('covers all four frequency values', () => {
    const values = FREQUENCIES.map((f) => f.value);
    expect(values).toContain('DAILY');
    expect(values).toContain('WEEKLY');
    expect(values).toContain('MONTHLY');
    expect(values).toContain('YEARLY');
  });

  it('all icon strings start with "pi-"', () => {
    for (const f of FREQUENCIES) {
      expect(f.icon).toMatch(/^pi-/);
    }
  });

  it('has no duplicate values', () => {
    const values = FREQUENCIES.map((f) => f.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
