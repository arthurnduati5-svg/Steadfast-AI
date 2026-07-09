import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - No Live Notification Send Contract', () => {
  it('should report realNotificationsSent as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.realNotificationsSent).toBe(false);
  });

  it('should not include notification-sending side-effect patterns in forbidden list', () => {
    const notificationPatterns = TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS.filter(
      p => p.includes('send') || p.includes('notice'),
    );
    expect(notificationPatterns.some(p => p.includes('sendCanaryNotice'))).toBe(true);
  });

  it('should have noLiveNotificationScanRun false and no associated blockers', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.noLiveNotificationScanRun).toBe(false);
  });

  it('should not trigger any notification-related commands in report', async () => {
    const report: Task031Report = await generateTask031Report({});
    const cmds = report.commandsRun.join(' ').toLowerCase();
    const hasNotificationCommand = cmds.includes('notif') || cmds.includes('email') || cmds.includes('sms');
    expect(hasNotificationCommand).toBe(false);
  });
});
