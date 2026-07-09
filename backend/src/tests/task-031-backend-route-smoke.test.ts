import { describe, it, expect } from 'vitest';
import { runTask031BackendRouteSmoke } from '../services/task031BackendRouteSmokeService';

describe('Task 031 - Backend Route Smoke', () => {
  it('should pass with valid input', async () => {
    const result = await runTask031BackendRouteSmoke({ routePath: '/api/health/live' });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should check all health routes', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.healthRoutesChecked).toBe(4);
    expect(result.healthRoutesAccessible).toBe(4);
  });

  it('should check all task routes', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.taskRoutesChecked).toBe(12);
    expect(result.taskRoutesAccessible).toBe(12);
  });

  it('should check all service routes', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.serviceRoutesChecked).toBe(10);
    expect(result.serviceRoutesAccessible).toBe(10);
  });

  it('should calculate total routes correctly', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.totalRoutes).toBe(26);
  });

  it('should not make live connector calls', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.liveConnectorCallMade).toBe(false);
  });

  it('should not make live AI calls', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.liveAiCallMade).toBe(false);
  });

  it('should return routePath when provided', async () => {
    const result = await runTask031BackendRouteSmoke({ routePath: '/api/health/ready' });
    expect(result.routePath).toBe('/api/health/ready');
  });

  it('should return undefined routePath when not provided', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.routePath).toBeUndefined();
  });
});