// Warm guarded-stack retest: 6 sequential guarded requests, report each.
setTimeout(() => { console.log(JSON.stringify({ timeout: true })); process.exit(2); }, 180000).unref();
(async () => {
  const express = (await import('express')).default;
  const request = (await import('supertest')).default;
  const jwt = (await import('jsonwebtoken')).default;
  const { schoolAuthMiddleware } = await import('../../src/middleware/schoolAuthMiddleware');
  const { backpressureMiddleware } = await import('../../src/middleware/task019BackpressureMiddleware');
  const { rateLimitMiddleware } = await import('../../src/middleware/task019RateLimitMiddleware');
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/guarded', schoolAuthMiddleware, backpressureMiddleware, rateLimitMiddleware, (_req: any, res: any) => res.json({ ok: true }));
  const token = jwt.sign({ userId: 'stu-1', schoolId: 'school-a', role: 'student' }, String(process.env.JWT_SECRET), { expiresIn: '5m' });
  const out: any[] = [];
  for (let i = 0; i < 6; i++) {
    const s = Date.now();
    const r = await request(app).get('/api/guarded').set('Authorization', 'Bearer ' + token);
    out.push({ i, ms: Date.now() - s, status: r.status });
  }
  console.log('WARM-GUARDED ' + JSON.stringify(out));
  process.exit(0);
})().catch((e) => { console.error('FAIL ' + (e && e.stack)); process.exit(1); });
