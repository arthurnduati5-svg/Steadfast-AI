import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

const SESSION_JWT_SECRET = String(process.env.JWT_SECRET || '').trim();
const COPILOT_JWT_SECRET = String(process.env.COPILOT_JWT_SECRET || '').trim();
const COPILOT_PUBLIC_KEY = String(process.env.COPILOT_PUBLIC_KEY || '').trim().replace(/\\n/g, '\n');

if (!SESSION_JWT_SECRET && !COPILOT_JWT_SECRET && !COPILOT_PUBLIC_KEY) {
  throw new Error(
    'FATAL ERROR: At least one auth key must be configured (JWT_SECRET, COPILOT_JWT_SECRET, or COPILOT_PUBLIC_KEY).'
  );
}

const readBearerToken = (req: Request): string => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
};

const extractUserId = (decoded: string | JwtPayload): string => {
  if (!decoded || typeof decoded === 'string') return '';
  const candidate =
    decoded.userId ||
    decoded.studentId ||
    decoded.id ||
    decoded.sub;
  return typeof candidate === 'string' ? candidate.trim() : '';
};

const extractRole = (decoded: string | JwtPayload): string | undefined => {
  if (!decoded || typeof decoded === 'string') return undefined;

  const direct = decoded.role || decoded.userRole || decoded.accountRole || decoded.accountType;
  if (typeof direct === 'string') {
    const normalized = direct.trim().toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'counselor' || normalized === 'counsellor') return 'counselor';
  }

  const roleList = decoded.roles;
  if (Array.isArray(roleList)) {
    const normalizedList = roleList.map((entry) => String(entry || '').trim().toLowerCase());
    if (normalizedList.includes('admin')) return 'admin';
    if (normalizedList.includes('counselor') || normalizedList.includes('counsellor')) return 'counselor';
  }

  return undefined;
};

type VerifiedClaims = {
  userId: string;
  role?: string;
};

const verifyToken = (token: string): VerifiedClaims | null => {
  const verificationAttempts: Array<() => VerifiedClaims | null> = [];

  if (SESSION_JWT_SECRET) {
    verificationAttempts.push(() => {
      const decoded = jwt.verify(token, SESSION_JWT_SECRET);
      const userId = extractUserId(decoded);
      if (!userId) return null;
      return { userId, role: extractRole(decoded) };
    });
  }

  if (COPILOT_JWT_SECRET && COPILOT_JWT_SECRET !== SESSION_JWT_SECRET) {
    verificationAttempts.push(() => {
      const decoded = jwt.verify(token, COPILOT_JWT_SECRET);
      const userId = extractUserId(decoded);
      if (!userId) return null;
      return { userId, role: extractRole(decoded) };
    });
  }

  if (COPILOT_PUBLIC_KEY) {
    verificationAttempts.push(() => {
      const decoded = jwt.verify(token, COPILOT_PUBLIC_KEY, { algorithms: ['RS256'] });
      const userId = extractUserId(decoded);
      if (!userId) return null;
      return { userId, role: extractRole(decoded) };
    });
  }

  for (const attempt of verificationAttempts) {
    try {
      const claims = attempt();
      if (claims?.userId) return claims;
    } catch {
      // Try the next configured key.
    }
  }

  return null;
};

export const schoolAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided or invalid format.',
    });
  }

  const claims = verifyToken(token);
  if (!claims?.userId) {
    logger.warn({ url: req.originalUrl }, '[AuthMiddleware] Token verification failed');
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid token.',
    });
  }

  req.user = claims.role ? { id: claims.userId, role: claims.role } : { id: claims.userId };
  return next();
};
