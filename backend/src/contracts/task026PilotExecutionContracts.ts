export type PilotExecutionStatus = 'not_started' | 'starting' | 'active' | 'paused' | 'resuming' | 'rollback_requested' | 'rolled_back' | 'completed' | 'cancelled' | 'blocked' | 'failed'

export type PilotExecutionEventType = 'created' | 'activated' | 'paused' | 'resumed' | 'rolled_back' | 'completed' | 'cancelled' | 'blocked'

export type PilotExecutionEventInput = {
  executionRunId: string
  pilotProgramId: string
  schoolId: string
  actorRole: string
  actorIdHash?: string
  eventType: string
  eventStatus?: string
  safeSummary?: string
  reasonCodes?: string[]
  metadataSafeJson?: Record<string, unknown>
  requestId?: string
  correlationId?: string
}

export type PilotFeedbackInput = {
  executionRunId: string
  pilotProgramId: string
  schoolId: string
  actorRole: string
  actorIdHash?: string
  feedbackType: string
  sentiment?: string
  safeSummary?: string
  riskFlags?: string[]
  safeguardingRelevant?: boolean
  deenRelevant?: boolean
  privacyRelevant?: boolean
  teacherActionRequested?: boolean
  metadataSafeJson?: Record<string, unknown>
}

export type PilotMetricSnapshot = {
  executionRunId: string
  pilotProgramId: string
  schoolId: string
  activeSessions?: number
  allowedSessionStarts?: number
  blockedSessionStarts?: number
  pilotAccessDeniedCount?: number
  curriculumGateBlockCount?: number
  schoolAuthGateBlockCount?: number
  socraticGateBlockCount?: number
  deenGateBlockCount?: number
  privacyGateBlockCount?: number
  aiCallBlockedCount?: number
  aiCallAllowedCount?: number
  feedbackCount?: number
  safetySignalCount?: number
  incidentBridgeCount?: number
  p95LatencyMs?: number
  errorCount?: number
  metadataSafeJson?: Record<string, unknown>
}

export type PilotExecutionGateDecision = {
  allowed: boolean
  reasonCodes: string[]
  safeMessage: string
  gateSnapshot: Record<string, unknown>
}

export type PilotSafetySignalType = 'feedback_risk' | 'privacy_scan' | 'safeguarding_concern' | 'deen_violation' | 'socratic_quality' | 'operational_anomaly'

export type PilotSafetySeverity = 'low' | 'medium' | 'high' | 'critical'

export type PilotPostPilotReview = {
  executionRunId: string
  pilotProgramId: string
  schoolId: string
  status: string
  safeSummary: string
  recommendedDecision: string
  safeToStartNextTask: boolean
  blockingIssues: string[]
}

export type PilotReviewRecommendedDecision = 'expand_cautiously' | 'pause_and_fix' | 'rollback_required' | 'continue_limited_pilot' | 'approve' | 'reject' | 'request_changes'

export interface Task026PilotExecutionContext {
  schoolId: string
  pilotRunId: string
  actorRole: string
}

export const TASK026_PILOT_EXECUTION_STATUSES: PilotExecutionStatus[] = [
  'not_started', 'starting', 'active', 'paused', 'resuming', 'rollback_requested', 'rolled_back', 'completed', 'cancelled', 'blocked', 'failed',
]

export const PILOT_EXECUTION_STATUSES = TASK026_PILOT_EXECUTION_STATUSES

export const TASK026_PILOT_EVENT_TYPES: PilotExecutionEventType[] = [
  'created', 'activated', 'paused', 'resumed', 'rolled_back', 'completed', 'cancelled', 'blocked',
]

export const PILOT_EXECUTION_EVENT_TYPES = TASK026_PILOT_EVENT_TYPES

export const PILOT_FEEDBACK_TYPES = [
  'positive', 'negative', 'neutral', 'suggestion', 'bug_report', 'safeguarding', 'deen_concern',
] as const

export const PRIVATE_CONTENT_PATTERNS = [
  'rawStudentData', 'rawLearnerData', 'answerKey', 'correctAnswer',
] as const

export const PILOT_SAFETY_SEVERITIES: PilotSafetySeverity[] = [
  'low', 'medium', 'high', 'critical',
]
