import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const FINAL_DOCS = [
  '../docs/architecture/FINAL_BACKEND_ACCEPTED_TASK_RECONCILIATION_MAP.md',
  '../docs/architecture/FINAL_BACKEND_SOURCE_OF_TRUTH_INDEX.md',
  '../docs/architecture/FINAL_BACKEND_PAUSE_GATE.md',
  '../docs/architecture/FINAL_REPORT_RECONCILIATION_AUDIT.md',
  '../docs/frontend/FINAL_FRONTEND_CONTRACT_READINESS_RECONCILIATION.md',
  '../docs/integration/FINAL_INTEGRATION_DEFERRED_BOUNDARY_RECONCILIATION.md',
]

const REPORT_DIR = path.resolve(__dirname, '../../../reports')

function getAllFinalDocContents(): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = []
  for (const doc of FINAL_DOCS) {
    const p = path.resolve(__dirname, doc)
    if (fs.existsSync(p)) {
      results.push({ path: doc, content: fs.readFileSync(p, 'utf-8') })
    }
  }
  return results
}

/**
 * Check if a pattern appears to be a real (non-fake) credential.
 * We allow `sk-test-...`, placeholder values, and obvious examples.
 */
function appearsReal(value: string): boolean {
  const lower = value.toLowerCase()
  // Allow obvious placeholders
  if (lower.includes('placeholder') || lower.includes('example') || lower.includes('test-') || lower.includes('your-') || lower.includes('sk-test')) return false
  // Check for realistic-looking secrets
  if (/^sk-[a-z0-9]{20,}/i.test(value)) return true
  if (/^[a-zA-Z0-9_-]{32,}$/.test(value)) return true
  return false
}

describe('Task 040 — Final Privacy Leak Scan', () => {

  const docs = getAllFinalDocContents()

  it('no docs expose real API keys', () => {
    const patterns = [
      /sk-[a-zA-Z0-9]{20,}/g,
      /AI[A-Za-z0-9_-]{30,}/g,
    ]
    for (const { path: p, content } of docs) {
      for (const pattern of patterns) {
        const matches = content.match(pattern) || []
        for (const m of matches) {
          if (appearsReal(m)) {
            expect.fail(`Potential API key leak in ${p}: ${m}`)
          }
        }
      }
    }
  })

  it('no docs expose school credentials', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/school.*credential.*:.*[^\s]/)
    }
  })

  it('no docs expose provider credentials', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/provider.*(key|secret|token).*:.*[^\s]/)
    }
  })

  it('no docs expose database URLs', () => {
    const patterns = [
      /postgresql:\/\/[^\s]+/,
      /mysql:\/\/[^\s]+/,
      /mongodb:\/\/[^\s]+/,
      /DATABASE_URL[=:][^\s]+/,
    ]
    for (const { path: p, content } of docs) {
      for (const pattern of patterns) {
        const matches = content.match(pattern)
        if (matches) {
          // Allow if it's clearly a placeholder
          for (const m of matches) {
            if (!m.includes('placeholder') && !m.includes('localhost') && !m.includes('your-')) {
              expect.fail(`Potential DB URL leak in ${p}: ${m}`)
            }
          }
        }
      }
    }
  })

  it('no docs expose JWT-looking strings', () => {
    for (const { path: p, content } of docs) {
      const matches = content.match(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g)
      if (matches) {
        expect.fail(`Potential JWT leak in ${p}`)
      }
    }
  })

  it('no docs expose private keys', () => {
    const patterns = [
      /BEGIN (RSA |EC )?PRIVATE KEY/,
      /private_key[=:][^\s]+/,
    ]
    for (const { path: p, content } of docs) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          expect.fail(`Potential private key leak in ${p}`)
        }
      }
    }
  })

  it('no docs expose authorization headers', () => {
    for (const { path: p, content } of docs) {
      if (/\b[Aa]uthorization:?\s+(Bearer|Basic|Digest)\s+[^\s]{10,}/.test(content)) {
        expect.fail(`Potential authorization header leak in ${p}`)
      }
    }
  })

  it('no docs expose answer keys', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/answer\s*ke?y[^:]*:[^"]{10,}/)
    }
  })

  it('no docs expose teacher-only raw content', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/teacher.only[^:]*:[^"]{20,}/)
    }
  })

  it('no docs expose safeguarding raw details', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/safeguarding[^:]*:[^"]{20,}/)
    }
  })

  it('no docs expose real student names', () => {
    for (const { path: p, content } of docs) {
      const lines = content.split('\n')
      for (const line of lines) {
        if (/student.*name/i.test(line) && /[A-Z][a-z]+ [A-Z][a-z]+/.test(line)) {
          // Allow if clearly fake/test
          if (!line.toLowerCase().includes('test') && !line.toLowerCase().includes('example') && !line.toLowerCase().includes('anon')) {
            expect.fail(`Potential real student name in ${p}: ${line}`)
          }
        }
      }
    }
  })

  it('no docs expose real emails unless clearly fake', () => {
    for (const { path: p, content } of docs) {
      const matches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
      if (matches) {
        for (const m of matches) {
          if (!m.includes('example.com') && !m.includes('test.com') && !m.includes('fake')) {
            expect.fail(`Potential real email in ${p}: ${m}`)
          }
        }
      }
    }
  })

  it('no docs expose AI prompts', () => {
    for (const { path: p, content } of docs) {
      if (content.toLowerCase().includes('system prompt') && content.length > 2000) {
        expect.fail(`Potential AI prompt dump in ${p}`)
      }
    }
  })

  it('no docs expose provider responses', () => {
    for (const { path: p, content } of docs) {
      if (content.toLowerCase().includes('assistant') && content.length > 5000) {
        expect.fail(`Potential provider response dump in ${p}`)
      }
    }
  })

  it('no docs claim live frontend integration has happened', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/frontend.*integrat(ed|ion).*(complete|done|finished)/i)
    }
  })

  it('no docs claim live school integration has happened', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/school.*(integrat|connect).*(complete|done|finished|live)/i)
    }
  })

  it('no docs claim live AI integration has happened', () => {
    for (const { path: p, content } of docs) {
      expect(content.toLowerCase()).not.toMatch(/ai.*(integrat|connect|provider).*(complete|done|finished|live)/i)
    }
  })
})
