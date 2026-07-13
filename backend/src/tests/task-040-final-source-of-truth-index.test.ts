import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ARCH_DIR = path.resolve(__dirname, '../../../docs/architecture')
const FRONTEND_DIR = path.resolve(__dirname, '../../../docs/frontend')
const INTEGRATION_DIR = path.resolve(__dirname, '../../../docs/integration')
const REPORTS_DIR = path.resolve(__dirname, '../../../reports')

function fileExists(...parts: string[]): boolean {
  return fs.existsSync(path.resolve(...parts))
}

describe('Task 040 — Final Source of Truth Index', () => {

  it('source-of-truth index exists', () => {
    expect(fileExists(ARCH_DIR, 'FINAL_BACKEND_SOURCE_OF_TRUTH_INDEX.md')).toBe(true)
  })

  it('BACKEND_CLOSURE_OVERVIEW.md exists', () => {
    expect(fileExists(ARCH_DIR, 'BACKEND_CLOSURE_OVERVIEW.md')).toBe(true)
  })

  it('BACKEND_FRONTEND_API_CONTRACT_MAP.md exists', () => {
    expect(fileExists(ARCH_DIR, 'BACKEND_FRONTEND_API_CONTRACT_MAP.md')).toBe(true)
  })

  it('BACKEND_ROUTE_GUARD_AND_ACCESS_MATRIX.md exists', () => {
    expect(fileExists(ARCH_DIR, 'BACKEND_ROUTE_GUARD_AND_ACCESS_MATRIX.md')).toBe(true)
  })

  it('BACKEND_PERSISTENCE_CLOSURE_AUDIT.md exists', () => {
    expect(fileExists(ARCH_DIR, 'BACKEND_PERSISTENCE_CLOSURE_AUDIT.md')).toBe(true)
  })

  it('BACKEND_STALE_FILE_CLEANUP_REPORT.md exists', () => {
    expect(fileExists(ARCH_DIR, 'BACKEND_STALE_FILE_CLEANUP_REPORT.md')).toBe(true)
  })

  it('INTEGRATION_DEFERRED_BOUNDARY.md exists', () => {
    expect(fileExists(ARCH_DIR, 'INTEGRATION_DEFERRED_BOUNDARY.md')).toBe(true)
  })

  it('frontend workflow map exists', () => {
    expect(fileExists(FRONTEND_DIR, 'FRONTEND_WORKFLOW_TO_BACKEND_ENDPOINT_MAP.md')).toBe(true)
  })

  it('frontend integration guide exists', () => {
    expect(fileExists(FRONTEND_DIR, 'FRONTEND_INTEGRATION_GUIDE.md')).toBe(true)
  })

  it('frontend error-state playbook exists', () => {
    expect(fileExists(FRONTEND_DIR, 'FRONTEND_ERROR_STATE_PLAYBOOK.md')).toBe(true)
  })

  it('frontend role/access matrix exists', () => {
    expect(fileExists(FRONTEND_DIR, 'FRONTEND_ROLE_AND_ACCESS_MATRIX.md')).toBe(true)
  })

  it('API contract versioning guide exists', () => {
    expect(fileExists(FRONTEND_DIR, 'API_CONTRACT_VERSIONING_AND_CHANGE_CONTROL.md')).toBe(true)
  })

  it('AI provider activation guide exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'MOCK_TO_LIVE_AI_PROVIDER_ACTIVATION_GUIDE.md')).toBe(true)
  })

  it('AI provider readiness checklist exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'AI_PROVIDER_GATEWAY_READINESS_CHECKLIST.md')).toBe(true)
  })

  it('AI provider failure/fallback policy exists', () => {
    expect(fileExists(ARCH_DIR, 'AI_PROVIDER_FAILURE_AND_FALLBACK_POLICY.md')).toBe(true)
  })

  it('school-system activation guide exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'MOCK_TO_LIVE_SCHOOL_SYSTEM_ACTIVATION_GUIDE.md')).toBe(true)
  })

  it('school connector readiness checklist exists', () => {
    expect(fileExists(INTEGRATION_DIR, 'SCHOOL_CONNECTOR_READINESS_CHECKLIST.md')).toBe(true)
  })

  it('school context failure policy exists', () => {
    expect(fileExists(ARCH_DIR, 'SCHOOL_CONTEXT_FAILURE_POLICY.md')).toBe(true)
  })

  it('Task 036 report exists', () => {
    expect(fileExists(REPORTS_DIR, 'task-036-backend-closure-frontend-endpoints-persistence-v1.json')).toBe(true)
  })

  it('Task 037 report exists', () => {
    expect(fileExists(REPORTS_DIR, 'task-037-frontend-api-contract-alignment-v1.json')).toBe(true)
  })

  it('Task 038 report exists', () => {
    expect(fileExists(REPORTS_DIR, 'task-038-mock-to-live-ai-provider-gateway-switch-v1.json')).toBe(true)
  })

  it('Task 039 report exists', () => {
    expect(fileExists(REPORTS_DIR, 'task-039-school-system-mock-to-live-identity-bridge-v1.json')).toBe(true)
  })
})
