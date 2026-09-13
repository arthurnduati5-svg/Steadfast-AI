import { randomUUID } from 'crypto';
import type {
  SchoolActorRole,
  ExternalSchoolUserIdentity,
  TutorLearnerMapping,
  SchoolIntegrationErrorCode,
} from './task021SchoolIntegrationContracts';
import { nowISO } from './task021SchoolIntegrationContracts';
import { logger } from '../utils/logger';
import * as identityRepo from '../repositories/schoolIdentityMappingRepository';
import { useDurableSchoolIntegration } from './schoolIntegrationDurableFlag';

interface IdentityMappingRecord {
  id: string;
  schoolId: string;
  externalUserId: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  role: SchoolActorRole;
  tutorLearnerId?: string;
  status: 'active' | 'inactive' | 'transferred' | 'archived' | 'quarantined';
  reasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

const identityCache = new Map<string, IdentityMappingRecord>();

function schoolScopedKey(schoolId: string, externalUserId: string): string {
  return `${schoolId}::${externalUserId}`;
}

function studentScopedKey(schoolId: string, externalStudentId: string): string {
  return `${schoolId}::student::${externalStudentId}`;
}

function tutorLearnerScopedKey(tutorLearnerId: string): string {
  return `tl::${tutorLearnerId}`;
}

export function clearIdentityStore(): void {
  identityCache.clear();
}

export function getIdentityMappingCount(): number {
  return identityCache.size;
}

function cacheRecord(record: IdentityMappingRecord): void {
  identityCache.set(schoolScopedKey(record.schoolId, record.externalUserId), record);
  if (record.externalStudentId) {
    identityCache.set(studentScopedKey(record.schoolId, record.externalStudentId), record);
  }
  if (record.tutorLearnerId) {
    identityCache.set(tutorLearnerScopedKey(record.tutorLearnerId), record);
  }
}

export async function initializeIdentityMappingsFromDurable(): Promise<void> {
  if (!useDurableSchoolIntegration()) return;
  const mappings = await identityRepo.getAllMappingsRepo();
  for (const mapping of mappings) {
    cacheRecord(mapping);
  }
  logger.info(`[SchoolIdentityMappingService] Loaded ${mappings.length} identity mappings from durable storage`);
}

export async function resolveExternalIdentity(
  schoolId: string,
  externalUserId: string,
): Promise<IdentityMappingRecord | undefined> {
  const cacheKey = schoolScopedKey(schoolId, externalUserId);
  const cached = identityCache.get(cacheKey);
  if (cached) return cached;

  if (useDurableSchoolIntegration()) {
    const repoRecord = await identityRepo.resolveExternalIdentityRepo(schoolId, externalUserId);
    if (repoRecord) {
      cacheRecord(repoRecord);
      return repoRecord;
    }
  }
  return undefined;
}

export async function findMappingByTutorLearnerId(tutorLearnerId: string): Promise<IdentityMappingRecord | undefined> {
  const cacheKey = tutorLearnerScopedKey(tutorLearnerId);
  const cached = identityCache.get(cacheKey);
  if (cached) return cached;

  if (useDurableSchoolIntegration()) {
    const repoRecord = await identityRepo.findMappingByTutorLearnerIdRepo(tutorLearnerId);
    if (repoRecord) {
      cacheRecord(repoRecord);
      return repoRecord;
    }
  }
  return undefined;
}

export async function findMappingByExternalStudentId(
  schoolId: string,
  externalStudentId: string,
): Promise<IdentityMappingRecord | undefined> {
  const cacheKey = studentScopedKey(schoolId, externalStudentId);
  const cached = identityCache.get(cacheKey);
  if (cached) return cached;

  if (useDurableSchoolIntegration()) {
    const repoRecord = await identityRepo.findMappingByExternalStudentIdRepo(schoolId, externalStudentId);
    if (repoRecord) {
      cacheRecord(repoRecord);
      return repoRecord;
    }
  }
  return undefined;
}

export interface CreateMappingInput {
  schoolId: string;
  externalUserId: string;
  role: SchoolActorRole;
  externalStudentId?: string;
  externalTeacherId?: string;
}

export interface CreateMappingResult {
  ok: true;
  mapping: IdentityMappingRecord;
  createdNew: boolean;
  tutorLearnerId?: string;
}

export interface CreateMappingConflict {
  ok: false;
  error: SchoolIntegrationErrorCode;
  reasonCodes: string[];
  existingMapping?: IdentityMappingRecord;
}

export type CreateMappingOutcome = CreateMappingResult | CreateMappingConflict;

export async function createOrResolveIdentityMapping(
  input: CreateMappingInput,
): Promise<CreateMappingOutcome> {
  const existing = await resolveExternalIdentity(input.schoolId, input.externalUserId);

  if (existing) {
    if (existing.role !== input.role) {
      const conflict: SchoolIntegrationErrorCode =
        input.role === 'student' ? 'teacher_student_role_mismatch' : 'student_teacher_role_mismatch';
      return {
        ok: false,
        error: conflict,
        reasonCodes: [conflict, 'role_mismatch_with_existing_mapping'],
        existingMapping: existing,
      };
    }

    if (existing.status === 'quarantined') {
      return {
        ok: false,
        error: 'quarantine_required',
        reasonCodes: ['mapping_in_quarantine'],
        existingMapping: existing,
      };
    }

    return {
      ok: true,
      mapping: existing,
      createdNew: false,
      tutorLearnerId: existing.tutorLearnerId,
    };
  }

  if (input.externalStudentId) {
    const existingStudentMapping = await findMappingByExternalStudentId(
      input.schoolId,
      input.externalStudentId,
    );
    if (existingStudentMapping && existingStudentMapping.externalUserId !== input.externalUserId) {
      return {
        ok: false,
        error: 'duplicate_external_id',
        reasonCodes: ['duplicate_external_student_id', 'conflicting_external_user_id'],
        existingMapping: existingStudentMapping,
      };
    }
  }

  const tutorLearnerId = input.role === 'student'
    ? `tl_${randomUUID().replace(/-/g, '').slice(0, 24)}`
    : undefined;

  const record: IdentityMappingRecord = {
    id: randomUUID(),
    schoolId: input.schoolId,
    externalUserId: input.externalUserId,
    externalStudentId: input.externalStudentId,
    externalTeacherId: input.externalTeacherId,
    role: input.role,
    tutorLearnerId,
    status: 'active',
    reasonCodes: ['identity_mapping_created'],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  if (useDurableSchoolIntegration()) {
    try {
      await identityRepo.createMapping({
        id: record.id,
        schoolId: record.schoolId,
        externalUserId: record.externalUserId,
        externalStudentId: record.externalStudentId,
        externalTeacherId: record.externalTeacherId,
        role: record.role,
        tutorLearnerId: record.tutorLearnerId,
        status: record.status,
        reasonCodes: record.reasonCodes,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    } catch (error) {
      logger.error({ error }, '[SchoolIdentityMappingService] Failed to persist identity mapping to durable storage');
      return {
        ok: false,
        error: 'internal_error',
        reasonCodes: ['durable_persistence_failed'],
      };
    }
  }

  cacheRecord(record);

  logger.info(
    { schoolId: input.schoolId, role: input.role, externalUserId: input.externalUserId, tutorLearnerId },
    '[SchoolIdentityMappingService] Created identity mapping',
  );

  return {
    ok: true,
    mapping: record,
    createdNew: true,
    tutorLearnerId,
  };
}

export async function updateMappingStatus(
  schoolId: string,
  externalUserId: string,
  newStatus: IdentityMappingRecord['status'],
  reasonCodes: string[],
): Promise<IdentityMappingRecord | undefined> {
  const record = await resolveExternalIdentity(schoolId, externalUserId);
  if (!record) return undefined;

  record.status = newStatus;
  record.updatedAt = nowISO();
  record.reasonCodes = [...record.reasonCodes, ...reasonCodes];

  cacheRecord(record);

  if (useDurableSchoolIntegration()) {
    await identityRepo.updateMappingStatusRepo(schoolId, externalUserId, newStatus, reasonCodes);
  }

  return record;
}

export async function detectDuplicateExternalStudentId(
  schoolId: string,
  externalStudentId: string,
  excludeExternalUserId?: string,
): Promise<IdentityMappingRecord | undefined> {
  const cached = identityCache.get(studentScopedKey(schoolId, externalStudentId));
  if (cached && cached.externalUserId !== excludeExternalUserId) return cached;

  if (useDurableSchoolIntegration()) {
    return identityRepo.detectDuplicateExternalStudentIdRepo(schoolId, externalStudentId, excludeExternalUserId);
  }
  return undefined;
}

export async function getActiveMappingsForSchool(schoolId: string): Promise<IdentityMappingRecord[]> {
  const results: IdentityMappingRecord[] = [];
  for (const record of identityCache.values()) {
    if (record.schoolId === schoolId && record.status === 'active' && !results.some(r => r.id === record.id)) {
      results.push(record);
    }
  }
  if (results.length === 0 && useDurableSchoolIntegration()) {
    const repoRecords = await identityRepo.getActiveMappingsForSchoolRepo(schoolId);
    for (const r of repoRecords) {
      cacheRecord(r);
      results.push(r);
    }
  }
  return results;
}

export async function getMappingsForSchool(schoolId: string): Promise<IdentityMappingRecord[]> {
  const seen = new Set<string>();
  const results: IdentityMappingRecord[] = [];
  for (const record of identityCache.values()) {
    if (record.schoolId === schoolId && !seen.has(record.id)) {
      seen.add(record.id);
      results.push(record);
    }
  }
  if (results.length === 0 && useDurableSchoolIntegration()) {
    const repoRecords = await identityRepo.getMappingsForSchoolRepo(schoolId);
    for (const r of repoRecords) {
      cacheRecord(r);
      if (!seen.has(r.id)) {
        seen.add(r.id);
        results.push(r);
      }
    }
  }
  return results;
}

export async function getMappingSummary(schoolId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  transferred: number;
  archived: number;
  quarantined: number;
}> {
  if (useDurableSchoolIntegration()) {
    return identityRepo.getMappingSummaryRepo(schoolId);
  }
  const schoolMappings = await getMappingsForSchool(schoolId);
  return {
    total: schoolMappings.length,
    active: schoolMappings.filter(m => m.status === 'active').length,
    inactive: schoolMappings.filter(m => m.status === 'inactive').length,
    transferred: schoolMappings.filter(m => m.status === 'transferred').length,
    archived: schoolMappings.filter(m => m.status === 'archived').length,
    quarantined: schoolMappings.filter(m => m.status === 'quarantined').length,
  };
}
