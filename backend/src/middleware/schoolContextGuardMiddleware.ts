import { Request, Response, NextFunction } from 'express';
import {
  verifySchoolContext,
} from '../services/task021SchoolContextVerificationService';
import {
  resolveTutorLearnerFromVerifiedIdentity,
  checkMappingActive,
  checkMappingSchoolScope,
} from '../services/task021TutorLearnerMappingService';
import {
  recordSchoolIntegrationAudit,
} from '../services/task021SchoolIntegrationAuditService';
import {
  normalizeRole,
  nowISO,
} from '../services/task021SchoolIntegrationContracts';
import type {
  SchoolIntegrationContext,
  VerifiedSchoolIdentity,
} from '../services/task021SchoolIntegrationContracts';

declare global {
  namespace Express {
    interface Request {
      verifiedSchoolIdentity?: VerifiedSchoolIdentity;
      schoolId?: string;
    }
  }
}

export function requireVerifiedSchoolContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = (req as any).requestId || 'unknown';

  const context: SchoolIntegrationContext = {
    schoolId: (req as any).schoolId || (req as any).user?.schoolId || '',
    externalUserId: (req as any).user?.id || '',
    role: normalizeRole((req as any).user?.role || ''),
    externalStudentId: req.params?.studentId || (req as any).externalStudentId || undefined,
    classId: (req.query?.classId as string) || undefined,
    subjectId: (req.query?.subjectId as string) || undefined,
  };

  if (!context.schoolId || !context.externalUserId) {
    // Fire-and-forget: audit persistence failure is non-critical, must not block route response
    recordSchoolIntegrationAudit({
      schoolId: context.schoolId || undefined,
      eventType: 'school_context_denied',
      actorRole: normalizeRole(context.role),
      actorId: context.externalUserId || undefined,
      route: req.originalUrl || req.url,
      operation: req.method,
      decision: 'denied',
      reasonCodes: ['missing_school_context', 'no_verified_school_identity'],
      requestId,
    }).catch((_err) => {
      // audit failure is explicitly non-critical; middleware must not block route on audit failure
    });

    res.status(401).json({
      error: 'Verified school context required',
      code: 'SCHOOL_CONTEXT_REQUIRED',
      reasonCodes: ['missing_school_context'],
    });
    return;
  }

  const verification = verifySchoolContext(context, requestId);

  if (!verification.ok) {
    // Fire-and-forget: audit persistence failure is non-critical
    recordSchoolIntegrationAudit({
      schoolId: context.schoolId,
      eventType: 'school_context_denied',
      actorRole: normalizeRole(context.role),
      actorId: context.externalUserId,
      route: req.originalUrl || req.url,
      operation: req.method,
      decision: 'denied',
      reasonCodes: verification.reasonCodes,
      requestId,
    }).catch((_err) => {
      // audit failure is explicitly non-critical; middleware must not block route on audit failure
    });

    res.status(403).json({
      error: 'School context verification failed',
      code: 'SCHOOL_CONTEXT_INVALID',
      reasonCodes: verification.reasonCodes,
    });
    return;
  }

  req.verifiedSchoolIdentity = verification.identity;
  req.schoolId = verification.identity.schoolId;
  next();
}

export async function requireVerifiedStudentContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  requireVerifiedSchoolContext(req, res, async () => {
    try {
      const identity = req.verifiedSchoolIdentity!;

      if (identity.role !== 'student') {
        res.status(403).json({
          error: 'Student role required',
          code: 'STUDENT_ROLE_REQUIRED',
          reasonCodes: ['role_not_student'],
        });
        return;
      }

      if (!identity.externalStudentId) {
        res.status(403).json({
          error: 'Student identity not found in school context',
          code: 'STUDENT_IDENTITY_REQUIRED',
          reasonCodes: ['missing_external_student_id'],
        });
        return;
      }

      const mapping = await resolveTutorLearnerFromVerifiedIdentity(identity);

      if (!checkMappingActive(mapping.mapping)) {
        res.status(403).json({
          error: 'Learner mapping is not active',
          code: 'INACTIVE_LEARNER_MAPPING',
          reasonCodes: ['inactive_learner_mapping'],
        });
        return;
      }

      if (!checkMappingSchoolScope(mapping.mapping, identity.schoolId)) {
        res.status(403).json({
          error: 'School scope mismatch',
          code: 'SCHOOL_SCOPE_MISMATCH',
          reasonCodes: ['school_scope_mismatch'],
        });
        return;
      }

      (req as any).tutorLearnerId = mapping.tutorLearnerId;
      next();
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to resolve learner context',
        code: 'LEARNER_CONTEXT_FAILED',
        reasonCodes: ['learner_context_resolution_failed'],
      });
    }
  });
}
