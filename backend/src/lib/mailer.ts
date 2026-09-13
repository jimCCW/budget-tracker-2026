import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** `undefined` = not resolved yet; `null` = no SMTP configured, use the console fallback. */
let transporter: Transporter | null | undefined;

/**
 * Lazily creates and memoizes the SMTP transporter from the `SMTP_*` env vars.
 * Env is read at first send, not import time, so dotenv (loaded only in `index.ts`) has run.
 * Timeouts are explicit because Nodemailer's defaults are minutes long and callers await sends.
 * @returns The transporter, or `null` when `SMTP_HOST` is unset (local dev / tests).
 */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return transporter;
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

/**
 * Sends one email via SMTP. When no transport is configured, logs the message to the console
 * with a `[DEV]` prefix instead (the text body carries the code / link).
 * Rejects on SMTP failure or a missing `MAIL_FROM` — callers decide whether that is fatal.
 * @param msg - Recipient, subject and both body variants.
 */
export async function sendMail(msg: MailMessage): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[DEV] Email to ${msg.to} — ${msg.subject}\n${msg.text}`);
    return;
  }

  const from = process.env.MAIL_FROM;
  if (!from) {
    throw new Error('MAIL_FROM must be set when SMTP_HOST is configured.');
  }
  await transport.sendMail({ from, ...msg });
}
