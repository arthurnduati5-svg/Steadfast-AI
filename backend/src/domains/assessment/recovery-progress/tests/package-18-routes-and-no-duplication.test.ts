import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const routeFilePath = path.resolve(__dirname, '../../../../routes/recoveryProgress.ts');
const progressDir = path.resolve(__dirname, '..');

describe('Package 18 — Route Contract', () => {
  const routeContent = fs.readFileSync(routeFilePath, 'utf-8');

  it('route file exists', () => {
    expect(fs.existsSync(routeFilePath)).toBe(true);
  });

  it('observation create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/observations'");
  });

  it('observation list endpoint exists', () => {
    expect(routeContent).toContain("router.get('/observations'");
  });

  it('observation get by id endpoint exists', () => {
    expect(routeContent).toContain('/observations/:progressObservationId');
  });

  it('observation list by student endpoint exists', () => {
    expect(routeContent).toContain('/students/:studentRef/observations');
  });

  it('observation list by plan endpoint exists', () => {
    expect(routeContent).toContain('/plans/:planId/observations');
  });

  it('observation list by checkpoint endpoint exists', () => {
    expect(routeContent).toContain('/checkpoints/:checkpointId/observations');
  });

  it('observation review-ready endpoint exists', () => {
    expect(routeContent).toContain('/observations/:progressObservationId/review-ready');
  });

  it('observation approve endpoint exists', () => {
    expect(routeContent).toContain('/observations/:progressObservationId/approve');
  });

  it('observation suppress endpoint exists', () => {
    expect(routeContent).toContain('/observations/:progressObservationId/suppress');
  });

  it('observation block endpoint exists', () => {
    expect(routeContent).toContain('/observations/:progressObservationId/block');
  });

  it('observation void endpoint exists', () => {
    expect(routeContent).toContain('/observations/:progressObservationId/void');
  });

  it('evaluation create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/evaluations'");
  });

  it('evaluation list endpoints exist', () => {
    expect(routeContent).toContain('/plans/:planId/evaluations');
    expect(routeContent).toContain('/checkpoints/:checkpointId/evaluations');
  });

  it('evidence create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/evidence'");
  });

  it('adjustment draft create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/adjustment-drafts'");
  });

  it('decision create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/teacher-review-decisions'");
  });

  it('reflection draft create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/reflection-drafts'");
  });

  it('parent note draft create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/parent-note-drafts'");
  });

  it('evidence rollup create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/evidence-rollups'");
  });

  it('summary create endpoint exists', () => {
    expect(routeContent).toContain("router.post('/summaries'");
  });

  it('sendEnvelope is used for all responses', () => {
    const matches = routeContent.match(/sendEnvelope\(res/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThan(90);
  });

  it('uses InMemory repositories (not Prisma)', () => {
    expect(routeContent).toContain('InMemoryRecoveryProgressObservationRepository');
    expect(routeContent).not.toContain('PrismaRecoveryProgress');
  });

  it('does not contain multer or file upload', () => {
    expect(routeContent).not.toContain('multer');
    expect(routeContent).not.toContain('upload');
  });

  it('does not contain direct score mutation endpoints', () => {
    expect(routeContent).not.toContain('/scores');
    expect(routeContent).not.toContain('/grades');
  });

  it('does not contain notification endpoints', () => {
    expect(routeContent).not.toContain('/notifications');
    expect(routeContent).not.toContain('/email');
    expect(routeContent).not.toContain('/sms');
  });

  it('does not contain live assignment endpoints', () => {
    expect(routeContent).not.toContain('/live-assignments');
    expect(routeContent).not.toContain('/live-tasks');
  });

  it('does not contain AI generation endpoints', () => {
    expect(routeContent).not.toContain('/generate-narrative');
    expect(routeContent).not.toContain('/ai-generate');
  });

  it('mount is present in index.ts', () => {
    const indexContent = fs.readFileSync(path.resolve(__dirname, '../../../../index.ts'), 'utf-8');
    expect(indexContent).toContain('recoveryProgressRoutes');
    expect(indexContent).toContain('/api/question-bank/recovery-progress');
  });
});

describe('Package 18 — No Duplication', () => {
  const sourceFiles = [
    'policies/recoveryProgressPolicyDefinitions.ts',
    'services/recoveryProgressSafetyService.ts',
    'services/recoveryProgressObservationService.ts',
    'services/recoveryCheckpointEvaluationService.ts',
    'services/recoveryOutcomeEvidenceService.ts',
    'services/recoveryPlanAdjustmentDraftService.ts',
    'services/recoveryTeacherReviewDecisionService.ts',
    'services/recoveryStudentProgressReflectionDraftService.ts',
    'services/recoveryParentProgressNoteDraftService.ts',
    'services/recoveryEvidenceRollupService.ts',
    'services/recoveryProgressSummaryService.ts',
    'services/recoveryProgressIdempotencyService.ts',
    'services/recoveryProgressAuditBridge.ts',
    'repositories/inMemoryRecoveryProgressRepositories.ts',
  ];
  const allSourceFiles = [
    'contracts/recoveryProgressContracts.ts',
    'contracts/recoveryProgressRepositoryContracts.ts',
    ...sourceFiles,
  ];

  let combinedSource = '';
  for (const file of sourceFiles) {
    const fullPath = path.join(progressDir, file);
    if (fs.existsSync(fullPath)) {
      combinedSource += fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
  }

  it('no score mutation fields (score, mark, grade)', () => {
    expect(combinedSource).not.toContain('updateScore');
    expect(combinedSource).not.toContain('overrideScore');
    expect(combinedSource).not.toContain('overwriteResult');
  });

  it('no notification payload fields', () => {
    expect(combinedSource).not.toContain('sendEmail');
    expect(combinedSource).not.toContain('sendSms');
    expect(combinedSource).not.toContain('sendPush');
    expect(combinedSource).not.toContain('notifyParent');
  });

  it('no live assignment fields', () => {
    expect(combinedSource).not.toContain('assignHomework');
    expect(combinedSource).not.toContain('assignPractice');
    expect(combinedSource).not.toContain('assignRevision');
  });

  it('no AI/OCR/generation fields', () => {
    expect(combinedSource).not.toContain('generateNarrative');
    expect(combinedSource).not.toContain('generateQuestion');
    expect(combinedSource).not.toContain('runOcr');
    expect(combinedSource).not.toContain('runAiModel');
  });

  it('no external sync fields', () => {
    expect(combinedSource).not.toContain('exportToLms');
    expect(combinedSource).not.toContain('pushToExternal');
  });

  it('no portal URL or access token fields', () => {
    expect(combinedSource).not.toContain('portalUrl');
    expect(combinedSource).not.toContain('accessToken');
  });

  it('no PDF binary fields in non-repository code', () => {
    expect(combinedSource).not.toContain('.pdf');
  });

  it('no HTML export fields', () => {
    expect(combinedSource).not.toContain('.html');
  });

  it('no mastery mutation fields', () => {
    expect(combinedSource).not.toContain('updateMastery');
  });

  it('forbidden types are not present', () => {
    expect(combinedSource).not.toContain('LiveProgressUpdateRecord');
    expect(combinedSource).not.toContain('MasteryMutationExecutionRecord');
    expect(combinedSource).not.toContain('ScoreImprovementClaimRecord');
    expect(combinedSource).not.toContain('AIProgressNarrativeRecord');
  });
});
