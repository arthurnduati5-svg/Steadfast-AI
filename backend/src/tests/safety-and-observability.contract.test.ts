/**
 * Safety and Observability Contract Test
 *
 * Verifies:
 * - Source trust safety (no obvious fake/fallback URLs in trusted source logic)
 * - Cache key safety (secrets not leaked in cache key construction)
 * - Auth/tenant route protection (sensitive routes have middleware)
 * - Observability readiness (logger, requestId, error handling, latency tracking)
 * - Env inventory consistency (key vars classified in backendEnv.ts)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');
const BSRC = resolve(__dirname, '..');

describe('Source Trust Safety', () => {
  const files: { path: string; label: string }[] = [
    { path: resolve(ROOT, 'backend/src/services/safetyRiskService.ts'), label: 'safetyRiskService.ts' },
    { path: resolve(ROOT, 'backend/src/services/externalVideoNormalizationService.ts'), label: 'externalVideoNormalizationService.ts' },
    { path: resolve(ROOT, 'backend/src/services/youtubeCreativeSourceAdapter.ts'), label: 'youtubeCreativeSourceAdapter.ts' },
    { path: resolve(ROOT, 'backend/src/services/vimeoCreativeSourceAdapter.ts'), label: 'vimeoCreativeSourceAdapter.ts' },
  ];

  for (const { path: fp, label: name } of files) {
    it(`${name} exists for source trust safety scan`, () => {
      expect(existsSync(fp)).toBe(true);
    });
    it(`${name} does not hardcode fake/fallback URLs as trusted sources`, () => {
      const content = readFileSync(fp, 'utf-8');
      for (const pat of ['example.com', 'placeholder.com']) {
        if (content.includes(pat)) {
          const lines = content.split('\n').filter(l => l.includes(pat));
          for (const line of lines) {
            const inFixture = /test|mock|fixture/.test(line);
            const inComment = /^\s*[/\*]/.test(line);
            expect(inFixture || inComment).toBe(true);
          }
        }
      }
    });
  }
});

describe('Cache Key Safety', () => {
  const files: { path: string; label: string }[] = [
    { path: resolve(BSRC, 'lib/redis.ts'), label: 'redis.ts' },
    { path: resolve(BSRC, 'lib/personalization.ts'), label: 'personalization.ts' },
    { path: resolve(ROOT, 'AI/lib/redis.ts'), label: 'AI-redis.ts' },
  ];

  for (const { path: fp, label: name } of files) {
    it(`${name} exists for cache key safety scan`, () => {
      expect(existsSync(fp)).toBe(true);
    });
    it(`${name} does not leak secrets in cache key construction`, () => {
      const content = readFileSync(fp, 'utf-8');
      const suspicious = content.match(/cacheKey.*=.*\$\{[^}]*(SECRET|KEY|TOKEN|PASSWORD)[^}]*\}/);
      expect(suspicious).toBeNull();
    });
  }
});

describe('Auth/Tenant Route Protection', () => {
  const files: { path: string; label: string }[] = [
    { path: resolve(BSRC, 'routes/profile.ts'), label: 'profile.ts' },
    { path: resolve(BSRC, 'routes/voice.ts'), label: 'voice.ts' },
  ];

  for (const { path: fp, label: name } of files) {
    it(`${name} exists for auth middleware scan`, () => {
      expect(existsSync(fp)).toBe(true);
    });
    it(`${name} includes auth middleware`, () => {
      const content = readFileSync(fp, 'utf-8');
      const refs = content.match(/schoolAuthMiddleware|requireRole|resolveStudentId/g) || [];
      expect(refs.length).toBeGreaterThan(0);
    });
  }
});

describe('Observability Readiness', () => {
  const idxContent = readFileSync(resolve(BSRC, 'index.ts'), 'utf-8');
  const readyContent = readFileSync(resolve(BSRC, 'routes/readiness.ts'), 'utf-8');
  const ridContent = readFileSync(resolve(BSRC, 'middleware/requestId.ts'), 'utf-8');

  it('has structured logger', () => {
    expect(idxContent).toContain('logger');
    expect(idxContent).toContain('httpLogger');
  });

  it('has request ID middleware', () => {
    expect(ridContent).toContain('requestIdMiddleware');
    expect(ridContent).toContain('x-request-id');
    expect(ridContent).toContain('randomUUID');
  });

  it('request ID middleware wired in entrypoint', () => {
    expect(idxContent).toContain('requestIdMiddleware');
  });

  it('has latency tracking endpoints', () => {
    expect(idxContent).toContain('latencyRoutes');
    expect(idxContent).toContain('/api/copilot/latency');
  });

  it('has global error handler', () => {
    expect(idxContent).toContain('Global Error Handler');
    expect(idxContent).toContain('logger.error');
    expect(idxContent).toContain('statusCode');
  });

  it('error handler does not expose raw secrets in responses', () => {
    const handlerSection = idxContent.split('Global Error Handler')[1] || '';
    // The error handler may reference process.env for config, but must not leak secret values
    // Check that error responses don't include secret values inline
    const respLines = handlerSection.split('\n').filter(l => l.includes('.send({'));
    for (const line of respLines) {
      expect(line).not.toContain('process.env');
    }
  });

  it('readiness endpoint redacts secrets', () => {
    expect(readyContent).not.toContain('process.env.OPENAI_API_KEY');
    expect(readyContent).not.toContain('process.env.JWT_SECRET');
    expect(readyContent).not.toContain('process.env.DATABASE_URL');
  });

  it('health endpoint is lightweight (no service calls)', () => {
    const lines = idxContent.split('\n');
    const healthIdx = lines.findIndex(l => l.includes('/api/health'));
    expect(healthIdx).toBeGreaterThanOrEqual(0);
    const handlerBlock = lines.slice(healthIdx, healthIdx + 15).join('\n');
    expect(handlerBlock).not.toContain('prisma.');
    expect(handlerBlock).not.toContain('getRedisClient');
    expect(handlerBlock).not.toContain('OpenAI(');
  });
});

describe('Environment Variable Inventory', () => {
  it('key production env vars classified in backendEnv.ts', () => {
    const envContent = readFileSync(resolve(BSRC, 'config/backendEnv.ts'), 'utf-8');
    for (const key of ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY', 'REDIS_URL', 'ALLOWED_ORIGINS', 'PORT']) {
      expect(envContent).toContain(key);
    }
  });

  it('BACKEND_ENV_RULES list exported with valid categories', async () => {
    const mod = await import('../config/backendEnv');
    expect(mod.BACKEND_ENV_RULES).toBeDefined();
    expect(mod.BACKEND_ENV_RULES.length).toBeGreaterThan(0);
    const valid = ['required-all', 'required-production', 'recommended-production', 'optional'];
    for (const rule of mod.BACKEND_ENV_RULES) {
      expect(valid).toContain(rule.category);
    }
  });
});
