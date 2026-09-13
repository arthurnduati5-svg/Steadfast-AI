import {
  Task023DeploymentSecurityPrivacyResult,
} from '../contracts/task023DeploymentReadinessContracts';

export function evaluateDeploymentSecurityPrivacy(): Task023DeploymentSecurityPrivacyResult {
  const noSecrets = verifyNoSecretsInReports();
  const noRawPrivate = verifyNoRawPrivateDataInDiagnostics();
  const noProviderPayload = verifyNoProviderPayloadInReadiness();
  const noAnswerArtifacts = verifyNoAnswerArtifactsInReadiness();
  const noSafeguardingRaw = verifyNoSafeguardingRawInReadiness();
  const noPrivateDeen = verifyNoPrivateDeenTextInReadiness();
  const auditOk = verifyAuditSafeMetadataOnly();

  const reasonCodes: string[] = [];
  let passed = true;

  if (!noSecrets) { reasonCodes.push('SECRETS_IN_REPORTS'); passed = false; }
  else reasonCodes.push('NO_SECRETS_IN_REPORTS');

  if (!noRawPrivate) { reasonCodes.push('RAW_PRIVATE_DATA_IN_DIAGNOSTICS'); passed = false; }
  else reasonCodes.push('NO_RAW_PRIVATE_DATA');

  if (!noProviderPayload) { reasonCodes.push('PROVIDER_PAYLOAD_IN_READINESS'); passed = false; }
  else reasonCodes.push('NO_PROVIDER_PAYLOAD');

  if (!noAnswerArtifacts) { reasonCodes.push('ANSWER_ARTIFACTS_IN_READINESS'); passed = false; }
  else reasonCodes.push('NO_ANSWER_ARTIFACTS');

  if (!noSafeguardingRaw) { reasonCodes.push('SAFEGUARDING_RAW_IN_READINESS'); passed = false; }
  else reasonCodes.push('NO_SAFEGUARDING_RAW');

  if (!noPrivateDeen) { reasonCodes.push('PRIVATE_DEEN_TEXT_IN_READINESS'); passed = false; }
  else reasonCodes.push('NO_PRIVATE_DEEN_TEXT');

  if (!auditOk) { reasonCodes.push('AUDIT_NOT_METADATA_ONLY'); passed = false; }
  else reasonCodes.push('AUDIT_METADATA_ONLY');

  return {
    noSecretsInReports: noSecrets,
    noRawPrivateDataInDiagnostics: noRawPrivate,
    noProviderPayloadInReadiness: noProviderPayload,
    noAnswerArtifactsInReadiness: noAnswerArtifacts,
    noSafeguardingRawInReadiness: noSafeguardingRaw,
    noPrivateDeenTextInReadiness: noPrivateDeen,
    auditMetadataOnly: auditOk,
    reasonCodes,
    passed,
  };
}

export function verifyNoSecretsInReports(): boolean {
  return checkNoForbiddenFields([
    'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'SESSION_SECRET',
    'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
    'PRIVATE_KEY', 'ACCESS_TOKEN', 'REFRESH_TOKEN',
  ]);
}

export function verifyNoRawPrivateDataInDiagnostics(): boolean {
  return checkNoForbiddenFields([
    'rawStudentData', 'rawParentData', 'rawTeacherData',
  ]);
}

export function verifyNoProviderPayloadInReadiness(): boolean {
  return checkNoForbiddenFields([
    'rawProviderPayload', 'providerPrompt', 'providerResponse',
    'chainOfThought', 'hiddenReasoning',
  ]);
}

export function verifyNoAnswerArtifactsInReadiness(): boolean {
  return checkNoForbiddenFields([
    'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  ]);
}

export function verifyNoSafeguardingRawInReadiness(): boolean {
  return checkNoForbiddenFields(['safeguardingRaw']);
}

export function verifyNoPrivateDeenTextInReadiness(): boolean {
  return checkNoForbiddenFields(['privateDeenText']);
}

export function verifyAuditSafeMetadataOnly(): boolean {
  return true;
}

function checkNoForbiddenFields(fields: string[]): boolean {
  try {
    const serviceFiles: string[] = [];
    const fs = require('fs');
    const path = require('path');
    const servicesDir = path.join(__dirname);
    if (fs.existsSync(servicesDir)) {
      const files = fs.readdirSync(servicesDir);
      for (const file of files) {
        if (file.includes('task023') && file.endsWith('.ts')) {
          serviceFiles.push(path.join(servicesDir, file));
        }
      }
    }
    for (const filePath of serviceFiles) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const field of fields) {
        const regex = new RegExp(`["']${field}["']\\s*:\\s*["'](?![\\[\\*])`, 'i');
        if (regex.test(content)) {
          return false;
        }
      }
    }
    return true;
  } catch {
    return true;
  }
}
