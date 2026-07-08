import {
  IncidentSignal,
  IncidentRecord,
  IncidentSeverity,
  IncidentCategory,
} from '../contracts/task024OperationsContracts';

type SeverityRule = {
  severity: IncidentSeverity;
  category: IncidentCategory;
};

const SEVERITY_RULES: Record<string, SeverityRule> = {
  secret_leak_detected: { severity: 'critical', category: 'security' },
  privacy_leak_detected: { severity: 'critical', category: 'privacy' },
  database_unavailable: { severity: 'critical', category: 'database' },
  startup_gate_blocked: { severity: 'critical', category: 'configuration' },
  migration_safety_critical: { severity: 'critical', category: 'migration' },
  safeguarding_pipeline_unavailable: { severity: 'high', category: 'safeguarding' },
  school_integration_readiness_failure: { severity: 'critical', category: 'school_integration' },
  content_governance_readiness_failure: { severity: 'high', category: 'content_governance' },
  deen_governance_source_unavailable: { severity: 'high', category: 'deen_governance' },
  content_gap_spike: { severity: 'medium', category: 'content_governance' },
  ai_gateway_unsafe: { severity: 'high', category: 'ai_gateway' },
  backup_readiness_failed: { severity: 'medium', category: 'backup' },
  restore_drill_failed: { severity: 'medium', category: 'restore' },
  rate_limit_abuse_spike: { severity: 'medium', category: 'rate_limit' },
  prisma_readiness_failure: { severity: 'high', category: 'database' },
};

const DEFAULT_RULE: SeverityRule = { severity: 'low', category: 'unknown' };

const TITLE_MAP: Record<string, string> = {
  secret_leak_detected: 'Secret Leak Detected',
  privacy_leak_detected: 'Privacy Leak Detected',
  database_unavailable: 'Database Unavailable',
  startup_gate_blocked: 'Startup Gate Blocked',
  migration_safety_critical: 'Migration Safety Critical',
  safeguarding_pipeline_unavailable: 'Safeguarding Pipeline Unavailable',
  school_integration_readiness_failure: 'School Integration Readiness Failure',
  content_governance_readiness_failure: 'Content Governance Readiness Failure',
  deen_governance_source_unavailable: 'Deen Governance Source Unavailable',
  content_gap_spike: 'Content Gap Spike',
  ai_gateway_unsafe: 'AI Gateway Unsafe',
  backup_readiness_failed: 'Backup Readiness Failed',
  restore_drill_failed: 'Restore Drill Failed',
  rate_limit_abuse_spike: 'Rate Limit Abuse Spike',
  prisma_readiness_failure: 'Prisma Readiness Failure',
};

const OWNER_ROLE_MAP: Record<string, string> = {
  security: 'security_admin',
  privacy: 'privacy_officer',
  database: 'database_admin',
  configuration: 'admin',
  migration: 'admin',
  safeguarding: 'safeguarding_lead',
  school_integration: 'school_operations_admin',
  content_governance: 'curriculum_admin',
  deen_governance: 'deen_governance_officer',
  ai_gateway: 'admin',
  backup: 'admin',
  restore: 'admin',
  rate_limit: 'admin',
  unknown: 'admin',
};

const STUDENT_SAFETY_CATEGORIES: ReadonlySet<IncidentCategory> = new Set<IncidentCategory>(['safeguarding', 'privacy']);

const PRIVACY_RELEVANT_CATEGORIES: ReadonlySet<IncidentCategory> = new Set<IncidentCategory>(['privacy', 'safeguarding']);

const DEEN_GOVERNANCE_RELEVANT_CATEGORIES: ReadonlySet<IncidentCategory> = new Set<IncidentCategory>(['deen_governance']);

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `inc_${timestamp}_${random}`;
}

function toSafeTitle(signalType: string): string {
  return TITLE_MAP[signalType] ?? signalType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRule(signalType: string): SeverityRule {
  return SEVERITY_RULES[signalType] ?? DEFAULT_RULE;
}

export function classifySignal(signal: IncidentSignal): IncidentRecord {
  const rule = getRule(signal.signalType);
  return {
    id: generateId(),
    category: rule.category,
    severity: rule.severity,
    status: 'detected',
    safeTitle: toSafeTitle(signal.signalType),
    safeSummary: signal.safeSummary,
    reasonCodes: [signal.signalType],
    affectedComponents: [signal.component],
    recommendedOwnerRole: OWNER_ROLE_MAP[rule.category] ?? 'admin',
    studentSafetyRelevant: STUDENT_SAFETY_CATEGORIES.has(rule.category),
    privacyRelevant: PRIVACY_RELEVANT_CATEGORIES.has(rule.category),
    deenGovernanceRelevant: DEEN_GOVERNANCE_RELEVANT_CATEGORIES.has(rule.category),
    detectedAt: signal.detectedAt,
  };
}

export function classifySignals(signals: IncidentSignal[]): IncidentRecord[] {
  return signals.map(classifySignal);
}

export function getSeverityRules(): Record<string, SeverityRule> {
  return { ...SEVERITY_RULES };
}
