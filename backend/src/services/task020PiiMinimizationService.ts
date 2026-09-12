// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 PII Minimization Service v1
// Ensures only required identity fields are used and returned.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import type {
  PiiClassificationRequest,
  PiiClassificationResult,
} from '../contracts/task020GovernanceContracts';

const PII_FIELD_PATTERNS = [
  'email', 'phone', 'address', 'ssn', 'dob', 'dateOfBirth',
  'passport', 'nationalId', 'studentId',
];

const DISPLAY_NAME_FIELDS = ['name', 'displayName', 'firstName', 'lastName', 'fullName'];

export class PiiMinimizationService {
  classifyFields(request: PiiClassificationRequest): PiiClassificationResult {
    const piiFields: string[] = [];
    const safeFields: string[] = [];
    const redactedFields: string[] = [];

    for (const field of request.fields) {
      const lower = field.toLowerCase();
      const isPii = PII_FIELD_PATTERNS.some(p => lower.includes(p));
      const isName = DISPLAY_NAME_FIELDS.some(p => lower.includes(p));

      if (isPii) {
        piiFields.push(field);
        redactedFields.push(field);
      } else if (isName && request.context !== 'self_view') {
        redactedFields.push(field);
        safeFields.push(field);
      } else {
        safeFields.push(field);
      }
    }

    return {
      containsPii: piiFields.length > 0,
      piiFields,
      safeFields,
      redactedFields,
      displaySafeName: null,
      hashedIdentifier: null,
      reasonCodes: this.buildReasonCodes(piiFields, redactedFields),
    };
  }

  getSafeDisplayName(rawName: string): string {
    if (!rawName || rawName.trim() === '') return 'Learner';
    const parts = rawName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  hashIdentifier(input: string | undefined | null): string | null {
    if (!input) return null;
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  isPiiField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return PII_FIELD_PATTERNS.some(p => lower.includes(p));
  }

  sanitizeLogFields(record: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (this.isPiiField(key)) {
        safe[key] = '[REDACTED]';
      } else {
        safe[key] = value;
      }
    }
    return safe;
  }

  private buildReasonCodes(piiFields: string[], redactedFields: string[]): string[] {
    const codes: string[] = [];
    if (piiFields.length > 0) codes.push(`pii-fields-identified:${piiFields.join(',')}`);
    if (redactedFields.length > 0) codes.push(`fields-redacted:${redactedFields.length}`);
    codes.push('pii-minimization-applied');
    return codes;
  }
}

export const piiMinimizationService = new PiiMinimizationService();
