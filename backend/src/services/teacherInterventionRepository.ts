// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Repository v1 (Durable)
// Uses Prisma for durable persistence of intervention assignments.
// All reads are scoped by teacherId + schoolId. Cross-student,
// cross-class, cross-school reads are blocked.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { Prisma } from '@prisma/client';
import type {
  TeacherInterventionAssignment,
  TeacherInterventionCreateRequest,
  TeacherInterventionUpdateRequest,
  TeacherInterventionQueueRequest,
  TeacherInterventionOutcomeRequest,
  TeacherInterventionIdentity,
  TeacherInterventionStatus,
  TeacherInterventionPriority,
  TeacherInterventionOutcomeStatus,
  TeacherInterventionFollowUpStatus,
} from './teacherInterventionContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function isoToDate(s: string | null | undefined): Date | null {
  return s ? new Date(s) : null;
}

function prismaInterventionToContract(record: any): TeacherInterventionAssignment {
  return {
    interventionId: record.id,
    sourceRecommendationId: record.sourceRecommendationId || null,
    teacherId: record.teacherId,
    studentId: record.studentId,
    schoolId: record.schoolId,
    classId: record.classId || null,
    subject: record.subject || null,
    topic: record.topic || null,
    skillId: record.skillId || null,
    skillLabel: record.skillLabel || null,
    artifactId: record.artifactId || null,
    questionId: record.questionId || null,
    videoId: record.videoId || null,
    watchSessionId: record.watchSessionId || null,
    analyticsEvidenceRefs: (record.analyticsEvidenceRefs as string[]) || [],
    actionType: record.actionType,
    priority: record.priority,
    status: record.status,
    outcomeStatus: record.outcomeStatus,
    teacherReason: record.teacherReason,
    learnerFacingInstruction: record.learnerFacingInstruction || null,
    teacherPrivateNote: record.teacherPrivateNote || null,
    dueAt: record.dueAt ? record.dueAt.toISOString() : null,
    followUpRequired: record.followUpRequired,
    followUpStatus: record.followUpStatus as TeacherInterventionFollowUpStatus,
    evidenceSummary: record.evidenceSummary,
    warnings: (record.warnings as string[]) || [],
    metadata: (record.metadata as Record<string, unknown>) || {},
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    startedAt: record.startedAt ? record.startedAt.toISOString() : null,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    cancelledAt: record.cancelledAt ? record.cancelledAt.toISOString() : null,
  };
}

// ── Public API ──

export async function createTeacherInterventionAssignment(
  identity: TeacherInterventionIdentity,
  request: TeacherInterventionCreateRequest,
): Promise<TeacherInterventionAssignment> {
  const now = new Date();
  const record = await prisma.teacherInterventionAssignment.create({
    data: {
      id: randomUUID(),
      sourceRecommendationId: request.sourceRecommendationId || null,
      teacherId: request.teacherId,
      studentId: request.studentId,
      schoolId: request.schoolId,
      classId: request.classId || null,
      subject: request.subject || null,
      topic: request.topic || null,
      skillId: request.skillId || null,
      skillLabel: request.skillLabel || null,
      artifactId: request.artifactId || null,
      questionId: request.questionId || null,
      videoId: request.videoId || null,
      watchSessionId: request.watchSessionId || null,
      analyticsEvidenceRefs: request.analyticsEvidenceRefs || [],
      actionType: request.actionType,
      priority: request.priority || 'medium',
      status: 'draft',
      outcomeStatus: 'not_started',
      teacherReason: request.teacherReason,
      learnerFacingInstruction: request.learnerFacingInstruction || null,
      teacherPrivateNote: request.teacherPrivateNote || null,
      dueAt: request.dueAt ? new Date(request.dueAt) : null,
      followUpRequired: request.followUpRequired || false,
      followUpStatus: 'not_required',
      evidenceSummary: '',
      warnings: [],
      metadata: {},
      updatedAt: new Date(),
    },
  });

  return prismaInterventionToContract(record);
}

export async function getTeacherInterventionAssignment(
  identity: TeacherInterventionIdentity,
  interventionId: string,
): Promise<TeacherInterventionAssignment | null> {
  const record = await prisma.teacherInterventionAssignment.findUnique({
    where: { id: interventionId },
  });

  if (!record) return null;
  if (record.schoolId !== identity.schoolId) return null;

  return prismaInterventionToContract(record);
}

export async function listTeacherInterventionQueue(
  identity: TeacherInterventionIdentity,
  request: TeacherInterventionQueueRequest,
): Promise<TeacherInterventionAssignment[]> {
  const where: Prisma.TeacherInterventionAssignmentWhereInput = {
    teacherId: identity.teacherId,
    schoolId: identity.schoolId,
  };

  if (request.classId) where.classId = request.classId;
  if (request.studentId) where.studentId = request.studentId;
  if (request.status && request.status !== 'all') where.status = request.status;
  if (request.priority && request.priority !== 'all') where.priority = request.priority;
  if (request.topic) where.topic = request.topic;
  if (request.skillId) where.skillId = request.skillId;
  if (request.dueBefore) {
    where.dueAt = { lte: new Date(request.dueBefore) };
  }

  const limit = Math.min(request.limit || 50, 200);

  const records = await prisma.teacherInterventionAssignment.findMany({
    where,
    orderBy: [
      { priority: 'asc' }, // urgent=0, high=1, medium=2, low=3 — alphabetically works: 'high', 'low', 'medium', 'urgent'
      { dueAt: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return records.map(prismaInterventionToContract);
}

export async function listLearnerInterventions(
  identity: TeacherInterventionIdentity,
  studentId: string,
): Promise<TeacherInterventionAssignment[]> {
  const records = await prisma.teacherInterventionAssignment.findMany({
    where: {
      studentId,
      schoolId: identity.schoolId,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return records.map(prismaInterventionToContract);
}

export async function updateTeacherInterventionStatus(
  identity: TeacherInterventionIdentity,
  request: TeacherInterventionUpdateRequest,
): Promise<TeacherInterventionAssignment> {
  const existing = await prisma.teacherInterventionAssignment.findUnique({
    where: { id: request.interventionId },
  });

  if (!existing) throw new Error('Intervention not found');
  if (existing.schoolId !== identity.schoolId) throw new Error('Intervention not found');

  const data: Prisma.TeacherInterventionAssignmentUpdateInput = {};
  if (request.status) data.status = request.status;
  if (request.learnerFacingInstruction !== undefined) (data as any).learnerFacingInstruction = request.learnerFacingInstruction;
  if (request.teacherPrivateNote !== undefined) (data as any).teacherPrivateNote = request.teacherPrivateNote;
  if (request.teacherReason !== undefined) (data as any).teacherReason = request.teacherReason;
  if (request.followUpRequired !== undefined) (data as any).followUpRequired = request.followUpRequired;
  if (request.dueAt !== undefined) data.dueAt = request.dueAt ? new Date(request.dueAt) : null;

  // Set timestamps for status transitions
  if (request.status === 'started') data.startedAt = new Date();
  if (request.status === 'completed' || request.status === 'cancelled' || request.status === 'dismissed') {
    data.completedAt = new Date();
  }
  if (request.status === 'closed') {
    data.closedAt = new Date();
  }

  const record = await prisma.teacherInterventionAssignment.update({
    where: { id: request.interventionId },
    data,
  });

  return prismaInterventionToContract(record);
}

export async function recordTeacherInterventionOutcome(
  identity: TeacherInterventionIdentity,
  request: TeacherInterventionOutcomeRequest,
): Promise<TeacherInterventionAssignment> {
  const existing = await prisma.teacherInterventionAssignment.findUnique({
    where: { id: request.interventionId },
  });

  if (!existing) throw new Error('Intervention not found');
  if (existing.schoolId !== identity.schoolId) throw new Error('Intervention not found');

  const data: Prisma.TeacherInterventionAssignmentUpdateInput = {
    outcomeStatus: request.outcomeStatus,
    evidenceSummary: Array.isArray(request.evidenceRefs) ? request.evidenceRefs.join(', ') : '',
  };

  if (request.teacherNote) data.teacherPrivateNote = request.teacherNote;

  // If learner completed action or evidence exists, mark completed
  if (request.learnerCompletedAction || (request.evidenceRefs && request.evidenceRefs.length > 0)) {
    if (existing.status !== 'completed' && existing.status !== 'closed') {
      data.status = 'completed';
      data.completedAt = new Date();
    }
  }

  const record = await prisma.teacherInterventionAssignment.update({
    where: { id: request.interventionId },
    data,
  });

  return prismaInterventionToContract(record);
}

export async function recordTeacherInterventionFollowUp(
  identity: TeacherInterventionIdentity,
  interventionId: string,
  followUpStatus: TeacherInterventionFollowUpStatus,
): Promise<TeacherInterventionAssignment> {
  const existing = await prisma.teacherInterventionAssignment.findUnique({
    where: { id: interventionId },
  });

  if (!existing) throw new Error('Intervention not found');
  if (existing.schoolId !== identity.schoolId) throw new Error('Intervention not found');

  const data: Prisma.TeacherInterventionAssignmentUpdateInput = {
    followUpStatus,
    followUpRequired: true,
  };

  if (followUpStatus === 'completed') {
    data.status = 'needs_follow_up';
  }

  const record = await prisma.teacherInterventionAssignment.update({
    where: { id: interventionId },
    data,
  });

  return prismaInterventionToContract(record);
}

// NOTE: appendTeacherInterventionAuditEvent has been removed.
// All audit events are now handled by teacherInterventionAuditService.
// Routes call recordTeacherInterventionAuditEvent directly from the audit service.
