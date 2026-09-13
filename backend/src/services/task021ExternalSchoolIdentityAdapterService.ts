import { createHash } from 'crypto';
import type {
  Task021ExternalSchoolIdentity,
  Task021ExternalIdentityProvider,
  Task021SchoolIntegrationContext,
} from '../contracts/task021SchoolIntegrationContracts';
import { TASK021_FORBIDDEN_FIELDS } from '../contracts/task021SchoolIntegrationContracts';

export interface NormalizedExternalIdentity {
  externalUserId: string;
  schoolId: string;
  provider: Task021ExternalIdentityProvider;
  actorRole: string;
  safeDisplayName?: string;
  safeEmailHash?: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  externalParentId?: string;
  reasonCodes: string[];
}

export function hashExternalSubject(subject: string): string {
  return createHash('sha256').update(subject).digest('hex').slice(0, 16);
}

export function normalizeExternalSchoolIdentity(
  identity: Task021ExternalSchoolIdentity,
): NormalizedExternalIdentity {
  const reasonCodes: string[] = ['identity_normalized'];
  const safeDisplayName = identity.safeDisplayName
    ? identity.safeDisplayName.slice(0, 100)
    : undefined;

  const safeEmailHash = identity.safeEmailHash
    ? identity.safeEmailHash
    : identity.externalUserId
      ? hashExternalSubject(identity.externalUserId)
      : undefined;

  return {
    externalUserId: identity.externalUserId,
    schoolId: identity.schoolId,
    provider: identity.provider,
    actorRole: identity.actorRole,
    safeDisplayName,
    safeEmailHash,
    externalStudentId: identity.externalStudentId,
    externalTeacherId: identity.externalTeacherId,
    externalParentId: identity.externalParentId,
    reasonCodes,
  };
}

export function extractSafeExternalIdentityFromAuthContext(
  context: Task021SchoolIntegrationContext,
): NormalizedExternalIdentity {
  const reasonCodes: string[] = ['extracted_from_auth_context'];

  if (!context.schoolId) throw new Error('Missing schoolId in auth context');
  if (!context.provider) throw new Error('Missing provider in auth context');

  const externalUserId = context.externalUserId || context.externalSubjectId || 'unknown';

  return {
    externalUserId,
    schoolId: context.schoolId,
    provider: context.provider,
    actorRole: context.actorRole,
    externalStudentId: context.externalStudentId,
    externalTeacherId: context.externalTeacherId,
    externalParentId: context.externalParentId,
    reasonCodes,
  };
}

export function rejectUnsafeExternalIdentityPayload(
  payload: Record<string, unknown>,
): string[] {
  const forbidden = TASK021_FORBIDDEN_FIELDS as readonly string[];
  const found: string[] = [];
  for (const key of Object.keys(payload)) {
    if (forbidden.includes(key)) {
      found.push(key);
    }
  }
  return found;
}

export function buildExternalIdentitySummary(
  identity: NormalizedExternalIdentity,
): Record<string, unknown> {
  return {
    schoolId: identity.schoolId,
    provider: identity.provider,
    role: identity.actorRole,
    hasDisplayName: !!identity.safeDisplayName,
    hasEmailHash: !!identity.safeEmailHash,
    hasStudentId: !!identity.externalStudentId,
    hasTeacherId: !!identity.externalTeacherId,
    hasParentId: !!identity.externalParentId,
    reasonCodes: identity.reasonCodes,
  };
}
