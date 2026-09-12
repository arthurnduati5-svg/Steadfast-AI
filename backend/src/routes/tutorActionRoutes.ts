import { Router, type Request, type Response } from 'express';
import { TutorActionDecisionRequestSchema, HintLadderAdvanceRequestSchema, TutorActionEffectivenessRequestSchema } from '../lib/tutorActionValidation';
import { makeTutorActionDecision } from '../services/tutorActionDecisionService';
import { buildSafeDecisionResponse, buildSafeHintLadderStateResponse } from '../services/tutorActionResponseBuilder';
import { rejectForbiddenFields } from '../services/tutorActionPrivacyGuard';
import { checkTutorActionAccess } from '../services/tutorActionAccessPolicy';

const router = Router();

function getStudentId(req: Request): string {
  return (req as any).tutorLearnerId || (req as any).user?.id || 'unknown';
}

function getSchoolId(req: Request): string {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId || '';
}

function getRole(req: Request): 'student' | 'teacher' | 'admin' | 'system' {
  const role = (req as any).user?.role || 'student';
  if (role === 'admin') return 'admin';
  if (role === 'teacher') return 'teacher';
  if (role === 'system') return 'system';
  return 'student';
}

function ok(data: unknown) {
  return { ok: true, ...(data as any) };
}

function err(message: string, code = 'ERROR') {
  return { ok: false, error: message, code };
}

router.post('/next', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    res.status(401).json(err('Verified school context required', 'SCHOOL_CONTEXT_REQUIRED'));
    return;
  }

  const forbidden = rejectForbiddenFields(req.body || {});
  if (forbidden.length > 0) {
    res.status(400).json(err(`Forbidden fields detected: ${forbidden.join(', ')}`, 'FORBIDDEN_FIELDS'));
    return;
  }

  const parsed = TutorActionDecisionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(err(`Validation failed: ${parsed.error.message}`, 'VALIDATION_ERROR'));
    return;
  }

  const studentId = getStudentId(req);

  const access = checkTutorActionAccess({
    requesterSchoolId: schoolId,
    requesterStudentId: studentId,
    requesterRole: getRole(req),
    targetSchoolId: schoolId,
    targetStudentId: studentId,
  });

  if (!access.allowed) {
    res.status(403).json(err('Access denied', 'ACCESS_DENIED'));
    return;
  }

  const decision = makeTutorActionDecision({
    schoolId,
    studentId,
    request: parsed.data,
  });

  const safeResponse = buildSafeDecisionResponse(decision);

  res.json(ok({ decision: safeResponse }));
});

router.get('/:decisionId', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    res.status(401).json(err('Verified school context required', 'SCHOOL_CONTEXT_REQUIRED'));
    return;
  }

  const { decisionId } = req.params;
  if (!decisionId) {
    res.status(400).json(err('decisionId is required', 'VALIDATION_ERROR'));
    return;
  }

  const access = checkTutorActionAccess({
    requesterSchoolId: schoolId,
    requesterStudentId: getStudentId(req),
    requesterRole: getRole(req),
    targetSchoolId: schoolId,
    targetStudentId: getStudentId(req),
  });

  if (!access.allowed) {
    res.status(403).json(err('Access denied', 'ACCESS_DENIED'));
    return;
  }

  res.json(ok({ decisionId, decision: null, message: 'Decision record not yet persisted (in-memory mode)' }));
});

router.get('/hint-ladder/state', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    res.status(401).json(err('Verified school context required', 'SCHOOL_CONTEXT_REQUIRED'));
    return;
  }

  const studentId = getStudentId(req);

  const access = checkTutorActionAccess({
    requesterSchoolId: schoolId,
    requesterStudentId: studentId,
    requesterRole: getRole(req),
    targetSchoolId: schoolId,
    targetStudentId: studentId,
  });

  if (!access.allowed) {
    res.status(403).json(err('Access denied', 'ACCESS_DENIED'));
    return;
  }

  const hintLadderState = {
    id: undefined,
    schoolId,
    studentId,
    currentHintLevel: 'attention_hint',
    hintCount: 0,
    lastHintAt: undefined,
    stuckCount: 0,
    recoveryCount: 0,
    status: 'active',
    safeEvidenceRefs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  res.json(ok({ hintLadderState: buildSafeHintLadderStateResponse(hintLadderState) }));
});

router.post('/hint-ladder/advance', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    res.status(401).json(err('Verified school context required', 'SCHOOL_CONTEXT_REQUIRED'));
    return;
  }

  const forbidden = rejectForbiddenFields(req.body || {});
  if (forbidden.length > 0) {
    res.status(400).json(err(`Forbidden fields detected: ${forbidden.join(', ')}`, 'FORBIDDEN_FIELDS'));
    return;
  }

  const parsed = HintLadderAdvanceRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(err(`Validation failed: ${parsed.error.message}`, 'VALIDATION_ERROR'));
    return;
  }

  const access = checkTutorActionAccess({
    requesterSchoolId: schoolId,
    requesterStudentId: getStudentId(req),
    requesterRole: getRole(req),
    targetSchoolId: schoolId,
    targetStudentId: getStudentId(req),
  });

  if (!access.allowed) {
    res.status(403).json(err('Access denied', 'ACCESS_DENIED'));
    return;
  }

  res.json(ok({
    hintLadderState: null,
    advanceResult: { advance: false, hold: true, reason: 'hint_ladder_not_persisted' },
    message: 'Hint ladder state not yet persisted (in-memory mode)',
  }));
});

router.post('/effectiveness', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    res.status(401).json(err('Verified school context required', 'SCHOOL_CONTEXT_REQUIRED'));
    return;
  }

  const forbidden = rejectForbiddenFields(req.body || {});
  if (forbidden.length > 0) {
    res.status(400).json(err(`Forbidden fields detected: ${forbidden.join(', ')}`, 'FORBIDDEN_FIELDS'));
    return;
  }

  const parsed = TutorActionEffectivenessRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(err(`Validation failed: ${parsed.error.message}`, 'VALIDATION_ERROR'));
    return;
  }

  const access = checkTutorActionAccess({
    requesterSchoolId: schoolId,
    requesterStudentId: getStudentId(req),
    requesterRole: getRole(req),
    targetSchoolId: schoolId,
    targetStudentId: getStudentId(req),
  });

  if (!access.allowed) {
    res.status(403).json(err('Access denied', 'ACCESS_DENIED'));
    return;
  }

  res.status(201).json(ok({
    recorded: true,
    decisionId: parsed.data.decisionId,
    effectivenessSignal: parsed.data.effectivenessSignal,
    recoveryDetected: parsed.data.recoveryDetected,
  }));
});

export default router;
