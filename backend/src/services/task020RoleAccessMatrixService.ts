// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Role Access Matrix Service v1
// Centralizes role access decisions across the tutor system.
// ─────────────────────────────────────────────────────────────

import type {
  TutorRole,
  AccessAction,
  DataCategory,
  OwnerType,
  RoleAccessRequest,
  RoleAccessDecision,
  RoleAccessMatrixEntry,
} from '../contracts/task020GovernanceContracts';

type MatrixKey = `${TutorRole}:${DataCategory}`;

const ACCESS_MATRIX: Partial<Record<MatrixKey, RoleAccessMatrixEntry>> = {
  'learner:learner_identity': {
    role: 'learner', category: 'learner_identity', canRead: true, canWrite: false, canUpdate: true, canDelete: false,
    canExport: true, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'self_only', notes: 'Learner can read/update own identity; cannot delete identity record.',
  },
  'teacher:teacher_safe_summary': {
    role: 'teacher', category: 'teacher_safe_summary', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read safe summaries for enrolled students.',
  },
  'teacher:practice_attempt': {
    role: 'teacher', category: 'practice_attempt', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read safe practice attempt summaries.',
  },
  'teacher:mastery_snapshot': {
    role: 'teacher', category: 'mastery_snapshot', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read mastery snapshots for scoped students.',
  },
  'teacher:learning_evidence': {
    role: 'teacher', category: 'learning_evidence', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read learning evidence summaries.',
  },
  'teacher:revision_item': {
    role: 'teacher', category: 'revision_item', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read revision items.',
  },
  'teacher:tutor_session_state': {
    role: 'teacher', category: 'tutor_session_state', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can view session metadata but not content.',
  },
  'teacher:spaced_review_item': {
    role: 'teacher', category: 'spaced_review_item', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can view spaced review schedules.',
  },
  'teacher:safe_memory_summary': {
    role: 'teacher', category: 'safe_memory_summary', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read safe memory summaries only.',
  },
  'teacher:challenge_record': {
    role: 'teacher', category: 'challenge_record', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read challenge records.',
  },
  'teacher:remediation_path': {
    role: 'teacher', category: 'remediation_path', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read remediation paths.',
  },
  'teacher:difficulty_calibration': {
    role: 'teacher', category: 'difficulty_calibration', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read difficulty calibration metadata.',
  },
  'teacher:class_roster_scope': {
    role: 'teacher', category: 'class_roster_scope', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'class_scoped', notes: 'Teacher can read class roster for scoped classes.',
  },
  'teacher:school_identity': {
    role: 'teacher', category: 'school_identity', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'school_scoped', notes: 'Teacher can read own school identity.',
  },
  'school_admin:teacher_safe_summary': {
    role: 'school_admin', category: 'teacher_safe_summary', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'school_scoped', notes: 'Admin can diagnose and audit teacher summaries.',
  },
  'school_admin:audit_event': {
    role: 'school_admin', category: 'audit_event', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'school_scoped', notes: 'Admin can read audit events within school scope.',
  },
  'school_admin:operational_telemetry': {
    role: 'school_admin', category: 'operational_telemetry', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'school_scoped', notes: 'Admin can view safe operational telemetry.',
  },
  'school_admin:rate_limit_record': {
    role: 'school_admin', category: 'rate_limit_record', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: false, canSafeguardingReview: false,
    scopeLimit: 'school_scoped', notes: 'Admin can view rate limit records.',
  },
  'system_admin:learner_identity': {
    role: 'system_admin', category: 'learner_identity', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can diagnose identity records.',
  },
  'system_admin:conversation_message': {
    role: 'system_admin', category: 'conversation_message', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: true,
    scopeLimit: 'system_wide_safeguarding_review', notes: 'System admin can read conversation messages only for safeguarding review.',
  },
  'system_admin:audit_event': {
    role: 'system_admin', category: 'audit_event', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can read all audit events.',
  },
  'system_admin:operational_telemetry': {
    role: 'system_admin', category: 'operational_telemetry', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can read telemetry.',
  },
  'system_admin:ai_prompt_metadata': {
    role: 'system_admin', category: 'ai_prompt_metadata', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can diagnose prompt metadata.',
  },
  'system_admin:provider_response_metadata': {
    role: 'system_admin', category: 'provider_response_metadata', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can diagnose provider response metadata.',
  },
  'system_admin:idempotency_record': {
    role: 'system_admin', category: 'idempotency_record', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can diagnose idempotency records.',
  },
  'system_admin:rate_limit_record': {
    role: 'system_admin', category: 'rate_limit_record', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'System admin can diagnose rate limit records.',
  },
  'system_admin:safeguarding_metadata': {
    role: 'system_admin', category: 'safeguarding_metadata', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: true,
    scopeLimit: 'system_wide_safeguarding_review', notes: 'System admin can review safeguarding metadata.',
  },
  'system_admin:deen_sensitive_metadata': {
    role: 'system_admin', category: 'deen_sensitive_metadata', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: true,
    scopeLimit: 'system_wide_safeguarding_review', notes: 'System admin can review Deen-sensitive metadata.',
  },
  'safeguarding_officer:safeguarding_metadata': {
    role: 'safeguarding_officer', category: 'safeguarding_metadata', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: true, canSafeguardingReview: true,
    scopeLimit: 'safeguarding_scoped', notes: 'Safeguarding officer can review safeguarding metadata within scope.',
  },
  'safeguarding_officer:conversation_message': {
    role: 'safeguarding_officer', category: 'conversation_message', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: true,
    scopeLimit: 'safeguarding_scoped', notes: 'Safeguarding officer can read conversation messages for serious-risk review.',
  },
  'safeguarding_officer:conversation_archive': {
    role: 'safeguarding_officer', category: 'conversation_archive', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: false, canSafeguardingReview: true,
    scopeLimit: 'safeguarding_scoped', notes: 'Safeguarding officer can read conversation archives for serious-risk review.',
  },
  'safeguarding_officer:deen_sensitive_metadata': {
    role: 'safeguarding_officer', category: 'deen_sensitive_metadata', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: false, canAudit: true, canSafeguardingReview: true,
    scopeLimit: 'safeguarding_scoped', notes: 'Safeguarding officer can review Deen-sensitive metadata.',
  },
  'internal_operator:audit_event': {
    role: 'internal_operator', category: 'audit_event', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'Internal operator can audit events.',
  },
  'internal_operator:operational_telemetry': {
    role: 'internal_operator', category: 'operational_telemetry', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'Internal operator can diagnose telemetry.',
  },
  'internal_operator:rate_limit_record': {
    role: 'internal_operator', category: 'rate_limit_record', canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    canExport: false, canDiagnose: true, canAudit: true, canSafeguardingReview: false,
    scopeLimit: 'system_wide', notes: 'Internal operator can diagnose rate limit records.',
  },
};

export class RoleAccessMatrixService {
  private getKey(role: TutorRole, category: DataCategory): MatrixKey {
    return `${role}:${category}` as MatrixKey;
  }

  getEntry(role: TutorRole, category: DataCategory): RoleAccessMatrixEntry | null {
    const entry = ACCESS_MATRIX[this.getKey(role, category)];
    return entry ? { ...entry } : null;
  }

  hasAccess(request: RoleAccessRequest): RoleAccessDecision {
    const reasons: string[] = [];

    if (request.role === 'unknown') {
      return {
        allowed: false,
        role: 'unknown',
        action: request.requestedAction,
        resourceCategory: request.resourceCategory,
        scope: 'denied',
        redactionRequired: true,
        reasonCodes: ['unknown-role-denied'],
        privacyMetadata: { failClosed: true },
      };
    }

    if (!request.schoolId || request.schoolId === '') {
      return {
        allowed: false,
        role: request.role,
        action: request.requestedAction,
        resourceCategory: request.resourceCategory,
        scope: 'denied',
        redactionRequired: true,
        reasonCodes: ['missing-school-context-denied'],
        privacyMetadata: { failClosed: true },
      };
    }

    const entry = this.getEntry(request.role, request.resourceCategory);
    if (!entry) {
      return {
        allowed: false,
        role: request.role,
        action: request.requestedAction,
        resourceCategory: request.resourceCategory,
        scope: 'denied',
        redactionRequired: true,
        reasonCodes: [`no-matrix-entry:${request.role}:${request.resourceCategory}`],
        privacyMetadata: { failClosed: true },
      };
    }

    const actionField = this.getActionField(entry, request.requestedAction);
    if (!actionField) {
      return {
        allowed: false,
        role: request.role,
        action: request.requestedAction,
        resourceCategory: request.resourceCategory,
        scope: 'denied',
        redactionRequired: true,
        reasonCodes: [`action-not-allowed:${request.requestedAction}`],
        privacyMetadata: { failClosed: true },
      };
    }

    if (request.safeguardingRestricted && !entry.canSafeguardingReview) {
      reasons.push('safeguarding-restricted-access-denied');
    }
    if (request.deenSensitive && !entry.canSafeguardingReview) {
      reasons.push('deen-sensitive-access-denied');
    }
    if (!request.teacherVisible && request.role === 'teacher') {
      reasons.push('teacher-not-visible');
    }
    if (!request.adminVisible && (request.role === 'school_admin' || request.role === 'system_admin') && !entry.canSafeguardingReview) {
      reasons.push('admin-not-visible');
    }

    if (reasons.length > 0) {
      return {
        allowed: false,
        role: request.role,
        action: request.requestedAction,
        resourceCategory: request.resourceCategory,
        scope: 'denied',
        redactionRequired: true,
        reasonCodes: reasons,
        privacyMetadata: { failClosed: true },
      };
    }

    const redactionRequired = request.requestedAction === 'read' && (
      request.resourceCategory === 'conversation_message' ||
      request.resourceCategory === 'conversation_archive' ||
      request.resourceCategory === 'ai_prompt_metadata' ||
      request.resourceCategory === 'provider_response_metadata'
    );

    return {
      allowed: true,
      role: request.role,
      action: request.requestedAction,
      resourceCategory: request.resourceCategory,
      scope: entry.scopeLimit,
      redactionRequired,
      reasonCodes: ['access-allowed'],
      privacyMetadata: { matrixEntry: entry.scopeLimit },
    };
  }

  getAllRoles(): TutorRole[] {
    return ['learner', 'teacher', 'school_admin', 'safeguarding_officer', 'system_admin', 'internal_operator'];
  }

  getAllEntries(): RoleAccessMatrixEntry[] {
    return Object.values(ACCESS_MATRIX).map(e => ({ ...e }));
  }

  getEntriesForRole(role: TutorRole): RoleAccessMatrixEntry[] {
    return this.getAllEntries().filter(e => e.role === role);
  }

  private getActionField(entry: RoleAccessMatrixEntry, action: AccessAction): boolean {
    switch (action) {
      case 'read': return entry.canRead;
      case 'write': return entry.canWrite;
      case 'update': return entry.canUpdate;
      case 'delete': return entry.canDelete;
      case 'export': return entry.canExport;
      case 'diagnose': return entry.canDiagnose;
      case 'audit': return entry.canAudit;
      case 'safeguarding_review': return entry.canSafeguardingReview;
      default: return false;
    }
  }

  isSchoolScoped(role: TutorRole, scope: string): boolean {
    return scope === 'school_scoped' || scope === 'class_scoped';
  }
}

export const roleAccessMatrixService = new RoleAccessMatrixService();
