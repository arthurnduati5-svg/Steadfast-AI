export type PolicyFamilyName = string;

export interface PolicyDefinition {
  name: string;
  description: string;
  allowedRoles: string[];
  blockedRoles: string[];
  failClosed: boolean;
}

const ALLOWED_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const BLOCKED_ROLES = ['student', 'parent', 'guest', 'unknown'];

function definePolicy(name: string, description: string, overrides?: Partial<PolicyDefinition>): PolicyDefinition {
  return {
    name,
    description,
    allowedRoles: ALLOWED_ROLES,
    blockedRoles: BLOCKED_ROLES,
    failClosed: true,
    ...overrides,
  };
}

export const RECOVERY_EXECUTION_READINESS_BOARD_POLICIES: Record<PolicyFamilyName, PolicyDefinition> = {
  RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION',
    'Controls creation of readiness board snapshot records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION',
    'Controls creation of readiness board lane records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_CARD_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_CARD_CREATION',
    'Controls creation of readiness board card records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_FILTER_PRESET_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_FILTER_PRESET_CREATION',
    'Controls creation of readiness board filter preset records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION',
    'Controls creation of readiness board risk signal records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION',
    'Controls creation of readiness board blocker records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_GOVERNANCE_NOTE_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_GOVERNANCE_NOTE_CREATION',
    'Controls creation of readiness board governance note records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION',
    'Controls creation of readiness board role projection records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_TEACHER_QUEUE_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_TEACHER_QUEUE_CREATION',
    'Controls creation of readiness board teacher queue records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_ADMIN_QUEUE_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_ADMIN_QUEUE_CREATION',
    'Controls creation of readiness board admin queue records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_STUDENT_SAFE_STATUS_DRAFT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_STUDENT_SAFE_STATUS_DRAFT_CREATION',
    'Controls creation of readiness board student safe status draft records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_PARENT_SAFE_STATUS_DRAFT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_PARENT_SAFE_STATUS_DRAFT_CREATION',
    'Controls creation of readiness board parent safe status draft records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_REFRESH_JOB_CREATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_REFRESH_JOB_CREATION',
    'Controls creation of readiness board refresh job records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_SUMMARY_MUTATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_SUMMARY_MUTATION',
    'Controls mutation of readiness board summary records',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_AUDIT: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_AUDIT',
    'Controls creation of readiness board audit events',
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_BOARD_ACTION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_BOARD_ACTION',
    'Blocks live board action operations',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_AUTHORIZATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_AUTHORIZATION',
    'Blocks live authorization operations from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_EXECUTION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_EXECUTION',
    'Blocks live recovery execution from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_CLOSURE: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_CLOSURE',
    'Blocks live recovery closure from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ACTIVATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ACTIVATION',
    'Blocks live recovery activation from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_COMPLETION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_COMPLETION',
    'Blocks live recovery completion from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ASSIGNMENT: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ASSIGNMENT',
    'Blocks live assignment from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_NOTIFICATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_NOTIFICATION',
    'Blocks live notification dispatch from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_PORTAL_PUBLISH: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_PORTAL_PUBLISH',
    'Blocks portal publishing from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_SCORE_MUTATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_SCORE_MUTATION',
    'Blocks score mutation from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_MASTERY_MUTATION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_MASTERY_MUTATION',
    'Blocks mastery mutation from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_REGRADE_EXECUTION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_REGRADE_EXECUTION',
    'Blocks regrade execution from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_GENERATED_QUESTION: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_GENERATED_QUESTION',
    'Blocks generated question creation from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_AI_NARRATIVE: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_AI_NARRATIVE',
    'Blocks AI narrative generation from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_OCR: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_OCR',
    'Blocks OCR operations from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_PDF: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_PDF',
    'Blocks PDF generation from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
  RECOVERY_EXECUTION_READINESS_BOARD_NO_EXTERNAL_SYNC: definePolicy(
    'RECOVERY_EXECUTION_READINESS_BOARD_NO_EXTERNAL_SYNC',
    'Blocks external sync from the board',
    { allowedRoles: [], blockedRoles: ALLOWED_ROLES.concat(BLOCKED_ROLES) },
  ),
};
