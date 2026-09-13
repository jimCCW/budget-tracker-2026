describe('frontendUrl', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('defaults to the local Next.js dev server when FRONTEND_URL is unset', () => {
    delete process.env.FRONTEND_URL;
    const { frontendUrl } = require('../../../src/utils/appUrl');
    expect(frontendUrl()).toBe('http://localhost:3000');
  });

  it('uses FRONTEND_URL when set', () => {
    process.env.FRONTEND_URL = 'https://app.example.com';
    const { frontendUrl } = require('../../../src/utils/appUrl');
    expect(frontendUrl()).toBe('https://app.example.com');
  });
});

describe('appUrl', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.FRONTEND_URL;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('builds a URL with no query string when none is given', () => {
    const { appUrl } = require('../../../src/utils/appUrl');
    expect(appUrl('/reset-password')).toBe(
      'http://localhost:3000/reset-password'
    );
  });

  it('encodes query values and preserves insertion order', () => {
    const { appUrl } = require('../../../src/utils/appUrl');
    expect(appUrl('/reset-password', { token: 'tok', email: 'a@b.com' })).toBe(
      'http://localhost:3000/reset-password?token=tok&email=a%40b.com'
    );
  });
});
