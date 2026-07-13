import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const REPORTS_DIR = path.resolve(__dirname, '../../../reports')

function readReport(name: string): any {
  const p = path.resolve(REPORTS_DIR, name)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

describe('Task 040 — Final No-Live-Integration Contract', () => {

  it('Task 040 did not perform live frontend integration', () => {
    // Read all four task reports to verify no live integration
    const names = [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]
    for (const name of names) {
      const r = readReport(name)
      if (r) {
        // Each report has these fields with consistent naming
        const liveFields = [
          'frontendIntegrationPerformed',
          'liveFrontendIntegrationPerformed',
        ]
        for (const f of liveFields) {
          if (r[f] !== undefined) {
            expect(r[f]).toBe(false)
          }
        }
      }
    }
  })

  it('Task 040 did not perform live school-system integration', () => {
    const names = [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]
    for (const name of names) {
      const r = readReport(name)
      if (r) {
        const liveFields = [
          'liveSchoolSystemIntegrationPerformed',
          'liveSchoolSystemCallsPerformed',
        ]
        for (const f of liveFields) {
          if (r[f] !== undefined) {
            expect(r[f]).toBe(false)
          }
        }
      }
    }
  })

  it('Task 040 did not perform live AI provider integration', () => {
    const names = [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]
    for (const name of names) {
      const r = readReport(name)
      if (r) {
        const liveFields = [
          'liveAiProviderIntegrationPerformed',
          'liveAiProviderCallsPerformed',
        ]
        for (const f of liveFields) {
          if (r[f] !== undefined) {
            expect(r[f]).toBe(false)
          }
        }
      }
    }
  })

  it('Task 038 AI provider mode is mock_only, not live', () => {
    const r = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(r.providerModeDefault).toBe('mock_only')
    expect(r.liveProviderModeBlocked).toBe(true)
  })

  it('Task 039 school connector mode is mock_only, not live', () => {
    const r = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(r.providerModeDefault).toBe('mock_only')
    expect(r.liveSchoolConnectorModeBlocked).toBe(true)
  })

  it('Task 038 confirms no AI provider SDK introduced for live calls', () => {
    const r = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(r.noProviderSdkIntroducedForLiveCalls).toBe(true)
    expect(r.noApiKeyRequired).toBe(true)
  })

  it('Task 039 confirms no school system SDK introduced for live calls', () => {
    const r = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(r.noSchoolSystemSdkIntroducedForLiveCalls).toBe(true)
    expect(r.noSchoolCredentialsRequired).toBe(true)
  })

  it('Task 040 final docs do not claim live integration', () => {
    const archDir = path.resolve(__dirname, '../../../docs/architecture')
    const integrationDir = path.resolve(__dirname, '../../../docs/integration')
    const frontendDir = path.resolve(__dirname, '../../../docs/frontend')

    const finalDocs = [
      path.resolve(archDir, 'FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md'),
      path.resolve(archDir, 'FINAL_BACKEND_SOURCE_OF_TRUTH_INDEX.md'),
      path.resolve(archDir, 'FINAL_BACKEND_PAUSE_GATE.md'),
      path.resolve(archDir, 'FINAL_REPORT_RECONCILIATION_AUDIT.md'),
      path.resolve(frontendDir, 'FINAL_FRONTEND_CONTRACT_READINESS_RECONCILIATION.md'),
      path.resolve(integrationDir, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'),
    ]

    for (const doc of finalDocs) {
      if (fs.existsSync(doc)) {
        const content = fs.readFileSync(doc, 'utf-8').toLowerCase()
        // These patterns should NOT appear as claims of completion
        const forbiddenCompletionClaims = [
          'live frontend integration completed',
          'live school integration completed',
          'live ai integration completed',
          'production is live',
          'real frontend is connected',
          'real school system is connected',
          'real ai provider is connected',
        ]
        for (const claim of forbiddenCompletionClaims) {
          expect(content).not.toContain(claim)
        }
      }
    }
  })
})
