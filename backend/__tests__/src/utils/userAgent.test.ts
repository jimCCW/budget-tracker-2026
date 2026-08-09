import { describeUserAgent } from '../../../src/utils/userAgent';

describe('describeUserAgent', () => {
  it('returns "Unknown device" for null/undefined', () => {
    expect(describeUserAgent(undefined)).toBe('Unknown device');
    expect(describeUserAgent(null)).toBe('Unknown device');
    expect(describeUserAgent('')).toBe('Unknown device');
  });

  it('detects Chrome on Windows', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      )
    ).toBe('Chrome · Windows');
  });

  it('detects Safari on Mac (without misdetecting Chrome)', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15'
      )
    ).toBe('Safari · Mac');
  });

  it('detects mobile Safari on iPhone', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe('Safari · iPhone');
  });

  it('detects Edge distinctly from Chrome', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      )
    ).toBe('Edge · Windows');
  });

  it('falls back to a bare browser label when no OS is recognized', () => {
    expect(describeUserAgent('SomeCustomClient/1.0')).toBe('Browser');
  });
});
