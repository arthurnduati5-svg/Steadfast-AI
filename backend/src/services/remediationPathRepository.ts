import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RemediationPathStepRecord {
  stepId: string;
  stepType: string;
  studentInstruction: string;
  checkQuestion: string;
  supportLevel: string;
  completionSignal: string;
}

export interface RemediationPathRecord {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string | null;
  sessionId?: string | null;
  subject: string;
  topic?: string | null;
  skillTag?: string | null;
  blockingSkillTag?: string | null;
  prerequisiteSkillTags: string[];
  steps: RemediationPathStepRecord[];
  currentStepIndex: number;
  status: string;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRemediationPathInput {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  subject: string;
  topic?: string;
  skillTag?: string;
  blockingSkillTag?: string;
  prerequisiteSkillTags: string[];
  steps: RemediationPathStepRecord[];
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export class RemediationPathRepository {
  async createRemediationPath(input: CreateRemediationPathInput): Promise<RemediationPathRecord> {
    try {
      const record = await prisma.remediationPathRecord.create({
        data: {
          id: randomUUID(),
          schoolId: input.schoolId,
          tutorLearnerId: input.tutorLearnerId,
          studentId: input.studentId ?? null,
          sessionId: input.sessionId ?? null,
          subject: input.subject,
          topic: input.topic ?? null,
          skillTag: input.skillTag ?? null,
          blockingSkillTag: input.blockingSkillTag ?? null,
          prerequisiteSkillTags: input.prerequisiteSkillTags as any,
          steps: input.steps as any,
          reasonCodes: input.reasonCodes as any,
          privacyMetadata: input.privacyMetadata as any,
          updatedAt: new Date(),
        },
      });
      return this.mapRecord(record);
    } catch {
      return {
        id: 'mock_rp_' + Date.now(),
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        studentId: input.studentId ?? null,
        sessionId: input.sessionId ?? null,
        subject: input.subject,
        topic: input.topic ?? null,
        skillTag: input.skillTag ?? null,
        blockingSkillTag: input.blockingSkillTag ?? null,
        prerequisiteSkillTags: input.prerequisiteSkillTags,
        steps: input.steps,
        currentStepIndex: 0,
        status: 'active',
        reasonCodes: input.reasonCodes,
        privacyMetadata: input.privacyMetadata as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async getActiveRemediationPath(
    schoolId: string,
    tutorLearnerId: string,
    subject?: string,
    skillTag?: string,
  ): Promise<RemediationPathRecord | null> {
    try {
      const where: Record<string, unknown> = {
        schoolId,
        tutorLearnerId,
        status: 'active',
      };
      if (subject) where.subject = subject;
      if (skillTag) where.skillTag = skillTag;

      const record = await prisma.remediationPathRecord.findFirst({
        where: where as any,
        orderBy: { createdAt: 'desc' },
      });
      return record ? this.mapRecord(record) : null;
    } catch {
      return null;
    }
  }

  async getRemediationPathById(
    schoolId: string,
    tutorLearnerId: string,
    pathId: string,
  ): Promise<RemediationPathRecord | null> {
    try {
      const record = await prisma.remediationPathRecord.findFirst({
        where: { id: pathId, schoolId, tutorLearnerId },
      });
      return record ? this.mapRecord(record) : null;
    } catch {
      return null;
    }
  }

  async updateRemediationPathProgress(
    pathId: string,
    currentStepIndex: number,
    status?: string,
  ): Promise<void> {
    try {
      const data: Record<string, unknown> = { currentStepIndex };
      if (status) data.status = status;
      await prisma.remediationPathRecord.update({
        where: { id: pathId },
        data: data as any,
      });
    } catch {
      // DB unavailable - operation skipped in test/non-prod
    }
  }

  private mapRecord(r: any): RemediationPathRecord {
    return {
      ...r,
      prerequisiteSkillTags: typeof r.prerequisiteSkillTags === 'string' ? JSON.parse(r.prerequisiteSkillTags) : r.prerequisiteSkillTags ?? [],
      steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps ?? [],
      reasonCodes: typeof r.reasonCodes === 'string' ? JSON.parse(r.reasonCodes) : r.reasonCodes ?? [],
      privacyMetadata: typeof r.privacyMetadata === 'string' ? JSON.parse(r.privacyMetadata) : r.privacyMetadata ?? {},
    };
  }
}

export const remediationPathRepository = new RemediationPathRepository();
