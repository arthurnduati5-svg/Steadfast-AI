import { describe, it, expect } from 'vitest';
import { createIncidentResponsePlan } from '../services/task024IncidentResponseWorkflowService';

describe('task024IncidentResponseWorkflowService', () => {
  describe('createIncidentResponsePlan', () => {
    it('returns correct shape', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_test_001', 'security', 'sev0_school_wide_safety_or_privacy', 'security_admin',
      );
      expect(plan).toHaveProperty('incidentId');
      expect(plan).toHaveProperty('severity');
      expect(plan).toHaveProperty('category');
      expect(plan).toHaveProperty('owner');
      expect(plan).toHaveProperty('escalationPath');
      expect(plan).toHaveProperty('containmentSteps');
      expect(plan).toHaveProperty('mitigationSteps');
      expect(plan).toHaveProperty('postmortemRequired');
      expect(plan).toHaveProperty('safeSummary');
      expect(plan.incidentId).toBe('inc_test_001');
      expect(Array.isArray(plan.containmentSteps)).toBe(true);
      expect(Array.isArray(plan.mitigationSteps)).toBe(true);
    });

    it('sev0 incident has containment steps', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_001', 'security', 'sev0_school_wide_safety_or_privacy', 'security_admin',
      );
      expect(plan.containmentSteps.length).toBeGreaterThanOrEqual(3);
    });

    it('sev1 incident has containment steps', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_002', 'database', 'sev1_major_learning_or_identity_outage', 'database_admin',
      );
      expect(plan.containmentSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('sev4 incident has containment steps', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_003', 'rate_limit', 'sev4_low_priority', 'operator',
      );
      expect(plan.containmentSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('plan does NOT contain secrets or raw private data', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_004', 'security', 'sev0_school_wide_safety_or_privacy', 'security_admin',
      );
      const text = JSON.stringify(plan);
      const credentialPatterns = [
        /sk-[a-zA-Z0-9]{10,}/,
        /[Aa][Pp][Ii]_?[Kk]ey\s*[:=]/,
        /[Pp]assword\s*[:=]/,
        /DATABASE_URL/,
        /raw.?student/i,
        /raw.?chat/i,
      ];
      for (const pattern of credentialPatterns) {
        expect(text).not.toMatch(pattern);
      }
    });

    it('plan does NOT contain destructive DB commands', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_005', 'database', 'sev0_school_wide_safety_or_privacy', 'database_admin',
      );
      const text = JSON.stringify(plan);
      const destructive = [/\bDROP\b/i, /\bDELETE\b/i, /\bTRUNCATE\b/i, /\bALTER\b.*\bTABLE\b/i];
      for (const pattern of destructive) {
        expect(text).not.toMatch(pattern);
      }
    });

    it('postmortemRequired is true for sev0 severity', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_006', 'security', 'sev0_school_wide_safety_or_privacy', 'security_admin',
      );
      expect(plan.postmortemRequired).toBe(true);
    });

    it('postmortemRequired is true for sev1 severity', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_007', 'database', 'sev1_major_learning_or_identity_outage', 'database_admin',
      );
      expect(plan.postmortemRequired).toBe(true);
    });

    it('postmortemRequired is false for sev3 severity', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_008', 'rate_limit', 'sev3_limited_feature_degradation', 'operator',
      );
      expect(plan.postmortemRequired).toBe(false);
    });

    it('postmortemRequired is false for sev4 severity', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_009', 'rate_limit', 'sev4_low_priority', 'operator',
      );
      expect(plan.postmortemRequired).toBe(false);
    });

    it('escalationPath differs by severity', async () => {
      const critical = await createIncidentResponsePlan(
        'inc_010', 'security', 'sev0_school_wide_safety_or_privacy', 'security_admin',
      );
      const low = await createIncidentResponsePlan(
        'inc_011', 'rate_limit', 'sev4_low_priority', 'operator',
      );
      expect(critical.escalationPath).not.toBe(low.escalationPath);
      expect(critical.escalationPath).toContain('immediate_escalation');
      expect(low.escalationPath).toContain('weekly_review');
    });

    it('escalationPath includes team lead for sev2', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_012', 'database', 'sev2_degraded_core_learning', 'engineering_lead',
      );
      expect(plan.escalationPath).toContain('team_lead');
    });

    it('mitigationSteps are present for all severities', async () => {
      const plan = await createIncidentResponsePlan(
        'inc_013', 'database', 'sev1_major_learning_or_identity_outage', 'database_admin',
      );
      expect(plan.mitigationSteps.length).toBeGreaterThanOrEqual(2);
    });
  });
});
