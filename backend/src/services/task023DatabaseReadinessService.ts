import prisma from '../lib/prisma';
import { DeploymentReadinessStatus, ReadinessSeverity, DatabaseReadinessResult, ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';

const REQUIRED_MODELS = [
  'TutorLearnerIdentityMap',
  'TutorSession',
  'SchoolRosterSyncJobRecord',
  'SchoolRosterSyncConflictRecord',
  'SchoolIntegrationIdempotencyRecord',
  'SchoolIntegrationAuditRecord',
  'CurriculumVersionRecord',
  'CurriculumTopicRecord',
  'CurriculumSkillRecord',
  'LearningObjectiveRecord',
  'PrerequisiteLinkRecord',
  'ApprovedSourceRecord',
  'ContentItemRecord',
  'ContentGapRecord',
  'ContentGovernanceAuditRecord',
  'ContentReviewRecord',
  'DurableAuditEvent',
  'LearnerMemoryItem',
  'PracticeAttempt',
  'SkillMasterySnapshot',
  'ConversationArchiveRecord',
  'SafeMemorySummary',
];

async function safeModelCheck(modelName: string): Promise<boolean> {
  try {
    const prismaAny = prisma as unknown as Record<string, { count: (args?: Record<string, unknown>) => Promise<number> }>;
    const modelAccessor = prismaAny[modelName];
    if (!modelAccessor || typeof modelAccessor.count !== 'function') return false;
    await modelAccessor.count({ take: 0 });
    return true;
  } catch {
    return false;
  }
}

export async function getDatabaseReadinessResult(): Promise<DatabaseReadinessResult> {
  const start = Date.now();
  const availableModels: string[] = [];
  const missingModels: string[] = [];

  try {
    await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>('SELECT 1');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'blocked',
      severity: 'critical',
      message: `Database unreachable: ${message.length > 150 ? message.slice(0, 150) : message}`,
      latencyMs: Date.now() - start,
      connectionVerified: false,
      requiredModelsAvailable: [],
      requiredModelsMissing: REQUIRED_MODELS,
    };
  }

  for (const modelName of REQUIRED_MODELS) {
    try {
      const accessible = await safeModelCheck(modelName);
      if (accessible) {
        availableModels.push(modelName);
      } else {
        missingModels.push(modelName);
      }
    } catch {
      missingModels.push(modelName);
    }
  }

  const allAvailable = missingModels.length === 0;
  return {
    status: allAvailable ? 'ready' : 'degraded',
    severity: missingModels.length > 0 ? 'warning' : 'info',
    message: allAvailable
      ? `Database reachable. All ${REQUIRED_MODELS.length} required models available.`
      : `Database reachable. ${missingModels.length} model(s) unavailable: ${missingModels.join(', ')}`,
    latencyMs: Date.now() - start,
    connectionVerified: true,
    requiredModelsAvailable: availableModels,
    requiredModelsMissing: missingModels,
  };
}

export async function getDatabaseReadinessCheck(): Promise<ReadinessCheckResult> {
  const result = await getDatabaseReadinessResult();
  return {
    name: 'database-readiness',
    status: result.status,
    severity: result.severity,
    required: true,
    message: result.message,
    latencyMs: result.latencyMs,
    details: {
      connectionVerified: result.connectionVerified,
      modelsAvailable: result.requiredModelsAvailable.length,
      modelsMissing: result.requiredModelsMissing.length,
    },
  };
}

export { REQUIRED_MODELS };
