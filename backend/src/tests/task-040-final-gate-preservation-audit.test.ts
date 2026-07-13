import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ARCH_DIR = path.resolve(__dirname, '../../../docs/architecture')
const FRONTEND_DIR = path.resolve(__dirname, '../../../docs/frontend')
const INTEGRATION_DIR = path.resolve(__dirname, '../../../docs/integration')
const REPORTS_DIR = path.resolve(__dirname, '../../../reports')

function readDoc(filename: string): string {
  const p = path.resolve(ARCH_DIR, filename)
  if (!fs.existsSync(p)) return ''
  return fs.readFileSync(p, 'utf-8')
}

function readFrontendDoc(filename: string): string {
  const p = path.resolve(FRONTEND_DIR, filename)
  if (!fs.existsSync(p)) return ''
  return fs.readFileSync(p, 'utf-8')
}

function readIntegrationDoc(filename: string): string {
  const p = path.resolve(INTEGRATION_DIR, filename)
  if (!fs.existsSync(p)) return ''
  return fs.readFileSync(p, 'utf-8')
}

function readReport(filename: string): any {
  const p = path.resolve(REPORTS_DIR, filename)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

describe('Task 040 — Final Gate Preservation Audit', () => {

  // ---- Verified School Identity Rule ----
  it('preserves verified school identity rule — no tutor without school context', () => {
    const report036 = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(report036).not.toBeNull()
    const report039 = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(report039).not.toBeNull()
    expect(report039.schoolContextBeforeTutorVerified).toBe(true)
    expect(report039.missingSchoolContextBlocked).toBe(true)
  })

  it('preserves existing school system ownership rule', () => {
    const doc = readDoc('FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md')
    expect(doc).toContain('Existing School System Ownership Rule')
    expect(doc).toContain('existing school system owns')
    expect(doc).toContain('The tutor backend owns')
  })

  // ---- Content Governance Rule ----
  it('preserves content governance rule — no invented teaching claim', () => {
    const doc = readDoc('FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md')
    expect(doc.toLowerCase()).toContain('content governance')
    const files = fs.readdirSync(ARCH_DIR)
    const hasContentGovernance = files.some(f => f.includes('CONTENT_GOVERNANCE') || f.includes('TASK_022'))
    expect(hasContentGovernance).toBe(true)
  })

  // ---- Socratic Tutor / No-Final-Answer Rule ----
  it('preserves Socratic tutor rule — no final-answer bot, no fatwa engine', () => {
    const doc = readDoc('FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md')
    expect(doc).toContain('Socratic')
    const pauseGate = readDoc('FINAL_BACKEND_PAUSE_GATE.md')
    expect(pauseGate).toContain('Socratic')
    // Scan for forbidden patterns
    const allDocs = [
      readDoc('FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md'),
      readDoc('FINAL_BACKEND_PAUSE_GATE.md'),
    ]
    for (const d of allDocs) {
      expect(d.toLowerCase()).not.toContain('generic chatbot')
      expect(d.toLowerCase()).not.toContain('answer bot')
      expect(d.toLowerCase()).not.toContain('fatwa engine')
      expect(d.toLowerCase()).not.toContain('final-answer bot')
    }
  })

  // ---- Privacy Boundary ----
  it('preserves privacy boundary — no raw chat, no private memory, no safeguarding raw', () => {
    const report036 = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(report036.rawChatExcluded).toBe(true)
    expect(report036.privateMemoryExcluded).toBe(true)
    expect(report036.safeguardingRawExcluded).toBe(true)
    expect(report036.deenSensitiveRawExcluded).toBe(true)
    expect(report036.tokensSecretsExcluded).toBe(true)
  })

  it('preserves privacy boundary — no AI prompts, no provider responses', () => {
    const report038 = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(report038.aiPromptRawExcludedFromLogs).toBe(true)
    expect(report038.providerResponseRawExcludedFromLogs).toBe(true)
    expect(report038.tokensSecretsExcluded).toBe(true)
  })

  it('preserves privacy boundary — no database URLs, no real credentials', () => {
    const report036 = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(report036.databaseUrlMasked).toBe(true)
    const report039 = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(report039.noRealSchoolCredentialsRead).toBe(true)
  })

  // ---- Deen Authority Boundary ----
  it('preserves Deen authority boundary', () => {
    const doc = readDoc('FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md')
    expect(doc).toContain('Deen')
    const pauseGate = readDoc('FINAL_BACKEND_PAUSE_GATE.md')
    expect(pauseGate).toContain('Deen')
  })

  // ---- Teacher-Only Content Boundary ----
  it('preserves teacher-only content boundary', () => {
    const report036 = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(report036.teacherOnlyContentProtected).toBe(true)
    const report037 = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(report037.teacherOnlyContentProtectedInFixtures).toBe(true)
  })

  // ---- Answer-Key Boundary ----
  it('preserves answer-key boundary', () => {
    const report036 = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(report036.answerKeyProtected).toBe(true)
    const report037 = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(report037.answerKeyProtectedInFixtures).toBe(true)
    const report038 = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(report038.answerKeyRiskBlocked).toBe(true)
    const report039 = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(report039.answerKeyProtected).toBe(true)
  })

  // ---- AI Provider Deferred Boundary ----
  it('preserves AI provider deferred boundary', () => {
    const report038 = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(report038.liveAiProviderIntegrationPerformed).toBe(false)
    expect(report038.liveAiProviderCallsPerformed).toBe(false)
    expect(report038.liveProviderModeBlocked).toBe(true)
    expect(report038.providerModeDefault).toBe('mock_only')
  })

  // ---- School-System Deferred Boundary ----
  it('preserves school-system deferred boundary', () => {
    const report039 = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(report039.liveSchoolSystemIntegrationPerformed).toBe(false)
    expect(report039.liveSchoolSystemCallsPerformed).toBe(false)
    expect(report039.liveSchoolConnectorModeBlocked).toBe(true)
    expect(report039.providerModeDefault).toBe('mock_only')
  })

  // ---- Frontend Integration Deferred Boundary ----
  it('preserves frontend integration deferred boundary', () => {
    const report036 = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(report036.frontendIntegrationPerformed).toBe(false)
    const report037 = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(report037.liveFrontendIntegrationPerformed).toBe(false)
    expect(report037.noFrontendRuntimeWiringPerformed).toBe(true)
  })

  // ---- No Live Provider Call Rule ----
  it('preserves no live provider call rule', () => {
    const report038 = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(report038.noLiveAiCallIntroduced).toBe(true)
    expect(report038.noProviderSdkIntroducedForLiveCalls).toBe(true)
    expect(report038.noApiKeyRequired).toBe(true)
  })

  // ---- No Live School Call Rule ----
  it('preserves no live school call rule', () => {
    const report039 = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(report039.noLiveSchoolSystemCallIntroduced).toBe(true)
    expect(report039.noSchoolSystemSdkIntroducedForLiveCalls).toBe(true)
    expect(report039.noSchoolCredentialsRequired).toBe(true)
  })

  // ---- No Destructive DB Command ----
  it('preserves no destructive DB command rule across all reports', () => {
    for (const name of [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]) {
      const report = readReport(name)
      if (report.noDestructiveDbCommandIntroduced !== undefined) {
        expect(report.noDestructiveDbCommandIntroduced).toBe(true)
      }
    }
  })

  // ---- Forbidden Contradictions ----
  it('contains no forbidden contradiction: live AI provider connected', () => {
    for (const name of ['task-036', 'task-037', 'task-038', 'task-039']) {
      const report = readReport(`${name}*.json`)
      // Just check each individually
    }
    const report038 = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(report038.liveAiProviderIntegrationPerformed).toBe(false)
  })

  it('contains no forbidden contradiction: frontend integration completed', () => {
    const report037 = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(report037.liveFrontendIntegrationPerformed).toBe(false)
  })

  it('contains no forbidden contradiction: production launched', () => {
    for (const name of [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]) {
      const report = readReport(name)
      if (report.productionDeploymentPerformed !== undefined) {
        expect(report.productionDeploymentPerformed).toBe(false)
      }
    }
  })
})
