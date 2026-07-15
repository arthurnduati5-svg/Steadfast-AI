import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardAccessTokenIntentRepository,
  InMemoryResultReportCardAccessAuditRepository,
  InMemoryResultReportCardAccessIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardAccessRepositories';
import { ResultReportCardAccessTokenIntentService } from '../services/resultReportCardAccessTokenIntentService';
import { ResultReportCardAccessAuditBridge } from '../services/resultReportCardAccessAuditBridge';
import { ResultReportCardAccessIdempotencyService } from '../services/resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessSafetyService } from '../services/resultReportCardAccessSafetyService';
import type { ResultReportCardAccessCommandContext } from '../contracts/resultReportCardAccessContracts';

const ctx: ResultReportCardAccessCommandContext = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'teacher',
  correlationId: 'corr-1',
  idempotencyKey: 'idem-1',
};

describe('Package 15 — Token Intent No Secret', () => {
  let tokenIntentRepo: InMemoryResultReportCardAccessTokenIntentRepository;
  let auditRepo: InMemoryResultReportCardAccessAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardAccessIdempotencyRepository;
  let auditBridge: ResultReportCardAccessAuditBridge;
  let idempotencyService: ResultReportCardAccessIdempotencyService;
  let tokenIntentService: ResultReportCardAccessTokenIntentService;
  let safetyService: ResultReportCardAccessSafetyService;
  let grantId: string;

  beforeEach(() => {
    tokenIntentRepo = new InMemoryResultReportCardAccessTokenIntentRepository();
    auditRepo = new InMemoryResultReportCardAccessAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardAccessIdempotencyRepository();
    auditBridge = new ResultReportCardAccessAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardAccessIdempotencyService(idempotencyRepo);
    tokenIntentService = new ResultReportCardAccessTokenIntentService(tokenIntentRepo, auditBridge, idempotencyService);
    safetyService = new ResultReportCardAccessSafetyService();
    grantId = 'grant-1';
  });

  it('token intent can be created as non-secret future intent', async () => {
    const result = await tokenIntentService.createTokenIntent(ctx, {
      resultReportCardAccessGrantId: grantId,
      tokenIntentMode: 'future_token_required',
      safeTokenIntentSummary: 'Future access token intent for parent preview',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.safeMessage).toContain('created');
  });

  it('token intent can be validated', async () => {
    const created = await tokenIntentService.createTokenIntent(ctx, {
      resultReportCardAccessGrantId: grantId,
      tokenIntentMode: 'no_token_created',
      safeTokenIntentSummary: 'No real token needed',
    });
    const result = await tokenIntentService.validateTokenIntent(ctx, created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('validated');
  });

  it('token intent can be blocked', async () => {
    const created = await tokenIntentService.createTokenIntent(ctx, {
      resultReportCardAccessGrantId: grantId,
      tokenIntentMode: 'admin_review_required',
      safeTokenIntentSummary: 'Admin review needed before token creation',
    });
    const result = await tokenIntentService.blockTokenIntent(ctx, created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('token intent can be voided', async () => {
    const created = await tokenIntentService.createTokenIntent(ctx, {
      resultReportCardAccessGrantId: grantId,
      tokenIntentMode: 'future_token_required',
      safeTokenIntentSummary: 'Void test',
    });
    const result = await tokenIntentService.voidTokenIntent(ctx, created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('token intent does not contain token value (tokenSecret)', () => {
    const intent: Record<string, unknown> = {
      resultReportCardAccessTokenIntentId: 'intent-1',
      tokenIntentMode: 'no_token_created',
      safeTokenIntentSummary: 'safe',
    };
    const result = safetyService.assertTokenIntentHasNoSecret(intent);
    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe('SAFE');

    const unsafe: Record<string, unknown> = { ...intent, tokenSecret: 'abc123' };
    const blocked = safetyService.assertTokenIntentHasNoSecret(unsafe);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reasonCode).toBe('TOKEN_INTENT_CONTAINS_SECRET');
  });

  it('token intent does not contain JWT', () => {
    const intent: Record<string, unknown> = {
      safeTokenIntentSummary: 'safe',
    };
    const result = safetyService.assertNoLoginBypassLeakage({ ...intent, jwt: 'eyJhbGci' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LOGIN_BYPASS_LEAKAGE');
  });

  it('token intent does not contain signed URL', () => {
    const result = safetyService.assertNoSignedUrlLeakage({ signedUrl: 'https://example.com/signed' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SIGNED_URL_LEAKAGE');
  });

  it('token intent does not contain session cookie', () => {
    const result = safetyService.assertNoLoginBypassLeakage({ sessionCookie: 'connect.sid=s%3A' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LOGIN_BYPASS_LEAKAGE');
  });

  it('token intent does not contain login bypass', () => {
    const result = safetyService.assertNoLoginBypassLeakage({ loginToken: 'login-token-value' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LOGIN_BYPASS_LEAKAGE');
  });

  it('token intent does not contain password', () => {
    const result = safetyService.assertNoLoginBypassLeakage({ password: 'p@ssw0rd' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LOGIN_BYPASS_LEAKAGE');
  });

  it('token intent does not contain provider secret', () => {
    const result = safetyService.assertNoAccessTokenLeakage({ accessToken: 'ghp_xxxx' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ACCESS_TOKEN_LEAKAGE');
  });
});
