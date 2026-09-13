import {
  activationEmail,
  passwordResetEmail,
} from '../../../src/utils/emailTemplates';

describe('activationEmail', () => {
  const input = {
    code: '12345',
    url: 'http://localhost:3000/register/activate?email=a%40b.com&code=12345',
    expiresInMinutes: 15,
  };

  it('includes the code in subject, html and text', () => {
    const { subject, html, text } = activationEmail(input);
    expect(subject).toContain('12345');
    expect(html).toContain('12345');
    expect(text).toContain('12345');
  });

  it('includes the raw URL in text and an escaped href in html', () => {
    const { html, text } = activationEmail(input);
    expect(text).toContain(input.url);
    // Handlebars escapes both `&` and `=` (still valid HTML — browsers render &#x3D; as =).
    expect(html).toContain(
      'href="http://localhost:3000/register/activate?email&#x3D;a%40b.com&amp;code&#x3D;12345"'
    );
  });

  it('states the expiry', () => {
    const { html, text } = activationEmail(input);
    expect(html).toContain('15 minutes');
    expect(text).toContain('15 minutes');
  });

  it('escapes HTML-significant characters in values', () => {
    const { html } = activationEmail({
      ...input,
      code: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('wraps the body in the shared layout', () => {
    const { html } = activationEmail(input);
    expect(html.trim().startsWith('<!doctype html>')).toBe(true);
  });
});

describe('passwordResetEmail', () => {
  const input = {
    url: 'http://localhost:3000/reset-password?token=tok&email=a%40b.com',
    expiresInMinutes: 15,
  };

  it('includes the raw URL in text and an escaped href in html', () => {
    const { html, text } = passwordResetEmail(input);
    expect(text).toContain(input.url);
    expect(html).toContain(
      'href="http://localhost:3000/reset-password?token&#x3D;tok&amp;email&#x3D;a%40b.com"'
    );
  });

  it('mentions ignoring the email if not requested', () => {
    const { html, text } = passwordResetEmail(input);
    expect(html.toLowerCase()).toContain('ignore');
    expect(text.toLowerCase()).toContain('ignore');
  });

  it('states the expiry', () => {
    const { html, text } = passwordResetEmail(input);
    expect(html).toContain('15 minutes');
    expect(text).toContain('15 minutes');
  });
});

describe('template caching', () => {
  it('reads each template file at most once per process', () => {
    const fs = require('fs');
    const readSpy = jest.spyOn(fs, 'readFileSync');

    activationEmail({ code: '1', url: 'http://x', expiresInMinutes: 1 });
    const callsAfterFirst = readSpy.mock.calls.length;
    activationEmail({ code: '2', url: 'http://y', expiresInMinutes: 2 });

    expect(readSpy.mock.calls.length).toBe(callsAfterFirst);
    readSpy.mockRestore();
  });
});
