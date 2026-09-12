import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A-D1C Focused Proof 1 — production composition lock (static).
// Fails if the mounted route is rewired to the legacy sync Map-backed
// repository as canonical production storage.

const SRC = path.resolve(__dirname, '..');

function readService(name: string): string {
  return fs.readFileSync(path.join(SRC, 'services', name), 'utf-8');
}

function readRoute(): string {
  return fs.readFileSync(path.join(SRC, 'routes', 'phase3LivingRevisionRoutes.ts'), 'utf-8');
}

describe('R8-G.3A-D1C production composition lock', () => {
  it('mounted route does not import/use the legacy sync repository directly', () => {
    const route = readRoute();
    // Precise lock: no import of the legacy sync module member, and no
    // direct sync state calls. The durable singleton name
    // (…DurableRepository) never matches these patterns.
    expect(route).not.toMatch(/from\s+['"]\.\.\/services\/phase3LivingRevisionRepository['"]/);
    expect(route).not.toMatch(/phase3LivingRevisionRepository\s*\./);
    expect(route).not.toMatch(/\b(listLearnerRevisionNodes|getRevisionNode|pinRevisionNode|archiveRevisionNode|completeRevisionNode|snoozeRevisionNode|listNodeConnections|deriveDueRevisionItems|markRevisionDueItemCompleted|getLearnerRevisionNoteGraph|getTeacherRevisionOverview|recordRevisionAuditEvent)\s*\(/);
  });

  it('production node operations resolve through the durable async path', () => {
    const route = readRoute();
    for (const fn of [
      'createRevisionNodeDurable',
      'getRevisionNodeDurable',
      'listLearnerRevisionNodesDurable',
      'pinRevisionNodeDurable',
      'archiveRevisionNodeDurable',
      'completeRevisionNodeDurable',
      'snoozeRevisionNodeDurable',
    ]) {
      expect(route).toContain(fn);
    }
    const nodeSvc = readService('phase3RevisionNodeService.ts');
    expect(nodeSvc).toContain('phase3LivingRevisionDurableRepository');
    expect(nodeSvc).toContain('createRevisionNodeDurable');
    expect(nodeSvc).toContain('getRevisionNodeDurable');
    expect(nodeSvc).toContain('listLearnerRevisionNodesDurable');
  });

  it('production edge operations resolve through the durable async path', () => {
    const route = readRoute();
    expect(route).toContain('listNodeConnectionsDurable');
    const edgeSvc = readService('phase3RevisionEdgeService.ts');
    expect(edgeSvc).toContain('phase3LivingRevisionDurableRepository');
    expect(edgeSvc).toContain('createRevisionEdgeDurable');
    expect(edgeSvc).toContain('listNodeConnectionsDurable');
    expect(edgeSvc).toContain('listEdgesForLearnerDurable');
    expect(edgeSvc).toContain('removeRevisionEdgeDurable');
  });

  it('production due operations resolve through the durable async path', () => {
    const route = readRoute();
    expect(route).toContain('deriveDueRevisionItemsDurable');
    expect(route).toContain('markRevisionDueItemCompletedDurable');
    const dueSvc = readService('phase3RevisionDueResolverService.ts');
    expect(dueSvc).toContain('phase3LivingRevisionDurableRepository');
    expect(dueSvc).toContain('deriveDueRevisionItemsDurable');
    expect(dueSvc).toContain('markRevisionDueItemCompletedDurable');
  });

  it('production graph operations use durable reconstruction', () => {
    const route = readRoute();
    expect(route).toContain('getDurableLearnerRevisionNoteGraph');
    const graphSvc = readService('phase3RevisionNoteGraphService.ts');
    expect(graphSvc).toContain('getDurableLearnerRevisionNoteGraph');
  });

  it('production teacher overview uses durable reads', () => {
    const route = readRoute();
    for (const fn of [
      'getTeacherRevisionOverviewDurable',
      'getLearnerRevisionTeacherSummaryDurable',
      'getRevisionDueSupportQueueDurable',
      'getRevisionSourceRequiredQueueDurable',
      'getTeacherSupportRevisionQueueDurable',
      'getRevisionMistakeRepairSummaryDurable',
    ]) {
      expect(route).toContain(fn);
    }
    const teacherSvc = readService('phase3RevisionTeacherOverviewService.ts');
    expect(teacherSvc).toContain('phase3LivingRevisionDurableRepository');
    expect(teacherSvc).toContain('getTeacherRevisionOverviewDurable');
  });

  it('production audit recording uses the durable audit repository', () => {
    const route = readRoute();
    expect(route).toContain('recordRevisionAuditEventDurable');
    // Required audits are awaited, never fire-and-forget.
    expect(route).toContain('await revisionAuditService.recordRevisionAuditEventDurable');
    const auditSvc = readService('phase3RevisionAuditService.ts');
    expect(auditSvc).toContain('phase3LivingRevisionDurableRepository');
    expect(auditSvc).toContain('recordRevisionAuditEventDurable');
  });

  it('legacy sync exports are preserved for explicit test compatibility', () => {
    const nodeSvc = readService('phase3RevisionNodeService.ts');
    expect(nodeSvc).toContain('export function createLearnerRevisionNode(');
    expect(nodeSvc).toContain('export function getRevisionNode(');
    const edgeSvc = readService('phase3RevisionEdgeService.ts');
    expect(edgeSvc).toContain('export function createRevisionEdge(');
    const teacherSvc = readService('phase3RevisionTeacherOverviewService.ts');
    expect(teacherSvc).toContain('export function getTeacherRevisionOverview(');
  });
});
