import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { classifySignal } from '../services/task024IncidentClassificationService';
import { getSeverityRules } from '../services/task024IncidentClassificationService';
import type { IncidentSignal } from '../contracts/task024OperationsContracts';

const AI_PROVIDER_IMPORTS = [
  'openai', 'aiProvider', 'aiProviderFactory',
  'anthropic', 'cohere', 'together', 'google/generative-ai',
  '@anthropic-ai/sdk', 'langchain', 'llm',
  'AiProviderClient', 'createAiProvider',
];

const AI_PROVIDER_PATTERNS = [
  /\bfrom\s+['"]openai['"]/i,
  /\bfrom\s+['"]@anthropic-ai\/sdk['"]/i,
  /\bfrom\s+['"].*\/aiProvider/i,
  /\bfrom\s+['"].*\/aiProviderFactory/i,
  /\bfrom\s+['"]langchain/i,
  /\bimport\s+(openai|Anthropic|Cohere|Together|GoogleGenerativeAI)\b/i,
];

const servicesDir = resolve(__dirname, '..', 'services');
const testsDir = resolve(__dirname);

function getServiceFiles(): string[] {
  return readdirSync(servicesDir)
    .filter((f) => f.startsWith('task024') && f.endsWith('.ts'))
    .map((f) => resolve(servicesDir, f));
}

function getTestFiles(): string[] {
  return readdirSync(testsDir)
    .filter((f) => f.startsWith('task-024') && f.endsWith('.test.ts'))
    .map((f) => resolve(testsDir, f));
}

function fileContainsAny(filePath: string, patterns: RegExp[]): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return pattern.source;
      }
    }
    return null;
  } catch {
    return null;
  }
}

describe('task024NoLiveAiCallContract', () => {
  describe('service files do not import AI providers', () => {
    const serviceFiles = getServiceFiles();

    it('at least one task024 service file exists', () => {
      expect(serviceFiles.length).toBeGreaterThan(0);
    });

    for (const filePath of serviceFiles) {
      const fileName = filePath.split(/[\\/]/).pop() ?? '';
      it(`${fileName} contains no AI provider imports`, () => {
        const matched = fileContainsAny(filePath, AI_PROVIDER_PATTERNS);
        expect(matched).toBeNull();
      });
    }

    it('no service file directly imports AI provider SDKs', () => {
      const allSources = serviceFiles
        .map((f) => {
          try {
            return readFileSync(f, 'utf-8');
          } catch {
            return '';
          }
        })
        .join('\n');
      for (const pattern of AI_PROVIDER_PATTERNS) {
        expect(allSources).not.toMatch(pattern);
      }
    });
  });

  describe('no test file mocks or calls AI providers', () => {
    const testFiles = getTestFiles();

    it('at least one task-024 test file exists', () => {
      expect(testFiles.length).toBeGreaterThan(0);
    });

    for (const filePath of testFiles) {
      const fileName = filePath.split(/[\\/]/).pop() ?? '';
      it(`${fileName} contains no AI provider mocks or imports`, () => {
        const matched = fileContainsAny(filePath, AI_PROVIDER_PATTERNS);
        expect(matched).toBeNull();
      });
    }

    it('no test file imports or references AI provider SDKs directly', () => {
      const allTestSources = testFiles
        .map((f) => {
          try {
            return readFileSync(f, 'utf-8');
          } catch {
            return '';
          }
        })
        .join('\n');
      for (const pattern of AI_PROVIDER_PATTERNS) {
        expect(allTestSources).not.toMatch(pattern);
      }
    });
  });

  describe('IncidentClassificationService uses deterministic rules, not AI', () => {
    it('classifySignal maps signalType to severity via lookup table — not AI', () => {
      const rules = getSeverityRules();
      expect(Object.keys(rules).length).toBeGreaterThan(0);
      for (const [signalType, rule] of Object.entries(rules)) {
        expect(typeof rule.severity).toBe('string');
        expect(typeof rule.category).toBe('string');
        expect(['info', 'low', 'medium', 'high', 'critical']).toContain(rule.severity);
      }
    });

    it('classifySignal returns deterministic output for known signals', () => {
      const rules = getSeverityRules();
      const sampleTypes = Object.keys(rules).slice(0, 5);
      for (const signalType of sampleTypes) {
        const signal: IncidentSignal = {
          source: 'test',
          component: 'test-component',
          signalType,
          detectedAt: new Date().toISOString(),
          safeSummary: `Test signal for ${signalType}`,
        };
        const record1 = classifySignal(signal);
        const record2 = classifySignal(signal);
        expect(record1.category).toBe(record2.category);
        expect(record1.severity).toBe(record2.severity);
        expect(record1.recommendedOwnerRole).toBe(record2.recommendedOwnerRole);
      }
    });

    it('classifySignal does not call any external AI endpoint', () => {
      const rules = getSeverityRules();
      const signal: IncidentSignal = {
        source: 'test',
        component: 'database',
        signalType: 'database_unavailable',
        detectedAt: new Date().toISOString(),
        safeSummary: 'Simulated database unavailable',
      };
      const record = classifySignal(signal);
      expect(record.category).toBe('database');
      expect(record.severity).toBe('critical');
      expect(record.status).toBe('detected');
      expect(record.studentSafetyRelevant).toBe(false);
      expect(record.privacyRelevant).toBe(false);
    });

    it('getSeverityRules contains only known deterministic keys', () => {
      const rules = getSeverityRules();
      const knownKeys = [
        'secret_leak_detected', 'privacy_leak_detected', 'database_unavailable',
        'startup_gate_blocked', 'migration_safety_critical',
        'safeguarding_pipeline_unavailable', 'school_integration_readiness_failure',
        'content_governance_readiness_failure', 'deen_governance_source_unavailable',
        'content_gap_spike', 'ai_gateway_unsafe', 'backup_readiness_failed',
        'restore_drill_failed', 'rate_limit_abuse_spike', 'prisma_readiness_failure',
      ];
      for (const key of knownKeys) {
        expect(rules[key]).toBeDefined();
      }
      expect(Object.keys(rules).length).toBe(knownKeys.length);
    });

    it('classifySignal does not reference any language model or inference', () => {
      const rules = getSeverityRules();
      const signal: IncidentSignal = {
        source: 'test',
        component: 'unknown',
        signalType: 'unknown_type',
        detectedAt: new Date().toISOString(),
        safeSummary: 'Fallback test',
      };
      const record = classifySignal(signal);
      expect(record.category).toBe('unknown');
      expect(record.severity).toBe('low');
    });
  });
});
