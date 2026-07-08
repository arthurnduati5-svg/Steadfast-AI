import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordSafeEvent,
  validateEventPrivacyLevel,
  redactSensitivePayload,
  getMetricsSnapshot,
  filterByComponent,
  filterByCategory,
  filterBySeverity,
  filterByTimeRange,
  clearEvents,
} from '../services/task024SafeTelemetryService';
import type { TelemetryEventCategory, OperationalSeverity } from '../contracts/task024OperationsContracts';

const validEvent = {
  component: 'auth-service',
  category: 'request' as TelemetryEventCategory,
  severity: 'info' as OperationalSeverity,
  status: 'healthy' as const,
  safeSummary: 'Auth request completed',
};

describe('SafeTelemetryService', () => {
  beforeEach(() => {
    clearEvents();
  });

  describe('recordSafeEvent', () => {
    it('records a valid event successfully', () => {
      const result = recordSafeEvent(validEvent);
      expect(result.id).toMatch(/^tev_/);
      expect(result.timestamp).toBeTruthy();
      expect(result.component).toBe('auth-service');
      expect(result.category).toBe('request');
    });

    it('returns the event with id and timestamp', () => {
      const result = recordSafeEvent(validEvent);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
    });

    it('throws when event has forbidden fields', () => {
      const badEvent = {
        ...validEvent,
        rawChat: 'some raw chat',
      } as any;
      expect(() => recordSafeEvent(badEvent)).toThrow('Safe Telemetry: Forbidden field present: rawChat');
    });

    it('throws for multiple forbidden field types', () => {
      const badEvent = {
        ...validEvent,
        token: 'abc123',
        secret: 'shh',
      } as any;
      expect(() => recordSafeEvent(badEvent)).toThrow('Safe Telemetry: Forbidden field present: token');
    });
  });

  describe('validateEventPrivacyLevel', () => {
    it('returns safe for a clean event', () => {
      const cleanEvent = recordSafeEvent(validEvent);
      const result = validateEventPrivacyLevel(cleanEvent);
      expect(result).toEqual({ safe: true });
    });

    it('returns unsafe for an event with a forbidden field', () => {
      const badEvent = {
        ...validEvent,
        id: 'tev_1',
        timestamp: new Date().toISOString(),
        databaseUrl: 'postgres://localhost:5432/db',
      } as any;
      const result = validateEventPrivacyLevel(badEvent);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('databaseUrl');
    });
  });

  describe('redactSensitivePayload', () => {
    it('redacts unsafe fields from a payload object', () => {
      const payload = {
        component: 'auth-service',
        email: 'test@example.com',
        token: 'sk-secret123',
        safeSummary: 'All good',
      };
      const result = redactSensitivePayload(payload);
      expect(result.email).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.component).toBe('auth-service');
      expect(result.safeSummary).toBe('All good');
    });

    it('returns a copy without mutating the original', () => {
      const payload = { apiKey: 'sk-12345678901234567890' };
      const result = redactSensitivePayload(payload);
      expect(result.apiKey).toBe('[REDACTED]');
      expect(payload.apiKey).toBe('sk-12345678901234567890');
    });
  });

  describe('getMetricsSnapshot', () => {
    it('returns correct shape', () => {
      const snapshot = getMetricsSnapshot();
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('requestId');
      expect(snapshot).toHaveProperty('requestCount');
      expect(snapshot).toHaveProperty('errorCount');
      expect(snapshot).toHaveProperty('rateLimitCount');
      expect(snapshot).toHaveProperty('readinessStatusCounts');
      expect(snapshot).toHaveProperty('incidentCountBySeverity');
      expect(snapshot).toHaveProperty('incidentCountByCategory');
      expect(snapshot).toHaveProperty('contentGapCount');
      expect(snapshot).toHaveProperty('approvedSourceUnavailableCount');
      expect(snapshot).toHaveProperty('schoolContextDeniedCount');
      expect(snapshot).toHaveProperty('aiGatewayBlockedCount');
      expect(snapshot).toHaveProperty('databaseReadinessFailures');
      expect(snapshot).toHaveProperty('backupReadinessStatus');
      expect(snapshot).toHaveProperty('restoreDrillStatus');
    });

    it('has correct defaults', () => {
      const snapshot = getMetricsSnapshot();
      expect(snapshot.requestCount).toBe(0);
      expect(snapshot.errorCount).toBe(0);
      expect(snapshot.rateLimitCount).toBe(0);
      expect(snapshot.contentGapCount).toBe(0);
      expect(snapshot.approvedSourceUnavailableCount).toBe(0);
      expect(snapshot.schoolContextDeniedCount).toBe(0);
      expect(snapshot.aiGatewayBlockedCount).toBe(0);
      expect(snapshot.databaseReadinessFailures).toBe(0);
      expect(snapshot.backupReadinessStatus).toBe('unknown');
      expect(snapshot.restoreDrillStatus).toBe('unknown');
    });

    it('reflects recorded event counts', () => {
      recordSafeEvent({ ...validEvent, category: 'error', severity: 'critical' });
      recordSafeEvent({ ...validEvent, category: 'request' });
      const snapshot = getMetricsSnapshot();
      expect(snapshot.requestCount).toBe(1);
      expect(snapshot.errorCount).toBe(1);
    });
  });

  describe('filterByComponent', () => {
    it('filters events by component', () => {
      recordSafeEvent({ ...validEvent, component: 'alpha' });
      recordSafeEvent({ ...validEvent, component: 'beta' });
      recordSafeEvent({ ...validEvent, component: 'alpha' });
      const results = filterByComponent('alpha');
      expect(results).toHaveLength(2);
      results.forEach((e) => expect(e.component).toBe('alpha'));
    });

    it('returns empty array when no events match', () => {
      const results = filterByComponent('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('filterByCategory', () => {
    it('filters events by category', () => {
      recordSafeEvent({ ...validEvent, category: 'error' });
      recordSafeEvent({ ...validEvent, category: 'audit' });
      recordSafeEvent({ ...validEvent, category: 'error' });
      const results = filterByCategory('error');
      expect(results).toHaveLength(2);
      results.forEach((e) => expect(e.category).toBe('error'));
    });
  });

  describe('filterBySeverity', () => {
    it('filters events by severity', () => {
      recordSafeEvent({ ...validEvent, severity: 'high' });
      recordSafeEvent({ ...validEvent, severity: 'low' });
      recordSafeEvent({ ...validEvent, severity: 'high' });
      const results = filterBySeverity('high');
      expect(results).toHaveLength(2);
      results.forEach((e) => expect(e.severity).toBe('high'));
    });
  });

  describe('filterByTimeRange', () => {
    it('filters events within a time range', () => {
      const before = new Date();
      const e1 = recordSafeEvent(validEvent);
      const e2 = recordSafeEvent(validEvent);
      const after = new Date();
      const results = filterByTimeRange(before.toISOString(), after.toISOString());
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.map((r) => r.id)).toContain(e1.id);
      expect(results.map((r) => r.id)).toContain(e2.id);
    });

    it('returns empty when no events fall in range', () => {
      const results = filterByTimeRange('1990-01-01T00:00:00.000Z', '1990-01-01T00:00:00.001Z');
      expect(results).toEqual([]);
    });
  });

  describe('clearEvents', () => {
    it('clears all recorded events', () => {
      recordSafeEvent({ ...validEvent, component: 'keep' });
      expect(filterByComponent('keep')).toHaveLength(1);
      clearEvents();
      expect(filterByComponent('keep')).toHaveLength(0);
      const snapshot = getMetricsSnapshot();
      expect(snapshot.requestCount).toBe(0);
    });
  });
});
