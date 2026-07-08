import { describe, it, expect } from 'vitest';
import { produceMetricsSnapshot } from '../services/task024MetricsSnapshotService';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';
import { evaluateBackupReadiness } from '../services/task024BackupReadinessService';
import { runRestoreDrill } from '../services/task024RestoreDrillService';
import { verifyDataIntegrity } from '../services/task024DataIntegrityVerificationService';
import { scanForLeaks, assertNoLeaks } from '../services/task024RedactionAndLeakDetectionService';

const PRIVATE_FIELDS = [
  'rawChat', 'raw_chat', 'rawMessage', 'raw_message',
  'rawTranscript', 'raw_transcript', 'rawPrompt', 'raw_prompt',
  'systemPrompt', 'system_prompt', 'developerPrompt', 'developer_prompt',
  'providerResponse', 'provider_response',
  'answerKey', 'answer_key',
  'teacherOnlyContent', 'teacher_only_note', 'teacherOnlyNote',
  'privateMemory', 'private_memory', 'studentPrivateMemory',
];

describe('task024NoPrivateDataLeakContract', () => {
  describe('produceMetricsSnapshot', () => {
    it('contains only aggregate counts — no raw private data fields', async () => {
      const snapshot = await produceMetricsSnapshot();
      const keys = Object.keys(snapshot);
      for (const field of PRIVATE_FIELDS) {
        const found = keys.some((k) => k.toLowerCase() === field.toLowerCase());
        expect(found).toBe(false);
      }
    });

    it('stringified output passes scanForLeaks', async () => {
      const snapshot = await produceMetricsSnapshot();
      const serialized = JSON.stringify(snapshot);
      const leakCheck = scanForLeaks(serialized);
      expect(leakCheck.hasLeak).toBe(false);
    });

    it('stringified output passes assertNoLeaks', async () => {
      const snapshot = await produceMetricsSnapshot();
      const serialized = JSON.stringify(snapshot);
      const result = assertNoLeaks(serialized);
      expect(result.safe).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });

  describe('getOperationalHealth', () => {
    it('components contain only safeMessage — no raw private data', async () => {
      const health = await getOperationalHealth('leak-test-health');
      for (const component of health.components) {
        expect(component.safeMessage).toBeDefined();
        const lower = component.safeMessage.toLowerCase();
        for (const field of PRIVATE_FIELDS) {
          expect(lower).not.toContain(field.replace(/_/g, '').toLowerCase());
        }
      }
    });

    it('stringified output passes scanForLeaks', async () => {
      const health = await getOperationalHealth('leak-test-health-2');
      const serialized = JSON.stringify(health);
      const leakCheck = scanForLeaks(serialized);
      expect(leakCheck.hasLeak).toBe(false);
    });

    it('stringified output passes assertNoLeaks', async () => {
      const health = await getOperationalHealth('leak-test-health-3');
      const serialized = JSON.stringify(health);
      const result = assertNoLeaks(serialized);
      expect(result.safe).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });

  describe('evaluateBackupReadiness', () => {
    it('safeSummary contains no private data fields', async () => {
      const result = await evaluateBackupReadiness();
      const lowerSummary = result.safeSummary.toLowerCase();
      for (const field of PRIVATE_FIELDS) {
        expect(lowerSummary).not.toContain(field.replace(/_/g, '').toLowerCase());
      }
    });

    it('stringified output passes scanForLeaks', async () => {
      const result = await evaluateBackupReadiness();
      const serialized = JSON.stringify(result);
      const leakCheck = scanForLeaks(serialized);
      expect(leakCheck.hasLeak).toBe(false);
    });

    it('stringified output passes assertNoLeaks', async () => {
      const result = await evaluateBackupReadiness();
      const serialized = JSON.stringify(result);
      const noLeaks = assertNoLeaks(serialized);
      expect(noLeaks.safe).toBe(true);
    });
  });

  describe('runRestoreDrill', () => {
    it('safeSummary contains no private data fields', async () => {
      const result = await runRestoreDrill({ useTestFixture: true });
      const lower = result.safeSummary.toLowerCase();
      for (const field of PRIVATE_FIELDS) {
        expect(lower).not.toContain(field.replace(/_/g, '').toLowerCase());
      }
    });

    it('integrityCheckDetails contain no private data fields', async () => {
      const result = await runRestoreDrill({ useTestFixture: true });
      const details = result.integrityCheckDetails.join(' ').toLowerCase();
      for (const field of PRIVATE_FIELDS) {
        expect(details).not.toContain(field.replace(/_/g, '').toLowerCase());
      }
    });

    it('stringified output passes scanForLeaks', async () => {
      const result = await runRestoreDrill({ useTestFixture: true });
      const serialized = JSON.stringify(result);
      const leakCheck = scanForLeaks(serialized);
      expect(leakCheck.hasLeak).toBe(false);
    });

    it('stringified output passes assertNoLeaks', async () => {
      const result = await runRestoreDrill({ useTestFixture: true });
      const serialized = JSON.stringify(result);
      const noLeaks = assertNoLeaks(serialized);
      expect(noLeaks.safe).toBe(true);
    });
  });

  describe('verifyDataIntegrity', () => {
    it('each check result contains no private data fields', async () => {
      const results = await verifyDataIntegrity({ useTestFixtures: true });
      for (const r of results) {
        const combined = [r.tableOrModel, ...r.issues].join(' ').toLowerCase();
        for (const field of PRIVATE_FIELDS) {
          expect(combined).not.toContain(field.replace(/_/g, '').toLowerCase());
        }
      }
    });

    it('stringified output passes scanForLeaks', async () => {
      const results = await verifyDataIntegrity({ useTestFixtures: true });
      const serialized = JSON.stringify(results);
      const leakCheck = scanForLeaks(serialized);
      expect(leakCheck.hasLeak).toBe(false);
    });

    it('stringified output passes assertNoLeaks', async () => {
      const results = await verifyDataIntegrity({ useTestFixtures: true });
      const serialized = JSON.stringify(results);
      const noLeaks = assertNoLeaks(serialized);
      expect(noLeaks.safe).toBe(true);
    });
  });

  describe('cross-service aggregate leak scan', () => {
    it('all five operation outputs pass assertNoLeaks when combined', async () => {
      const snapshot = await produceMetricsSnapshot();
      const health = await getOperationalHealth('leak-test-aggregate');
      const backup = await evaluateBackupReadiness();
      const drill = await runRestoreDrill({ useTestFixture: true });
      const integrity = await verifyDataIntegrity({ useTestFixtures: true });

      const allSerialized = [
        JSON.stringify(snapshot),
        JSON.stringify(health),
        JSON.stringify(backup),
        JSON.stringify(drill),
        JSON.stringify(integrity),
      ].join('\n');

      const noLeaks = assertNoLeaks(allSerialized);
      expect(noLeaks.safe).toBe(true);
    });
  });
});
