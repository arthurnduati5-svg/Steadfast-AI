/**
 * Backend Health (Liveness) Service
 *
 * Returns liveness status without deep dependency checks.
 * Designed for /health/live endpoint.
 */

export interface BackendLivenessResult {
  ok: boolean;
  status: 'live';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  version: string | null;
}

export function getBackendLiveness(): BackendLivenessResult {
  return {
    ok: true,
    status: 'live',
    service: 'steadfast-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.max(1, Math.round(process.uptime())),
    version: process.env.npm_package_version || null,
  };
}
