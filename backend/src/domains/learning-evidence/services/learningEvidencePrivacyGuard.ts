// Privacy guard for the Learning Evidence Event Store
// Rejects forbidden payload keys recursively before event append.

import { hasForbiddenKeys } from '../contracts/learningEvidencePrivacyContracts';

export class LearningEvidencePrivacyGuard {
  validatePayload(payload: Record<string, unknown>): { valid: boolean; forbiddenKeys: string[] } {
    const forbiddenKeys = hasForbiddenKeys(payload);
    return {
      valid: forbiddenKeys.length === 0,
      forbiddenKeys,
    };
  }

  sanitizeCommandBody(body: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith('raw') && !key.startsWith('_')) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitized[key] = this.sanitizeCommandBody(value as Record<string, unknown>);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }
}
