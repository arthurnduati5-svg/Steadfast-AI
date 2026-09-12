import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import {
  recordRevisionAuditEvent,
  listRevisionAuditEvents,
} from '../services/phase3RevisionAuditService';

describe('Phase3RevisionAuditService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('records audit events', () => {
    recordRevisionAuditEvent({
      schoolId: 'school-1',
      actorId: 'student-1',
      actorRole: 'student',
      studentId: 'student-1',
      eventType: 'revision_node_created',
      safeReasonCodes: ['test'],
    });

    const events = listRevisionAuditEvents('school-1');
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('revision_node_created');
  });

  it('records events with safe metadata only', () => {
    recordRevisionAuditEvent({
      schoolId: 'school-1',
      actorId: 'student-1',
      actorRole: 'student',
      studentId: 'student-1',
      nodeId: 'node-1',
      eventType: 'revision_node_viewed',
      safeReasonCodes: ['viewed'],
    });

    const events = listRevisionAuditEvents('school-1');
    expect(events[0]).not.toHaveProperty('rawChat');
    expect(events[0]).not.toHaveProperty('hiddenReasoning');
  });

  it('records all required event types', () => {
    const types: Array<any> = [
      'revision_node_created', 'revision_node_viewed', 'revision_node_pinned',
      'revision_node_archived', 'revision_edge_created', 'revision_graph_viewed',
      'revision_due_item_created', 'revision_due_item_completed',
      'revision_teacher_overview_viewed', 'revision_empty_state_returned',
    ];

    for (const t of types) {
      recordRevisionAuditEvent({
        schoolId: 'school-1', actorId: 'test', actorRole: 'test',
        eventType: t, safeReasonCodes: [],
      });
    }

    const events = listRevisionAuditEvents('school-1');
    expect(events.length).toBe(types.length);
  });
});
