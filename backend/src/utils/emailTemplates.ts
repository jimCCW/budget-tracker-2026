import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

type TemplateName = 'activation' | 'password-reset';
type TemplateData = Record<string, string | number>;

/** Resolves identically from `src/utils/` (ts-node-dev, Jest) and `dist/utils/` (compiled build). */
const TEMPLATE_DIR = path.join(__dirname, '../templates/emails');

const cache = new Map<string, Handlebars.TemplateDelegate>();

/**
 * Reads and compiles a template file once per process, then serves it from cache.
 * @param file - File name inside `src/templates/emails/`, e.g. `activation.hbs`.
 * @param options - Handlebars compile options (`noEscape` for plain-text templates).
 * @returns The compiled template function.
 */
function compile(
  file: string,
  options?: CompileOptions
): Handlebars.TemplateDelegate {
  let template = cache.get(file);
  if (!template) {
    const source = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf8');
    template = Handlebars.compile(source, options);
    cache.set(file, template);
  }
  return template;
}

/**
 * Renders an email's HTML (wrapped in the shared layout) and plain-text bodies from its `.hbs` files.
 * HTML values are auto-escaped by Handlebars; the plain-text variant is rendered with escaping off.
 * @param name - Template base name — `<name>.hbs` and `<name>.txt.hbs` must both exist.
 * @param title - Used as the HTML document `<title>`.
 * @param data - Values referenced by the templates.
 * @returns The rendered `html` and `text` bodies.
 */
export function renderEmail(
  name: TemplateName,
  title: string,
  data: TemplateData
): { html: string; text: string } {
  const body = compile(`${name}.hbs`)(data);
  const html = compile('layout.hbs')({ title, body });
  const text = compile(`${name}.txt.hbs`, { noEscape: true })(data);
  return { html, text };
}

/**
 * Builds the account-activation email: prominent 5-digit code, activation button, expiry note.
 * @param input.code - The 5-digit activation code.
 * @param input.url - Absolute activation URL (email + code pre-filled).
 * @param input.expiresInMinutes - How long the code stays valid.
 * @returns Subject, HTML and plain-text content.
 */
export function activationEmail(input: {
  code: string;
  url: string;
  expiresInMinutes: number;
}): EmailContent {
  const subject = `${input.code} is your Budget Tracker activation code`;
  return { subject, ...renderEmail('activation', subject, input) };
}

/**
 * Builds the password-reset email: reset button, expiry note, "ignore if this wasn't you" line.
 * @param input.url - Absolute reset URL (token + email pre-filled).
 * @param input.expiresInMinutes - How long the link stays valid.
 * @returns Subject, HTML and plain-text content.
 */
export function passwordResetEmail(input: {
  url: string;
  expiresInMinutes: number;
}): EmailContent {
  const subject = 'Reset your Budget Tracker password';
  return { subject, ...renderEmail('password-reset', subject, input) };
}
