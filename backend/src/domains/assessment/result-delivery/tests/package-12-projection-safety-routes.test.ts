import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 12 — Projection Safety Routes', () => {
  const routesDir = path.resolve(__dirname, '../../../../routes');
  const indexFile = path.resolve(__dirname, '../../../../index.ts');

  it('resultDelivery routes file exists', () => {
    const routeFile = path.join(routesDir, 'resultDelivery.ts');
    expect(fs.existsSync(routeFile)).toBe(true);
  });

  it('route file exports default router', () => {
    const routeFile = path.join(routesDir, 'resultDelivery.ts');
    const content = fs.readFileSync(routeFile, 'utf-8');
    expect(content).toContain('Router');
    expect(content).toContain('export default router');
  });

  it('index.ts mounts /api/question-bank/result-delivery routes', () => {
    const content = fs.readFileSync(indexFile, 'utf-8');
    expect(content).toContain('result-delivery');
    expect(content).toContain('resultDeliveryRoutes');
  });

  it('ai.ts has no Package 12 result delivery expansion', () => {
    const aiFile = path.join(routesDir, 'ai.ts');
    const content = fs.readFileSync(aiFile, 'utf-8');
    expect(content).not.toContain('ResultDelivery');
    expect(content).not.toContain('resultDelivery');
    expect(content).not.toContain('package-12');
    expect(content).not.toContain('Package12');
  });

  it('projection safety service exists and exports', async () => {
    const mod = await import('../services/resultDeliveryProjectionSafetyService');
    expect(mod.ResultDeliveryProjectionSafetyService).toBeDefined();
    expect(typeof mod.ResultDeliveryProjectionSafetyService.prototype.toTeacherProjection).toBe('function');
    expect(typeof mod.ResultDeliveryProjectionSafetyService.prototype.toAdminProjection).toBe('function');
    expect(typeof mod.ResultDeliveryProjectionSafetyService.prototype.toStudentSafeProjection).toBe('function');
    expect(typeof mod.ResultDeliveryProjectionSafetyService.prototype.toParentBoundaryProjection).toBe('function');
  });

  it('projection contracts define all projection types in source file', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/resultDeliveryProjectionContracts.ts'), 'utf-8');
    expect(content).toContain('ResultDeliveryTeacherProjection');
    expect(content).toContain('ResultDeliveryAdminProjection');
    expect(content).toContain('ResultDeliveryStudentSafeProjection');
    expect(content).toContain('ResultDeliveryParentBoundaryProjection');
  });

  it('routes directory contains resultRelease route', () => {
    const resultReleaseFile = path.join(routesDir, 'resultRelease.ts');
    expect(fs.existsSync(resultReleaseFile)).toBe(true);
  });

  it('resultRelease route has projection safety routes', () => {
    const content = fs.readFileSync(path.join(routesDir, 'resultRelease.ts'), 'utf-8');
    expect(content).toContain('/projection/teacher');
    expect(content).toContain('/projection/admin');
    expect(content).toContain('/projection/student-safe');
    expect(content).toContain('/projection/parent-boundary');
  });
});
