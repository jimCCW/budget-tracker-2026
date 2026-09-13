import { sendMail } from '../lib/mailer';
import { appUrl } from '../utils/appUrl';
import { activationEmail, passwordResetEmail } from '../utils/emailTemplates';

/**
 * Emails the activation code and pre-filled activation link. Rejects on delivery failure — the caller owns the failure policy.
 * @param to - Recipient email address.
 * @param code - The 5-digit activation code.
 * @param expiresInMinutes - How long the code stays valid, shown in the email.
 */
export async function sendActivationEmail(
  to: string,
  code: string,
  expiresInMinutes: number
): Promise<void> {
  const url = appUrl('/register/activate', { email: to, code });
  await sendMail({ to, ...activationEmail({ code, url, expiresInMinutes }) });
}

/**
 * Emails the password-reset link. Rejects on delivery failure — the caller owns the failure policy.
 * @param to - Recipient email address.
 * @param token - The plain-text reset token (only its hash is stored in the DB).
 * @param expiresInMinutes - How long the link stays valid, shown in the email.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  expiresInMinutes: number
): Promise<void> {
  const url = appUrl('/reset-password', { token, email: to });
  await sendMail({ to, ...passwordResetEmail({ url, expiresInMinutes }) });
}
