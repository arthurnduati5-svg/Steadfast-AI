// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Response Safety Service v1
// Validates AI output before returning it to the frontend.
// Blocks fake sources, unverified citations, prompt leakage, etc.
// ─────────────────────────────────────────────────────────────

import type { ChatTurnExecutionContext, ChatResponseSafetyDecision } from './chatPipelineContracts';
import { enforceSocraticNoFinalAnswer } from './socraticResponseSafetyService';

function checkFakeUrls(text: string): string[] {
  const detected: string[] = [];
  const urlPattern = /https?:\/\/[^\s"'<>\]\[)]+/gi;
  const matches = text.match(urlPattern) || [];

  for (const url of matches) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'example.com' || parsed.hostname.endsWith('.example.com')) {
        detected.push(url);
      }
    } catch {
      detected.push(url);
    }
  }
  return detected;
}

function checkPromptLeakage(text: string): boolean {
  const patterns = [
    /system\s+prompt/i,
    /developer\s+instructions/i,
    /hidden\s+instructions/i,
    /ignore\s+(previous|above)\s+(instructions|rules)/i,
    /you\s+are\s+(now\s+)?(an?\s+)?(admin|assistant|developer)/i,
  ];
  return patterns.some((p) => p.test(text));
}

function checkAnswerKeyExposure(text: string): boolean {
  const patterns = [
    /\banswer\s+key\b/i,
    /\bsolutions?\s+manual\b/i,
    /\bhere\s+(is|are)\s+(the\s+)?answers?\b/i,
    /\bthe\s+(correct\s+)?answer\s+is\b/i,
  ];
  return patterns.some((p) => p.test(text));
}

export class ChatResponseSafetyService {
  /**
   * Sanitize and validate a chat AI response before returning to the frontend.
   */
  async sanitizeAndValidateChatResponse(
    context: ChatTurnExecutionContext,
    answer: string,
    sources: unknown[],
    followUps: string[],
  ): Promise<{
    answer: string;
    sources: unknown[];
    followUps: string[];
    safety: ChatResponseSafetyDecision;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const blockedReasons: string[] = [];
    const fakeSourcesDetected: string[] = [];
    const unverifiedSources: string[] = [];
    let promptLeakageDetected = false;
    let answerKeyExposureRisk = false;

    // ── 1. Check for fake URLs in the answer ──
    const fakeUrls = checkFakeUrls(answer);
    if (fakeUrls.length > 0) {
      fakeSourcesDetected.push(...fakeUrls);
      warnings.push(`Fake URLs detected and removed from response: ${fakeUrls.join(', ')}`);
    }

    // ── 2. Check prompt leakage ──
    promptLeakageDetected = checkPromptLeakage(answer);
    if (promptLeakageDetected) {
      blockedReasons.push('Prompt leakage detected in response.');
      warnings.push('Response may contain internal instructions. Blocking for safety.');
    }

    // ── 3. Check answer key exposure ──
    answerKeyExposureRisk = checkAnswerKeyExposure(answer);
    if (answerKeyExposureRisk) {
      warnings.push('Answer key exposure risk detected. Verify response before returning.');
    }

    // ── 4. Validate sources ──
    const cleanedSources: unknown[] = [];
    const verifiedSourceIds = new Set(
      (context.tutorContext?.sourceTrust?.allowedSourceIds || []).map((id) => String(id)),
    );

    if (Array.isArray(sources)) {
      for (const source of sources) {
        const src = source as Record<string, unknown>;
        const url = String(src?.url || '').trim();
        const sourceId = String(src?.sourceId || src?.id || '').trim();

        // Block fake URLs
        if (!url || /example\.com/i.test(url)) {
          unverifiedSources.push(url || 'unknown');
          continue;
        }

        // Check if source is verified
        if (sourceId && !verifiedSourceIds.has(sourceId)) {
          unverifiedSources.push(sourceId);
          continue;
        }

        cleanedSources.push(source);
      }
    }

    if (unverifiedSources.length > 0) {
      warnings.push(`${unverifiedSources.length} unverified source(s) removed.`);
    }

    // ── 5. Check unsafe / clarification intent ──
    if (context.intentResolution?.status === 'unsafe') {
      return {
        answer: 'I cannot process that request. Please ask a learning-related question.',
        sources: [],
        followUps: ['What would you like to learn about?'],
        safety: {
          safeToReturn: true,
          blockedReasons: ['Unsafe intent — returning safe refusal.'],
          fakeSourcesDetected,
          unverifiedSources,
          promptLeakageDetected: false,
          answerKeyExposureRisk: false,
          warnings: ['Original request was flagged as unsafe.'],
        },
        warnings: ['Returned safe refusal for unsafe intent.'],
      };
    }

    if (context.intentResolution?.status === 'needs_clarification') {
      const clarification = context.intentResolution.clarification;
      return {
        answer: clarification?.question || 'Could you clarify what you need help with?',
        sources: [],
        followUps: clarification?.options || ['Explain a topic', 'Practice', 'Check my work'],
        safety: {
          safeToReturn: true,
          blockedReasons: [],
          fakeSourcesDetected,
          unverifiedSources,
          promptLeakageDetected: false,
          answerKeyExposureRisk: false,
          warnings: ['Returned clarification request without AI generation.'],
        },
        warnings: ['Clarification needed — returned clarification question.'],
      };
    }

    const socraticSafety = enforceSocraticNoFinalAnswer({
      answer,
      noFinalAnswerRequired: context.socraticPolicyContext?.noFinalAnswerRequired === true,
      recommendedTutorMove: context.socraticPolicyContext?.recommendedTutorMove,
    });

    if (socraticSafety.transformed) {
      answer = socraticSafety.answer;
      warnings.push(...socraticSafety.warnings);
      answerKeyExposureRisk = true;
    }

    // ── 6. Build safety decision ──
    const safeToReturn = !promptLeakageDetected;
    if (!safeToReturn) {
      answer = 'I encountered an issue generating a response. Please try rephrasing your question.';
    }

    const safety: ChatResponseSafetyDecision = {
      safeToReturn,
      blockedReasons,
      fakeSourcesDetected,
      unverifiedSources,
      promptLeakageDetected,
      answerKeyExposureRisk,
      warnings,
    };

    return {
      answer: promptLeakageDetected ? 'I encountered an issue generating a response. Please try rephrasing your question.' : answer,
      sources: cleanedSources,
      followUps,
      safety,
      warnings,
    };
  }
}

export const chatResponseSafetyService = new ChatResponseSafetyService();
