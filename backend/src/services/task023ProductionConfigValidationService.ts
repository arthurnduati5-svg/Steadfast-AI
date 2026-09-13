import {
  Task023ProductionConfigResult,
  Task023EnvironmentGateStatus,
} from '../contracts/task023DeploymentReadinessContracts';
import { getDeploymentEnvironment, isStrictMode } from './task023EnvironmentGateService';

export function validateProductionConfig(): Task023ProductionConfigResult {
  const env = getDeploymentEnvironment();
  const strict = isStrictMode();
  const envConfig: Record<string, string | undefined> = {};
  for (const key of ['ALLOWED_ORIGINS', 'SCHOOL_INTEGRATION_ENABLED', 'TASK020_ENABLED', 'TASK021_ENABLED', 'TASK022_ENABLED', 'AI_PROVIDER_MODE', 'LIVE_SCHOOL_CONNECTOR_ENABLED', 'LOG_LEVEL']) {
    envConfig[key] = process.env[key];
  }
  const corsOrigins = (process.env.ALLOWED_ORIGINS || '').trim();
  const corsSafe = strict ? (corsOrigins !== '*' && corsOrigins.length > 0) : true;
  const schoolAuthEnabled = process.env.SCHOOL_INTEGRATION_ENABLED !== 'false';
  const task020Enabled = process.env.TASK020_ENABLED !== 'false';
  const task021Enabled = process.env.TASK021_ENABLED !== 'false';
  const task022Enabled = process.env.TASK022_ENABLED !== 'false';
  const aiProviderMode = (process.env.AI_PROVIDER_MODE || '').toLowerCase();
  const liveAiBlocked = strict ? (aiProviderMode !== 'live' && aiProviderMode !== '') : true;
  const liveConnectorEnabled = process.env.LIVE_SCHOOL_CONNECTOR_ENABLED === 'true';
  const liveConnectorBlocked = strict ? !liveConnectorEnabled : true;
  const loggingRawContent = (process.env.LOG_LEVEL || '').toLowerCase() === 'debug'
    && strict ? false : true;

  const reasonCodes: string[] = [];
  let passed = true;

  if (!corsSafe) {
    reasonCodes.push('UNSAFE_CORS_WILDCARD');
    passed = false;
  } else {
    reasonCodes.push('CORS_SAFE');
  }

  if (strict && !schoolAuthEnabled) {
    reasonCodes.push('SCHOOL_AUTH_DISABLED');
    passed = false;
  } else {
    reasonCodes.push('SCHOOL_AUTH_ENABLED');
  }

  if (strict && !task020Enabled) {
    reasonCodes.push('TASK020_DISABLED');
    passed = false;
  } else {
    reasonCodes.push('TASK020_ENABLED');
  }

  if (strict && !task021Enabled) {
    reasonCodes.push('TASK021_DISABLED');
    passed = false;
  } else {
    reasonCodes.push('TASK021_ENABLED');
  }

  if (strict && !task022Enabled) {
    reasonCodes.push('TASK022_DISABLED');
    passed = false;
  } else {
    reasonCodes.push('TASK022_ENABLED');
  }

  if (!liveAiBlocked) {
    reasonCodes.push('LIVE_AI_PROVIDER_ACCIDENTALLY_ENABLED');
    passed = false;
  } else {
    reasonCodes.push('LIVE_AI_PROVIDER_BLOCKED');
  }

  if (!liveConnectorBlocked) {
    reasonCodes.push('LIVE_SCHOOL_CONNECTOR_ACCIDENTALLY_ENABLED');
    passed = false;
  } else {
    reasonCodes.push('LIVE_SCHOOL_CONNECTOR_BLOCKED');
  }

  if (!loggingRawContent) {
    reasonCodes.push('RAW_CONTENT_LOGGING_IN_STRICT_MODE');
    passed = false;
  } else {
    reasonCodes.push('LOGGING_SAFE');
  }

  return {
    corsSafe,
    schoolAuthEnabled,
    task020GovernanceEnabled: task020Enabled,
    task021SchoolIntegrationEnabled: task021Enabled,
    task022ContentGovernanceEnabled: task022Enabled,
    liveAiProviderBlocked: liveAiBlocked,
    liveSchoolConnectorBlocked: liveConnectorBlocked,
    privacyLoggingSafe: loggingRawContent,
    reasonCodes,
    passed,
  };
}

export function validateCorsConfig(): boolean {
  if (!isStrictMode()) return true;
  const origins = (process.env.ALLOWED_ORIGINS || '').trim();
  return origins !== '*' && origins.length > 0;
}

export function validateSchoolAuthConfig(): boolean {
  return process.env.SCHOOL_INTEGRATION_ENABLED !== 'false';
}

export function validateAiProviderModeConfig(): boolean {
  if (!isStrictMode()) return true;
  const mode = (process.env.AI_PROVIDER_MODE || '').toLowerCase();
  return mode !== 'live';
}
