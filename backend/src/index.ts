import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import voiceRoutes from './routes/voice';
import latencyRoutes from './routes/latency';
import anomalyRoutes from './routes/anomalies';
import readinessRoutes from './routes/readiness';
import tutorStateRoutes from './routes/tutorState';
import tutorStateV2Routes from './routes/tutorStateEndpoint';
import artifactRoutes from './routes/artifacts';
import learnerMemoryRoutes from './routes/learnerMemory';
import practiceMasteryRoutes from './routes/practiceMastery';
import intentResolverRoutes from './routes/intentResolver';
import chatPipelineRoutes from './routes/chatPipeline';
import liveChatRoutes from './routes/liveChat';
import videoRecommendationRoutes from './routes/videoRecommendations';
import videoLearningSessionRoutes from './routes/videoLearningSessions';
import videoLearningAnalyticsRoutes from './routes/videoLearningAnalytics';
import teacherInterventionRoutes from './routes/teacherInterventions';
import videoAwarePracticeRoutes from './routes/videoAwarePractice';
import artifactAwarePracticeRoutes from './routes/artifactAwarePractice';
import healthRoutes from './routes/health';
import growthAggregateRoutes from './routes/growthAggregate';
import copilotHandoffRoutes from './routes/copilotHandoff';
import tutorPolicyEvaluateRoutes from './routes/tutorPolicyEvaluate';
import tutorSafeChatRoutes from './routes/tutorSafeChat';
import teacherReportRoutes from './routes/teacherReports';
import learnerRecommendationRoutes from './routes/learnerRecommendations';
import learnerPreferenceRoutes from './routes/learnerPreferences';
import adaptiveChallengeRoutes from './routes/adaptiveChallenges';
import learnerSessionRoutes from './routes/learnerSessions';
import tutorConversationRoutes from './routes/tutorConversation';
import { publicRouter as opsPublicRouter, diagnosticsRouter as task018DiagnosticsRoutes } from './routes/task018OperationsDiagnostics';
import rateLimitAdminRoutes from './routes/task019RateLimitAdminRoutes';
import privacyGovernanceRoutes from './routes/privacyGovernance';
import task020SecurityPrivacyGovernanceRoutes from './routes/task020SecurityPrivacyGovernanceRoutes';
import schoolIntegrationRoutes from './routes/schoolIntegration';
import task021SchoolIntegrationRoutes from './routes/task021SchoolIntegrationRoutes';
import contentGovernanceRoutes from './routes/contentGovernance';
import task022CurriculumContentGovernanceRoutes from './routes/task022CurriculumContentGovernanceRoutes';
import deploymentReadinessRoutes from './routes/deploymentReadiness';
import task023DeploymentReadinessRoutes from './routes/task023DeploymentReadinessRoutes';
import task024OperationsRoutes from './routes/task024OperationsRoutes';
import task025PilotRoutes from './routes/task025PilotRoutes';
import task025ControlledPilotReadinessRoutes from './routes/task025ControlledPilotReadinessRoutes';
import task026PilotExecutionRoutes from './routes/task026PilotExecutionRoutes';
import task027PilotExpansionRoutes from './routes/task027PilotExpansionRoutes';
import task027PilotExpansionGovernanceRoutes from './routes/task027PilotExpansionGovernanceRoutes';
import task028ExpansionExecutionRoutes from './routes/task028ExpansionExecutionRoutes';
import task028ControlledExpansionExecutionRoutes from './routes/task028ControlledExpansionExecutionRoutes';
import task029ExpansionOperationsRoutes from './routes/task029ExpansionOperationsRoutes';
import task030ControlledStagingRehearsalRoutes from './routes/task030ControlledStagingRehearsalRoutes';
import task031StagingSmokeCanaryReadinessRoutes from './routes/task031StagingSmokeCanaryReadinessRoutes';
import task032ControlledCanaryActivationRoutes from './routes/task032ControlledCanaryActivationRoutes';
import task033ControlledCanaryObservationRoutes from './routes/task033ControlledCanaryObservationRoutes';
import task034ControlledLimitedRolloutRoutes from './routes/task034ControlledLimitedRolloutRoutes';
import task035SchoolWideReadinessRoutes from './routes/task035SchoolWideReadinessRoutes';
import learningModeRoutes from './routes/learningModeRoutes';
import learningProfileRoutes from './routes/learningProfileRoutes';
import tutorActionRoutes from './routes/tutorActionRoutes';
import focusModeRoutes from './routes/focusModeRoutes';
import examModeRoutes from './routes/examModeRoutes';
import quizModeRoutes from './routes/quizModeRoutes';
import teachBackModeRoutes from './routes/teachBackModeRoutes';
import studentLearningSessionRoutes from './routes/studentLearningSessionRoutes';
import noAiBypassAuditRoutes from './routes/noAiBypassAuditRoutes';
import { schoolAuthMiddleware } from './middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from './middleware/schoolContextGuardMiddleware';
import { requestIdMiddleware } from './middleware/requestId';
import { requestCorrelationMiddleware } from './middleware/requestCorrelationMiddleware';
import { requestTelemetryMiddleware } from './middleware/requestTelemetryMiddleware';
import { errorTelemetryMiddleware } from './middleware/errorTelemetryMiddleware';
import { rateLimitMiddleware, configureRouteRateLimit } from './middleware/task019RateLimitMiddleware';
import { backpressureMiddleware } from './middleware/task019BackpressureMiddleware';
import { logger, httpLogger } from './utils/logger';
import { initializeDurableSchoolIntegration } from './services/schoolIntegrationDurableBootstrap';
import { enableDurableSchoolIntegration } from './services/schoolIntegrationDurableFlag';
import { seedInMemoryStoresFromDurable } from './services/task021SchoolIntegrationDurableBridge';

const app = express();

if (process.env.NODE_ENV === 'production') {
  initializeDurableSchoolIntegration();
  enableDurableSchoolIntegration();
  seedInMemoryStoresFromDurable().catch((err) => {
    logger.error({ err }, '[Server] Failed to seed school integration durable stores');
  });
}
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const JSON_LIMIT = process.env.JSON_LIMIT || '10mb';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10);
const KEEP_ALIVE_TIMEOUT_MS = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS || '65000', 10);
const HEADERS_TIMEOUT_MS = parseInt(process.env.HEADERS_TIMEOUT_MS || '66000', 10);
const rawAllowedOrigins = String(process.env.ALLOWED_ORIGINS || '').trim();
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.length === 0 && !isProduction;
const corsOrigin = allowAllOrigins ? true : allowedOrigins.length > 0 ? allowedOrigins : false;

type GlobalSignalBridge = {
  __steadfastSignalBridge?: {
    installed: boolean;
    dispatch?: (signal: string) => void;
  };
};

const globalSignalBridge = globalThis as typeof globalThis & GlobalSignalBridge;
if (!globalSignalBridge.__steadfastSignalBridge) {
  globalSignalBridge.__steadfastSignalBridge = { installed: false };
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

// 🛡️ SECURITY MIDDLEWARE
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📉 GLOBAL RATE LIMITING
// NOTE: Schools often share one public IP. 
// We set a high threshold (10,000 req / 15 min) to prevent blocking whole schools,
// while still providing protection against brute-force/DDoS attempts.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Allow high volume for NAT environments
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Server is under heavy load. Please try again later.' }
});

app.use(globalLimiter);
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: JSON_LIMIT }));
app.use(requestIdMiddleware);
app.use(requestCorrelationMiddleware);
app.use(requestTelemetryMiddleware);
app.use(httpLogger); // Structured logging

// ─── Task 019: Route-specific rate limit configuration ──────────
const RATE_LIMIT_DISABLED_ROUTES = ['/api/health', '/api/ops', '/api/ready'];
for (const r of RATE_LIMIT_DISABLED_ROUTES) {
  configureRouteRateLimit(r, { useBackpressure: false, useAbuseDetection: false, useQuotas: false, useMultiTenant: false, enabled: false });
}
// Rate limit admin routes use light config
configureRouteRateLimit('/api/admin/rate-limits', { useBackpressure: false, useQuotas: false, useMultiTenant: false });
configureRouteRateLimit('/api/integrations/school/roster/sync', { useBackpressure: true, useAbuseDetection: true, useQuotas: false, useMultiTenant: true });

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown',
    requestId: req.requestId,
  });
});

app.use('/api/health', healthRoutes);
app.use('/api', readinessRoutes);

app.use('/api/copilot/latency', schoolAuthMiddleware, latencyRoutes);
app.use('/api/copilot/anomalies', schoolAuthMiddleware, anomalyRoutes);
app.use('/api/copilot/tutor-state', schoolAuthMiddleware, tutorStateRoutes);
app.use('/api/copilot/tutor-state', schoolAuthMiddleware, tutorStateV2Routes);
app.use('/api/copilot/artifacts', schoolAuthMiddleware, artifactRoutes);
app.use('/api/copilot/learner-memory', schoolAuthMiddleware, learnerMemoryRoutes);
app.use('/api/copilot/practice-mastery', schoolAuthMiddleware, practiceMasteryRoutes);
app.use('/api/copilot/intent', schoolAuthMiddleware, intentResolverRoutes);
app.use('/api/copilot/chat-pipeline', schoolAuthMiddleware, chatPipelineRoutes);
app.use('/api/copilot/live-chat', schoolAuthMiddleware, liveChatRoutes);
app.use('/api/copilot', schoolAuthMiddleware, videoRecommendationRoutes);
app.use('/api/copilot', schoolAuthMiddleware, videoLearningSessionRoutes);
app.use('/api/copilot', schoolAuthMiddleware, videoAwarePracticeRoutes);
app.use('/api/video-learning-analytics', schoolAuthMiddleware, videoLearningAnalyticsRoutes);
app.use('/api', schoolAuthMiddleware, teacherInterventionRoutes);
app.use('/api', schoolAuthMiddleware, requireVerifiedSchoolContext, teacherReportRoutes);
app.use('/api/copilot/artifacts', schoolAuthMiddleware, artifactAwarePracticeRoutes);
app.use('/api/copilot', schoolAuthMiddleware, rateLimitMiddleware, aiRoutes);
app.use('/api/voice', schoolAuthMiddleware, rateLimitMiddleware, voiceRoutes);
app.use('/api/copilot/growth', schoolAuthMiddleware, growthAggregateRoutes);
app.use('/api', schoolAuthMiddleware, profileRoutes);
app.use('/api/learner', schoolAuthMiddleware, learnerRecommendationRoutes);
app.use('/api/learner', schoolAuthMiddleware, learnerPreferenceRoutes);
app.use('/api/copilot', copilotHandoffRoutes);
app.use('/api/copilot', schoolAuthMiddleware, tutorPolicyEvaluateRoutes);
app.use('/api/copilot', schoolAuthMiddleware, tutorSafeChatRoutes);
app.use('/api/learner', schoolAuthMiddleware, requireVerifiedSchoolContext, learnerSessionRoutes);
app.use('/api/tutor', schoolAuthMiddleware, requireVerifiedSchoolContext, tutorConversationRoutes);
app.use('/api/learner', schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeRoutes);
app.use('/api/copilot/learning-sessions', schoolAuthMiddleware, requireVerifiedSchoolContext, studentLearningSessionRoutes);
app.use('/api/ops', opsPublicRouter);
app.use('/api/ops/diagnostics', schoolAuthMiddleware, requireVerifiedSchoolContext, task018DiagnosticsRoutes);
app.use('/api/admin/rate-limits', schoolAuthMiddleware, rateLimitAdminRoutes);
app.use('/api/governance', schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes);
app.use('/api/task020/security-privacy-governance', schoolAuthMiddleware, requireVerifiedSchoolContext, task020SecurityPrivacyGovernanceRoutes);
app.use('/api/learner', schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes);
app.use('/api', schoolAuthMiddleware, schoolIntegrationRoutes);
app.use('/api/task021/school-integration', schoolAuthMiddleware, requireVerifiedSchoolContext, task021SchoolIntegrationRoutes);

app.use('/api/content-governance', schoolAuthMiddleware, requireVerifiedSchoolContext, contentGovernanceRoutes);
app.use('/api/task022/curriculum-governance', schoolAuthMiddleware, requireVerifiedSchoolContext, task022CurriculumContentGovernanceRoutes);

// ─── Task 023: Deployment Readiness Routes ────────────────────
app.use('/api', deploymentReadinessRoutes);

// Task 023 production readiness gate — requires school auth, verified school context, and admin/internal role
app.use(
  '/api/task023/deployment-readiness',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task023DeploymentReadinessRoutes
);

// ─── Task 024: Production Operations Routes ───────────────────
// All operations routes are admin/internal only.
app.use('/api', task024OperationsRoutes);

// Task 024 operations readiness routes — requires school auth, verified school context
import task024OperationsReadinessRoutes from './routes/task024OperationsReadinessRoutes';
app.use(
  '/api/task024/operations-readiness',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task024OperationsReadinessRoutes
);

// ─── Task 025: Controlled Pilot Readiness Routes ────────────
// All pilot routes are admin/internal only; school-auth is enforced per-route.
app.use('/api', schoolAuthMiddleware, task025PilotRoutes);

// Task 025 controlled pilot readiness routes — requires school auth and verified school context.
app.use(
  '/api/task025/pilot-readiness',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task025ControlledPilotReadinessRoutes
);

// ─── Task 026: Controlled Pilot Execution Routes ──────────────────
// Session preflight and feedback routes use schoolAuth only; control routes use adminGuard.
app.use('/api', schoolAuthMiddleware, task026PilotExecutionRoutes);

// ─── Task 027: Controlled Pilot Expansion Governance Routes ──────
// All expansion routes require school auth; admin role required for most operations.
app.use('/api', schoolAuthMiddleware, task027PilotExpansionRoutes);

// Task 027 controlled pilot expansion governance — requires school auth, verified school context, role scoping
app.use(
  '/api/task027/pilot-expansion-governance',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task027PilotExpansionGovernanceRoutes
);

// ─── Task 028: Controlled Expansion Execution Routes ──────
// All expansion execution routes require school auth; admin role for control operations.
app.use('/api', schoolAuthMiddleware, task028ExpansionExecutionRoutes);

// Task 028 controlled expansion execution — requires school auth, verified school context, role scoping
app.use(
  '/api/task028/controlled-expansion-execution',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task028ControlledExpansionExecutionRoutes
);

// ─── Task 029: Expansion Operations Console Routes ──────
// All expansion operations routes require school auth; role gated per-route.
app.use('/api', schoolAuthMiddleware, task029ExpansionOperationsRoutes);

// ─── Task 030: Controlled Staging Rehearsal Routes ──────
// All staging rehearsal routes require school auth, verified school context, and admin/operator role.
app.use(
  '/api/task030/controlled-staging-rehearsal',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task030ControlledStagingRehearsalRoutes
);

// ─── Task 031: Staging Smoke / Canary Readiness Routes ───
// All staging smoke routes require school auth and verified school context.
app.use(
  '/api/task031/staging-smoke-canary-readiness',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task031StagingSmokeCanaryReadinessRoutes
);

// ─── Task 032: Controlled Canary Activation Routes ──────
// All canary activation routes require school auth and verified school context.
app.use(
  '/api/task032/controlled-canary-activation',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task032ControlledCanaryActivationRoutes
);

// ─── Task 033: Controlled Canary Observation Routes ──────
// All observation routes require school auth, verified school context, and role gating.
app.use(
  '/api/task033/controlled-canary-observation',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task033ControlledCanaryObservationRoutes
);

// ─── Task 034: Controlled Limited Rollout Routes ──────
// All rollout routes require school auth; role gated per-route.
app.use(
  '/api/task034/controlled-limited-rollout',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task034ControlledLimitedRolloutRoutes
);

// ─── Task 035: School-Wide Readiness Routes ──────────
// All readiness routes require school auth, verified school context; role gated per-route.
app.use(
  '/api/task035/school-wide-readiness',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task035SchoolWideReadinessRoutes
);

// ─── Task 036: Controlled Live School Launch Routes ──
// All launch routes require school auth, verified school context, role gated per endpoint.
import task036LiveSchoolLaunchRoutes from './routes/task036LiveSchoolLaunchRoutes';
app.use(
  '/api/task036/live-school-launch',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task036LiveSchoolLaunchRoutes
);

// ─── Task 040: Final Backend Logic Freeze Routes ──
// All freeze routes require school auth, verified school context, role gated per endpoint.
import task040BackendFreezeRoutes from './routes/task040BackendFreezeRoutes';
app.use(
  '/api/task040/backend-freeze',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  task040BackendFreezeRoutes
);

// ─── Question Bank Routes ───────────────────────────────
import questionBankRoutes from './routes/questionBank';
app.use('/api/question-bank', schoolAuthMiddleware, questionBankRoutes);

// ─── Exam Blueprint Routes (Package 4) ─────────────────
import examBlueprintRoutes from './routes/examBlueprint';
app.use('/api/question-bank', schoolAuthMiddleware, examBlueprintRoutes);

// ─── Marking Routes (Package 5) ──────────────────────
import markingRoutes from './routes/marking';
app.use('/api/question-bank/marking', schoolAuthMiddleware, requireVerifiedSchoolContext, markingRoutes);

// ─── Exam Paper Routes (Package 6) ──────────────────
import examPaperRoutes from './routes/examPaper';
app.use('/api/question-bank/exam-papers', schoolAuthMiddleware, requireVerifiedSchoolContext, examPaperRoutes);

// ─── Phase 2: Learning Mode Runtime Routes ──────────────
app.use('/api', schoolAuthMiddleware, requireVerifiedSchoolContext, learningModeRoutes);
app.use('/api/copilot', schoolAuthMiddleware, requireVerifiedSchoolContext, learningProfileRoutes);

// ─── Phase 2 Task 003: Tutor Action Routes ─────────────
app.use('/api/copilot/tutor-actions', schoolAuthMiddleware, requireVerifiedSchoolContext, tutorActionRoutes);

// ─── Phase 2 Task 004: Focus Mode Routes ──────────────
app.use('/api/copilot/focus-mode', schoolAuthMiddleware, requireVerifiedSchoolContext, focusModeRoutes);

// ─── Phase 2 Task 005: Exam Mode Routes ──────────────
app.use('/api/copilot/exam-mode', schoolAuthMiddleware, requireVerifiedSchoolContext, examModeRoutes);

// ─── Phase 2 Task 006: Quiz Mode Routes ──────────────
app.use('/api/copilot/quiz-mode', schoolAuthMiddleware, requireVerifiedSchoolContext, quizModeRoutes);

// ─── Phase 2 Task 007: Teach-Back Mode Routes ─────────
app.use('/api/copilot/teach-back-mode', schoolAuthMiddleware, requireVerifiedSchoolContext, teachBackModeRoutes);

// ─── Phase 2 Task 008: Revision Mode Routes ──────────
import revisionModeRoutes from './routes/revisionModeRoutes';
app.use('/api/copilot/revision-mode', schoolAuthMiddleware, requireVerifiedSchoolContext, revisionModeRoutes);

// ─── Backend Phase 2 Task 009: Growth Action Resolver Routes ──────────
import growthActionRoutes from './routes/growthActionRoutes';
app.use('/api/copilot/growth', schoolAuthMiddleware, requireVerifiedSchoolContext, growthActionRoutes);

// ─── Backend Phase 2 Task 010: Tutor Turn Orchestration Runtime Routes ──
import tutorTurnRuntimeRoutes from './routes/tutorTurnRuntimeRoutes';
app.use('/api/copilot/tutor-turn', schoolAuthMiddleware, requireVerifiedSchoolContext, tutorTurnRuntimeRoutes);

// ─── Backend Phase 2 Task 011: Safe Learning Evidence Ledger Routes ──
import safeLearningEvidenceRoutes from './routes/safeLearningEvidenceRoutes';
app.use('/api/copilot/learning-evidence', schoolAuthMiddleware, requireVerifiedSchoolContext, safeLearningEvidenceRoutes);

// ─── Backend Phase 2 Task 012: Teacher Safe Insight Routes ──
import teacherSafeInsightRoutes from './routes/teacherSafeInsightRoutes';
app.use('/api/copilot/teacher-insights', schoolAuthMiddleware, requireVerifiedSchoolContext, teacherSafeInsightRoutes);

// ─── Backend Phase 2 Task 013: Learner Transparency Routes ──
import learnerTransparencyRoutes from './routes/learnerTransparencyRoutes';
app.use('/api/copilot/learner-transparency', schoolAuthMiddleware, requireVerifiedSchoolContext, learnerTransparencyRoutes);

// ─── Backend Phase 2 Task 014: Adaptive Recommendation Tuning Routes ──
import adaptiveRecommendationTuningRoutes from './routes/adaptiveRecommendationTuningRoutes';
app.use('/api/copilot/adaptive-recommendations', schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveRecommendationTuningRoutes);

// ─── Backend Phase 2 Task 015: Adaptive Challenge Generation + Remediation Routes ──
import adaptiveChallengeTask015Routes from './routes/adaptiveChallengeRoutes';
import remediationTask015Routes from './routes/remediationRoutes';
app.use('/api/copilot/adaptive-challenges', schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeTask015Routes);
app.use('/api/copilot/remediation', schoolAuthMiddleware, requireVerifiedSchoolContext, remediationTask015Routes);

app.use('/api/copilot/no-ai-bypass', schoolAuthMiddleware, requireVerifiedSchoolContext, noAiBypassAuditRoutes);

// ��� Phase 3A Task 001: Objective Mastery Runtime Routes ����������
import phase3ObjectiveMasteryRoutes from './routes/phase3ObjectiveMasteryRoutes';
app.use('/api/phase3/objectives', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ObjectiveMasteryRoutes);

// ��� Phase 3A Task 002: Daily Objective Check Runtime Routes ��������
import phase3DailyObjectiveCheckRoutes from './routes/phase3DailyObjectiveCheckRoutes';
app.use('/api/phase3/daily-objective-checks', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyObjectiveCheckRoutes);

// ��� Phase 3A Task 003: Daily Learning Feed Routes ����������������
import phase3DailyLearningFeedRoutes from './routes/phase3DailyLearningFeedRoutes';
app.use('/api/phase3/daily-learning-feed', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyLearningFeedRoutes);

// ��� Phase 3B Task 001: Study Plan Runtime Routes ����������������
import phase3StudyPlanRoutes from './routes/phase3StudyPlanRoutes';
app.use('/api/phase3/study-plans', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3StudyPlanRoutes);

// ��� Phase 3C Task 001: Growth Page Intelligence Routes �����������
import phase3GrowthPageRoutes from './routes/phase3GrowthPageRoutes';
app.use('/api/phase3/growth-page', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3GrowthPageRoutes);

// ─── Phase 3D Task 001: Living Revision NoteGraph Routes ──────
import phase3LivingRevisionRoutes from './routes/phase3LivingRevisionRoutes';
app.use('/api/phase3/living-revision', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3LivingRevisionRoutes);

// ─── Phase 3E Task 001: Confidence Recovery Runtime Routes ──────
import phase3ConfidenceRecoveryRoutes from './routes/phase3ConfidenceRecoveryRoutes';
app.use('/api/phase3/confidence-recovery', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ConfidenceRecoveryRoutes);

// ─── Phase 3F Task 001: Parent-Safe Support Runtime Routes ──────
import phase3ParentSupportRoutes from './routes/phase3ParentSupportRoutes';
app.use('/api/phase3/parent-support', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ParentSupportRoutes);

// ─── Phase 3G Task 001: Peer Learning Safety Runtime Routes ──────
import phase3PeerLearningRoutes from './routes/phase3PeerLearningRoutes';
app.use('/api/phase3/peer-learning', schoolAuthMiddleware, requireVerifiedSchoolContext, phase3PeerLearningRoutes);

// Error Telemetry Middleware (before global error handler)
app.use(errorTelemetryMiddleware);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled application error');
  const status = Number(err?.status || err?.statusCode || 500);
  if (status === 413) {
    res.status(413).send({ message: `Request payload too large. Increase JSON_LIMIT or upload fewer/smaller files.` });
    return;
  }
  res.status(status >= 400 && status < 600 ? status : 500).send({ message: 'An unexpected error occurred.' });
});

const server = app.listen(PORT, HOST, () => {
  if (!allowAllOrigins && allowedOrigins.length === 0) {
    logger.error('ALLOWED_ORIGINS is empty in production. Cross-origin requests are blocked until it is configured.');
  }
  logger.info(`Server listening on ${HOST}:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
});

// ⚡ SERVER CONFIGURATION
server.requestTimeout = REQUEST_TIMEOUT_MS;
server.timeout = REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = HEADERS_TIMEOUT_MS;

// 🛑 GRACEFUL SHUTDOWN
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.closeIdleConnections?.();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    server.closeAllConnections?.();
    process.exit(1);
  }, 10000);
};

globalSignalBridge.__steadfastSignalBridge.dispatch = shutdown;
if (!globalSignalBridge.__steadfastSignalBridge.installed) {
  process.on('SIGTERM', () => globalSignalBridge.__steadfastSignalBridge?.dispatch?.('SIGTERM'));
  process.on('SIGINT', () => globalSignalBridge.__steadfastSignalBridge?.dispatch?.('SIGINT'));
  globalSignalBridge.__steadfastSignalBridge.installed = true;
}
