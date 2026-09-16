import { Response, Request, RequestHandler } from 'express';

export type UserRole = 'admin' | 'counselor' | 'student';

type ReqWithUser = Request & {
  user?: {
    id?: string;
    role?: string;
  };
};

const parseIdSet = (raw: string): Set<string> =>
  new Set(
    String(raw || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );

const ADMIN_IDS = () => parseIdSet(process.env.ADMIN_USER_IDS || '');
const COUNSELOR_IDS = () => parseIdSet(process.env.COUNSELOR_USER_IDS || '');

const normalizeRole = (value: string): UserRole | null => {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'admin') return 'admin';
  if (role === 'counselor' || role === 'counsellor') return 'counselor';
  if (role === 'student' || role === 'user' || role === 'teacher') return 'student';
  return null;
};

export function resolveRequestRole(req: ReqWithUser): UserRole {
  const userId = String(req.user?.id || '').trim();
  const claimRole = normalizeRole(req.user?.role || '');
  if (claimRole === 'admin' || claimRole === 'counselor') return claimRole;

  if (userId) {
    if (ADMIN_IDS().has(userId)) return 'admin';
    if (COUNSELOR_IDS().has(userId)) return 'counselor';
  }

  return 'student';
}

export function requireRole(req: ReqWithUser, res: Response, allowed: UserRole[]): UserRole | null;
export function requireRole(...allowed: UserRole[]): RequestHandler;
export function requireRole(
  first: ReqWithUser | UserRole,
  second?: Response | UserRole,
  third?: UserRole[] | UserRole,
  ...rest: UserRole[]
): UserRole | null | RequestHandler {
  if (typeof first === 'string') {
    const allowed: UserRole[] = [first];
    if (second !== undefined) allowed.push(second as UserRole);
    if (third !== undefined) {
      if (Array.isArray(third)) allowed.push(...third);
      else allowed.push(third);
    }
    allowed.push(...rest);
    const guard: RequestHandler = (req, res, next) => {
      const role = resolveRequestRole(req as ReqWithUser);
      if (allowed.includes(role)) {
        next();
        return;
      }
      res.status(403).send({ message: 'Forbidden' });
    };
    return guard;
  }
  const req = first as ReqWithUser;
  const res = second as Response;
  const allowed = third as UserRole[];
  const role = resolveRequestRole(req);
  if (allowed.includes(role)) return role;
  res.status(403).send({ message: 'Forbidden' });
  return null;
}

