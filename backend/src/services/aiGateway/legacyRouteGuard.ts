import { detectSafetyRisk } from '../safetyRiskService';
import { logger } from '../../utils/logger';

export interface LegacyRouteGuardResult {
  allowed: boolean;
  reason?: string;
}

export function checkLegacyRouteAllowed(
  studentId: string,
  sessionId: string,
  message: string,
): LegacyRouteGuardResult {
  if (!studentId || !sessionId) {
    return { allowed: false, reason: 'Missing identity or session' };
  }

  const safety = detectSafetyRisk(message);
  if (safety.flagged && (safety.severity === 'critical' || safety.severity === 'high')) {
    logger.warn({ studentId, sessionId, category: safety.category }, '[LegacyGuard] Blocked by safety check');
    return { allowed: false, reason: 'Message flagged by safety check' };
  }

  return { allowed: true };
}
