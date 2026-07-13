import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE = resolve(__dirname, '..');

const TASK035_SERVICE_FILES = [
  'services/task035Task034ProofLoaderService.ts',
  'services/task035ProductionSafeEnvironmentGateService.ts',
  'services/task035ApprovedSchoolBoundaryGuardService.ts',
  'services/task035FullSchoolRolloutSimulationService.ts',
  'services/task035StaffReleaseBoardService.ts',
  'services/task035StudentSafeLaunchNoticeService.ts',
  'services/task035TeacherAdminReadinessChecklistService.ts',
  'services/task035FullSchoolRuntimeGuardSimulationService.ts',
  'services/task035HealthCapacityBudgetService.ts',
  'services/task035FullSchoolRollbackReadinessService.ts',
  'services/task035PrivacyReviewService.ts',
  'services/task035SocraticIntegrityReviewService.ts',
  'services/task035DeenGovernanceReviewService.ts',
  'services/task035CurriculumSourceReviewService.ts',
  'services/task035ReleaseBoardPackageService.ts',
  'services/task035FinalSchoolLaunchDecisionService.ts',
];

const AI_PROVIDER_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /openai/i, label: 'OpenAI import or reference' },
  { pattern: /genkit/i, label: 'Genkit import or reference' },
  { pattern: /OPENAI_API_KEY/i, label: 'OpenAI API key' },
  { pattern: /fetch\(/i, label: 'fetch call to external API' },
  { pattern: /axios/i, label: 'axios HTTP client' },
  { pattern: /anthropic/i, label: 'Anthropic AI reference' },
  { pattern: /langchain/i, label: 'LangChain reference' },
  { pattern: /google\.ai/i, label: 'Google AI reference' },
  { pattern: /createChatCompletion|createCompletion/i, label: 'direct OpenAI SDK call' },
];

describe('task035 no live AI call contract', () => {
  for (const filePath of TASK035_SERVICE_FILES) {
    const fullPath = resolve(BASE, filePath);

    it(`${filePath} file exists`, () => {
      const content = readFileSync(fullPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    for (const { pattern, label } of AI_PROVIDER_PATTERNS) {
      it(`${filePath} has no ${label}`, () => {
        const content = readFileSync(fullPath, 'utf-8');
        expect(content.match(pattern)).toBeNull();
      });
    }
  }
});
