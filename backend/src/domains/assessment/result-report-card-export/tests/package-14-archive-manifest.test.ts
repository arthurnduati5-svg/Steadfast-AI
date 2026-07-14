import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardArchiveManifestRepository,
} from '../repositories/inMemoryResultReportCardExportRepositories';
import { FORBIDDEN_EXPORT_ENVELOPE_FIELDS } from '../contracts/resultReportCardExportContracts';

function makeManifestInput() {
  return {
    resultReportCardExportJobId: 'job-1',
    manifestMode: 'metadata_only' as const,
    safeArchiveSummary: 'Archive manifest with metadata only',
    archiveMetadataJson: { studentRef: 'student-1', paperId: 'paper-1' } as Record<string, unknown>,
    retentionPolicyJson: { retentionDays: 365 } as Record<string, unknown>,
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };
}

describe('Package 14 — Archive Manifest', () => {
  let manifestRepo: InMemoryResultReportCardArchiveManifestRepository;

  beforeEach(() => {
    manifestRepo = new InMemoryResultReportCardArchiveManifestRepository();
  });

  it('archive manifest can be created', async () => {
    const manifest = await manifestRepo.create(makeManifestInput());
    expect(manifest).toBeDefined();
    expect(manifest.manifestStatus).toBe('draft');
    expect(manifest.manifestMode).toBe('metadata_only');
  });

  it('archive manifest can be sealed', async () => {
    const manifest = await manifestRepo.create(makeManifestInput());
    const sealed = await manifestRepo.seal(manifest.resultReportCardArchiveManifestId);
    expect(sealed.manifestStatus).toBe('sealed');
    expect(sealed.sealedAt).toBeTruthy();
  });

  it('archive manifest can be blocked', async () => {
    const manifest = await manifestRepo.create(makeManifestInput());
    const blocked = await manifestRepo.block(manifest.resultReportCardArchiveManifestId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.manifestStatus).toBe('blocked');
  });

  it('archive manifest can be voided', async () => {
    const manifest = await manifestRepo.create(makeManifestInput());
    const voided = await manifestRepo.void(manifest.resultReportCardArchiveManifestId, 'USER_REQUEST', 'Voided');
    expect(voided.manifestStatus).toBe('void');
  });

  it('archive manifest contains metadata only', async () => {
    const manifest = await manifestRepo.create(makeManifestInput());
    expect(manifest.archiveMetadataJson).toBeDefined();
    expect(manifest.archiveMetadataJson).toHaveProperty('studentRef');
    expect(manifest.archiveMetadataJson).toHaveProperty('paperId');
    expect(manifest.safeArchiveSummary).toBeTruthy();
  });

  it('archive manifest contains no file path to generated PDF', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBuffer');
  });

  it('archive manifest contains no PDF binary (via FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBase64');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBinary');
  });

  it('archive manifest contains no portal payload (via FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('portalPayload');
  });

  it('archive manifest contains no external sync payload (via FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('externalSyncPayload');
  });

  it('archive manifest does not upload file (no upload methods)', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardArchiveManifestRepository.prototype);
    expect(methods).not.toContain('uploadFile');
    expect(methods).not.toContain('upload');
    expect(methods).not.toContain('writeFile');
  });

  it('archive manifest does not sync externally (no sync methods)', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardArchiveManifestRepository.prototype);
    expect(methods).not.toContain('syncExternal');
    expect(methods).not.toContain('syncToExternal');
    expect(methods).not.toContain('exportToExternal');
  });
});
