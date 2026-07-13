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

const NOTIFICATION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /sendEmail|sendMail|nodemailer/i, label: 'sendEmail or nodemailer' },
  { pattern: /sendSms|twilio|vonage/i, label: 'sendSms or SMS provider' },
  { pattern: /sendWhatsApp|whatsapp/i, label: 'sendWhatsApp' },
  { pattern: /sendPush|pushNotification|firebase.*notification/i, label: 'push notification' },
  { pattern: /slack.*send|discord.*send|teams.*send/i, label: 'chat platform notification' },
];

describe('task035 no live notification contract', () => {
  for (const filePath of TASK035_SERVICE_FILES) {
    const fullPath = resolve(BASE, filePath);

    it(`${filePath} is readable`, () => {
      const content = readFileSync(fullPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    for (const { pattern, label } of NOTIFICATION_PATTERNS) {
      it(`${filePath} has no ${label}`, () => {
        const content = readFileSync(fullPath, 'utf-8');
        expect(content.match(pattern)).toBeNull();
      });
    }
  }
});
