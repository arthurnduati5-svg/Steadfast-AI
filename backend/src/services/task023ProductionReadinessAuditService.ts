import {
  Task023ProductionReadinessAuditEvent,
  Task023AuditEventType,
  DeploymentEnvironment,
} from '../contracts/task023DeploymentReadinessContracts';

let eventCounter = 0;

function generateEventId(): string {
  eventCounter++;
  return `audit-${Date.now()}-${eventCounter}`;
}

export function createAuditEvent(params: {
  schoolId?: string;
  actorId: string;
  actorRole: string;
  environmentType: DeploymentEnvironment;
  component: string;
  eventType: Task023AuditEventType;
  safeReasonCodes: string[];
  safeMetadata: Record<string, string | number | boolean>;
}): Task023ProductionReadinessAuditEvent {
  return {
    eventId: generateEventId(),
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    environmentType: params.environmentType,
    component: params.component,
    eventType: params.eventType,
    safeReasonCodes: params.safeReasonCodes,
    safeMetadata: params.safeMetadata,
    createdAt: new Date().toISOString(),
  };
}

export function recordAuditEvent(event: Task023ProductionReadinessAuditEvent): void {
  try {
    const repo = require('./task023DeploymentReadinessRepository');
    repo.recordProductionReadinessAuditEvent(event);
  } catch {
    try {
      const fs = require('fs');
      const path = require('path');
      const auditDir = path.join(__dirname, '../../../reports');
      if (!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
      }
      const logFile = path.join(auditDir, 'task023-audit-events.jsonl');
      fs.appendFileSync(logFile, JSON.stringify(event) + '\n');
    } catch {
    }
  }
}

export function createAndRecordAuditEvent(params: {
  schoolId?: string;
  actorId: string;
  actorRole: string;
  environmentType: DeploymentEnvironment;
  component: string;
  eventType: Task023AuditEventType;
  safeReasonCodes: string[];
  safeMetadata: Record<string, string | number | boolean>;
}): Task023ProductionReadinessAuditEvent {
  const event = createAuditEvent(params);
  recordAuditEvent(event);
  return event;
}

export function isSafeAuditMetadata(metadata: Record<string, unknown>): boolean {
  const forbiddenKeys = [
    'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'SESSION_SECRET',
    'COOKIE_SECRET', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
    'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'PINECONE_API_KEY',
    'STRIPE_SECRET_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY',
    'SMTP_PASSWORD', 'PRIVATE_KEY', 'ACCESS_TOKEN', 'REFRESH_TOKEN',
    'ID_TOKEN', 'AUTHORIZATION', 'COOKIE',
    'rawEnv', 'rawSecret', 'rawConnectionString',
    'rawProviderPayload', 'providerPrompt', 'providerResponse',
    'chainOfThought', 'hiddenReasoning',
    'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
    'rawStudentData', 'rawParentData', 'rawTeacherData',
    'safeguardingRaw', 'privateDeenText',
  ];

  for (const key of Object.keys(metadata)) {
    const keyUpper = key.toUpperCase();
    for (const forbidden of forbiddenKeys) {
      if (keyUpper === forbidden || keyUpper.includes(forbidden)) {
        return false;
      }
    }
    const value = metadata[key];
    if (typeof value === 'string') {
      const valueUpper = value.toUpperCase();
      for (const forbidden of forbiddenKeys) {
        if (valueUpper.includes(forbidden) && value.length > 2) {
          return false;
        }
      }
    }
  }
  return true;
}
