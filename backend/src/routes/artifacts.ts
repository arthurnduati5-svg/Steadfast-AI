// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Pipeline Routes v1
// Endpoints: POST ingest, POST parse, GET structure, POST query
// Mounted at /api/copilot/artifacts (schoolAuthMiddleware applied)
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import { Router, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  artifactIngestRequestSchema,
  artifactParseRequestSchema,
  artifactQueryRequestSchema,
  artifactIdSchema,
} from '../services/artifactValidation';
import { artifactService, ArtifactAccessError } from '../services/artifactService';
import { artifactParserService } from '../services/artifactParserService';
import { artifactQueryService } from '../services/artifactQueryService';
import { ArtifactNotFoundError } from '../services/artifactQueryService';
import { artifactCurriculumReferenceService } from '../services/artifactCurriculumReferenceService';

const router = Router();

// ── Helper: resolve identity ──
function resolveIdentity(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
    grade: undefined,
    ageBand: undefined,
  };
}

// ── Error helpers ──
function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// ── POST /api/copilot/artifacts/ingest ──
// Register or ingest an artifact from safe text/transcript/metadata input.
// Protected by schoolAuthMiddleware → requireVerifiedSchoolContext so
// schoolId/studentId in the body can NEVER be authoritative (spoof-safe).
router.post('/ingest', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }
    if (!identity.schoolId) { sendError(res, 401, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.'); return; }

    // Strictly ignore any body-supplied schoolId/studentId/owner* — authority is verified context only.
    const parsed: any = artifactIngestRequestSchema.parse(req.body || {});
    // Validate curriculum refs reference-only (never promoted to truth without KG)
    let validatedCurriculumRefs: any = undefined;
    let curriculumWarnings: string[] = [];
    if (parsed.curriculumRefs) {
      const cv = await artifactCurriculumReferenceService.resolveForPersistence(parsed.curriculumRefs);
      validatedCurriculumRefs = cv.persisted;
      curriculumWarnings = cv.warnings;
    }

    const artifact = await artifactService.createArtifact(identity, {
      ...parsed,
      mediaAssetId: parsed.mediaAssetId,
      curriculumRefs: validatedCurriculumRefs || parsed.curriculumRefs,
    });

    // Attach curriculum warnings if any
    if (curriculumWarnings.length > 0) {
      (artifact as any).warnings = [...(artifact.warnings || []), ...curriculumWarnings];
    }

    res.status(201).json({ ok: true, artifact });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    if (err instanceof ArtifactAccessError) {
      sendError(res, err.statusCode, err.code, err.message);
      return;
    }
    console.error('[POST /artifacts/ingest]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to ingest artifact.');
  }
});

// ── POST /api/copilot/artifacts/:artifactId/parse ──
// Parse an existing artifact into structured blocks.
// Canonical orchestration: verified school context → canonical MediaAsset →
// ownership/scope → deterministic parser → restricted separation →
// curriculum reference validation → atomic persistence → safe response.
router.post('/:artifactId/parse', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }
    if (!identity.schoolId) { sendError(res, 401, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.'); return; }

    const artifactId = artifactIdSchema.parse(req.params?.artifactId);
    const parsedReq: any = artifactParseRequestSchema.parse(req.body || {});

    // Retrieve with school/identity scope — cross-school reads return 404, never 403 leak
    const artifact = await artifactService.getArtifactForUser(identity, artifactId);
    if (!artifact) { sendError(res, 404, 'NOT_FOUND', 'Artifact not found.'); return; }

    // Anchor to a canonical MediaAsset when provided and not yet anchored.
    // The mediaAssetId is an explicit link only; it is never treated as an
    // authorization source — school/actor scope comes from the verified context.
    let workingArtifact = artifact;
    if (parsedReq.mediaAssetId && !artifact.mediaAssetId) {
      const anchored = await artifactService.anchorToMediaAsset(identity, artifact.artifactId, parsedReq.mediaAssetId);
      if (anchored) workingArtifact = anchored;
    }

    // R3.12 idempotent replay: same content fingerprint without force must not duplicate truth
    const incomingContent = (parsedReq.textContent || parsedReq.transcriptText || '').trim();
    if (incomingContent && !parsedReq.forceReparse) {
      const incomingFingerprint = createHash('sha256').update(incomingContent).digest('hex').slice(0, 16);
      if (incomingFingerprint === workingArtifact.contentFingerprint && workingArtifact.blockCount > 0) {
        // Return stable projection without creating a new one
        const structure = await artifactService.getArtifactStructure(identity, workingArtifact.artifactId);
        if (structure) {
          res.status(200).json({
            ok: true,
            artifact: structure.artifact,
            blocks: structure.blocks,
            extractedQuestions: structure.extractedQuestions,
            answerKeys: structure.answerKeys,
            workedExamples: structure.workedExamples,
            diagrams: structure.diagrams,
            warnings: [...(structure.artifact.warnings || []), 'Replay: same content fingerprint — stable projection returned.'],
          });
          return;
        }
      }
    }

    // Curriculum refs are reference-only — validate against Knowledge Graph before persistence
    let validatedCurriculumRefs: any = parsedReq.curriculumRefs;
    let curriculumWarnings: string[] = [];
    if (parsedReq.curriculumRefs) {
      const cv = await artifactCurriculumReferenceService.resolveForPersistence(parsedReq.curriculumRefs);
      validatedCurriculumRefs = Object.keys(cv.persisted).length > 0 ? cv.persisted : undefined;
      curriculumWarnings = cv.warnings;
    }

    // Determine content to parse — deterministic, no live OCR/STT/AI provider
    const parserService = artifactParserService;
    const result = parserService.parse(
      workingArtifact.artifactId,
      identity.schoolId,
      workingArtifact.kind,
      parsedReq.textContent || null,
      parsedReq.transcriptText || null,
      parsedReq,
    );

    // Merge curriculum warnings into parse warnings (honest degraded state)
    if (curriculumWarnings.length > 0) {
      result.warnings = [...result.warnings, ...curriculumWarnings];
    }

    // Honest low-confidence / unsupported degradation (R3.15)
    const looksLikeProviderNeeded =
      (parsedReq.textContent || parsedReq.transcriptText || '').toLowerCase().includes('provider_needed') ||
      (parsedReq.textContent || '').toLowerCase().includes('low_confidence') ||
      (parsedReq.textContent || '').toLowerCase().includes('ocr_required');

    if (looksLikeProviderNeeded && result.structureQuality === 'high') {
      result.structureQuality = 'partial';
      result.warnings.push('Extraction is low-confidence / provider needed — structure is partial and may be unavailable.');
    }

    // If parse produced no content because no text was stored, mark as unsupported
    if (result.blocks.length === 0 && result.parseStatus === 'failed') {
      const updated = await artifactService.updateArtifactParseResult(
        workingArtifact.artifactId,
        {
          ...result,
          parseStatus: 'unsupported',
          structureQuality: 'unavailable',
          warnings: [...result.warnings, 'No text content available for parsing. Binary upload parsing is not integrated in v1.'],
        },
        validatedCurriculumRefs,
      );

      // Preserve safe projection semantics even for failures
      res.status(422).json({
        ok: true,
        artifact: updated,
        blocks: [],
        extractedQuestions: [],
        answerKeys: [],
        workedExamples: [],
        diagrams: [],
        warnings: updated.warnings,
      });
      return;
    }

    // Atomic persistence (Prisma transaction inside service). Failures do not leave partial state.
    // If the new parse is a failure and a previous valid projection exists, the service preserves it.
    const updated = await artifactService.updateArtifactParseResult(
      workingArtifact.artifactId,
      result,
      validatedCurriculumRefs,
    );

    const safeResponse = artifactService.buildSafeParseResponse(identity, updated, result);

    res.status(200).json({
      ok: true,
      artifact: safeResponse.artifact,
      blocks: safeResponse.blocks,
      extractedQuestions: safeResponse.extractedQuestions,
      answerKeys: safeResponse.answerKeys,
      workedExamples: safeResponse.workedExamples,
      diagrams: safeResponse.diagrams,
      warnings: safeResponse.warnings,
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid artifact ID or request.');
      return;
    }
    if (err instanceof ArtifactAccessError) {
      sendError(res, err.statusCode, err.code, err.message);
      return;
    }
    if (err instanceof ArtifactNotFoundError) {
      sendError(res, 404, 'NOT_FOUND', err.message);
      return;
    }
    console.error('[POST /artifacts/:id/parse]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to parse artifact.');
  }
});

// ── GET /api/copilot/artifacts/:artifactId/structure ──
// Return artifact structure and blocks for authorized caller.
// Student-safe by default: teacher_only blocks are stripped unless the
// verified caller satisfies the established teacher authorization policy.
// Caller-controlled ?includeAnswers is NEVER treated as authorization.
router.get('/:artifactId/structure', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }
    if (!identity.schoolId) { sendError(res, 401, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.'); return; }

    const artifactId = artifactIdSchema.parse(req.params?.artifactId);
    const structure = await artifactService.getArtifactStructure(identity, artifactId);
    if (!structure) { sendError(res, 404, 'NOT_FOUND', 'Artifact not found.'); return; }

    res.status(200).json(structure);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid artifact ID.');
      return;
    }
    if (err instanceof ArtifactAccessError) {
      sendError(res, err.statusCode, err.code, err.message);
      return;
    }
    if (err instanceof ArtifactNotFoundError) {
      sendError(res, 404, 'NOT_FOUND', err.message);
      return;
    }
    console.error('[GET /artifacts/:id/structure]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get artifact structure.');
  }
});

// ── POST /api/copilot/artifacts/:artifactId/query ──
// Return relevant artifact blocks for a tutor query.
// Also protected by verified school context; answer-key inclusion still requires role policy.
router.post('/:artifactId/query', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const artifactId = artifactIdSchema.parse(req.params?.artifactId);
    const parsedReq = artifactQueryRequestSchema.parse(req.body || {});

    const result = await artifactQueryService.queryArtifact(identity, artifactId, parsedReq);
    res.status(200).json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    if (err instanceof ArtifactAccessError) {
      sendError(res, err.statusCode, err.code, err.message);
      return;
    }
    if (err instanceof ArtifactNotFoundError) {
      sendError(res, 404, 'NOT_FOUND', err.message);
      return;
    }
    console.error('[POST /artifacts/:id/query]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to query artifact.');
  }
});

export default router;
