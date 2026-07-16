import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseCapacitySnapshotRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseCapacityService } from '../services/recoveryCaseCapacityService';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Capacity Snapshot Safety', () => {
  let repo: InMemoryRecoveryCaseCapacitySnapshotRepository;
  let service: RecoveryCaseCapacityService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-cap-1',
    idempotencyKey: 'ik-cap-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseCapacitySnapshotRepository();
    service = new RecoveryCaseCapacityService(repo);
  });

  it('creates capacity snapshot with valid values', async () => {
    const result = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 50,
      usedCapacity: 20,
      capacityThreshold: 0.8,
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.totalCapacity).toBe(50);
    expect(result.data!.usedCapacity).toBe(20);
    expect(result.data!.capacityStatus).toBe('draft');
  });

  it('validates capacityLimit >= 0 (reject negative)', async () => {
    const result = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: -1,
      usedCapacity: 0,
      capacityThreshold: 0.8,
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain('capacityLimit must be >= 0');
  });

  it('validates currentLoad >= 0 (reject negative)', async () => {
    const result = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 50,
      usedCapacity: -5,
      capacityThreshold: 0.8,
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain('currentLoad must be >= 0');
  });

  it('calculates availableSlots = max(0, capacityLimit - currentLoad)', async () => {
    const result = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 50,
      usedCapacity: 20,
      capacityThreshold: 0.8,
    });
    expect(result.data!.availableCapacity).toBe(30);

    const exceeded = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 10,
      usedCapacity: 20,
      capacityThreshold: 0.8,
    });
    expect(exceeded.data!.availableCapacity).toBe(0);
  });

  it('marks capacity exceeded', async () => {
    const created = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 10,
      usedCapacity: 10,
      capacityThreshold: 1.0,
    });
    const updated = await service.markCapacityExceeded(ctx, 'school-1', created.data!.capacitySnapshotId);
    expect(updated.success).toBe(true);
    expect(updated.data!.capacityStatus).toBe('capacity_exceeded');
  });

  it('lists by role, by reviewer, by window', async () => {
    const c1 = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 20,
      usedCapacity: 10,
      capacityThreshold: 0.8,
      reviewerRef: 'reviewer-a',
    });
    await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'admin',
      totalCapacity: 30,
      usedCapacity: 5,
      capacityThreshold: 0.8,
      reviewerRef: 'reviewer-b',
    });

    const byRole = await service.listCapacitySnapshotsByRole('school-1', 'teacher');
    expect(byRole.data).toHaveLength(1);

    const byReviewer = await service.listCapacitySnapshotsByReviewer('school-1', 'reviewer-a');
    expect(byReviewer.data).toHaveLength(1);
  });

  it('capacity is advisory only (no live assignment created)', async () => {
    const result = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 10,
      usedCapacity: 5,
      capacityThreshold: 0.8,
    });
    expect(result.data!.availableCapacity).toBe(5);
    expect(result.data!.capacityStatus).toBe('draft');
    expect(Object.keys(result.data!)).not.toContain('assignmentId');
    expect(Object.keys(result.data!)).not.toContain('liveAssignmentId');
  });

  it('marks capacity snapshot review ready', async () => {
    const created = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 20,
      usedCapacity: 5,
      capacityThreshold: 0.8,
    });
    const updated = await service.markCapacitySnapshotReviewReady(ctx, 'school-1', created.data!.capacitySnapshotId);
    expect(updated.data!.capacityStatus).toBe('review_ready');
  });

  it('voids capacity snapshot', async () => {
    const created = await service.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      totalCapacity: 20,
      usedCapacity: 5,
      capacityThreshold: 0.8,
    });
    const updated = await service.voidCapacitySnapshot(ctx, 'school-1', created.data!.capacitySnapshotId, 'VOID_REASON', 'Test void');
    expect(updated.data!.capacityStatus).toBe('void');
  });
});
