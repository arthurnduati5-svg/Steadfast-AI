import { describe, it, expect, beforeEach } from 'vitest';
import { recordIncidentAudit, getAuditRecords, createIncidentAndAudit, transitionIncidentStatus, appendSafeAuditNote } from '../services/task024IncidentAuditService';
import { task024OpsRepository } from '../repositories/task024OpsRepository';

describe('task024IncidentAuditService', () => {
  beforeEach(() => {
    task024OpsRepository._clearMemory();
  });

  describe('recordIncidentAudit', () => {
    it('records metadata only (no raw data fields)', async () => {
      const audit = await recordIncidentAudit(
        'inc_test_001',
        'investigated',
        'security_admin',
      );
      expect(audit).toHaveProperty('id');
      expect(audit).toHaveProperty('incidentId');
      expect(audit).toHaveProperty('action');
      expect(audit).toHaveProperty('actorRole');
      expect(audit).toHaveProperty('createdAt');
      expect(audit.incidentId).toBe('inc_test_001');
      expect(audit.actorRole).toBe('security_admin');
      expect(audit.action).toBe('investigated');
    });

    it('does not include raw or private data fields', async () => {
      const audit = await recordIncidentAudit('inc_test_002', 'resolved');
      const keys = Object.keys(audit);
      const forbidden = ['rawChat', 'privateMemory', 'safeguardingRaw', 'deenSensitiveRaw', 'providerResponse', 'aiPrompt'];
      for (const key of forbidden) {
        expect(keys).not.toContain(key);
      }
    });

    it('returns with timestamp', async () => {
      const audit = await recordIncidentAudit('inc_test_003', 'detected');
      expect(audit.createdAt).toBeTruthy();
      expect(() => new Date(audit.createdAt as Date)).not.toThrow();
    });
  });

  describe('getAuditRecords', () => {
    it('returns stored records', async () => {
      await recordIncidentAudit('inc_1', 'detected');
      await recordIncidentAudit('inc_2', 'resolved');
      const records = await getAuditRecords();
      expect(records.length).toBeGreaterThanOrEqual(2);
    });

    it('filters by incidentId', async () => {
      await recordIncidentAudit('inc_a', 'detected');
      await recordIncidentAudit('inc_b', 'resolved');
      const records = await getAuditRecords('inc_a');
      expect(records.every((r) => r.incidentId === 'inc_a')).toBe(true);
    });

    it('returns empty array when no records match', async () => {
      const records = await getAuditRecords('nonexistent');
      expect(records.length).toBe(0);
    });
  });

  describe('createIncidentAndAudit', () => {
    it('creates incident and audit record atomically', async () => {
      const incident = await createIncidentAndAudit({
        category: 'security',
        severity: 'critical',
        safeTitle: 'Test Incident',
        safeSummary: 'A test incident',
        reasonCodes: ['test_signal'],
        affectedComponents: ['TestComponent'],
        studentSafetyRelevant: false,
        privacyRelevant: false,
        deenGovernanceRelevant: false,
      }, 'admin');

      expect(incident).toHaveProperty('id');
      expect(incident.category).toBe('security');
      expect(incident.status).toBe('open');

      const audits = await getAuditRecords(incident.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].action).toBe('incident_created');
    });
  });

  describe('transitionIncidentStatus', () => {
    it('transitions from open to acknowledged', async () => {
      const incident = await createIncidentAndAudit({
        category: 'database',
        severity: 'high',
        safeTitle: 'DB Issue',
        safeSummary: 'Database degradation',
      }, 'admin');

      const updated = await transitionIncidentStatus(incident.id, 'acknowledged', 'admin');
      expect(updated.status).toBe('acknowledged');

      const audits = await getAuditRecords(incident.id);
      expect(audits.some((a) => a.action === 'status_acknowledged')).toBe(true);
    });

    it('rejects invalid transition from resolved', async () => {
      const incident = await createIncidentAndAudit({
        category: 'database',
        severity: 'low',
        safeTitle: 'Test',
        safeSummary: 'Test incident',
      }, 'admin');

      await transitionIncidentStatus(incident.id, 'resolved', 'admin');
      await expect(
        transitionIncidentStatus(incident.id, 'acknowledged', 'admin'),
      ).rejects.toThrow(/Invalid status transition/);
    });

    it('rejects invalid transition from false_positive', async () => {
      const incident = await createIncidentAndAudit({
        category: 'database',
        severity: 'low',
        safeTitle: 'Test',
        safeSummary: 'Test incident',
      }, 'admin');

      await transitionIncidentStatus(incident.id, 'false_positive', 'admin');
      await expect(
        transitionIncidentStatus(incident.id, 'acknowledged', 'admin'),
      ).rejects.toThrow(/Invalid status transition/);
    });
  });

  describe('appendSafeAuditNote', () => {
    it('appends audit note to existing incident', async () => {
      const incident = await createIncidentAndAudit({
        category: 'privacy',
        severity: 'high',
        safeTitle: 'Privacy Alert',
        safeSummary: 'Possible privacy issue',
      }, 'admin');

      const audit = await appendSafeAuditNote(incident.id, 'Reviewed and escalated', 'privacy_officer');
      expect(audit.action).toBe('audit_note');
      expect(audit.safeNote).toBe('Reviewed and escalated');
    });

    it('throws when incident not found', async () => {
      await expect(
        appendSafeAuditNote('nonexistent', 'test note', 'admin'),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('audit records have only safe metadata fields', () => {
    it('includes only expected metadata fields', async () => {
      const audit = await recordIncidentAudit('inc_test_safe', 'investigated', 'admin');
      const allowed = new Set([
        'id', 'incidentId', 'schoolId', 'actorRole', 'actorIdSafe',
        'action', 'previousStatus', 'newStatus', 'safeNote',
        'metadataSafeJson', 'redactionStatus', 'createdAt',
        'requestId', 'correlationId',
      ]);
      for (const key of Object.keys(audit)) {
        expect(allowed.has(key)).toBe(true);
      }
    });
  });
});
