import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { appError } from '../utils/appError';

const prisma = new PrismaClient();

/** Generates a random 5-digit numeric code as a string. */
function generateCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/** Returns a Date 15 minutes from now, used as the activation code expiry. */
function codeExpiry(): Date {
  return new Date(Date.now() + 15 * 60 * 1000);
}

/**
 * Logs the activation code and clickable activation URL to the console (dev only).
 * @param email - The user's email address.
 * @param code - The generated 5-digit activation code.
 */
function logActivation(email: string, code: string): void {
  const url = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/register/activate?email=${encodeURIComponent(email)}&code=${code}`;
  console.log(`[DEV] Activation code for ${email}: ${code}`);
  console.log(`[DEV] Activation URL: ${url}`);
}

/**
 * Creates a new inactive user account, hashes the password, and sends a 5-digit activation code.
 * @param data - Registration payload containing email, plain-text password, and full name.
 * @returns The email address of the newly created account.
 * @throws CONFLICT (409) if the email is already registered.
 */
export async function register(data: {
  email: string;
  password: string;
  name: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing)
    throw appError(
      'CONFLICT',
      'An account with this email already exists.',
      409
    );

  const passwordHash = await bcrypt.hash(data.password, 10);
  const code = generateCode();

  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      isActive: false,
      activationCode: code,
      activationCodeExpiry: codeExpiry(),
    },
  });

  logActivation(data.email, code);
  return { email: data.email };
}

/**
 * Validates the activation code and marks the account as active. Idempotent — succeeds silently if already active.
 * @param data - Object containing the user's email and the submitted 5-digit code.
 * @returns A success message string.
 * @throws NOT_FOUND (404) if no account exists for the email.
 * @throws VALIDATION_ERROR (400) if the code is wrong or has expired.
 */
export async function activateAccount(data: { email: string; code: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw appError('NOT_FOUND', 'Account not found.', 404);
  if (user.isActive) return { message: 'Account already activated.' };

  if (user.activationCode !== data.code) {
    throw appError('VALIDATION_ERROR', 'Invalid activation code.', 400);
  }
  if (!user.activationCodeExpiry || user.activationCodeExpiry < new Date()) {
    throw appError('VALIDATION_ERROR', 'Code expired. Request a new one.', 400);
  }

  await prisma.user.update({
    where: { email: data.email },
    data: { isActive: true, activationCode: null, activationCodeExpiry: null },
  });

  return { message: 'Account activated.' };
}

/**
 * Generates and stores a fresh 5-digit activation code for an inactive account.
 * @param data - Object containing the user's email.
 * @returns The email address the new code was sent to.
 * @throws NOT_FOUND (404) if no account exists for the email.
 * @throws CONFLICT (409) if the account is already active.
 */
export async function resendActivation(data: { email: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw appError('NOT_FOUND', 'Account not found.', 404);
  if (user.isActive)
    throw appError('CONFLICT', 'Account is already activated.', 409);

  const code = generateCode();
  await prisma.user.update({
    where: { email: data.email },
    data: { activationCode: code, activationCodeExpiry: codeExpiry() },
  });

  logActivation(data.email, code);
  return { email: data.email };
}

/**
 * Verifies credentials and returns a signed 7-day JWT along with basic user info.
 * @param data - Object containing the user's email and plain-text password.
 * @returns JWT token, user id, email, and display name.
 * @throws UNAUTHORIZED (401) if the email is not found or the password is incorrect.
 * @throws FORBIDDEN (403) if the account has not been activated yet.
 */
export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw appError('UNAUTHORIZED', 'Invalid email or password.', 401);

  if (!user.isActive) {
    throw appError(
      'FORBIDDEN',
      'Account not activated. Check your email for the activation code.',
      403
    );
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw appError('UNAUTHORIZED', 'Invalid email or password.', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { token, id: user.id, email: user.email, name: user.name };
}

/**
 * Generates a password reset token, stores its hash in the DB, and logs the reset link to console.
 * Silently no-ops if no account exists for the email (avoids user enumeration).
 * @param data - Object containing the email address to reset.
 */
export async function forgotPassword(data: { email: string }): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);

  await prisma.user.update({
    where: { email: data.email },
    data: { resetToken: tokenHash, resetTokenExpiry: codeExpiry() },
  });

  const url = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(data.email)}`;
  console.log(`[DEV] Password reset link for ${data.email}: ${url}`);
}

/**
 * Verifies that a password reset token is valid and not expired.
 * @param data - Object containing email and the plain-text reset token.
 * @returns `{ valid: true }` on success.
 * @throws VALIDATION_ERROR (400) if the token is invalid or expired.
 */
export async function verifyResetToken(data: {
  email: string;
  token: string;
}): Promise<{ valid: true }> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (
    !user?.resetToken ||
    !user.resetTokenExpiry ||
    user.resetTokenExpiry < new Date()
  ) {
    throw appError(
      'VALIDATION_ERROR',
      'This reset link is invalid or has expired.',
      400
    );
  }

  const valid = await bcrypt.compare(data.token, user.resetToken);
  if (!valid)
    throw appError(
      'VALIDATION_ERROR',
      'This reset link is invalid or has expired.',
      400
    );

  return { valid: true };
}

/**
 * Validates the reset token and updates the user's password.
 * @param data - Object containing email, plain-text token, and new plain-text password.
 * @returns A success message string.
 * @throws VALIDATION_ERROR (400) if the token is invalid or expired.
 */
export async function resetPassword(data: {
  email: string;
  token: string;
  password: string;
}): Promise<{ message: string }> {
  await verifyResetToken({ email: data.email, token: data.token });

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.update({
    where: { email: data.email },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return { message: 'Password updated successfully.' };
}
