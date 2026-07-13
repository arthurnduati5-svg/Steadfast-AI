import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const REPORTS_DIR = path.resolve(__dirname, '../../../reports')

function readReport(name: string): any {
  const p = path.resolve(REPORTS_DIR, name)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

describe('Task 040 — Final Report Reconciliation', () => {

  it('Task 036 report exists and is valid JSON', () => {
    const r = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(r).not.toBeNull()
    expect(r.taskId).toBe('TASK-036')
  })

  it('Task 036 report has safe-to-next-task true', () => {
    const r = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(r.safeToStartTask037).toBe(true)
  })

  it('Task 037 report exists and is valid JSON', () => {
    const r = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(r).not.toBeNull()
    expect(r.taskId).toBe('TASK-037')
  })

  it('Task 037 report has safe-to-next-task true', () => {
    const r = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(r.safeToStartTask038).toBe(true)
  })

  it('Task 038 report exists and is valid JSON', () => {
    const r = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(r).not.toBeNull()
    expect(r.taskId).toBe('TASK-038')
  })

  it('Task 038 report has safe-to-next-task true', () => {
    const r = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(r.safeToStartTask039).toBe(true)
  })

  it('Task 039 report exists and is valid JSON', () => {
    const r = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(r).not.toBeNull()
    expect(r.taskId).toBe('TASK-039')
  })

  it('Task 039 report has safe-to-next-task true', () => {
    const r = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(r.safeToStartTask040).toBe(true)
  })

  it('All accepted reports mark integration deferred correctly', () => {
    for (const name of [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]) {
      const r = readReport(name)
      expect(r.integrationDeferred).toBe(true)
    }
  })

  it('Task 036 report: no live frontend/school/AI integration', () => {
    const r = readReport('task-036-backend-closure-frontend-endpoints-persistence-v1.json')
    expect(r.frontendIntegrationPerformed).toBe(false)
    expect(r.liveSchoolSystemIntegrationPerformed).toBe(false)
    expect(r.liveAiProviderIntegrationPerformed).toBe(false)
  })

  it('Task 037 report: no live frontend/school/AI integration', () => {
    const r = readReport('task-037-frontend-api-contract-alignment-v1.json')
    expect(r.liveFrontendIntegrationPerformed).toBe(false)
    expect(r.liveSchoolSystemIntegrationPerformed).toBe(false)
    expect(r.liveAiProviderIntegrationPerformed).toBe(false)
  })

  it('Task 038 report: no live frontend/school/AI integration', () => {
    const r = readReport('task-038-mock-to-live-ai-provider-gateway-switch-v1.json')
    expect(r.liveFrontendIntegrationPerformed).toBe(false)
    expect(r.liveSchoolSystemIntegrationPerformed).toBe(false)
    expect(r.liveAiProviderIntegrationPerformed).toBe(false)
    expect(r.liveAiProviderCallsPerformed).toBe(false)
  })

  it('Task 039 report: no live frontend/school/AI integration', () => {
    const r = readReport('task-039-school-system-mock-to-live-identity-bridge-v1.json')
    expect(r.liveFrontendIntegrationPerformed).toBe(false)
    expect(r.liveSchoolSystemIntegrationPerformed).toBe(false)
    expect(r.liveSchoolSystemCallsPerformed).toBe(false)
    expect(r.liveAiProviderIntegrationPerformed).toBe(false)
  })

  it('All reports confirm no destructive DB commands', () => {
    for (const name of [
      'task-036-backend-closure-frontend-endpoints-persistence-v1.json',
      'task-037-frontend-api-contract-alignment-v1.json',
      'task-038-mock-to-live-ai-provider-gateway-switch-v1.json',
      'task-039-school-system-mock-to-live-identity-bridge-v1.json',
    ]) {
      const r = readReport(name)
      if (r.noDestructiveDbCommandIntroduced !== undefined) {
        expect(r.noDestructiveDbCommandIntroduced).toBe(true)
      }
    }
  })
})
