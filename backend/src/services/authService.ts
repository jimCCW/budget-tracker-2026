import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { appError } from '../utils/appError';
import { prisma } from '../lib/prisma';
import { createDefault as createDefaultAccount } from './accountService';
import { revokeAllSessions } from './sessionService';
import { sendActivationEmail, sendPasswordResetEmail } from './emailService';

/** How long an activation code or password-reset token stays valid, in minutes. */
const CODE_TTL_MINUTES = 15;

/** Generates a random 5-digit numeric code as a string. */
function generateCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/** Returns a Date `CODE_TTL_MINUTES` from now, used as the activation code / reset token expiry. */
function codeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}

/**
 * Returns a `.catch` handler that logs a failed email send without rethrowing — delivery failures must never fail the request.
 * @param kind - Short label for the email type, used in the log line.
 * @param email - Recipient address, for the log line.
 * @returns A rejection handler suitable for `.catch(...)`.
 */
function logMailFailure(kind: string, email: string) {
  return (err: unknown) => {
    console.error(`[mail] Failed to send ${kind} to ${email}:`, err);
  };
}

/**
 * Creates a new inactive user account, hashes the password, and emails a 5-digit activation code.
 * @param data - Registration payload containing email, plain-text password, full name, first name, and last name.
 * @returns The email address of the newly created account.
 * @throws CONFLICT (409) if the email is already registered.
 */
export async function register(data: {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
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

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: false,
        activationCode: code,
        activationCodeExpiry: codeExpiry(),
      },
    });
    await createDefaultAccount(user.id, tx);
  });

  await sendActivationEmail(data.email, code, CODE_TTL_MINUTES).catch(
    logMailFailure('activation email', data.email)
  );
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
 * Generates, stores, and emails a fresh 5-digit activation code for an inactive account.
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

  await sendActivationEmail(data.email, code, CODE_TTL_MINUTES).catch(
    logMailFailure('activation email', data.email)
  );
  return { email: data.email };
}

/**
 * Verifies credentials, opens a new UserSession for this login, and returns a
 * signed 7-day JWT (carrying that session's id as `sid`) along with basic user info.
 * @param data - Object containing the user's email and plain-text password.
 * @param meta - Request metadata to record on the session; `userAgent` is used to label the device in Settings > Security.
 * @returns JWT token, user id, email, full name, first name, and last name.
 * @throws UNAUTHORIZED (401) if the email is not found or the password is incorrect.
 * @throws FORBIDDEN (403) if the account has not been activated yet.
 */
export async function login(
  data: { email: string; password: string },
  meta: { userAgent?: string } = {}
) {
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

  const session = await prisma.userSession.create({
    data: { userId: user.id, userAgent: meta.userAgent },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, sid: session.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return {
    token,
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Revokes the session the current request's JWT was issued for, so it fails
 * `authMiddleware`'s revocation check on any subsequent request. Idempotent.
 * @param sessionId - The `sid` claim from the caller's own JWT (`req.user.sid`).
 */
export async function logout(sessionId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Generates a password reset token, stores its hash, and emails the reset link (fire-and-forget, so response timing never reveals whether the email exists). Silently no-ops if no account exists for the email (avoids user enumeration).
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

  sendPasswordResetEmail(data.email, token, CODE_TTL_MINUTES).catch(
    logMailFailure('password reset email', data.email)
  );
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
 * Validates the reset token, updates the user's password, and revokes every session on the account.
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

  // Hash before opening the transaction — bcrypt at cost 10 is ~100ms of CPU
  // and doesn't touch the DB, so running it inside the transaction would
  // hold a pooled connection and row lock open for no benefit.
  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { email: data.email },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    await revokeAllSessions(user.id, tx);
  });

  return { message: 'Password updated successfully.' };
}
