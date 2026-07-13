import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ARCH_DIR = path.resolve(__dirname, '../../../docs/architecture')

describe('Task 040 — Final Backend Pause Gate', () => {

  it('backend pause gate document exists', () => {
    expect(fs.existsSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'))).toBe(true)
  })

  it('states backend feature-building is paused', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/Backend feature-building is paused after Task 040/i)
  })

  it('documents what changes are allowed during pause', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Changes Are Allowed During Pause/i)
  })

  it('documents what changes are forbidden during pause', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Changes Are Forbidden During Pause/i)
  })

  it('documents what must trigger reopening backend work', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Must Trigger Reopening Backend Work/i)
  })

  it('documents what is deferred to frontend integration', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Is Deferred to Frontend Integration/i)
  })

  it('documents what is deferred to live school-system integration', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Is Deferred to Live School-System Integration/i)
  })

  it('documents what is deferred to live AI provider activation', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Is Deferred to Live AI Provider Activation/i)
  })

  it('documents what is deferred to pilot/launch', () => {
    const doc = fs.readFileSync(path.resolve(ARCH_DIR, 'FINAL_BACKEND_PAUSE_GATE.md'), 'utf-8')
    expect(doc).toMatch(/What Is Deferred to Pilot\/Launch/i)
  })
})
