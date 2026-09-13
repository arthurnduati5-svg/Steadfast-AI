import type { SafeStepEvidenceInput, SafeStepEvidenceRecord, StepEvidenceType } from './task011Contracts';
import type { LearningEventKind, LearnerMemoryKind, LearningEventSource } from '../learnerMemoryContracts';
import { learningEventService } from '../learningEventService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

let evidenceIdCounter = 0;

function generateEvidenceId(): string {
  evidenceIdCounter += 1;
  return `sev_${Date.now().toString(36)}_${evidenceIdCounter.toString(36)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

const inMemoryEvidenceStore = new Map<string, SafeStepEvidenceRecord>();
const evidenceLookupByStudent = new Map<string, string[]>();

function studentKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

export class StepEvidencePersistenceService {
  async persistStepEvidence(
    identity: ResolvedTutorIdentity,
    input: SafeStepEvidenceInput,
  ): Promise<{
    record: SafeStepEvidenceRecord | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const evidenceId = generateEvidenceId();
    const now = nowISO();

    const record: SafeStepEvidenceRecord = {
      evidenceId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      sessionId: input.sessionId ?? null,
      subject: input.subject ?? null,
      topic: input.topic ?? null,
      skillIds: [...new Set((input.skillIds ?? []).filter(Boolean))],
      evidenceType: input.evidenceType,
      confidenceScore: Math.max(0, Math.min(1, input.confidenceScore)),
      hintLevel: input.hintLevel,
      validationModes: input.validationModes ?? [],
      mistakeCategory: input.mistakeCategory ?? null,
      safeSummary: input.safeSummary.slice(0, 500),
      curriculumTrack: input.curriculumTrack ?? 'unknown',
      subjectModuleId: input.subjectModuleId ?? null,
      sourceSensitive: input.sourceSensitive ?? false,
      source: input.source,
      createdAt: now,
    };

    inMemoryEvidenceStore.set(evidenceId, record);
    const key = studentKey(identity.schoolId, identity.studentId);
    const existing = evidenceLookupByStudent.get(key) || [];
    existing.push(evidenceId);
    evidenceLookupByStudent.set(key, existing);

    try {
      await learningEventService.createLearningEvent(identity, {
        sessionId: input.sessionId ?? null,
        kind: this._evidenceTypeToEventKind(input.evidenceType) as LearningEventKind,
        subject: input.subject ?? null,
        topic: input.topic ?? null,
        skillIds: [...new Set((input.skillIds ?? []).filter(Boolean))],
        promptSummary: input.safeSummary.slice(0, 1000),
        responseSummary: null,
        outcomeSummary: input.evidenceType,
        signals: [
          {
            kind: 'step_evidence' as LearnerMemoryKind,
            label: `Step evidence: ${input.evidenceType}`,
            summary: input.safeSummary.slice(0, 300),
            confidence: input.confidenceScore,
            skillIds: [...new Set((input.skillIds ?? []).filter(Boolean))],
            subject: input.subject ?? undefined,
            topic: input.topic ?? undefined,
            evidenceSummary: input.safeSummary.slice(0, 300),
          },
        ],
        source: input.source as LearningEventSource,
      });
    } catch (err) {
      warnings.push(`Failed to write learning event for step evidence: ${String(err)}`);
    }

    return { record, warnings };
  }

  async listStepEvidence(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      evidenceType?: StepEvidenceType;
      limit?: number;
    },
  ): Promise<{ records: SafeStepEvidenceRecord[]; warnings: string[] }> {
    const limit = options?.limit || 50;
    const key = studentKey(identity.schoolId, identity.studentId);
    const evidenceIds = evidenceLookupByStudent.get(key) || [];
    const results: SafeStepEvidenceRecord[] = [];

    for (const eid of evidenceIds) {
      const record = inMemoryEvidenceStore.get(eid);
      if (!record) continue;
      if (record.schoolId !== identity.schoolId || record.studentId !== identity.studentId) continue;
      if (options?.subject && record.subject !== options.subject) continue;
      if (options?.topic && record.topic !== options.topic) continue;
      if (options?.evidenceType && record.evidenceType !== options.evidenceType) continue;
      results.push(record);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { records: results.slice(0, limit), warnings: [] };
  }

  getEvidenceById(
    identity: ResolvedTutorIdentity,
    evidenceId: string,
  ): SafeStepEvidenceRecord | null {
    const record = inMemoryEvidenceStore.get(evidenceId);
    if (!record) return null;
    if (record.schoolId !== identity.schoolId || record.studentId !== identity.studentId) return null;
    return record;
  }

  _clearForTest(): void {
    inMemoryEvidenceStore.clear();
    evidenceLookupByStudent.clear();
    evidenceIdCounter = 0;
  }

  private _evidenceTypeToEventKind(type: StepEvidenceType): string {
    switch (type) {
      case 'attempt_correct': return 'corrected_mistake';
      case 'attempt_partially_correct': return 'answered_question';
      case 'attempt_incorrect': return 'made_mistake';
      case 'hint_used': return 'asked_for_hint';
      case 'mistake_detected': return 'made_mistake';
      case 'misconception_detected': return 'misconception_observed';
      case 'step_improved': return 'improved_understanding';
      case 'practice_requested': return 'asked_for_practice';
      case 'revision_needed': return 'revision_needed';
      case 'challenge_ready': return 'challenge_ready';
      default: return 'step_evidence';
    }
  }
}

export const stepEvidencePersistenceService = new StepEvidencePersistenceService();
