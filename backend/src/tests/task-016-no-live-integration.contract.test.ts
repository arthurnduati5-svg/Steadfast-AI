import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const TASK_016_FILES = [
  'backend/src/contracts/studentLearningSessionContracts.ts',
  'backend/src/lib/studentLearningSessionValidation.ts',
  'backend/src/services/studentLearningSessionPrivacyGuard.ts',
  'backend/src/services/studentLearningSessionAccessPolicy.ts',
  'backend/src/services/studentLearningSessionSourceTruthPolicy.ts',
  'backend/src/services/studentLearningSessionStateMachine.ts',
  'backend/src/services/studentLearningSessionLifecycleService.ts',
  'backend/src/services/studentLearningSessionTransitionPolicy.ts',
  'backend/src/services/studentLearningSessionModeBridge.ts',
  'backend/src/services/studentLearningSessionResumeContextService.ts',
  'backend/src/services/studentLearningSessionSnapshotService.ts',
  'backend/src/services/studentLearningSessionExitSummaryService.ts',
  'backend/src/services/studentLearningSessionEvidenceBridge.ts',
  'backend/src/services/studentLearningSessionActionHistoryService.ts',
  'backend/src/services/studentLearningSessionAuditService.ts',
  'backend/src/services/studentLearningSessionResponseBuilder.ts',
  'backend/src/routes/studentLearningSessionRoutes.ts',
];

describe('Task 016: No-Live-Integration', () => {
  for (const filePath of TASK_016_FILES) {
    const fullPath = path.resolve(REPO_ROOT, filePath);
    if (!fs.existsSync(fullPath)) { continue; }
    const content = fs.readFileSync(fullPath, 'utf-8');

    it(`${filePath} does not import openai`, () => {
      expect(content).not.toMatch(/from ['"]openai['"]/);
      expect(content).not.toMatch(/require\(['"]openai['"]\)/);
    });

    it(`${filePath} does not import genkit`, () => {
      expect(content).not.toMatch(/from ['"]genkit['"]/);
      expect(content).not.toMatch(/from ['"]@genkit-ai/);
    });

    it(`${filePath} does not contain OPENAI_API_KEY`, () => {
      expect(content).not.toContain('OPENAI_API_KEY');
    });

    it(`${filePath} does not use fetch/axios/http.request`, () => {
      const lines = content.split('\n');
      const httpCalls = lines.filter(l =>
        l.includes('fetch(') ||
        l.includes('axios(') ||
        l.includes('axios.get') ||
        l.includes('axios.post')
      );
      expect(httpCalls.length).toBe(0);
    });

    it(`${filePath} does not reference live school connector`, () => {
      const lines = content.split('\n');
      const refs = lines.filter(l =>
        l.match(/schoolConnector\(/) ||
        l.match(/liveSchool\(/) ||
        l.match(/liveStudent\(/) ||
        l.match(/import.*schoolConnector/) ||
        l.match(/require.*schoolConnector/)
      );
      expect(refs.length).toBe(0);
    });

    it(`${filePath} does not store answerKey as a value (only as constant name)`, () => {
      const answerKeyAssignments = content.match(/answerKey\s*=\s*['"]/);
      expect(answerKeyAssignments).toBeNull();
    });

    it(`${filePath} does not store transcripts`, () => {
      const transcriptStorage = content.match(/transcript\s*[:=]\s*['"]/);
      expect(transcriptStorage).toBeNull();
    });
  }
});
