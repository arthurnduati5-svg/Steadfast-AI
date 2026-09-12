import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A-D1 Living Revision + Tutor Snapshot — DURABILITY lock.
// D1 repaired the DEFECT_PROCESS_LOCAL_CANONICAL defect: the phase3
// living-revision repository and the tutor snapshot service are now
// Prisma-backed, restart-proven, and fail-closed. These assertions lock
// the repaired state so no future change can silently reintroduce a
// process-local canonical store. Static checks only (zero DB executions).
const SRC = path.resolve(__dirname, '..');
const PRISMA_SCHEMA = path.resolve(__dirname, '../../prisma/schema.prisma');

describe('R8-G.3A-D1 living-revision durability lock', () => {
  it('durable repository is Prisma-backed across all four record families', () => {
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    expect(repo).toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(repo).toContain('phase3RevisionNodeRecord');
    expect(repo).toContain('phase3RevisionEdgeRecord');
    expect(repo).toContain('phase3RevisionDueItemRecord');
    expect(repo).toContain('phase3RevisionAuditRecord');
  });

  it('canonical durable class holds no process-local Maps', () => {
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    const marker = 'CANONICAL DURABLE REPOSITORY';
    const canonical = repo.slice(repo.indexOf(marker));
    expect(repo.indexOf(marker)).toBeGreaterThan(-1);
    expect(canonical).not.toContain('new Map');
  });

  it('legacy sync store is explicit test injection with fail-closed guard', () => {
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    expect(repo).toContain('guardMemoryTestInjection');
    expect(repo).toContain('is not canonical truth');
    expect(repo).toContain('isRevisionMemoryFallbackAllowed');
  });

  it('no persistent graph model exists; graph is derived state', () => {
    const schema = fs.readFileSync(PRISMA_SCHEMA, 'utf-8');
    expect(schema).not.toContain('Phase3RevisionGraphRecord');
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    expect(repo).not.toContain('revisionGraphs');
    expect(repo).toContain('DERIVED_VIEW');
    const graphService = fs.readFileSync(
      path.join(SRC, 'services/phase3RevisionNoteGraphService.ts'),
      'utf-8',
    );
    expect(graphService).toContain('getDurableLearnerRevisionNoteGraph');
  });

  it('edge/count mutation is transactional', () => {
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    expect(repo).toContain('$transaction');
    expect(repo).toContain('connectionCount');
  });

  it('revision audit is append-only durable state', () => {
    const repo = fs.readFileSync(
      path.join(SRC, 'services/phase3LivingRevisionRepository.ts'),
      'utf-8',
    );
    expect(repo).toContain('recordRevisionAuditEvent');
    expect(repo).not.toContain('updateRevisionAuditEvent');
    expect(repo).not.toContain('deleteRevisionAuditEvent');
  });
});

describe('R8-G.3A-D1 tutor snapshot durability lock', () => {
  it('snapshot service is Prisma-backed and fail-closed', () => {
    const svc = fs.readFileSync(
      path.join(SRC, 'services/tutorStateSnapshotService.ts'),
      'utf-8',
    );
    expect(svc).toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(svc).toContain('tutorStateSnapshotRecord');
    expect(svc).toContain('isTutorSnapshotMemoryFallbackAllowed');
    expect(svc).toContain('in-memory fallback is disabled');
  });

  it('snapshot Prisma family exists with the required ownership', () => {
    const schema = fs.readFileSync(PRISMA_SCHEMA, 'utf-8');
    expect(schema).toContain('model TutorStateSnapshotRecord');
    expect(schema).toContain('@@index([schoolId, studentId, createdAt])');
  });
});
