import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type {
  Task028ExpandedLearnerAccessGateResult,
  Task028ExpandedLearnerAccessGateInput,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ExpandedLearnerAccessGateInput,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

export async function evaluateExpandedLearnerAccess(
  input: Task028ExpandedLearnerAccessGateInput,
): Promise<Task028ExpandedLearnerAccessGateResult> {
  const errors = validateTask028ExpandedLearnerAccessGateInput(input);
  if (errors.length > 0) {
    return {
      allowed: false,
      status: 'denied_general',
      reasonCodes: errors,
      safeMessage: 'Invalid learner access request.',
    };
  }

  const { schoolId, learnerId, runId, curriculumScopeId, requestType } = input;

  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    return {
      allowed: false,
      status: 'denied_run_not_active',
      reasonCodes: ['execution_run_not_found'],
      safeMessage: 'Execution run not found.',
    };
  }

  const runAny = run as any;
  if (runAny.schoolId !== schoolId) {
    return {
      allowed: false,
      status: 'denied_school_context',
      reasonCodes: ['school_mismatch'],
      safeMessage: 'Learner school does not match execution run school.',
    };
  }

  if (runAny.status === 'blocked' || runAny.status === 'cancelled' || runAny.status === 'rolled_back') {
    return {
      allowed: false,
      status: 'denied_run_not_active',
      reasonCodes: ['run_not_active', `status_${runAny.status}`],
      safeMessage: 'Execution run is not active.',
    };
  }

  if (runAny.status === 'paused' || runAny.status === 'intervention_required') {
    return {
      allowed: false,
      status: 'denied_run_paused',
      reasonCodes: ['run_paused', `status_${runAny.status}`],
      safeMessage: 'Execution run is paused. Access denied.',
    };
  }

  const participant = await task028ExpansionExecutionRepository.getExpandedParticipantByHash(runId, learnerId);
  if (!participant) {
    return {
      allowed: false,
      status: 'denied_not_in_cohort',
      reasonCodes: ['learner_not_in_cohort'],
      safeMessage: 'Learner is not in the expanded cohort.',
    };
  }

  const partAny = participant as any;
  if (partAny.activationStatus !== 'active') {
    return {
      allowed: false,
      status: 'denied_not_in_cohort',
      reasonCodes: [`learner_status_${partAny.activationStatus}`],
      safeMessage: 'Learner is not active in the expanded cohort.',
    };
  }

  if (curriculumScopeId) {
    const curriculumScopes: string[] = partAny.curriculumScopes ?? [];
    if (!curriculumScopes.includes(curriculumScopeId)) {
      return {
        allowed: false,
        status: 'denied_curriculum_scope',
        reasonCodes: ['curriculum_scope_not_allowed'],
        safeMessage: 'Learner does not have access to the requested curriculum scope.',
      };
    }
  }

  if (requestType === 'teacher_only_content' || requestType === 'answer_key_request') {
    return {
      allowed: false,
      status: requestType === 'answer_key_request' ? 'denied_answer_key_request' : 'denied_teacher_only_content',
      reasonCodes: ['request_type_not_permitted'],
      safeMessage: 'Request type not permitted for learner.',
    };
  }

  return {
    allowed: true,
    status: 'allowed',
    reasonCodes: [],
    safeMessage: 'Expanded learner access granted.',
  };
}
