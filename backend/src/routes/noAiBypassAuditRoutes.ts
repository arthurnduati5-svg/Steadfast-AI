import { Router, Request, Response } from 'express';
import { getAllRouteRegistrations } from '../services/noAiBypassRouteRegistry';
import { listNoAiBypassAuditEvents, buildNoAiBypassAuditSummary, recordNoAiBypassAuditEvent, clearNoAiBypassAuditForTest } from '../services/noAiBypassApiAuditService';
import { buildNoAiBypassAllowedResponse, buildNoAiBypassAuditResponse, buildNoAiBypassScanResponse, buildNoAiBypassBlockedResponse, buildNoAiBypassErrorResponse } from '../services/noAiBypassResponseBuilder';
import { scanRouteFileForNoAiBypassViolations } from '../services/noAiBypassModuleScanner';
import { findForbiddenFields } from '../services/noAiBypassPrivacyGuard';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/routes', (_req: Request, res: Response) => {
  const routes = getAllRouteRegistrations();
  const safeRoutes = routes.map(r => ({
    routeId: r.routeId,
    path: r.path,
    methods: r.methods,
    category: r.category,
    requiresSchoolAuth: r.requiresSchoolAuth,
    requiresVerifiedSchoolContext: r.requiresVerifiedSchoolContext,
    requiresLearnerScope: r.requiresLearnerScope,
    requiresSessionScope: r.requiresSessionScope,
    requiresSourceTruth: r.requiresSourceTruth,
    requiresPrivacyGuard: r.requiresPrivacyGuard,
    requiresAnswerProtection: r.requiresAnswerProtection,
    requiresDeenBoundary: r.requiresDeenBoundary,
    requiresSafeguardingBoundary: r.requiresSafeguardingBoundary,
    allowedRuntimeService: r.allowedRuntimeService,
    providerBoundaryStatus: r.providerBoundaryStatus,
  }));
  const response = buildNoAiBypassAllowedResponse({
    data: { routes: safeRoutes, count: safeRoutes.length },
  });
  res.json(response);
});

router.get('/audit', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const offset = parseInt(req.query.offset as string) || 0;
  const events = listNoAiBypassAuditEvents(limit, offset);
  const response = buildNoAiBypassAuditResponse({ events });
  res.json(response);
});

router.get('/summary', (_req: Request, res: Response) => {
  const summary = buildNoAiBypassAuditSummary();
  const response = buildNoAiBypassAuditResponse({ events: [], summary });
  res.json(response);
});

router.post('/evaluate', (req: Request, res: Response) => {
  const { path, method } = req.body || {};
  if (!path || !method) {
    const response = buildNoAiBypassErrorResponse({ error: 'path and method are required' });
    res.status(400).json(response);
    return;
  }

  const forbiddenFields = findForbiddenFields(req.body);
  if (forbiddenFields.length > 0) {
    const response = buildNoAiBypassBlockedResponse({
      policyDecision: 'blocked_raw_private_content',
      error: `Request contains forbidden fields: ${forbiddenFields.join(', ')}`,
    });
    res.status(400).json(response);
    return;
  }

  const { evaluateNoAiBypassRuntimeDecision } = require('../services/noAiBypassRuntimeGuard');
  const { getRouteRegistrationByPath } = require('../services/noAiBypassRouteRegistry');

  const registration = getRouteRegistrationByPath(path);

  const decision = evaluateNoAiBypassRuntimeDecision(registration, {
    path,
    method,
    hasSchoolAuth: true,
    hasVerifiedSchoolContext: true,
    isCrossSchool: false,
    isCrossLearner: false,
    hasDirectProviderImport: false,
    hasDirectProviderCall: false,
    hasRawProviderResponse: false,
    hasHiddenReasoning: false,
    hasAnswerKey: false,
    hasMarkingScheme: false,
    hasCorrectAnswer: false,
    hasModelAnswer: false,
    hasTeacherOnlyData: false,
    hasRawPrivateContent: false,
    requiresSourceTruth: registration?.requiresSourceTruth || false,
    sourceTruthAvailable: true,
    requiresDeenBoundary: registration?.requiresDeenBoundary || false,
    deenBoundaryPassed: true,
    requiresSafeguardingBoundary: registration?.requiresSafeguardingBoundary || false,
    safeguardingBoundaryPassed: true,
  });

  const actorId = (req as any).schoolAuth?.userId || 'unknown';
  const schoolId = (req as any).schoolAuth?.schoolId || 'unknown';

  recordNoAiBypassAuditEvent({
    routeId: registration?.routeId || 'unknown',
    routePath: path,
    method,
    category: registration?.category || 'unknown',
    policyDecision: decision.policyDecision,
    providerBoundaryStatus: decision.providerBoundaryStatus,
    safeReasonCodes: decision.safeReasonCodes,
    requestId: uuidv4(),
    schoolId,
    actorId,
    actorRole: 'admin',
  });

  const response = buildNoAiBypassAllowedResponse({
    policyDecision: decision.policyDecision,
    providerBoundaryStatus: decision.providerBoundaryStatus,
    safeReasonCodes: decision.safeReasonCodes,
    data: { decision },
  });
  res.json(response);
});

router.post('/scan', (req: Request, res: Response) => {
  const { filePaths } = req.body || {};
  if (!filePaths || !Array.isArray(filePaths)) {
    const response = buildNoAiBypassErrorResponse({ error: 'filePaths must be an array of strings' });
    res.status(400).json(response);
    return;
  }

  const forbiddenFields = findForbiddenFields(req.body);
  if (forbiddenFields.length > 0) {
    const response = buildNoAiBypassBlockedResponse({
      policyDecision: 'blocked_raw_private_content',
      error: `Request contains forbidden fields: ${forbiddenFields.join(', ')}`,
    });
    res.status(400).json(response);
    return;
  }

  const results = filePaths.map((fp: string) => {
    const result = scanRouteFileForNoAiBypassViolations(fp);
    return {
      filePath: result.filePath,
      safe: result.safe,
      forbiddenImportsFound: result.forbiddenImportsFound,
      directProviderCallsFound: result.directProviderCallsFound,
      rawProviderResponseFieldsFound: result.rawProviderResponseFieldsFound,
      hiddenReasoningFieldsFound: result.hiddenReasoningFieldsFound,
    };
  });

  const response = buildNoAiBypassScanResponse({ results });
  res.json(response);
});

export default router;
