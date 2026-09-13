import type {
  Task021ParentLearnerLink,
  Task021ParentLinkStatus,
} from '../contracts/task021SchoolIntegrationContracts';

export interface ParentLearnerLinkDecision {
  allowed: boolean;
  linkId?: string;
  parentId: string;
  learnerId: string;
  schoolId: string;
  status: Task021ParentLinkStatus;
  reasonCodes: string[];
}

export function upsertParentLearnerLink(
  link: Task021ParentLearnerLink,
): Task021ParentLearnerLink {
  return link;
}

export function verifyParentCanAccessLearner(
  parentId: string,
  learnerId: string,
  schoolId: string,
  link: Task021ParentLearnerLink | undefined,
): ParentLearnerLinkDecision {
  if (!link) {
    return {
      allowed: false,
      parentId,
      learnerId,
      schoolId,
      status: 'inactive',
      reasonCodes: ['parent_learner_link_not_found', 'parent_link_required'],
    };
  }

  if (link.schoolId !== schoolId) {
    return {
      allowed: false,
      linkId: link.linkId,
      parentId,
      learnerId,
      schoolId,
      status: link.status,
      reasonCodes: ['cross_school_parent_access_denied', `expected_school:${schoolId}`],
    };
  }

  if (link.status !== 'active') {
    return {
      allowed: false,
      linkId: link.linkId,
      parentId,
      learnerId,
      schoolId,
      status: link.status,
      reasonCodes: [`inactive_parent_link:${link.status}`, 'parent_link_must_be_active'],
    };
  }

  return {
    allowed: true,
    linkId: link.linkId,
    parentId,
    learnerId,
    schoolId,
    status: 'active',
    reasonCodes: ['parent_learner_link_verified'],
  };
}

export function denyUnlinkedParentAccess(
  parentId: string,
  learnerId: string,
  schoolId: string,
): ParentLearnerLinkDecision {
  return {
    allowed: false,
    parentId,
    learnerId,
    schoolId,
    status: 'inactive',
    reasonCodes: ['parent_not_linked_to_learner', 'parent_link_required'],
  };
}

export function denyCrossSchoolParentAccess(
  parentId: string,
  learnerId: string,
): ParentLearnerLinkDecision {
  return {
    allowed: false,
    parentId,
    learnerId,
    schoolId: 'cross_school',
    status: 'cross_school_rejected',
    reasonCodes: ['cross_school_parent_access_denied', 'parent_link_must_match_school'],
  };
}

export function denyInactiveParentLearnerLink(
  link: Task021ParentLearnerLink,
): ParentLearnerLinkDecision {
  return {
    allowed: false,
    linkId: link.linkId,
    parentId: link.parentId,
    learnerId: link.learnerId,
    schoolId: link.schoolId,
    status: link.status,
    reasonCodes: [`inactive_parent_link:${link.status}`, 'parent_link_must_be_active'],
  };
}

export function buildParentLearnerLinkDecision(
  link: Task021ParentLearnerLink | undefined,
  parentId: string,
  learnerId: string,
  schoolId: string,
): ParentLearnerLinkDecision {
  return verifyParentCanAccessLearner(parentId, learnerId, schoolId, link);
}
