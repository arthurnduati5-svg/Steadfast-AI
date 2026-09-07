import { Router, Request, Response } from 'express';
import { buildGrowthAggregate } from '../services/growthAggregateService';
import { createApiSuccess, createApiError } from '../services/apiEnvelopeService';
import { buildApiResponseMeta, dataSourceTruthToApiMeta } from '../services/apiMetadataService';
import { classifyDataSource } from '../services/dataSourceTruthService';
import { API_CONTRACT_VERSION } from '../contracts/apiEnvelopeContracts';

const router = Router();

const GROWTH_AGGREGATE_CONTRACT_VERSION = '1.0.0';

/**
 * GET /api/copilot/growth/aggregate
 *
 * Returns a truthful growth aggregate for the requesting learner.
 * Never returns fake data, never exposes raw evidence, never fabricates mastery.
 */
router.get('/aggregate', async (req: Request, res: Response) => {
  try {
    const studentId = (req.query.studentId as string) || req.headers['x-student-id'] as string;
    const schoolId = (req.query.schoolId as string) || req.headers['x-school-id'] as string;

    if (!studentId) {
      const meta400 = buildApiResponseMeta({
        route: '/api/copilot/growth/aggregate',
        method: 'GET',
        requestId: req.requestId,
      });
      return res.status(400).json(createApiError({
        code: 'validation_error',
        message: 'studentId query parameter or x-student-id header is required',
        status: 400,
        type: 'https://steadfast.ai/errors/validation-error',
        meta: meta400,
      }));
    }

    const includeRevision = req.query.includeRevision !== 'false';
    const includePractice = req.query.includePractice !== 'false';
    const includeArtifactSignals = req.query.includeArtifactSignals !== 'false';
    const includeVideoSignals = req.query.includeVideoSignals !== 'false';

    if (req.query.includeRevision !== undefined && req.query.includeRevision !== 'true' && req.query.includeRevision !== 'false') {
      const meta400 = buildApiResponseMeta({
        route: '/api/copilot/growth/aggregate',
        method: 'GET',
        requestId: req.requestId,
      });
      return res.status(400).json(createApiError({
        code: 'validation_error',
        message: 'includeRevision must be a boolean string (true/false)',
        status: 400,
        type: 'https://steadfast.ai/errors/validation-error',
        meta: meta400,
      }));
    }

    if (req.query.includePractice !== undefined && req.query.includePractice !== 'true' && req.query.includePractice !== 'false') {
      const meta400 = buildApiResponseMeta({
        route: '/api/copilot/growth/aggregate',
        method: 'GET',
        requestId: req.requestId,
      });
      return res.status(400).json(createApiError({
        code: 'validation_error',
        message: 'includePractice must be a boolean string (true/false)',
        status: 400,
        type: 'https://steadfast.ai/errors/validation-error',
        meta: meta400,
      }));
    }

    const aggregate = await buildGrowthAggregate({
      studentId,
      schoolId: schoolId || null,
      includeRevision,
      includePractice,
      includeArtifactSignals,
      includeVideoSignals,
    });

    const dataSourceTruth = classifyDataSource({
      safeReason: 'Growth aggregate built from live backend services',
    });
    const meta = buildApiResponseMeta({
      route: '/api/copilot/growth/aggregate',
      method: 'GET',
      requestId: req.requestId,
      privacy: {
        privacyMode: 'private_by_default',
        rawChatIncluded: false,
        rawLearnerMemoryIncluded: false,
        rawTranscriptIncluded: false,
      },
      dataSourceTruth: dataSourceTruthToApiMeta(dataSourceTruth),
    });

    const response = createApiSuccess({
      data: {
        aggregate,
        contractVersion: GROWTH_AGGREGATE_CONTRACT_VERSION,
      },
      meta,
    });

    return res.status(200).json(response);
  } catch (err) {
    const isUpstreamError = err instanceof Error &&
      (err.message.includes('upstream') || err.message.includes('unavailable') || err.message.includes('ECONNREFUSED'));

    const meta500 = buildApiResponseMeta({
      route: '/api/copilot/growth/aggregate',
      method: 'GET',
      requestId: req.requestId,
    });

    if (isUpstreamError) {
      return res.status(503).json(createApiError({
        code: 'upstream_unavailable',
        message: 'Required upstream service is unavailable. Please try again later.',
        status: 503,
        type: 'https://steadfast.ai/errors/upstream-unavailable',
        meta: meta500,
        safeUserMessage: 'The growth data service is temporarily unavailable.',
      }));
    }

    return res.status(500).json(createApiError({
      code: 'internal_error',
      message: 'An internal error occurred while building the growth aggregate.',
      status: 500,
      type: 'https://steadfast.ai/errors/internal-error',
      meta: meta500,
      safeUserMessage: 'Something went wrong. Please try again.',
    }));
  }
});

export default router;
