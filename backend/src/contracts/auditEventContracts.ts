export type BackendAuditEventType =
  | 'request_received'
  | 'request_completed'
  | 'request_failed'
  | 'auth_failed'
  | 'scope_denied'
  | 'safeguarding_escalation'
  | 'teacher_intervention_audit'
  | 'privacy_blocked'
  | 'source_trust_blocked'
  | 'cache_bypassed'
  | 'ai_call_started'
  | 'ai_call_completed'
  | 'ai_call_failed'
  | 'dependency_check_failed'
  | 'release_gate_observability_check';

export type BackendAuditOutcome = 'success' | 'failure' | 'blocked' | 'partial';

export type BackendAuditEvent = {
  eventId: string;
  eventType: BackendAuditEventType;
  timestamp: string;
  requestId?: string;
  traceId?: string;
  actorType?: BackendActorType;
  actorIdHash?: string;
  schoolIdHash?: string;
  targetType?: string;
  targetIdHash?: string;
  route?: string;
  method?: string;
  outcome: BackendAuditOutcome;
  reason?: string;
  safeSummary: string;
  minimumNecessary: boolean;
  rawPrivateDataIncluded: false;
};

import type { BackendActorType } from './observabilityContracts';
