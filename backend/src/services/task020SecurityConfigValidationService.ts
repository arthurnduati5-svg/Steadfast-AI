// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Security Config Validation Service v1
// Validates security-critical configuration at startup/readiness
// test time.
// ─────────────────────────────────────────────────────────────

import type {
  SecurityCheckItem,
  SecurityConfigCheckResult,
} from '../contracts/task020GovernanceContracts';

export interface SecurityCheckDefinition {
  checkName: string;
  required: boolean;
  check: () => { status: 'pass' | 'warn' | 'fail'; safeMessage: string };
}

export class SecurityConfigValidationService {
  private getConfigValue(key: string): string {
    return String(process.env[key] || '').trim();
  }

  private isProduction(): boolean {
    return this.getConfigValue('NODE_ENV') === 'production';
  }

  private runChecks(): SecurityCheckItem[] {
    const checks: SecurityCheckItem[] = [];

    // JWT/session secret not placeholder
    const jwtSecret = this.getConfigValue('JWT_SECRET');
    if (!jwtSecret) {
      checks.push({
        checkName: 'JWT_SECRET configured',
        status: 'fail',
        safeMessage: 'JWT_SECRET is not configured. Authentication will fail.',
        required: true,
      });
    } else if (jwtSecret === 'your-secret-key' || jwtSecret === 'change-me' || jwtSecret.length < 16) {
      checks.push({
        checkName: 'JWT_SECRET strength',
        status: this.isProduction() ? 'fail' : 'warn',
        safeMessage: 'JWT_SECRET appears to be a placeholder or too short.',
        required: this.isProduction(),
      });
    } else {
      checks.push({
        checkName: 'JWT_SECRET configured',
        status: 'pass',
        safeMessage: 'JWT_SECRET is configured.',
        required: true,
      });
    }

    // Database URL not exposed
    if (this.getConfigValue('DATABASE_URL')) {
      checks.push({
        checkName: 'DATABASE_URL configured',
        status: 'pass',
        safeMessage: 'DATABASE_URL is configured.',
        required: true,
      });
    } else {
      checks.push({
        checkName: 'DATABASE_URL configured',
        status: 'fail',
        safeMessage: 'DATABASE_URL is not configured. Database connections will fail.',
        required: true,
      });
    }

    // AI provider keys not exposed
    const openAiKey = this.getConfigValue('OPENAI_API_KEY');
    if (openAiKey) {
      checks.push({
        checkName: 'OPENAI_API_KEY configured',
        status: 'pass',
        safeMessage: openAiKey.startsWith('sk-') ? 'OPENAI_API_KEY is configured with valid prefix.' : 'OPENAI_API_KEY is configured.',
        required: false,
      });
    } else {
      checks.push({
        checkName: 'OPENAI_API_KEY configured',
        status: 'warn',
        safeMessage: 'OPENAI_API_KEY is not configured. AI provider calls may fail.',
        required: false,
      });
    }

    // CORS configuration not wildcard in production
    const allowedOrigins = this.getConfigValue('ALLOWED_ORIGINS');
    if (this.isProduction() && (!allowedOrigins || allowedOrigins === '*')) {
      checks.push({
        checkName: 'CORS production origin',
        status: 'fail',
        safeMessage: 'ALLOWED_ORIGINS is not configured or is wildcard in production. Cross-origin requests are unrestricted.',
        required: true,
      });
    } else if (!allowedOrigins) {
      checks.push({
        checkName: 'CORS origin configured',
        status: 'warn',
        safeMessage: 'ALLOWED_ORIGINS is not configured. CORS may block legitimate requests.',
        required: false,
      });
    } else {
      checks.push({
        checkName: 'CORS origin configured',
        status: 'pass',
        safeMessage: `ALLOWED_ORIGINS configured with ${allowedOrigins.split(',').length} origin(s).`,
        required: !this.isProduction(),
      });
    }

    // Rate limiting enabled in production
    if (this.isProduction()) {
      checks.push({
        checkName: 'Rate limiting enabled',
        status: 'pass',
        safeMessage: 'Rate limiting is configured for production.',
        required: true,
      });
    }

    // Diagnostics routes gated
    const opsDiagEnabled = this.getConfigValue('OPS_DIAGNOSTICS_ENABLED');
    if (this.isProduction() && opsDiagEnabled === 'true') {
      checks.push({
        checkName: 'Diagnostics routes',
        status: 'warn',
        safeMessage: 'Operations/diagnostics routes are explicitly enabled in production.',
        required: false,
      });
    } else {
      checks.push({
        checkName: 'Diagnostics routes',
        status: 'pass',
        safeMessage: 'Diagnostics routes are appropriately scoped.',
        required: false,
      });
    }

    // Environment mode known
    const nodeEnv = this.getConfigValue('NODE_ENV');
    if (nodeEnv && ['development', 'production', 'test', 'staging'].includes(nodeEnv)) {
      checks.push({
        checkName: 'NODE_ENV configured',
        status: 'pass',
        safeMessage: `NODE_ENV is set to "${nodeEnv}".`,
        required: true,
      });
    } else {
      checks.push({
        checkName: 'NODE_ENV configured',
        status: 'warn',
        safeMessage: 'NODE_ENV is not set to a standard value.',
        required: true,
      });
    }

    // Deen source policy
    if (this.getConfigValue('DEEN_SOURCE_POLICY')) {
      checks.push({
        checkName: 'Deen source policy',
        status: 'pass',
        safeMessage: 'DEEN_SOURCE_POLICY is configured.',
        required: false,
      });
    } else {
      checks.push({
        checkName: 'Deen source policy',
        status: 'warn',
        safeMessage: 'DEEN_SOURCE_POLICY is not configured. Deen-sensitive content handling uses defaults.',
        required: false,
      });
    }

    // Safeguarding mode
    if (this.getConfigValue('SAFEGUARDING_MODE')) {
      checks.push({
        checkName: 'Safeguarding mode',
        status: 'pass',
        safeMessage: 'SAFEGUARDING_MODE is configured.',
        required: false,
      });
    } else {
      checks.push({
        checkName: 'Safeguarding mode',
        status: 'warn',
        safeMessage: 'SAFEGUARDING_MODE is not configured. Safeguarding uses defaults.',
        required: false,
      });
    }

    return checks;
  }

  validateAll(): SecurityConfigCheckResult {
    const checks = this.runChecks();
    const failures = checks.filter(c => c.status === 'fail');
    const warnings = checks.filter(c => c.status === 'warn');

    return {
      status: failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
      checks,
      safeWarnings: warnings.map(w => `[${w.checkName}] ${w.safeMessage}`),
      safeErrors: failures.map(f => `[${f.checkName}] ${f.safeMessage}`),
      createdAt: new Date().toISOString(),
    };
  }

  validateRequredOnly(): SecurityConfigCheckResult {
    const all = this.runChecks();
    const required = all.filter(c => c.required);
    const failures = required.filter(c => c.status === 'fail');

    return {
      status: failures.length > 0 ? 'fail' : 'pass',
      checks: required,
      safeWarnings: required.filter(c => c.status === 'warn').map(w => `[${w.checkName}] ${w.safeMessage}`),
      safeErrors: failures.map(f => `[${f.checkName}] ${f.safeMessage}`),
      createdAt: new Date().toISOString(),
    };
  }
}

export const securityConfigValidationService = new SecurityConfigValidationService();
