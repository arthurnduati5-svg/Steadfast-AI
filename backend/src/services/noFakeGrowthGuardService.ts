import type { GrowthAggregate } from '../contracts/growthAggregateContracts';
import type { NoFakeGrowthGuardResult } from '../contracts/noFakeGrowthContracts';
import { NO_FAKE_GROWTH_VIOLATION_CODES, isGrowthAggregate } from '../contracts/noFakeGrowthContracts';
import { classifyDataSource } from './dataSourceTruthService';
import { runNoFakeDemoGuard } from './noFakeDemoGuardService';

export function assertNoFakeGrowthAggregate(input: GrowthAggregate): NoFakeGrowthGuardResult {
  const violations: string[] = [];
  const checkedAt = new Date().toISOString();

  if (!input.truthState) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.MISSING_TRUTH_STATE);
  }

  if (!input.generatedAt) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.MISSING_GENERATED_AT);
  }

  if (!input.safeMeta) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.MISSING_SAFE_META);
  }

  if (input.safeMeta?.demoDataIncluded && input.truthState === 'live') {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.DEMO_DATA_AS_LIVE);
  }

  if (input.safeMeta?.frontendSynthesized) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.FRONTEND_SYNTHESIZED);
  }

  if (input.safeMeta?.rawChatIncluded) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_CHAT_INCLUDED);
  }

  if (input.safeMeta?.rawLearnerMemoryIncluded) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_LEARNER_MEMORY_INCLUDED);
  }

  if (input.safeMeta?.rawTranscriptIncluded) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_TRANSCRIPT_INCLUDED);
  }

  if (input.safeMeta?.rawPromptIncluded) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_PROMPT_INCLUDED);
  }

  if (input.weakAreas) {
    for (const wa of input.weakAreas) {
      if ((wa.strength === 'weak' || wa.strength === 'stable') && wa.evidenceCount === 0) {
        violations.push(`${NO_FAKE_GROWTH_VIOLATION_CODES.WEAK_AREA_ZERO_EVIDENCE}: ${wa.skillId}`);
      }
    }
  }

  if (
    input.masterySummary?.confidence === 'high' &&
    input.masterySummary?.knownSkillCount === 0 &&
    input.masterySummary?.stableSkillCount === 0
  ) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.HIGH_CONFIDENCE_ZERO_EVIDENCE);
  }

  const hasRawEvidence = checkRawEvidenceFields(input);
  if (hasRawEvidence) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.ANSWER_KEY_IN_SAFE_OUTPUT);
  }

  return {
    safe: violations.length === 0,
    violations,
    checkedAt,
  };
}

export function assertNoUnsafeLearnerEvidence(input: unknown): NoFakeGrowthGuardResult {
  const violations: string[] = [];
  const checkedAt = new Date().toISOString();

  if (!input || typeof input !== 'object') {
    violations.push('input_is_not_an_object');
    return { safe: false, violations, checkedAt };
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.rawChat === 'string' || typeof obj.rawTranscript === 'string') {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_CHAT_INCLUDED);
  }

  if (typeof obj.rawLearnerMemory === 'string') {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_LEARNER_MEMORY_INCLUDED);
  }

  if (Array.isArray(obj.chatMessages) && obj.chatMessages.length > 0) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.RAW_CHAT_INCLUDED);
  }

  return {
    safe: violations.length === 0,
    violations,
    checkedAt,
  };
}

export function assertNoFrontendSynthesizedTruth(input: GrowthAggregate): NoFakeGrowthGuardResult {
  const violations: string[] = [];
  const checkedAt = new Date().toISOString();

  if (input.safeMeta?.frontendSynthesized) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.FRONTEND_SYNTHESIZED);
  }

  if (input.safeMeta?.demoDataIncluded) {
    violations.push(NO_FAKE_GROWTH_VIOLATION_CODES.DEMO_DATA_AS_LIVE);
  }

  return {
    safe: violations.length === 0,
    violations,
    checkedAt,
  };
}

function checkRawEvidenceFields(aggregate: GrowthAggregate): boolean {
  const suspiciousKeys = ['rawChat', 'rawTranscript', 'rawLearnerMemory', 'rawPrompt', 'answerKey', 'expectedAnswer'];

  for (const wa of aggregate.weakAreas ?? []) {
    for (const key of suspiciousKeys) {
      if (key in wa) return true;
    }
    for (const prov of wa.provenance ?? []) {
      if ((prov as unknown as Record<string, unknown>).rawPrivateDataIncluded === true) return true;
    }
  }

  return false;
}

export function runFullNoFakeGrowthGuard(input: GrowthAggregate): NoFakeGrowthGuardResult {
  const aggregateCheck = assertNoFakeGrowthAggregate(input);
  const frontendCheck = assertNoFrontendSynthesizedTruth(input);

  const allViolations = [...aggregateCheck.violations, ...frontendCheck.violations];

  // Run NoFakeDemo guard on the metadata if available
  if (input.masterySummary) {
    const truth = classifyDataSource({
      declaredKind: 'real',
      safeReason: 'Growth aggregate mastery summary check',
    });
    const demoCheck = runNoFakeDemoGuard(truth);
    if (!demoCheck.safe) {
      allViolations.push(...demoCheck.violations.map((v) => `no_fake_demo: ${v}`));
    }
  }

  return {
    safe: allViolations.length === 0,
    violations: allViolations,
    checkedAt: new Date().toISOString(),
  };
}
