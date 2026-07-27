// Curriculum Knowledge Graph — Role Policy Service

import type { ActorRole, CurriculumGraphError } from '../contracts/CurriculumGraphContracts';
import { CurriculumGraphErrorCodes } from '../contracts/CurriculumGraphContracts';

export type RoleAction =
  | 'create_version'
  | 'create_successor'
  | 'edit_draft'
  | 'remove_draft_node'
  | 'remove_draft_edge'
  | 'submit_for_review'
  | 'return_to_draft'
  | 'approve'
  | 'activate'
  | 'supersede'
  | 'archive'
  | 'read_active_student_safe'
  | 'read_draft_staff_safe'
  | 'read_staff_safe'
  | 'validate'
  | 'run_impact_analysis'
  | 'seed';

const rolePermissions: Record<ActorRole, Set<RoleAction>> = {
  student: new Set([
    'read_active_student_safe',
  ]),
  teacher: new Set([
    'create_version',
    'create_successor',
    'edit_draft',
    'remove_draft_node',
    'remove_draft_edge',
    'submit_for_review',
    'read_active_student_safe',
    'read_draft_staff_safe',
    'read_staff_safe',
    'validate',
    'run_impact_analysis',
  ]),
  school_admin: new Set([
    'create_version',
    'create_successor',
    'edit_draft',
    'remove_draft_node',
    'remove_draft_edge',
    'submit_for_review',
    'return_to_draft',
    'approve',
    'activate',
    'supersede',
    'archive',
    'read_active_student_safe',
    'read_draft_staff_safe',
    'read_staff_safe',
    'validate',
    'run_impact_analysis',
  ]),
  internal_operator: new Set([
    'create_version',
    'create_successor',
    'edit_draft',
    'remove_draft_node',
    'remove_draft_edge',
    'submit_for_review',
    'return_to_draft',
    'approve',
    'activate',
    'supersede',
    'archive',
    'read_active_student_safe',
    'read_draft_staff_safe',
    'read_staff_safe',
    'validate',
    'run_impact_analysis',
    'seed',
  ]),
  parent: new Set([]),
  unknown: new Set([]),
};

export class CurriculumGraphRolePolicyService {
  private contextErrors: CurriculumGraphError[] = [];

  isActionAllowed(role: ActorRole, action: RoleAction): boolean {
    return rolePermissions[role]?.has(action) ?? false;
  }

  enforceAction(role: ActorRole, action: RoleAction, requestId: string, correlationId: string): CurriculumGraphError | null {
    if (role === 'parent' || role === 'unknown') {
      return {
        code: CurriculumGraphErrorCodes.ROLE_FORBIDDEN,
        studentSafeMessage: 'You do not have permission to perform this action.',
        internalMessage: `Role ${role} is denied all curriculum graph actions.`,
        requestId,
        correlationId,
        retryable: false,
        reasonCodes: ['role_forbidden'],
      };
    }
    if (!this.isActionAllowed(role, action)) {
      return {
        code: CurriculumGraphErrorCodes.ROLE_FORBIDDEN,
        studentSafeMessage: 'You do not have permission to perform this action.',
        internalMessage: `Role ${role} is not allowed to perform ${action}.`,
        requestId,
        correlationId,
        retryable: false,
        reasonCodes: ['role_forbidden', `denied_${action}`],
      };
    }
    return null;
  }
}
