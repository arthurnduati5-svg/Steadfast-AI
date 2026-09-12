import jwt, { JwtPayload, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import type {
  SchoolAuthBridgeInput,
  SchoolAuthBridgeResult,
  VerifiedSchoolIdentityContext,
  SchoolAuthVerificationSource,
  EnrollmentStatus,
} from './schoolAuthBridgeContracts';
import { logger } from '../utils/logger';

const SESSION_JWT_SECRET = String(process.env.JWT_SECRET || '').trim();
const COPILOT_JWT_SECRET = String(process.env.COPILOT_JWT_SECRET || '').trim();
const COPILOT_PUBLIC_KEY = String(process.env.COPILOT_PUBLIC_KEY || '').trim().replace(/\\n/g, '\n');

function readBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) return '';
  if (!authorizationHeader.startsWith('Bearer ')) return '';
  return authorizationHeader.slice(7).trim();
}

function extractUserId(decoded: string | JwtPayload): string {
  if (!decoded || typeof decoded === 'string') return '';
  const candidate =
    decoded.userId ||
    decoded.studentId ||
    decoded.id ||
    decoded.sub;
  return typeof candidate === 'string' ? candidate.trim() : '';
}

function extractSchoolId(decoded: string | JwtPayload): string {
  if (!decoded || typeof decoded === 'string') return '';
  const candidate =
    decoded.schoolId ||
    decoded.school_id ||
    decoded.orgId ||
    decoded.organizationId;
  return typeof candidate === 'string' ? candidate.trim() : '';
}

function extractRole(decoded: string | JwtPayload): string | undefined {
  if (!decoded || typeof decoded === 'string') return undefined;

  const direct = decoded.role || decoded.userRole || decoded.accountRole || decoded.accountType;
  if (typeof direct === 'string') {
    return direct.trim().toLowerCase();
  }

  const roleList = decoded.roles;
  if (Array.isArray(roleList)) {
    const normalizedList = roleList.map((entry) => String(entry || '').trim().toLowerCase());
    if (normalizedList.includes('admin')) return 'admin';
    if (normalizedList.includes('counselor') || normalizedList.includes('counsellor')) return 'counselor';
    if (normalizedList.includes('teacher')) return 'teacher';
    if (normalizedList.includes('student') || normalizedList.includes('learner')) return 'learner';
  }

  return undefined;
}

function extractDisplayName(decoded: string | JwtPayload): string | undefined {
  if (!decoded || typeof decoded === 'string') return undefined;
  const candidate = decoded.displayName || decoded.name || decoded.studentName;
  return typeof candidate === 'string' ? candidate.trim() : undefined;
}

function extractGrade(decoded: string | JwtPayload): string | undefined {
  if (!decoded || typeof decoded === 'string') return undefined;
  const candidate = decoded.grade || decoded.gradeLevel;
  return typeof candidate === 'string' ? candidate.trim() : undefined;
}

function extractClassId(decoded: string | JwtPayload): string | undefined {
  if (!decoded || typeof decoded === 'string') return undefined;
  const candidate = decoded.classId || decoded.class_id;
  return typeof candidate === 'string' ? candidate.trim() : undefined;
}

function nowISO(): string {
  return new Date().toISOString();
}

interface TokenVerifyResult {
  verified: boolean;
  userId?: string;
  schoolId?: string;
  role?: string;
  displayName?: string;
  grade?: string;
  classId?: string;
  error?: 'invalid' | 'expired';
}

function tryVerifyToken(token: string): TokenVerifyResult {
  const verificationAttempts: Array<() => TokenVerifyResult> = [];

  if (SESSION_JWT_SECRET) {
    verificationAttempts.push(() => {
      try {
        const decoded = jwt.verify(token, SESSION_JWT_SECRET);
        const decodedObj = decoded as string | JwtPayload;
        const userId = extractUserId(decodedObj);
        return {
          verified: true,
          userId,
          schoolId: extractSchoolId(decodedObj),
          role: extractRole(decodedObj),
          displayName: extractDisplayName(decodedObj),
          grade: extractGrade(decodedObj),
          classId: extractClassId(decodedObj),
        };
      } catch (err) {
        if (err instanceof TokenExpiredError) return { verified: false, error: 'expired' };
        return { verified: false, error: 'invalid' };
      }
    });
  }

  if (COPILOT_JWT_SECRET && COPILOT_JWT_SECRET !== SESSION_JWT_SECRET) {
    verificationAttempts.push(() => {
      try {
        const decoded = jwt.verify(token, COPILOT_JWT_SECRET);
        const decodedObj = decoded as string | JwtPayload;
        const userId = extractUserId(decodedObj);
        return {
          verified: true,
          userId,
          schoolId: extractSchoolId(decodedObj),
          role: extractRole(decodedObj),
          displayName: extractDisplayName(decodedObj),
          grade: extractGrade(decodedObj),
          classId: extractClassId(decodedObj),
        };
      } catch (err) {
        if (err instanceof TokenExpiredError) return { verified: false, error: 'expired' };
        return { verified: false, error: 'invalid' };
      }
    });
  }

  if (COPILOT_PUBLIC_KEY) {
    verificationAttempts.push(() => {
      try {
        const decoded = jwt.verify(token, COPILOT_PUBLIC_KEY, { algorithms: ['RS256'] });
        const decodedObj = decoded as string | JwtPayload;
        const userId = extractUserId(decodedObj);
        return {
          verified: true,
          userId,
          schoolId: extractSchoolId(decodedObj),
          role: extractRole(decodedObj),
          displayName: extractDisplayName(decodedObj),
          grade: extractGrade(decodedObj),
          classId: extractClassId(decodedObj),
        };
      } catch (err) {
        if (err instanceof TokenExpiredError) return { verified: false, error: 'expired' };
        return { verified: false, error: 'invalid' };
      }
    });
  }

  for (const attempt of verificationAttempts) {
    const result = attempt();
    if (result.verified) return result;
    if (result.error === 'expired') return result;
  }

  return { verified: false, error: 'invalid' };
}

export async function verifySchoolAuth(
  input: SchoolAuthBridgeInput,
): Promise<SchoolAuthBridgeResult> {
  const token = readBearerToken(input.authorizationHeader);

  if (!token) {
    logger.warn({ requestId: input.requestId }, '[SchoolAuthBridge] Missing token');
    return {
      ok: false,
      failure: {
        authStatus: 'missing_token',
        httpStatus: 401,
        safeMessage: 'Authentication required. Please provide a valid school session token.',
      },
    };
  }

  const verifyResult = tryVerifyToken(token);

  if (!verifyResult.verified) {
    if (verifyResult.error === 'expired') {
      logger.warn({ requestId: input.requestId }, '[SchoolAuthBridge] Expired token');
      return {
        ok: false,
        failure: {
          authStatus: 'expired_token',
          httpStatus: 401,
          safeMessage: 'Your school session has expired. Please refresh the school page and try again.',
        },
      };
    }

    logger.warn({ requestId: input.requestId }, '[SchoolAuthBridge] Invalid token');
    return {
      ok: false,
      failure: {
        authStatus: 'invalid_token',
        httpStatus: 401,
        safeMessage: 'Your school session could not be verified. Please refresh the school page and try again.',
      },
    };
  }

  if (!verifyResult.userId) {
    return {
      ok: false,
      failure: {
        authStatus: 'missing_student_identity',
        httpStatus: 403,
        safeMessage: 'Your school session is valid but does not include student identity. Please contact support.',
      },
    };
  }

  if (!verifyResult.schoolId) {
    return {
      ok: false,
      failure: {
        authStatus: 'school_lookup_failed',
        httpStatus: 503,
        safeMessage: 'Could not resolve your school identity. Please try again later.',
      },
    };
  }

  const normalizedRole = normalizeTokenRole(verifyResult.role);
  if (normalizedRole !== 'learner') {
    logger.warn(
      { requestId: input.requestId, role: verifyResult.role },
      '[SchoolAuthBridge] Non-learner role attempting handoff',
    );
    return {
      ok: false,
      failure: {
        authStatus: 'role_not_learner',
        httpStatus: 403,
        safeMessage: 'Only students can access the learning tutor.',
      },
    };
  }

  const context: VerifiedSchoolIdentityContext = {
    authStatus: 'verified',
    externalStudentId: verifyResult.userId,
    schoolId: verifyResult.schoolId,
    role: 'learner',
    classId: verifyResult.classId || undefined,
    grade: verifyResult.grade || undefined,
    displayName: verifyResult.displayName || undefined,
    enrollmentStatus: 'active',
    verifiedAt: nowISO(),
    verificationSource: 'local_jwt_verification',
  };

  return { ok: true, context };
}

export async function requireVerifiedLearnerContext(
  input: SchoolAuthBridgeInput,
): Promise<VerifiedSchoolIdentityContext> {
  const result = await verifySchoolAuth(input);

  if (!result.ok) {
    throw result.failure;
  }

  return result.context;
}

function normalizeTokenRole(role: string | undefined): string {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'student' || normalized === 'learner') return 'learner';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'counselor' || normalized === 'counsellor') return 'counselor';
  return 'unknown';
}
