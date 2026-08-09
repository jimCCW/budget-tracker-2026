import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; sid: string };
}

/**
 * Validates the Bearer JWT, confirms its session hasn't been revoked, and attaches the payload to `req.user`.
 * Returns 401 if the token is missing, invalid, or its session was revoked.
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing token' },
    });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      sid?: string;
    };

    // Tokens issued before session tracking shipped carry no `sid` — treat
    // them as invalid rather than passing `undefined` into the DB lookup.
    if (!payload.sid) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
      });
      return;
    }

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sid },
    });
    if (!session || session.revokedAt) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Session has been revoked' },
      });
      return;
    }

    req.user = payload as { id: string; email: string; sid: string };
    next();
  } catch {
    // Covers a malformed/expired JWT and any transient DB error on the
    // session lookup — Express 4 does not catch rejections thrown by async
    // middleware, so an uncaught error here would crash the process.
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}
