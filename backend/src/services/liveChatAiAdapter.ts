// ─────────────────────────────────────────────────────────────
// Steadfast AI — Live Chat AI Adapter v2
// Converts a ChatPromptPacket (safe bounded prompt packet) into
// the existing AI generation input format.
// Ensures forbidden context is excluded and context is bounded.
// Also provides the real AI adapter that calls the existing
// aiService.chat() with the assembled prompt.
// ─────────────────────────────────────────────────────────────

import type { ChatPromptPacket } from './chatPipelineContracts';
import { aiService } from './aiService';
import { runReliableAiOperation } from './aiRuntimeReliabilityService';

export interface ExistingAiInput {
  prompt: string;
  messages: Array<{ role: string; content: string }>;
  metadata: Record<string, unknown>;
}

export interface ExistingAiCallInput {
  studentId: string;
  message: string;
  topic?: string | null;
}

export interface AiAdapterOutput {
  answer: string;
  sources: unknown[];
  followUps: string[];
  warnings: string[];
}

export class LiveChatAiAdapter {
  /**
   * Convert a ChatPromptPacket into the existing AI generation input format.
   * Returns a structured prompt string + messages array compatible with
   * the current OpenAI / chat completion call signature.
   */
  buildExistingAiInputFromPromptPacket(packet: ChatPromptPacket): ExistingAiInput {
    const messages: Array<{ role: string; content: string }> = [];
    const metadata: Record<string, unknown> = {};
    let prompt = '';

    // ── 1. System instructions ──
    if (packet.systemInstructions.length > 0) {
      const systemContent = packet.systemInstructions.join('\n');
      messages.push({ role: 'system', content: systemContent });
      prompt += systemContent + '\n\n';
    }

    // ── 2. Developer instructions (intent context) ──
    if (packet.developerInstructions.length > 0) {
      const devContent = packet.developerInstructions.join('\n');
      messages.push({ role: 'developer', content: devContent });
      prompt += devContent + '\n\n';
    }

    // ── 3. Tutor task instruction ──
    const taskContent = packet.tutorTaskInstruction;
    if (taskContent) {
      messages.push({ role: 'developer', content: `Tutor task: ${taskContent}` });
      prompt += `Tutor task: ${taskContent}\n\n`;
    }

    // ── 4. Allowed context (bounded, safe) ──
    const contextParts: string[] = [];

    if (packet.allowedContext.tutorState) {
      const ts = packet.allowedContext.tutorState as Record<string, unknown>;
      contextParts.push(`Active context: subject=${ts.activeSubject || 'unknown'}, topic=${ts.activeTopic || 'unknown'}, mode=${ts.learningMode || 'learn'}`);
    }

    if (packet.allowedContext.learnerProfile) {
      const profile = packet.allowedContext.learnerProfile as Record<string, unknown[]>;
      if (profile.strengths && profile.strengths.length > 0) {
        contextParts.push(`Learner strengths: ${profile.strengths.map((s: any) => s.label).join(', ')}`);
      }
      if (profile.weaknesses && profile.weaknesses.length > 0) {
        contextParts.push(`Learner weaknesses: ${profile.weaknesses.map((w: any) => w.label).join(', ')}`);
      }
      if (profile.recentMistakes && profile.recentMistakes.length > 0) {
        contextParts.push(`Recent mistakes: ${profile.recentMistakes.map((m: any) => m.summary).join(' | ')}`);
      }
      if (profile.mastery && profile.mastery.length > 0) {
        contextParts.push(`Mastery signals: ${profile.mastery.map((m: any) => `${m.label} (${m.confidence})`).join(', ')}`);
      }
    }

    if (packet.allowedContext.masterySignals && Array.isArray(packet.allowedContext.masterySignals)) {
      const signals = packet.allowedContext.masterySignals as Array<{ action: string; reason: string }>;
      contextParts.push(`Practice recommendations: ${signals.map(s => `${s.action}: ${s.reason}`).join(' | ')}`);
    }

    if (packet.allowedContext.artifactBlocks && Array.isArray(packet.allowedContext.artifactBlocks)) {
      const blocks = packet.allowedContext.artifactBlocks as Array<{ blockId: string; kind: string; summary: string }>;
      contextParts.push(`Artifact blocks available: ${blocks.length} block(s) — ${blocks.map(b => `${b.kind}: ${b.summary}`).join(' | ')}`);
    }

    if (packet.allowedContext.sourceTrust) {
      const st = packet.allowedContext.sourceTrust as Record<string, unknown>;
      if (st.verifiedSourceIds && Array.isArray(st.verifiedSourceIds) && st.verifiedSourceIds.length > 0) {
        contextParts.push(`Verified sources: ${(st.verifiedSourceIds as string[]).join(', ')}`);
      }
    }

    if (packet.allowedContext.socraticPolicy) {
      const policy = packet.allowedContext.socraticPolicy;
      contextParts.push(
        `Socratic policy: supportMode=${policy.supportMode}; challenge=${policy.challengeLevel}; ` +
        `integrity=${policy.integritySignal}; privacy=${policy.privacyMode}; ` +
        `noFinalAnswerRequired=${policy.noFinalAnswerRequired}; safeSummary=${policy.safeContextSummary || 'none'}`,
      );
      metadata.socraticPolicy = {
        supportMode: policy.supportMode,
        challengeLevel: policy.challengeLevel,
        integritySignal: policy.integritySignal,
        safeguardingSignal: policy.safeguardingSignal,
        noFinalAnswerRequired: policy.noFinalAnswerRequired,
        privacyMode: policy.privacyMode,
      };
    }

    if (contextParts.length > 0) {
      const contextContent = `Learner context:\n${contextParts.join('\n')}`;
      messages.push({ role: 'developer', content: contextContent });
      prompt += contextContent + '\n\n';
    }

    // ── 5. Forbidden context warnings ──
    if (packet.forbiddenContext.length > 0) {
      const forbiddenContent = `Forbidden: Do NOT include ${packet.forbiddenContext.join(', ')} in your response.`;
      messages.push({ role: 'developer', content: forbiddenContent });
      prompt += forbiddenContent + '\n\n';
    }

    // ── 6. Citation policy ──
    if (packet.citationPolicy.allowSourceChips && packet.citationPolicy.verifiedSourceIds.length > 0) {
      const citationContent = `Citation policy: You may reference verified sources: ${packet.citationPolicy.verifiedSourceIds.join(', ')}. Do NOT fabricate URLs.`;
      messages.push({ role: 'developer', content: citationContent });
    }

    // ── 7. Cache policy ──
    if (packet.cachePolicy.cacheAllowed === false) {
      metadata.cachePolicy = 'no_cache';
    }

    // ── 8. Token budget metadata ──
    metadata.tokenBudget = packet.tokenBudget;
    metadata.warnings = packet.warnings;

    // ── 9. Learner message ──
    const learnerContent = packet.learnerMessage;
    if (learnerContent) {
      messages.push({ role: 'user', content: learnerContent });
      prompt += `Student: ${learnerContent}`;
    }

    return { prompt, messages, metadata };
  }

  /**
   * Build the aiService.chat() input (ExistingAiCallInput) from a ChatPromptPacket.
   * Composes the full safe prompt as the message field that includes
   * bounded context + task instructions + learner message.
   */
  buildExistingAiCallInput(
    packet: ChatPromptPacket,
    studentId: string,
  ): ExistingAiCallInput {
    const existingAiInput = this.buildExistingAiInputFromPromptPacket(packet);

    // Compose the message for aiService.chat() from prompt + learner message
    const message = [
      existingAiInput.prompt,
      packet.learnerMessage,
    ].filter(Boolean).join('\n\n');

    // Extract topic from context if available
    let topic: string | null = null;
    if (packet.allowedContext.tutorState) {
      const ts = packet.allowedContext.tutorState as Record<string, unknown>;
      topic = (ts.activeTopic as string) || null;
    }

    return {
      studentId,
      message: message.slice(0, 8000), // bounded to avoid token overflow
      topic,
    };
  }

  /**
   * Call the real existing AI generation service (aiService.chat())
   * with the assembled prompt packet, wrapped with the AI runtime
   * reliability orchestrator for timeout/retry/circuit/budget protection.
   * No placeholders. No fake responses. No mocks.
   */
  async callExistingAiService(
    packet: ChatPromptPacket,
    studentId: string,
  ): Promise<AiAdapterOutput> {
    const aiInput = this.buildExistingAiCallInput(packet, studentId);

    const reliabilityResult = await runReliableAiOperation({
      provider: 'openai',
      operation: 'chat_completion',
      operationIdempotent: true,
      actorType: 'student',
      actorId: studentId,
      promptTextForTokenEstimateOnly: aiInput.message.slice(0, 1000),
      socraticRequired: true,
      noFinalAnswerRequired: true,
      fn: async () => {
        const result = await aiService.chat({
          studentId: aiInput.studentId,
          message: aiInput.message,
          topic: aiInput.topic || undefined,
        });
        return result;
      },
    });

    if (!reliabilityResult.ok) {
      return {
        answer: reliabilityResult.fallback.learnerSafeMessage,
        sources: [],
        followUps: [],
        warnings: [`AI reliability guard: ${reliabilityResult.errorCategory} after ${reliabilityResult.attempts} attempt(s)`],
      };
    }

    return {
      answer: reliabilityResult.data.response,
      sources: [],
      followUps: [],
      warnings: [],
    };
  }
}

export const liveChatAiAdapter = new LiveChatAiAdapter();
