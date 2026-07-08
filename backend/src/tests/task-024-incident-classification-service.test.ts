import { describe, it, expect } from 'vitest';
import {
  classifySignal,
  classifySignals,
  getSeverityRules,
} from '../services/task024IncidentClassificationService';
import type { IncidentSignal } from '../contracts/task024OperationsContracts';

function makeSignal(signalType: string, component?: string): IncidentSignal {
  return {
    source: 'test',
    component: component ?? 'TestComponent',
    signalType,
    detectedAt: new Date().toISOString(),
    safeSummary: `Test ${signalType}`,
  };
}

describe('task024IncidentClassificationService', () => {
  describe('classifySignal', () => {
    it('returns an IncidentRecord with correct shape', () => {
      const record = classifySignal(makeSignal('secret_leak_detected'));
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('category');
      expect(record).toHaveProperty('severity');
      expect(record).toHaveProperty('status');
      expect(record).toHaveProperty('safeTitle');
      expect(record).toHaveProperty('safeSummary');
      expect(record).toHaveProperty('reasonCodes');
      expect(record).toHaveProperty('affectedComponents');
      expect(record).toHaveProperty('recommendedOwnerRole');
      expect(record).toHaveProperty('studentSafetyRelevant');
      expect(record).toHaveProperty('privacyRelevant');
      expect(record).toHaveProperty('deenGovernanceRelevant');
      expect(record).toHaveProperty('detectedAt');
      expect(record.id).toMatch(/^inc_/);
      expect(record.status).toBe('detected');
    });

    it('classifies secret leak -> critical, security', () => {
      const record = classifySignal(makeSignal('secret_leak_detected'));
      expect(record.severity).toBe('critical');
      expect(record.category).toBe('security');
    });

    it('classifies database_unavailable -> critical, database', () => {
      const record = classifySignal(makeSignal('database_unavailable'));
      expect(record.severity).toBe('critical');
      expect(record.category).toBe('database');
    });

    it('classifies startup_gate_blocked -> critical, configuration', () => {
      const record = classifySignal(makeSignal('startup_gate_blocked'));
      expect(record.severity).toBe('critical');
      expect(record.category).toBe('configuration');
    });

    it('classifies content_gap_spike -> medium, content_governance', () => {
      const record = classifySignal(makeSignal('content_gap_spike'));
      expect(record.severity).toBe('medium');
      expect(record.category).toBe('content_governance');
    });

    it('classifies unknown signal type -> low, unknown', () => {
      const record = classifySignal(makeSignal('some_unknown_signal'));
      expect(record.severity).toBe('low');
      expect(record.category).toBe('unknown');
    });

    it('sets studentSafetyRelevant true for safeguarding signals', () => {
      const record = classifySignal(makeSignal('safeguarding_pipeline_unavailable'));
      expect(record.studentSafetyRelevant).toBe(true);
    });

    it('sets deenGovernanceRelevant true for deen_governance signals', () => {
      const record = classifySignal(makeSignal('deen_governance_source_unavailable'));
      expect(record.deenGovernanceRelevant).toBe(true);
    });

    it('sets privacyRelevant true for privacy/safeguarding signals', () => {
      const privacy = classifySignal(makeSignal('privacy_leak_detected'));
      expect(privacy.privacyRelevant).toBe(true);
      const safeguarding = classifySignal(makeSignal('safeguarding_pipeline_unavailable'));
      expect(safeguarding.privacyRelevant).toBe(true);
    });

    it('includes signalType in reasonCodes', () => {
      const record = classifySignal(makeSignal('rate_limit_abuse_spike'));
      expect(record.reasonCodes).toContain('rate_limit_abuse_spike');
    });

    it('sets safeTitle from signal type mapping', () => {
      const record = classifySignal(makeSignal('secret_leak_detected'));
      expect(record.safeTitle).toBe('Secret Leak Detected');
    });

    it('sets recommendedOwnerRole based on category', () => {
      const security = classifySignal(makeSignal('secret_leak_detected'));
      expect(security.recommendedOwnerRole).toBe('security_admin');
      const database = classifySignal(makeSignal('database_unavailable'));
      expect(database.recommendedOwnerRole).toBe('database_admin');
      const content = classifySignal(makeSignal('content_gap_spike'));
      expect(content.recommendedOwnerRole).toBe('curriculum_admin');
    });
  });

  describe('classifySignals', () => {
    it('handles multiple signals', () => {
      const signals = [
        makeSignal('secret_leak_detected'),
        makeSignal('database_unavailable'),
        makeSignal('content_gap_spike'),
      ];
      const records = classifySignals(signals);
      expect(records).toHaveLength(3);
      expect(records[0].severity).toBe('critical');
      expect(records[1].severity).toBe('critical');
      expect(records[2].severity).toBe('medium');
    });

    it('returns empty array for empty input', () => {
      expect(classifySignals([])).toEqual([]);
    });
  });

  describe('getSeverityRules', () => {
    it('returns expected rules', () => {
      const rules = getSeverityRules();
      expect(rules.secret_leak_detected).toEqual({ severity: 'critical', category: 'security' });
      expect(rules.database_unavailable).toEqual({ severity: 'critical', category: 'database' });
      expect(rules.startup_gate_blocked).toEqual({ severity: 'critical', category: 'configuration' });
      expect(rules.content_gap_spike).toEqual({ severity: 'medium', category: 'content_governance' });
      expect(Object.keys(rules).length).toBeGreaterThanOrEqual(14);
    });
  });
});
