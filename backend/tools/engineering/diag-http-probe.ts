// DIAG campaign 3 (bounded): HTTP-layer overhead on fast paths + single-shot
// functional observations on guarded paths. No listen(), no DB touched
// knowingly, no providers. Supertest in-process. Real middleware composition.
const t0 = Date.now();
const log = (m: string) => console.error('+' + (Date.now() - t0) + 'ms ' + m);
setTimeout(() => { console.log(JSON.stringify({ harness: 'diag-http-probe', timeout: true })); process.exit(2); }, 240000).unref();
function pct(a: number[], p: number) {
  const s = [...a].sort((x, y) => x - y);
  return +s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))].toFixed(3);
}
(async () => {
  const express = (await import('express')).default;
  const request = (await import('supertest')).default;
  const jwt = (await import('jsonwebtoken')).default;
  const helmet = (await import('helmet')).default;
  const { requestIdMiddleware } = await import('../../src/middleware/requestId');
  const { requestCorrelationMiddleware } = await import('../../src/middleware/requestCorrelationMiddleware');
  const { schoolAuthMiddleware } = await import('../../src/middleware/schoolAuthMiddleware');
  const { requireVerifiedSchoolContext } = await import('../../src/middleware/schoolContextGuardMiddleware');
  const { backpressureMiddleware } = await import('../../src/middleware/task019BackpressureMiddleware');
  const { rateLimitMiddleware } = await import('../../src/middleware/task019RateLimitMiddleware');
  const healthRoutes = (await import('../../src/routes/health')).default;
  log('imports done');
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(requestCorrelationMiddleware);
  app.use('/api/health', healthRoutes);
  app.use('/api/open', schoolAuthMiddleware, (_req: any, res: any) => res.json({ ok: true }));
  app.use('/api/verified', schoolAuthMiddleware, requireVerifiedSchoolContext, (_req: any, res: any) => res.json({ ok: true }));
  app.use('/api/guarded', schoolAuthMiddleware, backpressureMiddleware, rateLimitMiddleware, (_req: any, res: any) => res.json({ ok: true }));
  const token = jwt.sign({ userId: 'stu-1', schoolId: 'school-a', role: 'student' }, String(process.env.JWT_SECRET), { expiresIn: '5m' });
  const results: any = {};
  async function bench(name: string, make: () => Promise<any>, n: number) {
    for (let i = 0; i < 5; i++) await make();
    const ts: number[] = []; let last: any;
    for (let i = 0; i < n; i++) { const s = Date.now(); last = await make(); ts.push(Date.now() - s); }
    results[name] = { p50Ms: pct(ts, 50), p95Ms: pct(ts, 95), minMs: Math.min(...ts), maxMs: Math.max(...ts), status: last.status };
    log(name + ' done p50=' + results[name].p50Ms);
  }
  await bench('health-live-public', () => request(app).get('/api/health/live'), 30);
  await bench('auth-missing-401', () => request(app).get('/api/open'), 30);
  await bench('auth-malformed-401', () => request(app).get('/api/open').set('Authorization', 'Bearer not-a-jwt'), 30);
  await bench('auth-ok-lightweight', () => request(app).get('/api/open').set('Authorization', 'Bearer ' + token), 30);
  const inj: any = {};
  const t1 = Date.now(); const rV = await request(app).get('/api/verified').set('Authorization', 'Bearer ' + token);
  inj['verified-context'] = { status: rV.status, ms: Date.now() - t1, body: rV.body };
  const t2 = Date.now(); const rG = await request(app).get('/api/guarded').set('Authorization', 'Bearer ' + token);
  inj['guarded-backpressure-ratelimit'] = { status: rG.status, ms: Date.now() - t2 };
  const rJ = await request(app).post('/api/open').set('Authorization', 'Bearer ' + token).set('Content-Type', 'application/json').send('{"broken":');
  inj['malformed-json'] = { status: rJ.status };
  console.log(JSON.stringify({ harness: 'diag-http-probe', sha: process.env.DIAG_SHA || 'unknown', results, injection: inj }));
  process.exit(0);
})().catch((e) => { console.error('FAIL ' + (e && e.stack)); process.exit(1); });
