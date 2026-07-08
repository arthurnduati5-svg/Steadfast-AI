import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

export async function applyCohortExpansion(expansionProposalId: string, actorRole: string, actorIdHash?: string): Promise<{
  ok: boolean;
  cohortChangeId?: string;
  addedStudentCount: number;
  addedTeacherCount: number;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const proposal = await task027PilotExpansionRepository.getProposal(expansionProposalId);
  if (!proposal) {
    return { ok: false, addedStudentCount: 0, addedTeacherCount: 0, blockingIssues: ['proposal_not_found'], safeMessage: 'Proposal not found.' };
  }

  const prop = proposal as any;

  if (prop.status !== 'approved') {
    return { ok: false, addedStudentCount: 0, addedTeacherCount: 0, blockingIssues: ['proposal_not_approved'], safeMessage: 'Proposal must be approved before cohort change.' };
  }

  const approval = await task027PilotExpansionRepository.getApprovalByProposalId(expansionProposalId);
  if (!approval) {
    return { ok: false, addedStudentCount: 0, addedTeacherCount: 0, blockingIssues: ['approval_not_found'], safeMessage: 'Approval not found.' };
  }

  if ((approval as any).approvalStatus !== 'approved') {
    return { ok: false, addedStudentCount: 0, addedTeacherCount: 0, blockingIssues: ['not_approved'], safeMessage: 'Approval status is not approved.' };
  }

  const blockingIssues: string[] = [];

  const addedStudentCount = prop.requestedStudentIncrease ?? 0;
  const addedTeacherCount = prop.requestedTeacherIncrease ?? 0;
  const addedClassIds = prop.requestedClassIds ?? [];
  const addedSubjectIds = prop.requestedSubjectIds ?? [];

  if (addedStudentCount <= 0 && addedTeacherCount <= 0) {
    blockingIssues.push('No students or teachers to add.');
  }

  if (addedClassIds.length === 0) {
    blockingIssues.push('No classes specified for cohort change.');
  }

  const previousCohortSnapshot: Record<string, unknown> = {
    studentCount: 0,
    teacherCount: 0,
    classes: [],
    subjects: [],
    recordedAt: new Date().toISOString(),
  };

  const newCohortSnapshot: Record<string, unknown> = {
    studentCount: addedStudentCount,
    teacherCount: addedTeacherCount,
    addedClasses: addedClassIds,
    addedSubjects: addedSubjectIds,
    appliedAt: new Date().toISOString(),
  };

  const rollbackPlan: Record<string, unknown> = {
    canRollback: true,
    rollbackSteps: [
      'Remove added students from pilot program',
      'Remove added teachers from pilot program',
      'Restore cohort to previous snapshot',
    ],
    previousSnapshotRef: previousCohortSnapshot,
    requiresAdminApproval: true,
    createdAt: new Date().toISOString(),
  };

  const uniqueBlocking = [...new Set(blockingIssues)];

  if (uniqueBlocking.length > 0) {
    const change = await task027PilotExpansionRepository.createCohortChange({
      expansionProposalId,
      pilotProgramId: prop.pilotProgramId,
      schoolId: prop.schoolId,
      changeStatus: 'failed',
      previousCohortSnapshot,
      newCohortSnapshot,
      addedStudentCount,
      addedTeacherCount,
      addedClassIds,
      addedSubjectIds,
      safeSummary: `Cohort change failed: ${uniqueBlocking.length} blocking issues.`,
      rollbackPlan,
    });

    await task027PilotExpansionRepository.createAuditRecord({
      expansionProposalId,
      pilotProgramId: prop.pilotProgramId,
      schoolId: prop.schoolId,
      actorRole,
      actorIdHash,
      action: 'cohort_expansion_failed',
      safeSummary: `Cohort expansion failed: ${uniqueBlocking.join('; ')}`,
    });

    return { ok: false, cohortChangeId: (change as any).id, addedStudentCount, addedTeacherCount, blockingIssues: uniqueBlocking, safeMessage: 'Cohort change blocked.' };
  }

  const change = await task027PilotExpansionRepository.createCohortChange({
    expansionProposalId,
    pilotProgramId: prop.pilotProgramId,
    schoolId: prop.schoolId,
    changeStatus: 'applied',
    previousCohortSnapshot,
    newCohortSnapshot,
    addedStudentCount,
    addedTeacherCount,
    addedClassIds,
    addedSubjectIds,
    safeSummary: `Cohort expanded: +${addedStudentCount} students, +${addedTeacherCount} teachers, ${addedClassIds.length} classes.`,
    rollbackPlan,
  });

  await task027PilotExpansionRepository.updateProposal(expansionProposalId, { status: 'expanded' });

  await task027PilotExpansionRepository.createAuditRecord({
    expansionProposalId,
    pilotProgramId: prop.pilotProgramId,
    schoolId: prop.schoolId,
    actorRole,
    actorIdHash,
    action: 'cohort_expansion_applied',
    safeSummary: `Cohort expanded: +${addedStudentCount} students, +${addedTeacherCount} teachers.`,
  });

  return {
    ok: true,
    cohortChangeId: (change as any).id,
    addedStudentCount,
    addedTeacherCount,
    blockingIssues: [],
    safeMessage: `Cohort expansion applied: +${addedStudentCount} students, +${addedTeacherCount} teachers.`,
  };
}

export async function rollbackCohortExpansion(cohortChangeId: string, actorRole: string, actorIdHash?: string): Promise<{
  ok: boolean;
  safeMessage: string;
}> {
  const change = await task027PilotExpansionRepository.getCohortChange(cohortChangeId);
  if (!change) {
    return { ok: false, safeMessage: 'Cohort change not found.' };
  }

  const ch = change as any;

  if (ch.changeStatus !== 'applied') {
    return { ok: false, safeMessage: `Cannot rollback: status is ${ch.changeStatus}.` };
  }

  await task027PilotExpansionRepository.createCohortChange({
    expansionProposalId: ch.expansionProposalId,
    pilotProgramId: ch.pilotProgramId,
    schoolId: ch.schoolId,
    changeStatus: 'rolled_back',
    previousCohortSnapshot: ch.previousCohortSnapshot,
    newCohortSnapshot: ch.previousCohortSnapshot,
    addedStudentCount: 0,
    addedTeacherCount: 0,
    addedClassIds: [],
    addedSubjectIds: [],
    safeSummary: `Cohort rollback from change ${cohortChangeId}.`,
    rollbackPlan: ch.rollbackPlan,
  });

  await task027PilotExpansionRepository.createAuditRecord({
    expansionProposalId: ch.expansionProposalId,
    pilotProgramId: ch.pilotProgramId,
    schoolId: ch.schoolId,
    actorRole,
    actorIdHash,
    action: 'cohort_rollback_applied',
    safeSummary: `Cohort rolled back from ${cohortChangeId}.`,
  });

  return { ok: true, safeMessage: 'Cohort expansion rolled back to previous state.' };
}
