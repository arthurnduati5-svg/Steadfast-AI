import { Router, Request, Response } from 'express'
import type { ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts'

function sendEnvelope(res: Response, data: any, status = 200): void {
  res.status(status).json({ data, safe: true } as ResultReportCardAccessSafeEnvelope)
}

function extractContext(req: Request): { schoolId: string; actorRole: string; idempotencyKey: string } {
  return {
    schoolId: req.body?.schoolId || req.query?.schoolId || '',
    actorRole: req.body?.actorRole || req.query?.actorRole || 'unknown',
    idempotencyKey: (req.headers['x-idempotency-key'] || '') as string,
  }
}

const router = Router()

router.get('/grants', (req: Request, res: Response) => {
  sendEnvelope(res, { grants: [] })
})

router.post('/grants', (req: Request, res: Response) => {
  sendEnvelope(res, { granted: true }, 201)
})

router.get('/token-intents', (req: Request, res: Response) => {
  sendEnvelope(res, { intents: [] })
})

router.post('/token-intents', (req: Request, res: Response) => {
  sendEnvelope(res, { created: true }, 201)
})

router.get('/acknowledgements', (req: Request, res: Response) => {
  sendEnvelope(res, { acknowledgements: [] })
})

router.post('/acknowledgements', (req: Request, res: Response) => {
  sendEnvelope(res, { acknowledged: true }, 201)
})

router.get('/revocations', (req: Request, res: Response) => {
  sendEnvelope(res, { revocations: [] })
})

router.post('/revocations', (req: Request, res: Response) => {
  sendEnvelope(res, { revoked: true }, 201)
})

router.get('/expiries', (req: Request, res: Response) => {
  sendEnvelope(res, { expiries: [] })
})

router.post('/expiries', (req: Request, res: Response) => {
  sendEnvelope(res, { expired: true }, 201)
})

router.get('/timeline', (req: Request, res: Response) => {
  sendEnvelope(res, { events: [] })
})

router.get('/summaries', (req: Request, res: Response) => {
  sendEnvelope(res, { summaries: [] })
})

router.get('/previews', (req: Request, res: Response) => {
  sendEnvelope(res, { previews: [] })
})

router.post('/previews', (req: Request, res: Response) => {
  sendEnvelope(res, { previewed: true }, 201)
})

router.get('/recipients', (req: Request, res: Response) => {
  sendEnvelope(res, { recipients: [] })
})

router.post('/recipients', (req: Request, res: Response) => {
  sendEnvelope(res, { added: true }, 201)
})

export default router
