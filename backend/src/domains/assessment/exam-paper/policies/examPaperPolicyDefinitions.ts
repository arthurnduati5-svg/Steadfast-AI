export const EXAM_PAPER_POLICY_FAMILIES = {
  EXAM_PAPER_ASSEMBLY: 'EXAM_PAPER_ASSEMBLY',
  EXAM_PAPER_VERSIONING: 'EXAM_PAPER_VERSIONING',
  EXAM_PAPER_VARIANT_PLANNING: 'EXAM_PAPER_VARIANT_PLANNING',
  EXAM_PAPER_ACCESS_POLICY: 'EXAM_PAPER_ACCESS_POLICY',
  EXAM_PAPER_APPROVAL: 'EXAM_PAPER_APPROVAL',
  EXAM_PAPER_DELIVERY_BRIDGE: 'EXAM_PAPER_DELIVERY_BRIDGE',
  EXAM_PAPER_PROJECTION: 'EXAM_PAPER_PROJECTION',
} as const;

export type ExamPaperPolicyFamily = typeof EXAM_PAPER_POLICY_FAMILIES[keyof typeof EXAM_PAPER_POLICY_FAMILIES];

export interface ExamPaperPolicyDefinition {
  family: ExamPaperPolicyFamily;
  configured: boolean;
  allowedRoles: string[];
  failClosedBlockMessage: string;
  failClosedReasonCode: string;
}

export const EXAM_PAPER_POLICY_DEFAULTS: Record<ExamPaperPolicyFamily, ExamPaperPolicyDefinition> = {
  EXAM_PAPER_ASSEMBLY: {
    family: 'EXAM_PAPER_ASSEMBLY',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_ASSEMBLY policy blocks assembly',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_ASSEMBLY_POLICY',
  },
  EXAM_PAPER_VERSIONING: {
    family: 'EXAM_PAPER_VERSIONING',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_VERSIONING policy blocks version creation',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_VERSIONING_POLICY',
  },
  EXAM_PAPER_VARIANT_PLANNING: {
    family: 'EXAM_PAPER_VARIANT_PLANNING',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_VARIANT_PLANNING policy blocks variants',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_VARIANT_PLANNING_POLICY',
  },
  EXAM_PAPER_ACCESS_POLICY: {
    family: 'EXAM_PAPER_ACCESS_POLICY',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_ACCESS_POLICY policy blocks delivery_ready status',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_ACCESS_POLICY',
  },
  EXAM_PAPER_APPROVAL: {
    family: 'EXAM_PAPER_APPROVAL',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_APPROVAL policy blocks approval',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_APPROVAL_POLICY',
  },
  EXAM_PAPER_DELIVERY_BRIDGE: {
    family: 'EXAM_PAPER_DELIVERY_BRIDGE',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_DELIVERY_BRIDGE policy: allow draft bridge only, block delivery_ready',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_DELIVERY_BRIDGE_POLICY',
  },
  EXAM_PAPER_PROJECTION: {
    family: 'EXAM_PAPER_PROJECTION',
    configured: true,
    allowedRoles: ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'],
    failClosedBlockMessage: 'Missing EXAM_PAPER_PROJECTION policy returns minimal safe projection only',
    failClosedReasonCode: 'MISSING_EXAM_PAPER_PROJECTION_POLICY',
  },
};

export function isRoleAllowedForPolicy(family: ExamPaperPolicyFamily, role: string): boolean {
  const def = EXAM_PAPER_POLICY_DEFAULTS[family];
  if (!def) return false;
  return def.allowedRoles.includes(role);
}

export function getBlockedRolesForPolicy(): string[] {
  return ['student', 'parent', 'guest', 'unknown'];
}
