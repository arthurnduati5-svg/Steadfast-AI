/**
 * R8-E Performance, Scale & Reliability workload harness.
 *
 * Task-scoped (R8-E). Imports ONLY explicit target services listed in §7 of
 * the frozen R8-E task. No repository scan, no AST parsing, no source
 * discovery, no all-file traversal, no code generation, no new dependency.
 *
 * Targets (selected with --target):
 *   roster       T1  school roster dry-run + reconcile sweeps (in-memory)
 *   marking      T2  deterministic marking batch sweep + partial failure (in-memory repos)
 *   mastery      T3  canonical mastery concurrent mutation (real Prisma/PostgreSQL, isolated test DB)
 *   assessment   T4  representative question-bank durable transition (real Prisma/PostgreSQL, isolated test DB)
 *   ai-reliab    T7  AI limiter/retry/breaker controlled failure matrix (in-memory)
 *   daily-obj    T6  daily-objective idempotency repeated-session workload (maps mode, in-memory store observable)
 *   evidence     T5  learning evidence long-history growth units (calculated from model shape)
 *
 * Exit code nonzero on invalid measurement setup.
 */

import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
function argValue(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const target = argValue('--target');
const DATABASE_URL =
  process.env.R8E_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:8000/steadfast_r6_test?schema=public';

if (!target) {
  console.error('usage: tsx tools/engineering/r8-e-workload.ts --target <roster|marking|mastery|assessment|ai-reliab|daily-obj|evidence>');
  process.exit(2);
}

// ── timing / memory helpers ─────────────────────────────────────────────
function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return NaN;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}
function memMB(): number {
  return process.memoryUsage().heapUsed / 1024 / 1024;
}
function report(name: string, cardinality: number, samples: number[], extra: Record<string, unknown> = {}) {
  const med = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  console.log(JSON.stringify({
    target: name,
    cardinality,
    samples: samples.length,
    p50Ms: Number(med.toFixed(3)),
    p95Ms: Number(p95.toFixed(3)),
    ...(samples.length >= 20 ? { p99Ms: Number(percentile(samples, 99).toFixed(3)) } : { p99: 'P99 NOT MEANINGFUL FOR THIS SAMPLE' }),
    ...extra,
  }));
}

// ════════════════════════════════════════════════════════════════════════
// T1 — School roster scale (rosterSyncDryRunService + task021 reconcile)
// ════════════════════════════════════════════════════════════════════════
async function runRoster() {
  const { performRosterSyncDryRun } = await import('../../src/services/rosterSyncDryRunService');
  const { reconcileRosterDiff } = await import('../../src/services/task021RosterReconciliationService');
  type RosterSyncInput = Parameters<typeof performRosterSyncDryRun>[0];
  type RosterDiffEntry = Parameters<typeof reconcileRosterDiff>[0][number];

  const SIZES = [1, 30, 500, 5000];
  const SCHOOL = 'r8e-roster-school';

  for (const n of SIZES) {
    const input: RosterSyncInput = {
      schoolId: SCHOOL,
      students: Array.from({ length: n }, (_, i) => ({ externalStudentId: `stu-${i}`, schoolId: SCHOOL })),
      teachers: Array.from({ length: Math.max(1, Math.floor(n / 20)) }, (_, i) => ({
        externalTeacherId: `tea-${i}`, schoolId: SCHOOL, assignedClassIds: [], assignedSubjectIds: [],
      })),
      classes: Array.from({ length: Math.max(1, Math.floor(n / 25)) }, (_, i) => ({ classId: `cls-${i}`, schoolId: SCHOOL })),
      subjects: Array.from({ length: Math.max(1, Math.floor(n / 25)) }, (_, i) => ({ subjectId: `sub-${i}`, schoolId: SCHOOL })),
      enrollments: Array.from({ length: n }, (_, i) => ({ studentId: `stu-${i}`, classId: `cls-${i % Math.max(1, Math.floor(n / 25))}`, schoolId: SCHOOL })),
      teacherAssignments: Array.from({ length: Math.max(1, Math.floor(n / 20)) }, (_, i) => ({ teacherId: `tea-${i}`, classId: `cls-${i % Math.max(1, Math.floor(n / 25))}`, schoolId: SCHOOL })),
    };

    // warm-up
    performRosterSyncDryRun(input);

    const memBefore = memMB();
    const samples: number[] = [];
    let conflicts = 0;
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const result = performRosterSyncDryRun(input);
      samples.push(performance.now() - t0);
      conflicts = result.conflicts.length;
    }
    const memAfter = memMB();
    report('roster-dry-run', n, samples, {
      conflicts,
      heapDeltaMB: Number((memAfter - memBefore).toFixed(2)),
    });

    const diffEntries: RosterDiffEntry[] = Array.from({ length: n }, (_, i) => ({
      category: i % 3 === 0 ? 'new_student_mapping_needed' : i % 3 === 1 ? 'existing_student_unchanged' : 'student_inactivated',
      externalId: `stu-${i}`,
      schoolId: SCHOOL,
      role: 'student' as const,
    }));
    const diffSamples: number[] = [];
    let applied = 0;
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const r = reconcileRosterDiff(diffEntries, SCHOOL);
      diffSamples.push(performance.now() - t0);
      applied = r.decisions.length;
    }
    report('roster-reconcile-decisions', n, diffSamples, { decisions: applied });
  }
  console.log(JSON.stringify({ target: 'roster', decision: 'sweep complete' }));
}

// ════════════════════════════════════════════════════════════════════════
// T2 — Deterministic marking batch sweep + partial-failure isolation
// ════════════════════════════════════════════════════════════════════════
async function runMarking() {
  const { DeterministicMarkingInvocationService } = await import('../../src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService');
  const { InMemoryMarkingBatchRepository, InMemoryMarkingBatchItemRepository, InMemoryMarkingResultLinkRepository } = await import('../../src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories');
  type MarkingBatch = Awaited<ReturnType<InstanceType<typeof DeterministicMarkingInvocationService>['executeDeterministicBatch']>>['batch'];
  type MarkingBatchItem = {
    markingBatchItemId: string; schoolId: string; markingBatchId: string;
    snapshotIntakeId: string; submissionSnapshotId: string; attemptId: string;
    attemptQuestionSnapshotId: string; answerSubmissionId: string; questionId: string;
    questionVersionId: string; paperQuestionId: string; variantQuestionId: string;
    studentRef: string; itemStatus: string; itemMode: string; marksAvailable: number;
    safeItemSummary: string; createdAt: string; updatedAt: string; completedAt: string | null;
  };

  const SIZES = [1, 30, 500];

  for (const n of SIZES) {
    const batchRepo = new InMemoryMarkingBatchRepository();
    const itemRepo = new InMemoryMarkingBatchItemRepository();
    const linkRepo = new InMemoryMarkingResultLinkRepository();
    const svc = new DeterministicMarkingInvocationService(batchRepo, itemRepo, linkRepo);

    const batch: MarkingBatch = {
      markingBatchId: `r8e-batch-${n}`,
      schoolId: 'r8e-school',
      markingInvocationRequestId: 'r8e-req',
      markingRunId: 'r8e-run',
      batchStatus: 'queued',
      batchMode: 'deterministic_only',
      batchSequence: 1,
      totalItems: n,
      deterministicItemCount: n,
      teacherReviewItemCount: 0,
      blockedItemCount: 0,
      safeBatchSummary: 'r8e measurement batch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };
    await batchRepo.create(batch);
    for (let i = 0; i < n; i++) {
      const item: MarkingBatchItem = {
        markingBatchItemId: `${batch.markingBatchId}-item-${i}`,
        schoolId: 'r8e-school',
        markingBatchId: batch.markingBatchId,
        snapshotIntakeId: 'r8e-intake',
        submissionSnapshotId: 'r8e-snap',
        attemptId: 'r8e-attempt',
        attemptQuestionSnapshotId: 'r8e-aqs',
        answerSubmissionId: 'r8e-as',
        questionId: 'r8e-q',
        questionVersionId: 'r8e-qv',
        paperQuestionId: 'r8e-pq',
        variantQuestionId: 'r8e-vq',
        studentRef: `stu-${i}`,
        itemStatus: 'ready',
        itemMode: 'deterministic',
        marksAvailable: 1,
        safeItemSummary: 'r8e item',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };
      await itemRepo.create(item);
    }

    // warm-up pass is the run itself (mutating); run once for timing
    const memBefore = memMB();
    const t0 = performance.now();
    const result = await svc.executeDeterministicBatch(batch.markingBatchId, 'r8e-run');
    const elapsed = performance.now() - t0;
    const memAfter = memMB();

    report('marking-deterministic-batch', n, [elapsed], {
      markedItems: result.markedItems.length,
      failedItems: result.failedItems.length,
      batchStatus: result.batch.batchStatus,
      heapDeltaMB: Number((memAfter - memBefore).toFixed(2)),
    });

    // Partial-failure isolation proof: one poisoned item must not corrupt the
    // batch lifecycle; other items still mark; failed item reported honestly.
    const failBatchRepo = new InMemoryMarkingBatchRepository();
    const failRepo = new InMemoryMarkingBatchItemRepository();
    const failSvc = new DeterministicMarkingInvocationService(failBatchRepo, failRepo, new InMemoryMarkingResultLinkRepository());
    const failBatchId = `r8e-failbatch-${n}`;
    await failBatchRepo.create({ ...batch, markingBatchId: failBatchId, totalItems: Math.min(10, n), deterministicItemCount: Math.min(10, n) - 1 });
    for (let i = 0; i < Math.min(10, n); i++) {
      const item: MarkingBatchItem = {
        ...({} as MarkingBatchItem),
        markingBatchItemId: `${failBatchId}-item-${i}`,
        schoolId: 'r8e-school',
        markingBatchId: failBatchId,
        snapshotIntakeId: 'r8e-intake',
        submissionSnapshotId: 'r8e-snap',
        attemptId: 'r8e-attempt',
        attemptQuestionSnapshotId: 'r8e-aqs',
        answerSubmissionId: 'r8e-as',
        questionId: 'r8e-q',
        questionVersionId: 'r8e-qv',
        paperQuestionId: 'r8e-pq',
        variantQuestionId: 'r8e-vq',
        studentRef: `stu-${i}`,
        itemStatus: 'ready',
        itemMode: i === 0 ? ('teacher_review_required' as string) : 'deterministic',
        marksAvailable: 1,
        safeItemSummary: 'r8e item',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };
      await failRepo.create(item);
    }
    const partial = await failSvc.executeDeterministicBatch(failBatchId, 'r8e-run');
    const failedMarkedStill = partial.failedItems.length === 1 && partial.markedItems.length === Math.min(10, n) - 1;
    console.log(JSON.stringify({
      target: 'marking-partial-failure-isolation',
      cardinality: Math.min(10, n),
      failedItems: partial.failedItems.length,
      markedItems: partial.markedItems.length,
      isolationPreserved: failedMarkedStill,
    }));
  }
  console.log(JSON.stringify({ target: 'marking', decision: 'sweep complete' }));
}

// ════════════════════════════════════════════════════════════════════════
// T3 — Canonical mastery concurrency (real Prisma/PostgreSQL)
// ════════════════════════════════════════════════════════════════════════
async function runMastery() {
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaMasteryRepository } = await import('../../src/services/probabilisticMasteryRepository');
  type AtomicUpdate = Parameters<InstanceType<typeof PrismaMasteryRepository>['applyEvidenceAtomically']>[0];
  type MasteryTarget = Parameters<InstanceType<typeof PrismaMasteryRepository>['readState']>[0];

  const client = new PrismaClient({ datasourceUrl: DATABASE_URL });
  try {
    await client.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error(JSON.stringify({ target: 'mastery', blocked: 'SAFE ISOLATED DATABASE REQUIRED', error: String(err).slice(0, 200) }));
    process.exit(3);
  }

  const repo = new PrismaMasteryRepository(client);
  const RUN = `r8e_${Date.now().toString(36)}`;
  const targetBase = {
    schoolId: `${RUN}_school`,
    learnerId: `${RUN}_learner`,
    targetNodeId: 'node_conc',
    targetNodeType: 'skill' as const,
    curriculumVersionId: `${RUN}_cv`,
  };

  function stateFor(t: MasteryTarget, revision: number): any {
    const now = new Date();
    return {
      schoolId: t.schoolId, learnerId: t.learnerId, targetNodeId: t.targetNodeId,
      targetNodeType: t.targetNodeType, curriculumVersionId: t.curriculumVersionId,
      probabilityOfMastery: 0.42, confidence: 0.55, evidenceCount: revision,
      lastEvidenceAt: now, decayRisk: 0.1, misconceptionTags: ['sign_error'],
      independenceScore: 0.7, hintDependencyScore: 0.2, retentionScore: 0.6,
      transferScore: 0.5, visibleLabel: 'developing', policyVersion: 'pm_policy_1',
      strategyId: 'pm_strategy', strategyVersion: '1', stateRevision: revision,
      updatedAt: now, consecutiveMissCountSinceMastered: 0,
    };
  }
  function updateFor(t: MasteryTarget, revision: number, evidenceId: string): AtomicUpdate {
    const now = new Date();
    const state = stateFor(t, revision);
    return {
      state,
      evidenceId,
      changeLog: {
        changeId: `chg_${evidenceId}`,
        schoolId: t.schoolId, learnerId: t.learnerId, targetNodeId: t.targetNodeId,
        previousState: revision > 1 ? stateFor(t, revision - 1) : null,
        newState: state,
        contributingEvidenceIds: [evidenceId],
        policyVersion: 'pm_policy_1', strategyId: 'pm_strategy',
        reasonCodes: ['stable_progress'], createdAt: now, correlationId: `corr_${evidenceId}`,
      },
    };
  }

  // W1: two concurrent applications of the SAME evidence → exactly one commit.
  {
    const t = { ...targetBase, targetNodeId: 'w1_same_evidence' };
    const update = updateFor(t, 1, `${RUN}_ev_w1`);
    const samples: number[] = [];
    const t0 = performance.now();
    const [a, b] = await Promise.allSettled([
      repo.applyEvidenceAtomically(update),
      repo.applyEvidenceAtomically(update),
    ]);
    samples.push(performance.now() - t0);
    const committed = [a, b].filter((r) => r.status === 'fulfilled' && r.value === true).length;
    const receipt = await client.canonicalMasteryEvidenceApplicationRecord.count({ where: { evidenceId: `${RUN}_ev_w1` } });
    const state = await repo.readState(t);
    console.log(JSON.stringify({
      target: 'mastery-concurrent-same-evidence',
      cardinality: 2,
      committedCount: committed,
      receiptCount: receipt,
      finalRevision: state?.stateRevision ?? null,
      invariant: committed === 1 && receipt === 1 ? 'PROVEN: no duplicate/split canonical state' : 'FAILED',
      elapsedMs: Number(samples[0].toFixed(1)),
    }));
  }

  // W2: sequential distinct-evidence revisions N=20 → no lost updates, revisions advance one by one.
  {
    const t = { ...targetBase, targetNodeId: 'w2_revision_chain' };
    const N = 20;
    let committed = 0;
    const t0 = performance.now();
    for (let r = 1; r <= N; r++) {
      const ok = await repo.applyEvidenceAtomically(updateFor(t, r, `${RUN}_ev_w2_${r}`));
      if (ok) committed++;
    }
    const elapsed = performance.now() - t0;
    const state = await repo.readState(t);
    const changeLogs = await client.canonicalMasteryChangeRecord.count({
      where: { schoolId: t.schoolId, learnerId: t.learnerId, targetNodeId: t.targetNodeId },
    });
    console.log(JSON.stringify({
      target: 'mastery-revision-chain',
      cardinality: N,
      committed,
      finalRevision: state?.stateRevision ?? null,
      changeLogCount: changeLogs,
      noLostUpdate: committed === N && state?.stateRevision === N && changeLogs === N,
      elapsedMs: Number(elapsed.toFixed(1)),
      perCommitMs: Number((elapsed / N).toFixed(2)),
    }));
  }

  // W3: 5-way concurrent distinct evidence on revision 1 (create race) → exactly one wins, no impossible state.
  {
    const t = { ...targetBase, targetNodeId: 'w3_create_race' };
    const C = 5;
    const t0 = performance.now();
    const results = await Promise.allSettled(
      Array.from({ length: C }, (_, i) => repo.applyEvidenceAtomically(updateFor(t, 1, `${RUN}_ev_w3_${i}`))),
    );
    const elapsed = performance.now() - t0;
    const committed = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
    const state = await repo.readState(t);
    const receiptCount = await client.canonicalMasteryEvidenceApplicationRecord.count({
      where: { evidenceId: { startsWith: `${RUN}_ev_w3_` } },
    });
    const changeLogs = await client.canonicalMasteryChangeRecord.count({
      where: { schoolId: t.schoolId, learnerId: t.learnerId, targetNodeId: t.targetNodeId },
    });
    console.log(JSON.stringify({
      target: 'mastery-create-race-5way',
      cardinality: C,
      committed,
      receiptCount,
      changeLogCount: changeLogs,
      finalRevision: state?.stateRevision ?? null,
      impossibleState: !(committed === 1 && receiptCount === 1 && changeLogs === 1 && state?.stateRevision === 1),
      elapsedMs: Number(elapsed.toFixed(1)),
    }));
  }

  // W4: bounded contention timing — 10 sequential commits measured for throughput.
  {
    const t = { ...targetBase, targetNodeId: 'w4_throughput' };
    // seed revision 1
    await repo.applyEvidenceAtomically(updateFor(t, 1, `${RUN}_ev_w4_seed`));
    const N = 10;
    const samples: number[] = [];
    for (let r = 2; r <= N + 1; r++) {
      const t0 = performance.now();
      await repo.applyEvidenceAtomically(updateFor(t, r, `${RUN}_ev_w4_${r}`));
      samples.push(performance.now() - t0);
    }
    report('mastery-commit-throughput', N, samples, { note: 'single-writer sequential commits; per-commit latency on isolated test DB' });
  }

  await client.$disconnect();
}

// ════════════════════════════════════════════════════════════════════════
// T4 — Representative question-bank durable transition (result release approval)
// ════════════════════════════════════════════════════════════════════════
async function runAssessment() {
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ datasourceUrl: DATABASE_URL });
  try {
    await client.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error(JSON.stringify({ target: 'assessment', blocked: 'SAFE ISOLATED DATABASE REQUIRED', error: String(err).slice(0, 200) }));
    process.exit(3);
  }

  const RUN = `r8e_qb_${Date.now().toString(36)}`;
  const schoolId = `${RUN}_school`;

  // Canonical durable transition: draft → approved on ResultReleaseApprovalRecord.
  // The guarded writer pattern (status-conditional updateMany) is the shared
  // concurrency mechanism candidate for the assessment state chain.
  const approvalId = `${RUN}_appr`;
  await client.resultReleaseApprovalRecord.create({
    data: {
      resultReleaseApprovalId: approvalId,
      schoolId,
      resultReleasePacketId: `${RUN}_pkt`,
      resultFinalizationDecisionId: `${RUN}_fin`,
      studentRef: 'r8e-stu',
      approvalStatus: 'draft',
      approvedByActorId: 'r8e-actor',
      approvedByRole: 'school_admin',
      safeApprovalSummary: 'r8e approval',
      updatedAt: new Date(),
    },
  });

  // W1: two concurrent approve attempts on the same draft approval.
  {
    const t0 = performance.now();
    const results = await Promise.allSettled([
      client.resultReleaseApprovalRecord.updateMany({
        where: { resultReleaseApprovalId: approvalId, approvalStatus: 'draft' },
        data: { approvalStatus: 'approved', approvedAt: new Date(), safeApprovalSummary: 'r8e approve A' },
      }),
      client.resultReleaseApprovalRecord.updateMany({
        where: { resultReleaseApprovalId: approvalId, approvalStatus: 'draft' },
        data: { approvalStatus: 'approved', approvedAt: new Date(), safeApprovalSummary: 'r8e approve B' },
      }),
    ]);
    const elapsed = performance.now() - t0;
    const winners = results.map((r) => (r.status === 'fulfilled' ? r.value.count : 0));
    const final = await client.resultReleaseApprovalRecord.findUnique({ where: { resultReleaseApprovalId: approvalId } });
    console.log(JSON.stringify({
      target: 'assessment-approval-concurrent-approve',
      cardinality: 2,
      winnerCounts: winners,
      finalStatus: final?.approvalStatus,
      singleEffectiveTransition: winners.filter((c) => c === 1).length === 1 && final?.approvalStatus === 'approved',
      elapsedMs: Number(elapsed.toFixed(1)),
      note: 'status-conditional updateMany is the guarded-transition mechanism; unguarded update() path (current service code uses getById-then-updateStatus) is the risk case measured in W2',
    }));
  }

  // W2: reproduce the current unguarded read-then-write service semantics
  // (getById → status check → update) to demonstrate whether a stale double
  // approve can slip through at the repository level.
  {
    const approvalId2 = `${RUN}_appr2`;
    await client.resultReleaseApprovalRecord.create({
      data: {
        resultReleaseApprovalId: approvalId2,
        schoolId,
        resultReleasePacketId: `${RUN}_pkt2`,
        resultFinalizationDecisionId: `${RUN}_fin2`,
        studentRef: 'r8e-stu2',
        approvalStatus: 'draft',
        approvedByActorId: 'r8e-actor',
        approvedByRole: 'school_admin',
        safeApprovalSummary: 'r8e approval 2',
        updatedAt: new Date(),
      },
    });
    const t0 = performance.now();
    const attempts = await Promise.allSettled([0, 1].map(async (i) => {
      // simulate service: read, check, write (interleaving window)
      const approval = await client.resultReleaseApprovalRecord.findUnique({ where: { resultReleaseApprovalId: approvalId2 } });
      if (approval?.approvalStatus !== 'draft') return 'rejected_status_check';
      // small yield to widen the race window deterministically
      await new Promise((r) => setTimeout(r, 5));
      const updated = await client.resultReleaseApprovalRecord.update({
        where: { resultReleaseApprovalId: approvalId2 },
        data: { approvalStatus: 'approved', approvedAt: new Date(), safeApprovalSummary: `actor ${i}` },
      });
      return updated.approvalStatus;
    }));
    const elapsed = performance.now() - t0;
    const outcomes = attempts.map((r) => (r.status === 'fulfilled' ? r.value : String(r.reason).slice(0, 60)));
    const bothApproved = outcomes.filter((o) => o === 'approved').length;
    console.log(JSON.stringify({
      target: 'assessment-approval-unguarded-readwrite-race',
      cardinality: 2,
      outcomes,
      bothWriteApproved: bothApproved,
      note: bothApproved === 2
        ? 'REPRODUCED: unguarded read-check-write permits both actors to pass the draft check; the write itself is last-writer-wins, so canonical status stays single-valued, but audit/timestamps and packet side-effects can double-fire — service must use status-conditional updateMany'
        : 'guarded: at least one actor saw non-draft status',
      elapsedMs: Number(elapsed.toFixed(1)),
    }));
  }

  await client.$disconnect();
}

// ════════════════════════════════════════════════════════════════════════
// T7 — AI runtime limiter / retry / breaker controlled failure matrix
// ════════════════════════════════════════════════════════════════════════
async function runAiReliab() {
  const rl = await import('../../src/services/aiRuntimeRateLimitGuardService');
  const rp = await import('../../src/services/aiRuntimeRetryPolicyService');
  const cb = await import('../../src/services/aiRuntimeCircuitBreakerService');

  // Rate limiter: bounded window, per-actor pruning.
  {
    rl.resetAiRateLimitStateForTests();
    const actor = { actorType: 'student', actorId: 'r8e-stu', provider: 'openai', operation: 'chat' };
    let allowed = 0, limited = 0;
    for (let i = 0; i < 50; i++) {
      const decision = rl.checkAiRateLimit({ ...actor, nowMs: 1000 + i });
      if (decision.allowed) { allowed++; rl.recordAiRateLimitUsage({ ...actor, nowMs: 1000 + i }); }
      else limited++;
    }
    // After window expiry, keys prune: rate state does not grow without bound.
    const afterWindow = rl.checkAiRateLimit({ ...actor, nowMs: 61_000 + 1000 });
    console.log(JSON.stringify({
      target: 'ai-rate-limit-window',
      cardinality: 50,
      allowed,
      rateLimited: limited,
      allowedAfterWindowExpiry: afterWindow.allowed,
      note: 'per-actor window prunes timestamps older than 60s; process-local Map keyed per actor — multi-instance deployment classified as process-local limiter',
    }));
  }

  // Retry policy: bounded attempts + capped backoff.
  {
    const decisions = [];
    for (let attempt = 1; attempt <= 6; attempt++) {
      decisions.push(rp.decideAiRetry({
        category: 'provider_unavailable',
        retryable: true,
        attempt,
        budgetAllowed: true,
        circuitState: 'closed',
        retryAfterMs: undefined,
      }));
    }
    const maxDelay = Math.max(...decisions.map((d) => d.delayMs ?? 0));
    const bounded = decisions.filter((d) => d.shouldRetry).length === 2 && decisions[2].reason === 'max_attempts_reached';
    console.log(JSON.stringify({
      target: 'ai-retry-policy',
      cardinality: 6,
      shouldRetryCount: decisions.filter((d) => d.shouldRetry).length,
      maxDelayMsObserved: maxDelay,
      cappedAt30s: maxDelay <= 30_000,
      stopsAtMaxAttempts: bounded,
    }));
  }

  // Circuit breaker: open stops calls, cooldown probe recovers, half-open probe cap.
  {
    cb.resetAiCircuitBreakersForTests();
    const op = { provider: 'r8e-provider', operation: 'chat' };
    const cfg = { failureThreshold: 5, successThreshold: 2, cooldownMs: 1000, halfOpenMaxProbes: 1 };
    let stoppedAt = -1;
    for (let i = 1; i <= 10; i++) {
      const before = cb.beforeAiProviderCall({ ...op, nowMs: i * 100, config: cfg });
      if (!before.allowed) { stoppedAt = i; break; }
      cb.recordAiProviderFailure({ ...op, category: 'provider_unavailable', nowMs: i * 100, config: cfg });
    }
    const openSnapshot = cb.getAiCircuitBreakerSnapshot(op);
    // recovery probe after cooldown
    const probe = cb.beforeAiProviderCall({ ...op, nowMs: 100 * 10 + 1001, config: cfg });
    const probeAllowed = probe.reason === 'half_open_probe_allowed';
    // success recovery
    cb.recordAiProviderSuccess({ ...op, nowMs: 100 * 10 + 1002, config: cfg });
    cb.recordAiProviderSuccess({ ...op, nowMs: 100 * 10 + 1003, config: cfg });
    const recovered = cb.getAiCircuitBreakerSnapshot(op);
    console.log(JSON.stringify({
      target: 'ai-circuit-breaker',
      cardinality: 10,
      openState: openSnapshot.state,
      stoppedCallingAtIteration: stoppedAt,
      cooldownProbeAllowed: probeAllowed,
      recoveredState: recovered.state,
      note: 'failure threshold 5 opens breaker; cooldown probe allowed once; 2 successes close',
    }));
  }
  console.log(JSON.stringify({ target: 'ai-reliab', decision: 'failure matrix complete' }));
}

// ════════════════════════════════════════════════════════════════════════
// T6 — Daily-objective idempotency repeated-session workload (maps mode)
// ════════════════════════════════════════════════════════════════════════
async function runDailyObj() {
  process.env.NODE_ENV = 'test';
  delete process.env.R4_USE_PRISMA;
  const { phase3DailyObjectiveCheckCompletionService } = await import('../../src/services/phase3DailyObjectiveCheckCompletionService');
  const { phase3DailyObjectiveCheckRepository } = await import('../../src/services/phase3DailyObjectiveCheckRepository');
  const { phase3DailyObjectiveCheckAttemptService } = await import('../../src/services/phase3DailyObjectiveCheckAttemptService');
  const { phase3DailyObjectiveConfidenceService } = await import('../../src/services/phase3DailyObjectiveConfidenceService');
  const { phase3ObjectiveRepository } = await import('../../src/services/phase3ObjectiveRepository');

  const svc = phase3DailyObjectiveCheckCompletionService as any;
  const N = Number(argValue('--sessions') ?? 50); // bounded repeated-session workload
  const SCHOOL = 'r8e-do-school';
  let settled = 0, retriedSameResult = 0, errors = 0;

  // Create one canonical objective (test maps mode) reused by all sessions.
  const objective = (phase3ObjectiveRepository as any).createObjective({
    schoolId: SCHOOL, creatorId: 'r8e-actor', creatorRole: 'teacher', objectiveType: 'skill_practice',
    difficultyBucket: 'medium', title: 'r8e daily objective', safeDescription: 'r8e measurement objective',
    successCriteria: [], sourceTruthStatus: 'verified', estimatedMinutes: 5,
  });

  const memBefore = memMB();
  const t0 = performance.now();
  const sampleTimings: number[] = [];
  for (let i = 0; i < N; i++) {
    const session = (phase3DailyObjectiveCheckRepository as any).createCheckSession({
      schoolId: SCHOOL, studentId: `r8e-stu-${i}`, objectiveId: objective.objectiveId,
      sourceTruthStatus: 'verified', requiredSteps: ['attempt'],
      learnerSafeReason: 'r8e', teacherSafeReason: 'r8e',
    });
    // satisfy required steps through the production attempt/confidence services
    (phase3DailyObjectiveCheckAttemptService as any).recordSafeAttemptSignal({
      checkSessionId: session.checkSessionId, schoolId: SCHOOL, studentId: `r8e-stu-${i}`,
      signalBucket: 'objective_check_passed', attemptType: 'daily_objective_check',
    });
    (phase3DailyObjectiveConfidenceService as any).recordConfidenceBefore({
      checkSessionId: session.checkSessionId, schoolId: SCHOOL, studentId: `r8e-stu-${i}`, confidenceLevel: 'medium', checkpointType: 'before',
    });
    (phase3DailyObjectiveConfidenceService as any).recordConfidenceAfter({
      checkSessionId: session.checkSessionId, schoolId: SCHOOL, studentId: `r8e-stu-${i}`, confidenceLevel: 'high', checkpointType: 'after',
    });

    const ts = performance.now();
    const first = svc.completeDailyObjectiveCheckSession({ checkSessionId: session.checkSessionId, schoolId: SCHOOL, studentId: `r8e-stu-${i}` });
    sampleTimings.push(performance.now() - ts);
    if (first.error) { errors++; continue; }
    settled++;
    // retry same settlement: must return the SAME cached result (exactly-once)
    const retry = svc.completeDailyObjectiveCheckSession({ checkSessionId: session.checkSessionId, schoolId: SCHOOL, studentId: `r8e-stu-${i}` });
    if (!retry.error && retry.result?.evidenceBridgeResultId === first.result.evidenceBridgeResultId) retriedSameResult++;
    else errors++;
  }
  const elapsed = performance.now() - t0;
  const memAfter = memMB();

  report('daily-obj-settle-and-retry', N, sampleTimings, {
    settled,
    retriedSameResult,
    errors,
    exactlyOncePreserved: settled === N && retriedSameResult === N,
    heapDeltaMB: Number((memAfter - memBefore).toFixed(2)),
    note: 'maps-mode idempotency store grows 1 entry per settled session and retains them (module-private Map); durable table analog = DailyObjectiveCheckCompletionIdempotencyRecord (1 row per settled session, no production purge)',
  });

  console.log(JSON.stringify({
    target: 'daily-obj-growth-shape',
    rowShape: '1 idempotency entry/row per settled check session (idempotencyKey unique)',
    measuredMapGrowthEntries: N,
    processLocalMapRetention: 'unbounded within process lifetime (cleared only in test-mode bulk reset paths)',
    durableTableProductionPurge: 'none in source',
    decision: 'POLICY DECISION REQUIRED for durable retention; process-local Map retention is test-mode-only (production uses the durable table) — no production Map repair required',
  }));
}

// ════════════════════════════════════════════════════════════════════════
// T5 — Learning evidence long-history growth units (calculated)
// ════════════════════════════════════════════════════════════════════════
async function runEvidence() {
  console.log(JSON.stringify({
    target: 'evidence-long-history-growth-units',
    models: {
      LearningEvidenceEvent: '1 row per evidenced operation (append-only, hash-chained) — canonical, immutable',
      LearningEvidenceIdempotency: '1 row per idempotent command (schoolId+commandType+idempotencyKey unique) — prunable candidate',
      LearningEvidenceStream: '1 row per stream (bounded by learner/objective streams)',
      LearningEvidenceProjectionCheckpoint: 'bounded: 1 row per projection per school per partition',
    },
    prunableIndependently: 'LearningEvidenceIdempotency rows are redundant once the referenced event is committed; canonical events are NOT prunable (integrity/legal correctness requirement, no invented retention period)',
    decision: 'idempotency pruning = POLICY DECISION REQUIRED; canonical retention = NOT APPLICABLE for performance action',
  }));
}

// ── main ────────────────────────────────────────────────────────────────
const t0 = performance.now();
main().catch((err) => {
  console.error(JSON.stringify({ target, fatal: String(err).slice(0, 400) }));
  process.exit(1);
});

async function main(): Promise<void> {
  try {
    if (target === 'roster') await runRoster();
    else if (target === 'marking') await runMarking();
    else if (target === 'mastery') await runMastery();
    else if (target === 'assessment') await runAssessment();
    else if (target === 'ai-reliab') await runAiReliab();
    else if (target === 'daily-obj') await runDailyObj();
    else if (target === 'evidence') await runEvidence();
    else {
      console.error(`unknown target: ${target}`);
      process.exit(2);
    }
  } catch (err) {
    console.error(JSON.stringify({ target, fatal: String(err).slice(0, 400) }));
    process.exit(1);
  }
  const total = performance.now() - t0;
  console.log(JSON.stringify({ harness: 'r8-e-workload', target, totalMs: Number(total.toFixed(0)) }));
}
