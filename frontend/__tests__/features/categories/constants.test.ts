import { describe, it, expect } from 'vitest';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  DEFAULT_TYPE,
} from '@/features/categories/constants';

describe('CATEGORY_ICONS', () => {
  it('contains 24 entries', () => {
    expect(CATEGORY_ICONS).toHaveLength(24);
  });

  it('every entry has an id and a label', () => {
    for (const icon of CATEGORY_ICONS) {
      expect(icon.id).toBeTruthy();
      expect(icon.label).toBeTruthy();
    }
  });

  it('all icon ids start with "pi-"', () => {
    for (const icon of CATEGORY_ICONS) {
      expect(icon.id).toMatch(/^pi-/);
    }
  });

  it('has no duplicate ids', () => {
    const ids = CATEGORY_ICONS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the DEFAULT_ICON value', () => {
    const ids = CATEGORY_ICONS.map((i) => i.id);
    expect(ids).toContain(DEFAULT_ICON);
  });
});

describe('CATEGORY_COLORS', () => {
  it('contains 12 entries', () => {
    expect(CATEGORY_COLORS).toHaveLength(12);
  });

  it('all entries are valid 6-digit hex colors', () => {
    for (const color of CATEGORY_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('has no duplicate values', () => {
    const unique = new Set(CATEGORY_COLORS);
    expect(unique.size).toBe(CATEGORY_COLORS.length);
  });

  it('includes the DEFAULT_COLOR value', () => {
    expect(CATEGORY_COLORS).toContain(DEFAULT_COLOR);
  });
});

describe('defaults', () => {
  it('DEFAULT_COLOR is a valid hex color', () => {
    expect(DEFAULT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('DEFAULT_ICON starts with "pi-"', () => {
    expect(DEFAULT_ICON).toMatch(/^pi-/);
  });

  it('DEFAULT_TYPE is EXPENSE', () => {
    expect(DEFAULT_TYPE).toBe('EXPENSE');
  });
});
