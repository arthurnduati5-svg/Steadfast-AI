import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';
import { LearningEvidenceSeedService } from '../../domains/learning-evidence/services/learningEvidenceSeedService';

describe('LearningEvidenceSeedService', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let seedService: LearningEvidenceSeedService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    const guard = new LearningEvidencePrivacyGuard();
    const commandService = new LearningEvidenceCommandService(repo, guard);
    seedService = new LearningEvidenceSeedService(commandService, repo);
  });

  it('seedAll runs all scenarios successfully', async () => {
    const result = await seedService.seedAll('school-seed', 'learner-seed-1');
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.success).toBe(true);
    }
  });

  it('creates events that can be read back', async () => {
    const result = await seedService.seedAll('school-seed', 'learner-seed-2');
    expect(result.results.every(r => r.success)).toBe(true);
    const events = await repo.getEventsForLearner('school-seed', 'learner-seed-2-s0');
    expect(events.length).toBeGreaterThan(0);
  });

  it('isolates seeds per school', async () => {
    await seedService.seedAll('school-A', 'learner-isolate');
    await seedService.seedAll('school-B', 'learner-isolate');
    const eventsA = await repo.getEventsForLearner('school-A', 'learner-isolate-s0');
    const eventsB = await repo.getEventsForLearner('school-B', 'learner-isolate-s0');
    expect(eventsA.length).toBeGreaterThan(0);
    expect(eventsB.length).toBeGreaterThan(0);
  });
});
