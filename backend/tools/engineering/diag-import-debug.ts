// Which import hangs? Sequential dynamic imports with logging + hard exit.
const t0 = Date.now();
const log = (m: string) => console.log('+' + (Date.now() - t0) + 'ms ' + m);
setTimeout(() => { console.log('TIMEOUT-EXIT'); process.exit(2); }, 45000).unref();
(async () => {
  log('start');
  await import('../../src/middleware/requestId'); log('requestId ok');
  await import('../../src/middleware/requestCorrelationMiddleware'); log('correlation ok');
  await import('../../src/middleware/requestTelemetryMiddleware'); log('telemetry ok');
  await import('../../src/middleware/schoolAuthMiddleware'); log('schoolAuth ok');
  await import('../../src/middleware/schoolContextGuardMiddleware'); log('guard ok');
  await import('../../src/middleware/task019BackpressureMiddleware'); log('backpressure ok');
  await import('../../src/middleware/task019RateLimitMiddleware'); log('ratelimit ok');
  await import('../../src/routes/health'); log('health ok');
  log('ALL-OK');
  process.exit(0);
})().catch((e) => { console.log('IMPORT-FAIL ' + (e && e.stack)); process.exit(1); });
