import { Router, Request, Response } from 'express';
import { getBackpressureState } from '../middleware/task019BackpressureMiddleware';
import { checkSimpleRateLimit } from '../services/task019TieredRateLimiterService';
import { getAllRouteRules } from '../services/task019RateLimitConfigurationService';
import { getQuotaState } from '../services/task019QuotaManagerService';
import { getAbuseStatus } from '../services/task019AbuseDetectionService';

const router = Router();

router.get('/rate-limits/status', (_req: Request, res: Response) => {
  const backpressure = getBackpressureState();
  const routes = getAllRouteRules().map(r => ({
    route: r.route,
    methods: r.methods,
    studentMaxTokens: r.student.maxTokens,
    schoolMaxTokens: r.school.maxTokens,
    enabled: r.enabled
  }));

  res.json({
    backpressure,
    routes,
    timestamp: new Date().toISOString()
  });
});

router.get('/rate-limits/config', (_req: Request, res: Response) => {
  const rules = getAllRouteRules();
  res.json({ rules, count: rules.length });
});

router.get('/rate-limits/check/:namespace/:id', async (req: Request, res: Response) => {
  const { namespace, id } = req.params;
  const result = await checkSimpleRateLimit(namespace, id);
  res.json(result);
});

router.get('/rate-limits/quota/:scope/:window/:id', async (req: Request, res: Response) => {
  const { scope, window, id } = req.params;
  if (scope !== 'student' && scope !== 'school') {
    return res.status(400).json({ error: 'Scope must be "student" or "school"' });
  }
  if (!['daily', 'weekly', 'monthly'].includes(window)) {
    return res.status(400).json({ error: 'Window must be "daily", "weekly", or "monthly"' });
  }
  const quota = await getQuotaState(scope as 'student' | 'school', id, window as 'daily' | 'weekly' | 'monthly');
  if (!quota) return res.status(404).json({ error: 'No quota data found' });
  res.json(quota);
});

router.get('/rate-limits/abuse/:studentId', async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const status = await getAbuseStatus(studentId);
  res.json(status);
});

export default router;
