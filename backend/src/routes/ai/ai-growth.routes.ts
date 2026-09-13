import { Router, Request, Response } from 'express'
import { schoolAuthMiddleware } from '../../middleware/schoolAuthMiddleware'
import {
  getGrowthOverview,
  getGrowthWeakTopics,
  getGrowthMistakeJournal,
  getGrowthStudyPlans,
  getGrowthMasteryTrends,
} from '../../services/growthIntelligenceService'

const router = Router()

router.get('/growth/overview', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const result = await getGrowthOverview(req.user!.id)
  res.json(result)
})

router.get('/growth/weak-topics', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const result = await getGrowthWeakTopics(req.user!.id)
  res.json(result)
})

router.get('/growth/mistake-journal', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const result = await getGrowthMistakeJournal(req.user!.id)
  res.json(result)
})

router.get('/growth/study-plans', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const result = await getGrowthStudyPlans(req.user!.id)
  res.json(result)
})

router.get('/growth/mastery-trends', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const result = await getGrowthMasteryTrends(req.user!.id)
  res.json(result)
})

export default router
