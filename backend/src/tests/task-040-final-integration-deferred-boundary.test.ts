import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const INTEGRATION_DIR = path.resolve(__dirname, '../../../docs/integration')
const ARCH_DIR = path.resolve(__dirname, '../../../docs/architecture')

function fileExists(...parts: string[]): boolean {
  return fs.existsSync(path.resolve(...parts))
}

describe('Task 040 — Final Integration-Deferred Boundary', () => {

  it('integration-deferred boundary reconciliation exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md')).toBe(true)
  })

  it('documents real frontend runtime wiring as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Real Frontend Runtime Wiring/i)
  })

  it('documents real school-system credential setup as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Real School-System Credential Setup/i)
  })

  it('documents real AI provider credentials as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Real AI Provider Credentials/i)
  })

  it('documents real AI provider calls as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Real AI Provider Calls/i)
  })

  it('documents staging deployment as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Staging Deployment/i)
  })

  it('documents production deployment as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Production Deployment/i)
  })

  it('documents pilot users as deferred', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Pilot Users/i)
  })

  it('states backend feature-building pauses after Task 040', () => {
    const doc = fs.readFileSync(path.resolve(INTEGRATION_DIR, 'FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md'), 'utf-8')
    expect(doc).toMatch(/Backend feature-building pauses after Task 040/i)
  })

  it('MOCK_TO_LIVE_AI_PROVIDER_ACTIVATION_GUIDE.md exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'MOCK_TO_LIVE_AI_PROVIDER_ACTIVATION_GUIDE.md')).toBe(true)
  })

  it('MOCK_TO_LIVE_SCHOOL_SYSTEM_ACTIVATION_GUIDE.md exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'MOCK_TO_LIVE_SCHOOL_SYSTEM_ACTIVATION_GUIDE.md')).toBe(true)
  })
})
