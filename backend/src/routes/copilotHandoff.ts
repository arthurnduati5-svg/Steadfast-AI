import { Router, Request, Response } from 'express';
import { buildCopilotHandoff } from '../services/copilotHandoffService';
import type { TutorClientContext } from '../services/copilotHandoffContracts';
import { logger } from '../utils/logger';

const router = Router();

router.get('/handoff', async (req: Request, res: Response) => {
  try {
    const authorizationHeader = req.headers.authorization;
    const requestId = req.requestId || 'unknown';

    const clientContext: TutorClientContext = {
      displayMode: req.query.displayMode === 'fullscreen' ? 'fullscreen' :
                   req.query.displayMode === 'widget' ? 'widget' : undefined,
      activeSchoolPage: typeof req.query.activeSchoolPage === 'string' ? req.query.activeSchoolPage : undefined,
      locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
    };

    const result = await buildCopilotHandoff({
      authorizationHeader,
      requestId,
      clientContext: Object.keys(clientContext).length > 0 ? clientContext : undefined,
    });

    if (!result.ok) {
      res.status(
        result.errorCode === 'missing_token' || result.errorCode === 'invalid_token' || result.errorCode === 'expired_token'
          ? 401
          : result.errorCode === 'school_lookup_failed'
            ? 503
            : 403,
      ).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    logger.error({ error: String(err), requestId: req.requestId }, '[CopilotHandoffRoute] Unexpected error');
    res.status(500).json({
      ok: false,
      requestId: req.requestId || 'unknown',
      errorCode: 'unknown',
      safeMessage: 'An unexpected error occurred. Please try again.',
    });
  }
});

export default router;
