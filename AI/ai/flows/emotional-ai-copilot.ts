'use server';

import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { runFlow } from '@genkit-ai/flow';
import { webSearchFlow } from './web_search_flow';
import { getYoutubeTranscriptFlow } from './get-youtube-transcript';
import { youtubeSearchFlow } from './youtube-search-flow';
import { runResearchOrchestrator } from './research-orchestrator';
import { GUARDIAN_SANITIZE, quran_pedagogy } from '../tools/handlers';
import { detectLearningTurnPlan, detectResearchIntent, heuristicResearchIntent } from './intent-detector';

// Ã¢Å“â€¦ Import Scope Guardian
import { isOutOfScope, getDynamicScopeResponse } from '../tools/scope-guardian';
import {
    evaluateSexualityScopePolicy,
    type SexualityPolicyBlockReason
} from '../tools/grade-sexuality-policy';

// Ã¢Å“â€¦ NEW: Import Multilingual Governance
import {
    getLanguageGovernance,
    getDeliveryRefinementLayer,
    getAdaptiveDeliveryLayers,
    getMasterBehavioralOrchestrationLayer
} from '../tools/multilingual-governance';

// Ã¢Å“â€¦ Relative Import
import { Message, TutorArtifact } from '../../lib/types';
import { buildSteadfastTutorConstitutionLayer } from '../../lib/steadfast-product';
import type {
    AskPracticeToolArgs,
    EmotionalAICopilotInput,
    EmotionalAICopilotOutput,
    ExtendedConversationState,
    MathTopicType,
    ResearchStatusEvent,
    ResearchOrchestratorResult,
    YoutubeSearchResult,
} from './emotional-ai-copilot.types';
import {
    buildAttachmentPromptSummary,
    extractTextFromPdfWithOcrFallback,
    isLikelyDenseTextRequest,
    runImageOcrAssist,
} from './emotional-ai-copilot.attachments.js';
import {
    emitChunkedText,
    finalizeAssistantResponseText,
    looksIncompleteResponse,
    shouldAttemptCompletionRepair,
} from './emotional-ai-copilot.completion.js';
import {
    applyLanguageOutputRules,
    buildFallbackPracticeQuestion,
    buildGenericPracticeRetryFeedback,
    buildGenericPracticeSuccessFeedback,
    buildGreetingText,
    buildPracticeChallengeReply,
    enforceFoundationalTheoryPacing,
    ensureCompleteSentence,
    extractTheoryTopicFromInput,
    isConceptualContinuation,
    localizedText,
    shouldExitConceptualMode,
    shouldUseConceptualMicroPacingMode,
    shouldUseFoundationalTeachingMode,
    validateAnswer,
} from './emotional-ai-copilot.teaching.js';
import {
    buildDenominatorQuestionLabel,
    buildMathFoundationRetryScaffold,
    buildMathKickoffPrompt,
    buildMathNoFinalAnswerSocraticReply,
    buildMathLessonStep,
    buildMathRetryScaffold,
    buildMathStepClarification,
    buildMathSuccessFeedback,
    buildMathWorkedExampleScaffold,
    detectMathLessonKind,
    detectMathTopicType,
    evaluateMathExpression,
    extractMathExpression,
    getMathWorkedExampleThreshold,
    getMathKickoffExpectedAnswers,
    isDirectAnswerRequest,
    isMathClarificationInput,
    isMathFocusedInput,
    normalizeCorrectAnswers,
    parseFractionDivisionExpression,
    parseToolArguments,
    recoverFractionDivisionExpressionFromContext,
    isVisualRatingOrCritiqueInput,
} from './emotional-ai-copilot.math.js';
import {
    buildSexualityPolicyReply,
    buildSupportiveSafetyReply,
    detectSupportRiskSignal,
} from './emotional-ai-copilot.safety.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function describeHistoryAttachments(message: Message): string[] {
    const msg = message as Message & { metadata?: any };
    const labels: string[] = [];
    const attachments = Array.isArray(msg.metadata?.attachments) ? msg.metadata.attachments : [];

    for (const attachment of attachments) {
        const kind = String(attachment?.kind || attachment?.type || 'file').toLowerCase();
        const fileName = String(attachment?.fileName || attachment?.name || '').trim();
        if (kind === 'image') {
            labels.push(fileName ? `image "${fileName}"` : 'an image');
            continue;
        }
        if (kind === 'pdf') {
            labels.push(fileName ? `PDF "${fileName}"` : 'a PDF document');
            continue;
        }
        if (kind === 'text') {
            labels.push(fileName ? `text file "${fileName}"` : 'a text document');
            continue;
        }
        labels.push(fileName ? `file "${fileName}"` : 'a study file');
    }

    if (labels.length === 0 && msg.image?.alt) {
        labels.push(`image "${msg.image.alt}"`);
    } else if (labels.length === 0 && msg.image?.src) {
        labels.push('an uploaded image');
    }

    return labels;
}

function buildHistoryMessageContent(message: Message): string {
    const base = String(message.content || '').trim();
    const attachmentContext = extractPersistedAttachmentContextFromMessage(message);
    const tutorArtifacts = extractPersistedTutorArtifactsFromMessage(message);
    const attachmentLabels = attachmentContext?.labels || describeHistoryAttachments(message);
    if (attachmentLabels.length === 0 && !attachmentContext?.summary && tutorArtifacts.length === 0) return base;

    const attachmentNote = [
        attachmentLabels.length > 0 ? `Uploaded study material in this message: ${attachmentLabels.join(', ')}.` : '',
        attachmentContext?.summary ? `Stored material context: ${attachmentContext.summary}` : '',
        tutorArtifacts.length > 0 ? buildArtifactReasoningContext(tutorArtifacts) : '',
        'Keep that file/image in context for follow-up questions unless the student changes topic.',
    ].filter(Boolean).join(' ');
    return base ? `${base}\n\n[${attachmentNote}]` : `[${attachmentNote}]`;
}

function extractPersistedAttachmentsFromMessage(message: Message): Array<
    | { kind?: 'image'; type?: string; mimeType?: string; base64: string; fileName?: string }
    | { kind: 'text'; mimeType?: string; text: string; fileName?: string; truncated?: boolean }
    | { kind: 'pdf'; mimeType?: string; type?: string; base64: string; fileName?: string }
> {
    const typedMessage = message as Message & { metadata?: any };
    const rawFileData = typedMessage.metadata?.fileData;
    if (Array.isArray(rawFileData)) {
        return rawFileData.filter(Boolean);
    }
    return rawFileData ? [rawFileData] : [];
}

function extractPersistedAttachmentContextFromMessage(message: Message): {
    labels: string[];
    summary: string;
} | null {
    const typedMessage = message as Message & { metadata?: any };
    const metadata = typedMessage.metadata || {};
    const labels = Array.isArray(metadata.attachmentLabels)
        ? metadata.attachmentLabels.map((label: unknown) => String(label || '').trim()).filter(Boolean)
        : describeHistoryAttachments(message);
    const summary = String(metadata.attachmentContextSummary || '').trim();
    if (!summary && labels.length === 0) return null;
    return { labels, summary };
}

function extractPersistedTutorArtifactsFromMessage(message: Message): TutorArtifact[] {
    const typedMessage = message as Message & { metadata?: any };
    const raw = Array.isArray(typedMessage.metadata?.tutorArtifacts) ? typedMessage.metadata.tutorArtifacts : [];
    return raw as TutorArtifact[];
}

function buildArtifactReasoningContext(artifacts: TutorArtifact[]): string {
    const usableArtifacts = artifacts.filter(Boolean).slice(0, 2);
    if (usableArtifacts.length === 0) return '';

    const lines: string[] = ['Structured study material context:'];
    for (const artifact of usableArtifacts) {
        const parts = [
            artifact.label ? `Material: ${artifact.label}.` : '',
            artifact.subject ? `Subject: ${artifact.subject}.` : '',
            artifact.artifactType ? `Type: ${artifact.artifactType}.` : '',
            artifact.summary ? `Summary: ${artifact.summary}` : '',
            Array.isArray(artifact.headings) && artifact.headings.length > 0
                ? `Headings: ${artifact.headings.slice(0, 4).join(' | ')}`
                : '',
            Array.isArray(artifact.questions) && artifact.questions.length > 0
                ? `Questions detected: ${artifact.questions.slice(0, 4).join(' | ')}`
                : '',
            Array.isArray(artifact.actionableTasks) && artifact.actionableTasks.length > 0
                ? `Likely tasks: ${artifact.actionableTasks.slice(0, 4).join(' | ')}`
                : '',
            Array.isArray(artifact.keywords) && artifact.keywords.length > 0
                ? `Keywords: ${artifact.keywords.slice(0, 6).join(', ')}`
                : '',
        ].filter(Boolean);
        if (parts.length > 0) {
            lines.push(parts.join(' '));
        }
    }

    lines.push('When the student refers to "this", "the file", "the image", or "the document", use this material context first.');
    return lines.join('\n');
}

function shouldReusePriorAttachmentContext(text: string): boolean {
    const raw = String(text || '').trim().toLowerCase();
    if (!raw) return false;
    return (
        isLikelyFollowUpQuery(raw) ||
        /\b(image|photo|picture|poster|design|logo|layout|brand|branding|style|colour|color|look|looks|visual|that image|this image|the image|uploaded|attachment|attached|file|document|pdf|notes|worksheet|diagram|graph|table|page)\b/i.test(raw)
    );
}

function findLatestPersistedAttachments(chatHistory: Message[]) {
    for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
        const message = chatHistory[i];
        if (message.role !== 'user') continue;
        const attachments = extractPersistedAttachmentsFromMessage(message);
        if (attachments.length === 0) continue;
        const persistedContext = extractPersistedAttachmentContextFromMessage(message);
        const attachmentLabels = persistedContext?.labels || describeHistoryAttachments(message);
        return {
            attachments,
            labels: attachmentLabels,
            summary: persistedContext?.summary || '',
            requestText: String(message.content || '').trim(),
        };
    }
    return null;
}

function findLatestTutorArtifacts(chatHistory: Message[]): TutorArtifact[] {
    for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
        const message = chatHistory[i];
        if (message.role !== 'user') continue;
        const artifacts = extractPersistedTutorArtifactsFromMessage(message);
        if (artifacts.length > 0) {
            return artifacts;
        }
    }
    return [];
}

function buildFallbackAttachmentContext(args: {
    labels: string[];
    requestText?: string;
}): string {
    const labels = args.labels.map((label) => String(label || '').trim()).filter(Boolean).slice(0, 5);
    const requestText = String(args.requestText || '').replace(/\s+/g, ' ').trim();
    const parts = [
        labels.length > 0 ? `Uploaded study material: ${labels.join(', ')}.` : '',
        requestText ? `Student request at upload time: ${requestText}.` : '',
        'Keep the uploaded material in scope for follow-up questions unless the student explicitly changes topic.',
    ].filter(Boolean);
    return parts.join(' ').trim();
}

function hydrateAttachmentStateFromHistory(args: {
    state: ExtendedConversationState;
    inferredContext: ReturnType<typeof findLatestPersistedAttachments> | null;
}): void {
    if (!args.inferredContext) return;
    if ((!args.state.lastAttachmentLabels || args.state.lastAttachmentLabels.length === 0) && args.inferredContext.labels.length > 0) {
        args.state.lastAttachmentLabels = args.inferredContext.labels;
    }
    if (!args.state.lastAttachmentContextSummary) {
        args.state.lastAttachmentContextSummary =
            args.inferredContext.summary ||
            buildFallbackAttachmentContext({
                labels: args.inferredContext.labels,
                requestText: args.inferredContext.requestText,
            });
    }
}

function buildAttachmentConversationContext(args: {
    userText: string;
    attachmentSummaries: string[];
    attachmentLabels: string[];
}): string {
    const cleanedSummaries = args.attachmentSummaries
        .map((summary) => String(summary || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 3);
    const cleanedLabels = args.attachmentLabels
        .map((label) => String(label || '').trim())
        .filter(Boolean)
        .slice(0, 5);
    const userText = String(args.userText || '').trim();

    const parts = [
        cleanedLabels.length > 0 ? `Uploaded study material: ${cleanedLabels.join(', ')}.` : '',
        userText ? `Student request at upload time: ${userText}.` : '',
        cleanedSummaries.length > 0 ? `What the material contains: ${cleanedSummaries.join(' ')}` : '',
    ].filter(Boolean);

    return parts.join(' ').trim();
}

function extractStickyMemoryFacts(chatHistory: Message[]): string[] {
    const facts: string[] = [];
    const userMessages = chatHistory
        .filter((msg) => msg.role === 'user')
        .map((msg) => String(msg.content || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(-12);

    const pushFact = (value: string) => {
        const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return;
        if (cleaned.length < 4) return;
        if (!facts.includes(cleaned)) facts.push(cleaned.slice(0, 180));
    };

    for (const text of userMessages) {
        const rememberMatch = text.match(/\bremember(?:\s+this)?\s*[:\-]\s*(.+)$/i);
        if (rememberMatch?.[1]) {
            pushFact(`Explicit memory: ${rememberMatch[1]}`);
        }

        const weakTopicMatch = text.match(/\bmy\s+weak\s+topic\s+is\s+([^.?!\n]+)/i);
        if (weakTopicMatch?.[1]) {
            pushFact(`Weak topic: ${weakTopicMatch[1]}`);
        }

        const examDaysMatch = text.match(/\bexam\s+is\s+in\s+(\d+)\s*days?\b/i);
        if (examDaysMatch?.[1]) {
            pushFact(`Exam timeline: ${examDaysMatch[1]} days`);
        }

        if (/\bexam\s+tomorrow\b/i.test(text)) {
            pushFact('Exam timeline: tomorrow');
        }

        const preferenceMatch = text.match(/\bi\s+prefer\s+([^.?!\n]+)/i);
        if (preferenceMatch?.[1]) {
            pushFact(`Preference: ${preferenceMatch[1]}`);
        }
    }

    return facts.slice(0, 5);
}

function isMemoryRecallPrompt(text: string): boolean {
    const lower = String(text || '').toLowerCase();
    if (!lower) return false;
    return /\b(what did i say|what did i tell you|what is my timeline|remind me|based on what i told you|do you remember)\b/i.test(lower);
}

function buildMemoryRecallReply(languageMode: string, stickyFacts: string[]): string {
    const cleanedFacts = stickyFacts
        .map((fact) => String(fact || '').replace(/^explicit memory:\s*/i, '').trim())
        .filter(Boolean)
        .slice(0, 4);
    if (cleanedFacts.length === 0) return '';

    const bulletList = cleanedFacts.map((fact, idx) => `${idx + 1}. ${fact}`).join('\n');
    return localizedText(
        languageMode,
        `Here is what I remember from this session:\n${bulletList}\nWould you like a short next-step plan based on this?`,
        `Haya ndiyo ninayokumbuka kutoka mazungumzo haya:\n${bulletList}\nUngependa nikupangie hatua fupi inayofuata kulingana na haya?`,
        `Ù‡Ø°Ø§ Ù…Ø§ Ø£ØªØ°ÙƒØ±Ù‡ Ù…Ù† Ù‡Ø°Ù‡ Ø§Ù„Ø¬Ù„Ø³Ø©:\n${bulletList}\nÙ‡Ù„ ØªØ±ÙŠØ¯ Ø®Ø·Ø© Ù‚ØµÙŠØ±Ø© Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ© Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø°Ù„ÙƒØŸ`
    );
}

function normalizeReplyForComparison(text: string): string {
    return String(text || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isNearDuplicateReply(nextText: string, previousText: string): boolean {
    const nextNorm = normalizeReplyForComparison(nextText);
    const prevNorm = normalizeReplyForComparison(previousText);
    if (!nextNorm || !prevNorm) return false;
    if (nextNorm === prevNorm) return true;
    if (nextNorm.length >= 28 && prevNorm.length >= 28 && (nextNorm.includes(prevNorm) || prevNorm.includes(nextNorm))) {
        return true;
    }

    const nextTokens = new Set(nextNorm.split(' ').filter(Boolean));
    const prevTokens = new Set(prevNorm.split(' ').filter(Boolean));
    if (nextTokens.size === 0 || prevTokens.size === 0) return false;
    let overlap = 0;
    for (const token of nextTokens) {
        if (prevTokens.has(token)) overlap += 1;
    }
    const overlapRatio = overlap / Math.min(nextTokens.size, prevTokens.size);
    return overlapRatio >= 0.92;
}

function buildPersistentConversationContext(args: {
    state: ExtendedConversationState;
    chatHistory: Message[];
    currentUserText: string;
    tutorState?: EmotionalAICopilotInput['tutorState'];
}): string {
    const lines: string[] = [];
    const topic = String(args.state.lastStudyTopic || args.state.lastTopic || args.state.lastSearchTopic?.[0] || '').trim();
    const attachmentSummary = String(args.state.lastAttachmentContextSummary || '').trim();
    const attachmentLabels = Array.isArray(args.state.lastAttachmentLabels)
        ? args.state.lastAttachmentLabels.map((label) => String(label || '').trim()).filter(Boolean).slice(0, 5)
        : [];
    const lastSuggestedVideo = args.state.lastSuggestedVideo;
    const stickyFacts = extractStickyMemoryFacts(args.chatHistory);
    const recentMessages = args.chatHistory.slice(-4);
    const lastUserTurn = [...recentMessages].reverse().find((msg) => msg.role === 'user' && String(msg.content || '').trim());
    const lastAssistantTurn = [...recentMessages].reverse().find((msg) => msg.role === 'model' && String(msg.content || '').trim());
    const lastAssistantMessage = String(args.state.lastAssistantMessage || lastAssistantTurn?.content || '').replace(/\s+/g, ' ').trim();
    const semanticMemory = String(args.tutorState?.semanticMemory || '').replace(/\s+/g, ' ').trim();
    const teacherCorrections = Array.isArray(args.tutorState?.teacherCorrections)
        ? args.tutorState.teacherCorrections.map((item) => String(item || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 6)
        : [];
    const studentPreferences = Array.isArray(args.tutorState?.studentPreferences)
        ? args.tutorState.studentPreferences.map((item) => String(item || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 6)
        : [];
    const evidenceReferences = Array.isArray(args.tutorState?.evidenceReferences)
        ? args.tutorState.evidenceReferences.map((item) => String(item || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 6)
        : [];
    const activeVideoSummary = String(args.tutorState?.activeVideoSummary || '').replace(/\s+/g, ' ').trim();
    const activeVideoConcepts = Array.isArray(args.tutorState?.activeVideoConcepts)
        ? args.tutorState.activeVideoConcepts.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6)
        : [];
    const activeVideoWhyRecommended = String(args.tutorState?.activeVideoWhyRecommended || '').replace(/\s+/g, ' ').trim();

    if (topic) {
        lines.push(`Active topic: ${topic}.`);
    }
    if (attachmentLabels.length > 0) {
        lines.push(`Uploaded material still in scope: ${attachmentLabels.join(', ')}.`);
    }
    if (attachmentSummary) {
        lines.push(`Uploaded material context: ${attachmentSummary}`);
    }
    if (lastSuggestedVideo?.id) {
        lines.push(`Current video in conversation: ${lastSuggestedVideo.title || 'Suggested video'}${lastSuggestedVideo.channel ? ` by ${lastSuggestedVideo.channel}` : ''}.`);
    }
    if (activeVideoSummary) {
        lines.push(`Cached current video summary: ${activeVideoSummary}`);
    }
    if (activeVideoConcepts.length > 0) {
        lines.push(`Current video concepts already identified: ${activeVideoConcepts.join(', ')}.`);
    }
    if (activeVideoWhyRecommended) {
        lines.push(`Why the current video was chosen: ${activeVideoWhyRecommended}`);
    }
    if (stickyFacts.length > 0) {
        lines.push(`Student-stated facts to remember: ${stickyFacts.join(' | ')}`);
    }
    if (studentPreferences.length > 0) {
        lines.push(`Student preferences to preserve: ${studentPreferences.join(' | ')}`);
    }
    if (teacherCorrections.length > 0) {
        lines.push(`Important teacher corrections to preserve: ${teacherCorrections.join(' | ')}`);
    }
    if (evidenceReferences.length > 0) {
        lines.push(`Evidence references already in conversation: ${evidenceReferences.join(' | ')}`);
    }
    if (semanticMemory) {
        lines.push(`Semantic session memory: ${semanticMemory}`);
    }
    if (lastUserTurn) {
        lines.push(`Recent student turn: ${String(lastUserTurn.content || '').replace(/\s+/g, ' ').trim()}`);
    }
    if (lastAssistantMessage) {
        lines.push(`Recent assistant understanding: ${lastAssistantMessage.slice(0, 500)}`);
    }

    if (lines.length === 0) return '';
    return [
        'Conversation context to preserve:',
        ...lines,
        `Current student request: ${String(args.currentUserText || '').trim()}`,
        'Use this context unless the student explicitly changes topic.',
    ].join('\n');
}

function buildLearnerMemoryContext(memory?: {
    progress?: any[];
    mistakes?: any[];
}): string {
    const progress = Array.isArray(memory?.progress) ? memory!.progress : [];
    const mistakes = Array.isArray(memory?.mistakes) ? memory!.mistakes : [];

    const strongTopics = progress
        .slice()
        .sort((a: any, b: any) => Number(b?.mastery || 0) - Number(a?.mastery || 0))
        .slice(0, 3)
        .map((entry: any) => {
            const topic = String(entry?.topic || entry?.subject || '').trim();
            const mastery = Number(entry?.mastery || 0);
            return topic ? `${topic} (${mastery}% mastery)` : '';
        })
        .filter(Boolean);

    const recurringMistakes = mistakes
        .slice()
        .sort((a: any, b: any) => Number(b?.attempts || 0) - Number(a?.attempts || 0))
        .slice(0, 4)
        .map((entry: any) => {
            const topic = String(entry?.topic || '').trim();
            const error = String(entry?.error || '').trim();
            if (topic && error) return `${topic}: ${error}`;
            return topic || error;
        })
        .filter(Boolean);

    const lines: string[] = [];
    if (strongTopics.length > 0) {
        lines.push(`Known strengths from learner memory: ${strongTopics.join(' | ')}`);
    }
    if (recurringMistakes.length > 0) {
        lines.push(`Recurring mistakes to watch for: ${recurringMistakes.join(' | ')}`);
        lines.push('Use these mistake patterns to choose hints, pacing, and practice checks.');
    }

    return lines.join('\n').trim();
}

function buildMasteryPolicyContext(args: {
    memory?: { progress?: any[]; mistakes?: any[] };
    activeTopic?: string;
}): {
    learnerStage?: 'support' | 'developing' | 'secure';
    recommendedMode?: 'guided' | 'practice' | 'challenge';
    context: string;
} {
    const activeTopic = String(args.activeTopic || '').trim().toLowerCase();
    const progress = Array.isArray(args.memory?.progress) ? args.memory!.progress : [];
    const mistakes = Array.isArray(args.memory?.mistakes) ? args.memory!.mistakes : [];
    const topicProgress = progress.find((entry: any) => String(entry?.topic || '').trim().toLowerCase() === activeTopic);
    const topicMistake = mistakes.find((entry: any) => String(entry?.topic || '').trim().toLowerCase() === activeTopic);
    const mastery = Number(topicProgress?.mastery || 0);
    const mistakeAttempts = Number(topicMistake?.attempts || 0);

    let learnerStage: 'support' | 'developing' | 'secure' | undefined;
    if (activeTopic) {
        if (mistakeAttempts >= 3 || mastery < 35) learnerStage = 'support';
        else if (mastery >= 75 && mistakeAttempts <= 1) learnerStage = 'secure';
        else learnerStage = 'developing';
    }

    const recommendedMode =
        learnerStage === 'support'
            ? 'guided'
            : learnerStage === 'secure'
                ? 'challenge'
                : learnerStage === 'developing'
                    ? 'practice'
                    : undefined;

    const lines: string[] = [];
    if (activeTopic && learnerStage) {
        lines.push(`Learner stage for "${activeTopic}": ${learnerStage}.`);
    }
    if (activeTopic && Number.isFinite(mastery) && mastery > 0) {
        lines.push(`Known mastery estimate: ${mastery}%.`);
    }
    if (activeTopic && mistakeAttempts > 0) {
        lines.push(`Recent struggle count on this topic: ${mistakeAttempts}.`);
    }
    if (recommendedMode === 'guided') {
        lines.push('Teaching mode: guided. Use smaller steps, more checks, and avoid big jumps.');
    } else if (recommendedMode === 'practice') {
        lines.push('Teaching mode: practice. Explain clearly, then give a short checkpoint or mini-question.');
    } else if (recommendedMode === 'challenge') {
        lines.push('Teaching mode: challenge. Keep explanations concise and move to harder application quickly.');
    }

    return {
        learnerStage,
        recommendedMode,
        context: lines.join('\n').trim(),
    };
}

function isIslamicStudyContext(...values: Array<string | undefined>): boolean {
    const combined = values.map((value) => String(value || '')).join(' ').toLowerCase();
    if (!combined.trim()) return false;
    return /\b(quran|surah|ayah|tafsir|tajweed|hadith|sunnah|fiqh|seerah|sirah|dua|salah|wudu|wudhu|zakat|sawm|ramadan|akhlaq|adab|aqeedah|islam|muslim)\b/.test(combined);
}

const EXPLICIT_TOPIC_SHIFT_REGEX =
    /\b(new topic|another topic|different topic|change topic|switch topic|unrelated|instead|let'?s talk about|talk about|move to|now about|different question|separate question)\b/i;
const VIDEO_INTENT_REGEX = /\b(video|youtube|watch|transcript)\b/i;
const GENERIC_VIDEO_REQUEST_NOISE_WORDS = new Set([
    'a',
    'an',
    'about',
    'another',
    'can',
    'cvan',
    'could',
    'educational',
    'find',
    'for',
    'get',
    'give',
    'i',
    'it',
    'lecture',
    'lesson',
    'me',
    'on',
    'please',
    'recommend',
    'same',
    'show',
    'suggest',
    'suggested',
    'that',
    'the',
    'this',
    'topic',
    'transcript',
    'video',
    'watch',
    'would',
    'youtube',
    'you',
]);

function sanitizeTopicCandidate(text: string): string {
    return String(text || '')
        .replace(/[`"'*#]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
}

function extractTopicCandidate(text: string): string {
    const raw = sanitizeTopicCandidate(text);
    if (!raw) return '';

    const stripped = raw
        .replace(/^(can you|could you|would you|please|kindly|hey|hi|hello)\s+/i, '')
        .replace(/^(show me|give me|find me|suggest|recommend)\s+(an?\s+)?(video|youtube video|youtube|transcript)\s+(on|about)\s+/i, '')
        .replace(/^(i want to learn|teach me|help me understand|explain|tell me|what about|how about|let'?s talk about|talk about|new topic|another topic|different topic|change topic to|switch topic to|instead)\s+/i, '')
        .replace(/\b(on a scale of \d+\s*-\s*\d+.*)$/i, '')
        .trim();

    return stripped.length >= 3 ? stripped : raw;
}

function looksLikeGenericVideoRequest(text: string): boolean {
    const raw = sanitizeTopicCandidate(text).toLowerCase();
    if (!raw) return false;
    if (!VIDEO_INTENT_REGEX.test(raw)) return false;

    if (/\b(this|that|it|same topic|same thing|same concept|same lesson)\b/.test(raw)) {
        return true;
    }

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    const meaningfulWords = words.filter((word) => !GENERIC_VIDEO_REQUEST_NOISE_WORDS.has(word));
    return meaningfulWords.length <= 2;
}

function findRecentMeaningfulUserTopic(chatHistory: Message[]): string {
    for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
        const msg = chatHistory[i];
        if (msg.role !== 'user') continue;
        const candidate = extractTopicCandidate(msg.content);
        if (candidate && isMeaningfulStudyTopic(candidate)) {
            return candidate;
        }
    }
    return '';
}

function isMeaningfulStudyTopic(text: string): boolean {
    const raw = sanitizeTopicCandidate(text);
    if (!raw) return false;

    const extracted = sanitizeTopicCandidate(extractTopicCandidate(raw) || raw);
    const lower = extracted.toLowerCase();

    if (!lower) return false;
    if (looksLikeGenericVideoRequest(lower)) return false;
    if (isLikelyFollowUpQuery(lower)) return false;
    if (isVideoContextFollowUp(lower)) return false;
    if (/^(can you|could you|would you|please|kindly|do you|are you|will you)\b/.test(lower) && lower.split(/\s+/).length <= 8) {
        return false;
    }

    const nonTopicWords = new Set([
        ...GENERIC_VIDEO_REQUEST_NOISE_WORDS,
        'about',
        'aware',
        'content',
        'contents',
        'cover',
        'covers',
        'explain',
        'explaining',
        'know',
        'summary',
        'summaries',
        'summarise',
        'summarize',
        'tell',
        'understand',
        'video',
        'watch',
    ]);
    const meaningfulWords = lower.split(/\s+/).filter((word) => word.length > 2 && !nonTopicWords.has(word));
    return meaningfulWords.length > 0;
}

function resolveStableStudyTopic(args: {
    userText: string;
    resolvedTopic: string;
    state: ExtendedConversationState;
    chatHistory: Message[];
    activeTopic?: string;
}): string {
    const candidates = [
        args.state.lastStudyTopic,
        args.resolvedTopic,
        args.activeTopic,
        args.state.lastTopic,
        args.state.lastSearchTopic?.[0],
        findRecentMeaningfulUserTopic(args.chatHistory),
        args.state.lastAttachmentContextSummary,
        extractTopicCandidate(args.userText),
    ];

    for (const candidate of candidates) {
        const clean = sanitizeTopicCandidate(String(candidate || ''));
        if (clean && isMeaningfulStudyTopic(clean)) {
            return clean;
        }
    }

    return sanitizeTopicCandidate(String(args.resolvedTopic || args.activeTopic || args.userText || ''));
}

function persistStableStudyTopic(state: ExtendedConversationState, topic: string): void {
    const clean = sanitizeTopicCandidate(topic);
    if (!clean || !isMeaningfulStudyTopic(clean)) return;
    state.lastStudyTopic = clean;
    state.lastTopic = clean;
    state.lastSearchTopic = [clean];
}

function resolveTurnTopic(args: {
    userText: string;
    state: ExtendedConversationState;
    chatHistory: Message[];
}): { topic: string; explicitShift: boolean; shouldReuseContext: boolean } {
    const userText = String(args.userText || '').trim();
    const explicitShift = EXPLICIT_TOPIC_SHIFT_REGEX.test(userText);
    const stateTopic = String(args.state.lastStudyTopic || args.state.lastTopic || args.state.lastSearchTopic?.[0] || '').trim();
    const attachmentSummary = String(args.state.lastAttachmentContextSummary || '').trim();
    const recentTopic = findRecentMeaningfulUserTopic(args.chatHistory);
    const candidate = extractTopicCandidate(userText);
    const followUp = isLikelyFollowUpQuery(userText);
    const visualFollowUp = shouldReusePriorAttachmentContext(userText);

    if (explicitShift) {
        return {
            topic: candidate || userText,
            explicitShift: true,
            shouldReuseContext: false,
        };
    }

    if (followUp || visualFollowUp) {
        return {
            topic: stateTopic || recentTopic || candidate || attachmentSummary || userText,
            explicitShift: false,
            shouldReuseContext: true,
        };
    }

    return {
        topic: candidate || stateTopic || recentTopic || attachmentSummary || userText,
        explicitShift: false,
        shouldReuseContext: false,
    };
}

function buildContextAwareVideoQuery(args: {
    userText: string;
    resolvedTopic: string;
    state: ExtendedConversationState;
}): string {
    const rawUserText = String(args.userText || '').trim();
    const resolvedTopic = sanitizeTopicCandidate(args.resolvedTopic);
    const attachmentHint = sanitizeTopicCandidate(args.state.lastAttachmentContextSummary || '');
    const genericVideoRequest =
        looksLikeGenericVideoRequest(rawUserText) ||
        isLikelyFollowUpQuery(rawUserText) ||
        /^(another|same|that|this|it)\b/i.test(rawUserText) ||
        /\b(video|youtube|watch)\b/i.test(rawUserText) && /\b(this|that|it|same|about it|about this|about that)\b/i.test(rawUserText);

    if (genericVideoRequest) {
        return sanitizeTopicCandidate(resolvedTopic || attachmentHint || rawUserText);
    }

    const stripped = sanitizeTopicCandidate(
        rawUserText
            .replace(/^(show me|give me|find me|suggest|recommend)\s+(an?\s+)?(video|youtube video|youtube|transcript)\s*/i, '')
            .replace(/\b(on|about|for)\b\s*$/i, '')
    );

  if (looksLikeGenericVideoRequest(stripped)) {
      return resolvedTopic || attachmentHint || rawUserText;
  }

  return stripped || resolvedTopic || attachmentHint || rawUserText;
}

function findLatestVideoContext(
    chatHistory: Message[],
    state: ExtendedConversationState
): { id: string; title?: string; channel?: string; thumbnailUrl?: string; videoId?: string } | null {
    for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
        const message = chatHistory[i];
        if (message.videoData?.id) {
            return message.videoData as any;
        }
        const metadataVideo = (message as Message & { metadata?: any }).metadata?.videoData || (message as Message & { metadata?: any }).metadata?.video;
        if (metadataVideo?.id) {
            return metadataVideo as any;
        }
    }
    return state.lastSuggestedVideo?.id ? state.lastSuggestedVideo : null;
}

function hasVideoContextInConversation(chatHistory: Message[], state: ExtendedConversationState): boolean {
    if (findLatestVideoContext(chatHistory, state)) return true;
    if (Boolean(state.videoSuggested)) return true;
    return chatHistory.some((message) => {
        const raw = String(message.content || '').toLowerCase();
        return /\b(attached the video below|found a relevant video|found a strong video|watch it here|suggested video)\b/.test(raw);
    });
}

function isVideoContextFollowUp(text: string): boolean {
    const raw = String(text || '').trim().toLowerCase();
    if (!raw) return false;
    if (!/\b(video|youtube|watch|clip|transcript)\b/.test(raw)) return false;
    return /\b(content|contents|about|about it|in it|inside it|aware|know|summary|summarize|summarise|explain|cover|covers|teach|talking about|what is in|what's in|what is the video about|what does the video say)\b/.test(raw);
}

async function answerFromExistingVideoContext(args: {
    question: string;
    video?: { id: string; title?: string; channel?: string; thumbnailUrl?: string; videoId?: string } | null;
    languageMode: string;
    cachedSummary?: string;
    cachedConcepts?: string[];
    cachedWhyRecommended?: string;
}): Promise<string> {
    const cachedSummary = String(args.cachedSummary || '').trim();
    const cachedConcepts = Array.isArray(args.cachedConcepts)
        ? args.cachedConcepts.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6)
        : [];
    const cachedWhyRecommended = String(args.cachedWhyRecommended || '').trim();

    if (cachedSummary) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.2,
                max_tokens: 220,
                messages: [
                    {
                        role: 'system',
                        content:
                            'Answer only from the cached current-video tutoring context below. Do not suggest a new video. Be concise, grounded, and avoid repetition.',
                    },
                    {
                        role: 'user',
                        content: [
                            `Current video title: ${args.video?.title || 'Suggested video'}`,
                            args.video?.channel ? `Channel: ${args.video.channel}` : '',
                            cachedWhyRecommended ? `Why this video was chosen: ${cachedWhyRecommended}` : '',
                            cachedConcepts.length > 0 ? `Known concepts: ${cachedConcepts.join(', ')}` : '',
                            `Cached video summary: ${cachedSummary}`,
                            `Student question: ${args.question}`,
                        ].filter(Boolean).join('\n'),
                    },
                ],
            });
            const raw = String(completion.choices?.[0]?.message?.content || '').trim();
            if (raw) return raw;
        } catch {
            // Fall through to transcript retrieval.
        }
    }

    let transcriptExcerpt = '';
    if (args.video?.id) {
        try {
            const transcript = await runFlow(getYoutubeTranscriptFlow, { videoId: args.video.id });
            if (typeof transcript === 'string' && transcript.trim() && !transcript.startsWith('Could not')) {
                transcriptExcerpt = transcript.length > 14000 ? `${transcript.slice(0, 14000)}...` : transcript;
            }
        } catch {
            transcriptExcerpt = '';
        }
    }

    if (!transcriptExcerpt) {
        return localizedText(
            args.languageMode,
            `Yes. We are still talking about the current video${args.video?.title ? `, "${args.video.title}"` : ''}. I will keep that video in context. Ask me to summarize it, break down a section, or tell you what topic it covers.`,
            `Ndiyo. Bado tunazungumzia video ya sasa${args.video?.title ? `, "${args.video.title}"` : ''}. Nitaendelea kuitunza kwenye muktadha. Niambie nikufupishie, nieleze sehemu yake, au nikuambie mada inayofundishwa humo.`,
            `Ù†Ø¹Ù…. Ù…Ø§ Ø²Ù„Ù†Ø§ Ù†ØªØ­Ø¯Ø« Ø¹Ù† Ø§Ù„ÙÙŠØ¯ÙŠÙˆ Ø§Ù„Ø­Ø§Ù„ÙŠ${args.video?.title ? `ØŒ "${args.video.title}"` : ''}. Ø³Ø£Ø¨Ù‚ÙŠ Ù‡Ø°Ø§ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ ÙÙŠ Ø§Ù„Ø³ÙŠØ§Ù‚. Ø§Ø·Ù„Ø¨ Ù…Ù†ÙŠ ØªÙ„Ø®ÙŠØµÙ‡ Ø£Ùˆ Ø´Ø±Ø­ Ø¬Ø²Ø¡ Ù…Ù†Ù‡ Ø£Ùˆ ØªÙˆØ¶ÙŠØ­ Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹ Ø§Ù„Ø°ÙŠ ÙŠØºØ·ÙŠÙ‡.`
        );
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            max_tokens: 220,
            messages: [
                {
                    role: 'system',
                    content:
                        'Answer only from the current video transcript excerpt and title. Do not suggest a new video. Do not claim uncertainty if the transcript provides enough context. Be concise, grounded, and avoid repetition.'
                },
                {
                    role: 'user',
                    content: [
                        `Current video title: ${args.video?.title || 'Suggested video'}`,
                        args.video?.channel ? `Channel: ${args.video.channel}` : '',
                        `Student question: ${args.question}`,
                        '',
                        'Transcript excerpt:',
                        transcriptExcerpt
                    ].filter(Boolean).join('\n')
                }
            ]
        });
        const raw = String(completion.choices?.[0]?.message?.content || '').trim();
        if (raw) return raw;
    } catch {
        // fall through
    }

        return localizedText(
            args.languageMode,
        `Yes. The current video${args.video?.title ? `, "${args.video.title}"` : ''} is still in context, and from the transcript it appears to cover the main topic shown there. Ask me which part you want summarized or broken down.`,
        `Ndiyo. Video ya sasa${args.video?.title ? `, "${args.video.title}"` : ''} bado iko kwenye muktadha, na transcript inaonyesha kuwa inaeleza mada kuu iliyopo humo. Niambie sehemu unayotaka nifupishe au nieleze.`,
        `Ù†Ø¹Ù…. Ø§Ù„ÙÙŠØ¯ÙŠÙˆ Ø§Ù„Ø­Ø§Ù„ÙŠ${args.video?.title ? `ØŒ "${args.video.title}"` : ''} Ù…Ø§ Ø²Ø§Ù„ ÙÙŠ Ø§Ù„Ø³ÙŠØ§Ù‚ØŒ ÙˆÙŠØ¨Ø¯Ùˆ Ù…Ù† Ø§Ù„Ù†Øµ Ø£Ù†Ù‡ ÙŠØ´Ø±Ø­ Ø§Ù„ÙÙƒØ±Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠÙ‡. Ø£Ø®Ø¨Ø±Ù†ÙŠ Ø¨Ø£ÙŠ Ø¬Ø²Ø¡ ØªØ±ÙŠØ¯ ØªÙ„Ø®ÙŠØµÙ‡ Ø£Ùˆ Ø´Ø±Ø­Ù‡.`
    );
}


async function maybeBuildSecondaryVideoRecommendation(args: {
    enabled: boolean;
    query: string;
    stableTopic: string;
    chatHistory: Message[];
    currentVideoId?: string;
}): Promise<{
    textSuffix?: string;
    videoData?: EmotionalAICopilotOutput['videoData'];
    lastSuggestedVideo?: ExtendedConversationState['lastSuggestedVideo'];
}> {
    if (!args.enabled) return {};
    const stableTopic = String(args.stableTopic || '').trim();
    if (!stableTopic) return {};

    const result = await runResearchOrchestrator({
        query: `Suggest a short educational video about ${stableTopic}`,
        lastSearchTopic: stableTopic,
        forceWebSearch: false,
        chatHistory: args.chatHistory.map((message) => ({ role: message.role, content: message.content })),
    }) as ResearchOrchestratorResult & { videoWhyRecommended?: string; videoConcepts?: string[] };

    if (!result.videoData?.id || result.videoData.id === args.currentVideoId) return {};

    return {
        textSuffix: [
            `Also, here is a focused video for ${stableTopic}: "${result.videoData.title || 'Recommended video'}".`,
            String(result.videoWhyRecommended || result.response || result.reply || '').trim(),
        ].filter(Boolean).join(' '),
        videoData: result.videoData,
        lastSuggestedVideo: {
            id: result.videoData.id,
            title: result.videoData.title,
            channel: result.videoData.channel,
            thumbnailUrl: result.videoData.thumbnail,
            videoId: result.videoData.id,
        },
    };
}

function legacyBuildGenericPracticeSuccessFeedback(topic: string, languageMode: string): string {
    const safeTopic = String(topic || 'this topic').trim() || 'this topic';
    return localizedText(
        languageMode,
        `Excellent. You understand ${safeTopic}. Ready for the next step?`,
        `Vizuri sana. Umeelewa ${safeTopic}. Uko tayari kwa hatua inayofuata?`,
        `Ù…Ù…ØªØ§Ø². Ù„Ù‚Ø¯ ÙÙ‡Ù…Øª ${safeTopic}. Ù‡Ù„ Ø£Ù†Øª Ù…Ø³ØªØ¹Ø¯ Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©ØŸ`
    );
}

function legacyBuildGenericPracticeRetryFeedback(attempt: number, languageMode: string): string {
    if (attempt > 1) {
        return localizedText(
            languageMode,
            "Let us take it slowly. Let's count together.",
            'Twende polepole. Tuhesabu pamoja.',
            'Ø¯Ø¹Ù†Ø§ Ù†Ø£Ø®Ø°Ù‡Ø§ Ø¨Ù‡Ø¯ÙˆØ¡. Ù„Ù†Ø¹Ø¯ Ù…Ø¹Ù‹Ø§.'
        );
    }

    return localizedText(
        languageMode,
        "Good try, but let's look closer.",
        'Jaribio zuri, lakini tuangalie kwa makini zaidi.',
        'Ù…Ø­Ø§ÙˆÙ„Ø© Ø¬ÙŠØ¯Ø©ØŒ Ù„ÙƒÙ† Ø¯Ø¹Ù†Ø§ Ù†Ù†Ø¸Ø± Ø¨Ø¯Ù‚Ø© Ø£ÙƒØ¨Ø±.'
    );
}

function legacyBuildFallbackPracticeQuestion(languageMode: string): string {
    return localizedText(
        languageMode,
        'a short revision question',
        'swali fupi la marudio',
        'Ø³Ø¤Ø§Ù„ Ù…Ø±Ø§Ø¬Ø¹Ø© Ù‚ØµÙŠØ±'
    );
}

function legacyBuildPracticeChallengeReply(question: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Here is a small challenge: ${question}`,
        `Hili hapa swali dogo la mazoezi: ${question}`,
        `Ø¥Ù„ÙŠÙƒ ØªØ­Ø¯ÙŠÙ‹Ø§ ØµØºÙŠØ±Ù‹Ø§: ${question}`
    );
}

function legacyBuildMathBasicsCheckLabel(expression: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Math basics check for ${expression}`,
        `Ukaguzi wa msingi wa hesabu kwa ${expression}`,
        `ÙØ­Øµ Ø£Ø³Ø§Ø³ÙŠØ§Øª Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ§Øª Ù„Ù€ ${expression}`
    );
}

function legacyBuildMathRuleCheckLabel(expression: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Math rule check for ${expression}`,
        `Ukaguzi wa kanuni ya hesabu kwa ${expression}`,
        `ÙØ­Øµ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ§Øª Ù„Ù€ ${expression}`
    );
}

function legacyBuildDenominatorQuestionLabel(fraction: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Denominator of ${fraction}`,
        `Denominator ya ${fraction}`,
        `Ù…Ù‚Ø§Ù… ${fraction}`
    );
}

function legacyBuildReciprocalQuestionLabel(fraction: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Reciprocal of ${fraction}`,
        `Reciprocal ya ${fraction}`,
        `Ù…Ù‚Ù„ÙˆØ¨ ${fraction}`
    );
}

function legacyBuildRewriteAsMultiplicationQuestionLabel(expression: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Rewrite ${expression} as multiplication`,
        `Andika upya ${expression} kama kuzidisha`,
        `Ø£Ø¹Ø¯ ÙƒØªØ§Ø¨Ø© ${expression} ÙƒØ¹Ù…Ù„ÙŠØ© Ø¶Ø±Ø¨`
    );
}

function legacyBuildProductsQuestionLabel(expression: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Products for ${expression}`,
        `Bidhaa za ${expression}`,
        `Ù†ÙˆØ§ØªØ¬ ${expression}`
    );
}

function legacyBuildSimplifiedFormQuestionLabel(fraction: string, languageMode: string): string {
    return localizedText(
        languageMode,
        `Simplified form of ${fraction}`,
        `Umbo lililorahisishwa la ${fraction}`,
        `Ø§Ù„ØµÙŠØºØ© Ø§Ù„Ù…Ø¨Ø³Ø·Ø© Ù„Ù€ ${fraction}`
    );
}

const buildMathBasicsCheckLabel = legacyBuildMathBasicsCheckLabel;
const buildMathRuleCheckLabel = legacyBuildMathRuleCheckLabel;
const buildReciprocalQuestionLabel = legacyBuildReciprocalQuestionLabel;
const buildRewriteAsMultiplicationQuestionLabel = legacyBuildRewriteAsMultiplicationQuestionLabel;
const buildProductsQuestionLabel = legacyBuildProductsQuestionLabel;
const buildSimplifiedFormQuestionLabel = legacyBuildSimplifiedFormQuestionLabel;

function legacyBuildGreetingText(languageMode: string, studentName: string, interests: string[]): string {
    const firstInterest = interests.find(Boolean);
    if (languageMode === 'arabic') {
        const base = `\u0645\u0631\u062d\u0628\u0627 ${studentName}\u060c \u0643\u064a\u0641 \u0623\u0633\u0627\u0639\u062f\u0643 \u0641\u064a \u0627\u0644\u0645\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u064a\u0648\u0645`;
        return firstInterest
            ? `${base}\u061f \u064a\u0645\u0643\u0646\u0646\u0627 \u0627\u0644\u0628\u062f\u0621 \u0628\u0645\u0648\u0636\u0648\u0639 ${firstInterest}.`
            : `${base}\u061f`;
    }
    if (languageMode === 'swahili' || languageMode === 'english_sw') {
        const base = `Habari ${studentName}, nisaidie nianze na somo gani leo`;
        return firstInterest
            ? `${base}? Tunaweza kuanza na ${firstInterest}.`
            : `${base}?`;
    }
    const base = `Hello ${studentName}, how can I help you study today`;
    return firstInterest
        ? `${base}? We can start with ${firstInterest}.`
        : `${base}?`;
}

function legacyEmitChunkedText(text: string, onToken?: (token: string) => void) {
    if (!onToken) return;
    const chunks = text.match(/(\S+\s*)/g) || [text];
    for (const chunk of chunks) {
        onToken(chunk);
    }
}

function legacyLooksIncompleteResponse(text: string): boolean {
    const value = String(text || '').trim();
    if (!value) return false;

    const openParen = (value.match(/\(/g) || []).length;
    const closeParen = (value.match(/\)/g) || []).length;
    if (openParen > closeParen) return true;

    const danglingTailWords = new Set([
        'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
        'when', 'while', 'if', 'then', 'this', 'these', 'those', 'lead', 'leads',
        'can', 'could', 'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being',
        'how', 'why', 'what', 'where', 'who', 'whom', 'whose', 'whether'
    ]);
    const danglingTailWordPattern = `(?:${Array.from(danglingTailWords).join('|')})`;
    const trailingFragmentPattern = new RegExp(`\\s*[^.?!\\n]*\\b${danglingTailWordPattern}\\s*[.!?]?\\s*$`, 'i');
    if (trailingFragmentPattern.test(value)) return true;

    const tailWord = value
        .split(/\s+/)
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z]/g, '') || '';

    if (danglingTailWords.has(tailWord)) return true;

    if (/[.!?]["')\]]?$/.test(value)) return false;
    if (/[:;,\-\(\[]$/.test(value)) return true;
    if (/\*\*$/.test(value)) return true;

    return false;
}

function hasHardCutoffSignal(text: string): boolean {
    const value = String(text || '').trim();
    if (!value) return false;

    const openParen = (value.match(/\(/g) || []).length;
    const closeParen = (value.match(/\)/g) || []).length;
    if (openParen > closeParen) return true;

    if (/[:;,\-\(\[]$/.test(value)) return true;
    if (/\*\*$/.test(value)) return true;

    const lastWord = value
        .split(/\s+/)
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z]/g, '') || '';
    const danglingWords = new Set([
        'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
        'when', 'while', 'if', 'then', 'this', 'these', 'those', 'can', 'could',
        'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being',
        'how', 'why', 'what', 'where', 'who', 'whom', 'whose', 'whether'
    ]);

    if (danglingWords.has(lastWord)) return true;
    if (/[.!?]["')\]]?$/.test(value)) return false;

    return value.length >= 80 && looksIncompleteResponse(value);
}

function legacyShouldAttemptCompletionRepair(
    text: string,
    isVoiceRealtime: boolean,
    modelLikelyTruncated = false
): boolean {
    const value = String(text || '').trim();
    if (!value || value.length < (isVoiceRealtime ? 56 : 72)) return false;
    if (modelLikelyTruncated) return true;
    return hasHardCutoffSignal(value);
}

function mergeWithOverlap(base: string, tail: string): string {
    const prefix = String(base || '').trimEnd();
    const addition = String(tail || '').trim();
    if (!addition) return prefix;
    if (!prefix) return addition;

    const lowerPrefix = prefix.toLowerCase();
    const lowerAddition = addition.toLowerCase();
    const max = Math.min(160, lowerPrefix.length, lowerAddition.length);
    let overlap = 0;

    for (let i = max; i >= 12; i--) {
        if (lowerPrefix.slice(-i) === lowerAddition.slice(0, i)) {
            overlap = i;
            break;
        }
    }

    const mergedTail = overlap > 0 ? addition.slice(overlap) : addition;
    return `${prefix}${/^\s/.test(mergedTail) ? '' : ' '}${mergedTail}`.trim();
}

function trimTrailingIncompleteClause(text: string): string {
    const value = String(text || '').trim();
    if (!value) return value;
    const danglingTailWords = [
        'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
        'when', 'while', 'if', 'then', 'this', 'these', 'those', 'can', 'could',
        'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being',
        'how', 'why', 'what', 'where', 'who', 'whom', 'whose', 'whether'
    ];
    const danglingTailWordPattern = `(?:${danglingTailWords.join('|')})`;
    const trailingFragmentPattern = new RegExp(`\\s*[^.?!\\n]*\\b${danglingTailWordPattern}\\s*[.!?]?\\s*$`, 'i');
    if (trailingFragmentPattern.test(value)) {
        const withoutFragment = value.replace(trailingFragmentPattern, '').trim();
        if (withoutFragment) {
            return /[.!?]$/.test(withoutFragment) ? withoutFragment : `${withoutFragment}.`;
        }
    }
    const lastPunctuation = Math.max(value.lastIndexOf('.'), value.lastIndexOf('!'), value.lastIndexOf('?'));
    if (lastPunctuation > 0) {
        return value.slice(0, lastPunctuation + 1).trim();
    }
    return value;
}

async function requestCompletionTail(
    messages: ChatCompletionMessageParam[],
    partialText: string,
    isVoiceRealtime: boolean
): Promise<string> {
    const partial = String(partialText || '').trim();
    if (!partial) return '';

    const continuationPrompt =
        'Continue exactly from the unfinished response above without repeating previous sentences. ' +
        'Complete the thought in plain text using 1 to 3 short sentences.';

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            max_tokens: isVoiceRealtime ? 160 : 220,
            stream: false,
            messages: [
                ...messages,
                { role: 'assistant', content: partial },
                { role: 'user', content: continuationPrompt },
            ],
        });
        return String(completion.choices?.[0]?.message?.content || '').trim();
    } catch {
        return '';
    }
}

async function ensureCompleteResponse(
    messages: ChatCompletionMessageParam[],
    initialText: string,
    isVoiceRealtime: boolean
): Promise<string> {
    let completed = String(initialText || '').trim();
    if (!completed) return completed;

    const maxAttempts = isVoiceRealtime ? 3 : 2;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (!looksIncompleteResponse(completed) || completed.length < 24) {
            break;
        }
        const tail = await requestCompletionTail(messages, completed, isVoiceRealtime);
        if (!tail) break;
        const merged = mergeWithOverlap(completed, tail);
        if (!merged || merged === completed) break;
        completed = merged;
    }

    if (looksIncompleteResponse(completed)) {
        completed = trimTrailingIncompleteClause(completed);
    }

    return completed;
}

type FinalizeAssistantResponseArgs = {
    text: string;
    languageMode: string;
    userInput: string;
    topic?: string;
    strictMathMode: boolean;
    isVoiceRealtime: boolean;
    messagesForCompletion?: ChatCompletionMessageParam[];
    sanitize?: boolean;
    conceptualMicroPacingMode?: boolean;
    conceptualTopic?: string;
};

async function legacyFinalizeAssistantResponseText(args: FinalizeAssistantResponseArgs): Promise<string> {
    let output = String(args.text || '').trim();
    if (!output) return output;

    const completionMessages =
        Array.isArray(args.messagesForCompletion) && args.messagesForCompletion.length > 0
            ? args.messagesForCompletion
            : undefined;

    if (completionMessages && shouldAttemptCompletionRepair(output, args.isVoiceRealtime)) {
        output = await ensureCompleteResponse(completionMessages, output, args.isVoiceRealtime);
    }

    if (args.sanitize) {
        output = await GUARDIAN_SANITIZE(output, args.topic, {
            userInput: args.userInput,
            strictMathMode: args.strictMathMode
        });
    }

    if (args.conceptualMicroPacingMode) {
        output = enforceFoundationalTheoryPacing(
            output,
            args.userInput,
            args.languageMode,
            args.conceptualTopic
        );
    }

    output = applyLanguageOutputRules(output, args.languageMode);

    if (looksIncompleteResponse(output)) {
        output = ensureCompleteSentence(trimTrailingIncompleteClause(output), args.languageMode);
    }

    return String(output || '').trim();
}

function isWebModeMetaQuery(query?: string): boolean {
    const lower = String(query || '').trim().toLowerCase();
    if (!lower) return false;
    if (/\b(web research mode|research mode)\b/.test(lower)) return true;
    return (
        /\b(are you|did you|why are you|how are you|can you|will you)\b[^?.!]{0,120}\b(search|searching|look up|web|online|source|sources|citation|verify)\b/.test(lower) ||
        /\b(are you searching|did you search|why are you searching|did you look up)\b/.test(lower)
    );
}

function isLikelyFollowUpQuery(query?: string): boolean {
    const lower = String(query || '').trim().toLowerCase();
    if (!lower) return false;
    const words = lower.split(/\s+/).filter(Boolean);
    if (words.length > 24) return false;
    return (
        /\b(this|that|it|those|these|above|earlier|previous|same|part|point)\b/.test(lower) ||
        /\b(you said|your answer|that answer|this answer|explain that|explain this)\b/.test(lower) ||
        /^(and|so|then|but)\b/.test(lower)
    );
}

function hasExplicitNoWebSignal(query?: string): boolean {
    const lower = String(query || '').trim().toLowerCase();
    if (!lower) return false;
    return (
        /\b(no web|don't search|do not search|without searching|no internet|without internet|from your knowledge|from context only)\b/.test(lower) ||
        /\bjust explain|no lookup|no research\b/.test(lower)
    );
}

function hasFreshnessOrVolatilitySignal(query?: string): boolean {
    const lower = String(query || '').trim().toLowerCase();
    if (!lower) return false;
    return (
        /\b(latest|current|today|this week|this month|this year|updated|recent|news|breaking|price|stock|rate|exchange rate|inflation|election|president|prime minister|ceo|version|release)\b/.test(lower) ||
        /\b(202[4-9]|203[0-9])\b/.test(lower)
    );
}

function isRecentResearchCooldownActive(state?: ExtendedConversationState): boolean {
    const raw = String(state?.lastResearchAt || '').trim();
    if (!raw) return false;
    const ts = Date.parse(raw);
    if (!Number.isFinite(ts)) return false;
    const elapsedMs = Date.now() - ts;
    return elapsedMs >= 0 && elapsedMs < 90 * 1000;
}

function shouldAutoWebResearchWithoutForce(args: {
    intent: string;
    query?: string;
    hasActiveTopic: boolean;
    likelyFollowUp: boolean;
    isMetaModeQuestion: boolean;
    state?: ExtendedConversationState;
    turnPlan?: {
        researchRequired?: boolean;
        researchReason?: string;
        primaryAction?: string;
    };
}): { shouldSearch: boolean; reason: string } {
    if (args.turnPlan) {
        return {
            shouldSearch: Boolean(args.turnPlan.researchRequired) && args.turnPlan.primaryAction === 'research',
            reason: String(args.turnPlan.researchReason || 'context_first'),
        };
    }
    const normalizedIntent = String(args.intent || '').toLowerCase();
    const normalizedQuery = String(args.query || '').toLowerCase();
    const explicitWebSignal =
        /\b(search|look up|web|online|browse|source|sources|citation|verify)\b/i
            .test(normalizedQuery);
    const freshnessSignal = hasFreshnessOrVolatilitySignal(normalizedQuery);

    if (hasExplicitNoWebSignal(normalizedQuery)) {
        return { shouldSearch: false, reason: 'explicit_no_web_request' };
    }
    if (args.isMetaModeQuestion) {
        return { shouldSearch: false, reason: 'meta_mode_question' };
    }
    if (args.likelyFollowUp) {
        return { shouldSearch: false, reason: 'follow_up_context' };
    }
    if (isRecentResearchCooldownActive(args.state) && !explicitWebSignal) {
        return { shouldSearch: false, reason: 'recent_research_cooldown' };
    }
    if (explicitWebSignal) {
        return { shouldSearch: true, reason: 'explicit_web_signal' };
    }
    if ((normalizedIntent === 'fact_lookup' || normalizedIntent === 'deep_research') && freshnessSignal) {
        return { shouldSearch: true, reason: 'freshness_or_volatility' };
    }
    if (!args.hasActiveTopic && normalizedIntent === 'fact_lookup' && freshnessSignal) {
        return { shouldSearch: true, reason: 'new_lookup_with_freshness' };
    }
    return { shouldSearch: false, reason: 'default_context_mode' };
}

function hasRunnableFlow(flow: unknown): flow is { inputSchema: unknown } {
    return Boolean(flow) && typeof flow === 'object' && 'inputSchema' in (flow as Record<string, unknown>);
}

async function runYoutubeSearchSafely(query: string): Promise<YoutubeSearchResult[]> {
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) return [];
    if (!hasRunnableFlow(youtubeSearchFlow)) {
        console.warn('[BRAIN] youtubeSearchFlow is unavailable. Skipping video lookup.');
        return [];
    }
    try {
        const results = await runFlow(youtubeSearchFlow as any, { query: cleanQuery });
        return Array.isArray(results) ? (results as YoutubeSearchResult[]) : [];
    } catch (error) {
        console.error('[BRAIN] Video Search Error:', error);
        return [];
    }
}

function shouldRouteToResearch(
    intent: string,
    forceWebSearch?: boolean,
    state?: ExtendedConversationState,
    query?: string,
    isVoiceRealtime?: boolean,
    turnPlan?: {
        researchRequired?: boolean;
        primaryAction?: string;
    }
): boolean {
    if (turnPlan) {
        if (turnPlan.primaryAction === 'video_lookup') return true;
        if (turnPlan.primaryAction === 'current_video') return false;
        return Boolean(turnPlan.researchRequired);
    }
    const activeTopic = String(state?.lastStudyTopic || state?.lastTopic || state?.lastSearchTopic?.[0] || '').trim();
    const hasActiveTopic = activeTopic.length > 0;
    const normalizedIntent = String(intent || '').toLowerCase();
    const normalizedQuery = String(query || '').toLowerCase();
    const isMetaModeQuestion = isWebModeMetaQuery(normalizedQuery);
    const likelyFollowUp = isLikelyFollowUpQuery(normalizedQuery);

    const explicitWebSignal =
        /\b(search|look up|web|online|browse|source|sources|citation|verify|latest|current|today|recent|news|price|update)\b/i
            .test(normalizedQuery);
    const explicitTopicShift =
        /\b(new topic|another topic|different topic|change topic|switch topic|unrelated)\b/i
            .test(normalizedQuery);
    const explicitVoiceResearchSignal =
        /\b(search( the)? web|search online|look up online|look it up|from the web|web source|sources|citation|cite|verify|latest|current|today|news|price|update)\b/i
            .test(normalizedQuery);
    const explicitVoiceVideoSignal = /\b(video|youtube|watch)\b/i.test(normalizedQuery);

    if (isVoiceRealtime) {
        if (normalizedIntent === 'video_lookup') return explicitVoiceVideoSignal;
        if (!forceWebSearch) return false;
        if (isMetaModeQuestion || likelyFollowUp) return false;
        if (explicitTopicShift) return true;
        return explicitVoiceResearchSignal;
    }

    if (normalizedIntent === 'video_lookup') return true;

    if (
        normalizedIntent === 'clarification' ||
        normalizedIntent === 'dialogue_continuation' ||
        normalizedIntent === 'greeting'
    ) {
        return false;
    }

    if (!forceWebSearch) {
        return shouldAutoWebResearchWithoutForce({
            intent: normalizedIntent,
            query: normalizedQuery,
            hasActiveTopic,
            likelyFollowUp,
            isMetaModeQuestion,
            state,
        }).shouldSearch;
    }

    if (forceWebSearch) {
        if (hasExplicitNoWebSignal(normalizedQuery)) return false;
        if (explicitTopicShift) return true;
        if (explicitWebSignal && !isMetaModeQuestion) return true;
        if (
            hasActiveTopic &&
            (
                normalizedIntent === 'fact_lookup' ||
                normalizedIntent === 'deep_research' ||
                normalizedIntent === 'definition' ||
                normalizedIntent === 'concept_explanation'
            )
        ) {
            // Web mode should preserve follow-up context unless the student explicitly asks to search.
            return false;
        }
        if ((normalizedIntent === 'fact_lookup' || normalizedIntent === 'deep_research') && !likelyFollowUp) return true;
        if (!hasActiveTopic && (normalizedIntent === 'definition' || normalizedIntent === 'concept_explanation')) {
            return true;
        }
        return false;
    }

    return false;
}

function emitResearchStatus(
    onStatus: EmotionalAICopilotInput['onStatus'],
    phase: ResearchStatusEvent['phase'],
    label: string
) {
    if (!onStatus) return;
    onStatus({
        phase,
        label,
        timestamp: new Date().toISOString(),
    });
}


function buildTutorActionFocusContext(input: EmotionalAICopilotInput): string {
    const tutorAction = input.tutorAction;
    const parts = [
        tutorAction?.selectedText ? `Selected text the student highlighted:\n${String(tutorAction.selectedText).trim().slice(0, 1200)}` : '',
        tutorAction?.sourceText ? `Source response the student clicked:\n${String(tutorAction.sourceText).trim().slice(0, 1800)}` : '',
        tutorAction?.sourceArtifactSummary ? `Relevant study material summary:\n${String(tutorAction.sourceArtifactSummary).trim().slice(0, 900)}` : '',
        input.tutorState?.activeArtifactSummary ? `Active material context:\n${String(input.tutorState.activeArtifactSummary).trim().slice(0, 900)}` : '',
        tutorAction?.sourceVideoTitle ? `Relevant video:\n${String(tutorAction.sourceVideoTitle).trim()}` : '',
        input.tutorState?.activeVideoSummary ? `Active video summary:\n${String(input.tutorState.activeVideoSummary).trim().slice(0, 900)}` : '',
    ].filter(Boolean);
    return parts.join('\n\n');
}

async function generateExplicitTutorActionReply(args: {
    action: NonNullable<EmotionalAICopilotInput['tutorAction']>;
    input: EmotionalAICopilotInput;
    languageMode: string;
    topic: string;
    isVoiceRealtime: boolean;
}): Promise<{ text: string; practiceQuestion?: string; correctAnswers?: string[] }> {
    const focusContext = buildTutorActionFocusContext(args.input);
    const tutorActionConstitution = buildSteadfastTutorConstitutionLayer({
        mode: 'teaching',
        languageMode: args.languageMode,
        voiceMode: args.isVoiceRealtime,
        activeTopic: args.topic,
    });
    const actionRules: Record<NonNullable<EmotionalAICopilotInput['tutorAction']>['id'], string> = {
        ask: 'Answer the selected passage or follow-up in a guided Socratic way. Stay tightly focused on the exact selected text or clicked context. Clarify the meaning first when needed, then end with one short check-for-understanding question.',
        hint: 'Give one short Socratic hint only. Do not reveal the full answer. End with one guiding question.',
        breakdown: 'Break the idea into 3 to 6 clear steps for the student’s level. Keep it simple and sequential.',
        summarize: 'Turn the explanation into concise revision notes with short points and clear wording.',
        practice: 'Create one short-answer practice question based on the topic and source context. The answer must be easy to validate with a few keywords or a simple numeric answer. Return strict JSON with keys question, correctAnswers, topic.',
        save: 'Write a compact revision note the student can save. Keep it short, clear, and easy to revise later.',
    };

    const prompt = [
        'You are Steadfast AI, a premium Socratic tutor for students.',
        `Tutor action: ${args.action.id}`,
        `Current study topic: ${args.topic}`,
        focusContext,
        `Student request text: ${args.input.text}`,
        actionRules[args.action.id],
        'Stay grounded in the current study context. Do not switch topic unless the context clearly demands it.',
    ].filter(Boolean).join('\n\n');

    if (args.action.id === 'practice') {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.25,
            max_tokens: args.isVoiceRealtime ? 180 : 220,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `${tutorActionConstitution}\n\nReturn only valid JSON.` },
                { role: 'user', content: prompt },
            ],
        } as any);
        const raw = String(completion.choices?.[0]?.message?.content || '').trim();
        try {
            const parsed = JSON.parse(raw);
            const question = String(parsed?.question || '').trim();
            const correctAnswers = Array.isArray(parsed?.correctAnswers)
                ? parsed.correctAnswers.map((item: unknown) => String(item || '').trim().toLowerCase()).filter(Boolean).slice(0, 6)
                : [];
            if (question && correctAnswers.length > 0) {
                return { text: '', practiceQuestion: question, correctAnswers };
            }
        } catch {
            // Fall through to the safe fallback below.
        }
        const fallbackQuestion = `In one short answer, what is the key idea in ${args.topic || 'this lesson'}?`;
        const fallbackAnswers = String(args.topic || 'lesson')
            .toLowerCase()
            .split(/\W+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 3)
            .slice(0, 4);
        return {
            text: '',
            practiceQuestion: fallbackQuestion,
            correctAnswers: fallbackAnswers.length > 0 ? fallbackAnswers : ['key idea'],
        };
    }

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: args.action.id === 'hint' ? 0.22 : 0.32,
        max_tokens: args.isVoiceRealtime ? 200 : 320,
        messages: [
            {
                role: 'system',
                content: `${tutorActionConstitution}\n\nFollow the tutor action exactly and stay inside the current study context.`,
            },
            { role: 'user', content: prompt },
        ],
    });
    return {
        text: String(completion.choices?.[0]?.message?.content || '').trim(),
    };
}

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
    const rawInterests = input.preferences?.interests || [];
    const languageMode = (
        input.sessionLanguageState?.preferredLanguageMode ||
        input.preferences?.preferredLanguage ||
        'english'
    ).toLowerCase();
    const isVoiceRealtime = input.responseMode === 'voice_realtime';
    const activeTopic = String((input.state as any)?.lastStudyTopic || input.state?.lastSearchTopic?.[0] || (input.state as any)?.lastTopic || '').trim();
    const stickyMemoryFacts = extractStickyMemoryFacts(input.chatHistory || []);
    console.log(`[TRACE] Student: ${input.studentProfile.name} | Interests: ${rawInterests.join(', ')}`);

    const supportRiskSignal = detectSupportRiskSignal(input.text);
    if (supportRiskSignal) {
        const supportText = buildSupportiveSafetyReply(supportRiskSignal, languageMode);
        const finalizedSupportText = await finalizeAssistantResponseText({
            text: supportText,
            languageMode,
            userInput: input.text,
            topic: input.state.lastSearchTopic?.[0] || "Wellbeing",
            strictMathMode: false,
            isVoiceRealtime,
            sanitize: false
        });
        emitChunkedText(finalizedSupportText, input.onToken);
        return {
            processedText: finalizedSupportText,
            state: input.state,
            topic: input.state.lastSearchTopic?.[0] || "Wellbeing",
            suggestedTitle: input.currentTitle,
            videoData: undefined,
            sources: []
        };
    }

    const sexualityPolicy = evaluateSexualityScopePolicy(
        input.text,
        input.studentProfile?.gradeLevel
    );
    if (sexualityPolicy.blocked) {
        const policyReply = buildSexualityPolicyReply(
            sexualityPolicy.reason || 'outside_allowed_scope',
            languageMode
        );
        const finalizedPolicyReply = await finalizeAssistantResponseText({
            text: policyReply,
            languageMode,
            userInput: input.text,
            topic: input.state.lastSearchTopic?.[0] || "General",
            strictMathMode: false,
            isVoiceRealtime,
            sanitize: false
        });
        emitChunkedText(finalizedPolicyReply, input.onToken);
        return {
            processedText: finalizedPolicyReply,
            state: input.state,
            topic: input.state.lastSearchTopic?.[0] || "General",
            suggestedTitle: input.currentTitle,
            videoData: undefined,
            sources: []
        };
    }

    // ==============================================================================
    // Ã°Å¸â€â€™ SCOPE GUARDIAN (SAFETY LOCK)
    // ==============================================================================
    if (isOutOfScope(input.text)) {
        console.log(`[Ã°Å¸â€ºÂ¡Ã¯Â¸Â SCOPE GUARDIAN] Blocked input: "${input.text}"`);
        const blockText = getDynamicScopeResponse(input.text);
        const finalizedBlockText = await finalizeAssistantResponseText({
            text: blockText,
            languageMode,
            userInput: input.text,
            topic: input.state.lastSearchTopic?.[0] || "General",
            strictMathMode: false,
            isVoiceRealtime,
            sanitize: false
        });

        // Word+Space pacing for a natural feel even on blocked content
        emitChunkedText(finalizedBlockText, input.onToken);

        return {
            processedText: finalizedBlockText,
            state: input.state,
            topic: input.state.lastSearchTopic?.[0] || "General",
            suggestedTitle: input.currentTitle,
            videoData: undefined,
            sources: []
        };
    }

    if (isMemoryRecallPrompt(input.text) && stickyMemoryFacts.length > 0) {
        const memoryReply = buildMemoryRecallReply(languageMode, stickyMemoryFacts);
        const finalizedMemoryReply = await finalizeAssistantResponseText({
            text: memoryReply,
            languageMode,
            userInput: input.text,
            topic: activeTopic || input.state.lastSearchTopic?.[0] || 'Memory',
            strictMathMode: false,
            isVoiceRealtime,
            sanitize: false
        });
        emitChunkedText(finalizedMemoryReply, input.onToken);
        return {
            processedText: finalizedMemoryReply,
            state: input.state,
            topic: activeTopic || input.state.lastSearchTopic?.[0] || 'Memory',
            suggestedTitle: input.currentTitle,
            videoData: undefined,
            sources: []
        };
    }

    // --- Normal Flow Continues Below ---

    let updatedState: ExtendedConversationState = JSON.parse(JSON.stringify(input.state));
    if (updatedState.validationAttemptCount === undefined) updatedState.validationAttemptCount = 0;
    if (updatedState.awaitingPracticeQuestionAnswer === undefined) updatedState.awaitingPracticeQuestionAnswer = false;
    const inferredResearchReady =
        Boolean(input.forceWebSearch) ||
        input.workspaceContext?.modeFlags?.research === true ||
        input.workspaceContext?.researchModeRequested === true;
    updatedState.researchReady = inferredResearchReady;
    updatedState.inferredSchoolLevel = String(input.studentProfile?.gradeLevel || '').trim() || updatedState.inferredSchoolLevel;
    updatedState.inferredLanguage =
        String(input.preferences?.preferredLanguage || '').trim() ||
        updatedState.inferredLanguage;
    updatedState.advancedOptions = {
        includeVideos: Boolean(input.includeVideos),
        level: String(input.studentProfile?.gradeLevel || '').trim() || undefined,
        language: String(input.preferences?.preferredLanguage || '').trim() || undefined,
    };
    const turnTopic = resolveTurnTopic({
        userText: input.text,
        state: updatedState,
        chatHistory: input.chatHistory,
    });
    const resolvedContextTopic = String(turnTopic.topic || activeTopic || input.text).trim();
    const stableStudyTopic = resolveStableStudyTopic({
        userText: input.text,
        resolvedTopic: resolvedContextTopic,
        state: updatedState,
        chatHistory: input.chatHistory,
        activeTopic,
    });
    const latestVideoContext = findLatestVideoContext(input.chatHistory, updatedState);
    const hasCurrentVideoContext = hasVideoContextInConversation(input.chatHistory, updatedState);
    if (input.tutorAction?.id) {
        const explicitTutorTopic = stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic || 'this topic';
        const tutorActionResult = await generateExplicitTutorActionReply({
            action: input.tutorAction,
            input,
            languageMode,
            topic: explicitTutorTopic,
            isVoiceRealtime,
        });

        let explicitReplyText = tutorActionResult.text;
        if (input.tutorAction.id === 'practice') {
            updatedState.awaitingPracticeQuestionAnswer = true;
            updatedState.activePracticeQuestion = String(
                tutorActionResult.practiceQuestion || buildFallbackPracticeQuestion(languageMode)
            ).trim();
            updatedState.correctAnswers = normalizeCorrectAnswers(tutorActionResult.correctAnswers || []);
            updatedState.validationAttemptCount = 0;
            explicitReplyText = buildPracticeChallengeReply(updatedState.activePracticeQuestion, languageMode);
        }

        persistStableStudyTopic(updatedState, explicitTutorTopic);
        const finalizedTutorActionText = await finalizeAssistantResponseText({
            text: explicitReplyText,
            languageMode,
            userInput: input.text,
            topic: explicitTutorTopic,
            strictMathMode: false,
            isVoiceRealtime,
            messagesForCompletion: [{ role: 'user', content: input.tutorAction.sourceText || input.text }],
            sanitize: true,
        });
        updatedState.lastAssistantMessage = finalizedTutorActionText;
        emitChunkedText(finalizedTutorActionText, input.onToken);
        return {
            processedText: finalizedTutorActionText,
            state: updatedState,
            topic: explicitTutorTopic,
            suggestedTitle: input.currentTitle,
            videoData: undefined,
            sources: [],
        };
    }
    const turnPlan = await detectLearningTurnPlan(
        input.text,
        stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic,
        {
            hasVideoContext: hasCurrentVideoContext,
            hasAttachmentContext: Boolean(updatedState.lastAttachmentContextSummary || findLatestPersistedAttachments(input.chatHistory)),
            forceWebSearch: Boolean(input.forceWebSearch),
        }
    );
    const isCurrentVideoFollowUp =
        turnPlan.primaryAction === 'current_video' ||
        (hasCurrentVideoContext && isVideoContextFollowUp(input.text));

    if (turnTopic.explicitShift) {
        persistStableStudyTopic(updatedState, resolvedContextTopic);
        updatedState.lastAttachmentContextSummary = undefined;
        updatedState.lastAttachmentLabels = [];
        updatedState.lastSuggestedVideo = undefined;
        updatedState.mathModeActive = false;
        updatedState.awaitingPracticeQuestionAnswer = false;
        updatedState.validationAttemptCount = 0;
        updatedState.activePracticeQuestion = undefined;
        updatedState.correctAnswers = [];
        updatedState.mathWorkedExampleStep = 0;
        updatedState.mathTopicType = undefined;
        updatedState.mathLessonKind = undefined;
        updatedState.mathLessonStep = undefined;
        updatedState.mathTargetExpression = undefined;
        updatedState.mathExpectedFinalAnswer = undefined;
        updatedState.conceptualLessonModeActive = false;
        updatedState.conceptualTopic = undefined;
    }

    let responseText: string = '';
    let videoData: EmotionalAICopilotOutput['videoData'] | undefined = undefined;
    let suggestedTitle: string | undefined = undefined;

    // ==============================================================================
    // 1. FAST PATH: GREETINGS & SHORT CONTINUATIONS (Sub-millisecond)
    // ==============================================================================
    const cleanInput = input.text.trim().toLowerCase();
    const greets = ["hi", "hello", "hey", "jambo", "good morning", "good afternoon"];
    const isGreet = greets.some(g => cleanInput === g || cleanInput === g + "!");

    if (isGreet) {
        const text = buildGreetingText(languageMode, input.studentProfile.name, rawInterests);
        const finalizedGreeting = await finalizeAssistantResponseText({
            text,
            languageMode,
            userInput: input.text,
            topic: stableStudyTopic || updatedState.lastTopic || 'general',
            strictMathMode: false,
            isVoiceRealtime,
            sanitize: false
        });
        emitChunkedText(finalizedGreeting, input.onToken);
        return {
            processedText: finalizedGreeting,
            state: updatedState,
            topic: stableStudyTopic || updatedState.lastTopic || 'general'
        };
    }

    if (isCurrentVideoFollowUp && latestVideoContext?.id) {
        const videoContextReply = await answerFromExistingVideoContext({
            question: input.text,
            video: latestVideoContext,
            languageMode,
            cachedSummary:
                input.tutorState?.activeVideoId === latestVideoContext.id
                    ? input.tutorState?.activeVideoSummary
                    : undefined,
            cachedConcepts:
                input.tutorState?.activeVideoId === latestVideoContext.id
                    ? input.tutorState?.activeVideoConcepts
                    : undefined,
            cachedWhyRecommended:
                input.tutorState?.activeVideoId === latestVideoContext.id
                    ? input.tutorState?.activeVideoWhyRecommended
                    : undefined,
        });
        const finalizedVideoContextReply = await finalizeAssistantResponseText({
            text: videoContextReply,
            languageMode,
            userInput: input.text,
            topic: stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || 'video',
            strictMathMode: false,
            isVoiceRealtime,
            sanitize: true,
        });
        updatedState.lastAssistantMessage = finalizedVideoContextReply;
        updatedState.lastSuggestedVideo = latestVideoContext;
        updatedState.videoSuggested = true;
        emitChunkedText(finalizedVideoContextReply, input.onToken);
        return {
            processedText: finalizedVideoContextReply,
            state: updatedState,
            topic: stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || input.text,
            videoData: {
                id: latestVideoContext.id,
                title: latestVideoContext.title || 'Suggested video',
                channel: latestVideoContext.channel,
                thumbnail: latestVideoContext.thumbnailUrl,
            },
            suggestedTitle,
        };
    }

    const currentTurnLooksMathFocused = isMathFocusedInput(input.text, stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic);
    const shouldDropMathStateForVisualTurn =
        isVisualRatingOrCritiqueInput(input.text) &&
        !currentTurnLooksMathFocused;

    if (shouldDropMathStateForVisualTurn) {
        updatedState.mathModeActive = false;
        updatedState.awaitingPracticeQuestionAnswer = false;
        updatedState.validationAttemptCount = 0;
        updatedState.activePracticeQuestion = undefined;
        updatedState.correctAnswers = [];
        updatedState.mathWorkedExampleStep = 0;
        updatedState.mathTopicType = undefined;
        updatedState.mathLessonKind = undefined;
        updatedState.mathLessonStep = undefined;
        updatedState.mathTargetExpression = undefined;
        updatedState.mathExpectedFinalAnswer = undefined;
    }

    const strictMathMode =
        Boolean(updatedState.mathModeActive) ||
        currentTurnLooksMathFocused;
    const extractedExpression = strictMathMode ? extractMathExpression(input.text) : null;
    const detectedMathTopicType: MathTopicType = strictMathMode
        ? detectMathTopicType(input.text, stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic, extractedExpression || undefined)
        : 'generic';
    const foundationalTeachingMode = shouldUseFoundationalTeachingMode({
        userText: input.text,
        chatHistory: input.chatHistory,
        strictMathMode,
        forceWebSearch: input.forceWebSearch,
        languageMode,
    });
    const conceptualMicroPacingMode = shouldUseConceptualMicroPacingMode({
        userText: input.text,
        state: updatedState,
        strictMathMode,
        forceWebSearch: input.forceWebSearch,
        languageMode,
        foundationalTeachingMode,
    });

    if (shouldExitConceptualMode(input.text) || strictMathMode || Boolean(input.forceWebSearch)) {
        updatedState.conceptualLessonModeActive = false;
        updatedState.conceptualTopic = undefined;
    } else if (conceptualMicroPacingMode) {
        updatedState.conceptualLessonModeActive = true;
        if (foundationalTeachingMode) {
            updatedState.conceptualTopic = extractTheoryTopicFromInput(input.text);
        } else if (!updatedState.conceptualTopic) {
            updatedState.conceptualTopic = extractTheoryTopicFromInput(input.text);
        } else if (!isConceptualContinuation(input.text) && /\b(take me through|teach me|walk me through|help me understand|i want to learn|learn about|introduction to|intro to|basics of|explain)\b/i.test(input.text)) {
            updatedState.conceptualTopic = extractTheoryTopicFromInput(input.text);
        }
    }

    if (strictMathMode && !updatedState.awaitingPracticeQuestionAnswer && extractedExpression) {
        const expected = evaluateMathExpression(extractedExpression);
        const lessonKind = detectMathLessonKind(extractedExpression);
        const isStructuredFractionLesson = lessonKind === 'fraction_division';
        const firstLessonStep = isStructuredFractionLesson ? 1 : 0;
        const directAnswerRequest = isDirectAnswerRequest(input.text);
        const firstLessonPayload = isStructuredFractionLesson
            ? buildMathLessonStep(
                lessonKind,
                extractedExpression,
                1,
                languageMode,
                expected
            )
            : null;
        const kickoffPrompt = directAnswerRequest
            ? buildMathNoFinalAnswerSocraticReply({
                expression: extractedExpression,
                languageMode,
                activeQuestion: firstLessonPayload?.activeQuestion,
                gradeLevel: input.studentProfile?.gradeLevel,
            })
            : (firstLessonPayload?.prompt || buildMathKickoffPrompt(extractedExpression, languageMode, detectedMathTopicType));
        const kickoffExpected = firstLessonPayload?.expectedAnswers || getMathKickoffExpectedAnswers(detectedMathTopicType, extractedExpression);
        const kickoffQuestion = firstLessonPayload?.activeQuestion || `Kickoff ${detectedMathTopicType} check`;

        updatedState.awaitingPracticeQuestionAnswer = true;
        updatedState.activePracticeQuestion = kickoffQuestion;
        updatedState.correctAnswers = kickoffExpected;
        updatedState.validationAttemptCount = 0;
        updatedState.mathModeActive = true;
        updatedState.mathWorkedExampleStep = 0;
        updatedState.mathLessonKind = lessonKind;
        updatedState.mathLessonStep = firstLessonStep;
        updatedState.mathTargetExpression = extractedExpression;
        updatedState.mathExpectedFinalAnswer = expected || undefined;
        updatedState.mathTopicType = detectedMathTopicType;
        if (!updatedState.lastTopic) updatedState.lastTopic = 'mathematics';
        if (!updatedState.lastStudyTopic) updatedState.lastStudyTopic = stableStudyTopic || 'mathematics';

        const finalizedKickoff = await finalizeAssistantResponseText({
            text: kickoffPrompt,
            languageMode,
            userInput: input.text,
            topic: updatedState.lastStudyTopic || updatedState.lastTopic,
            strictMathMode: true,
            isVoiceRealtime,
            sanitize: true
        });
        updatedState.lastAssistantMessage = finalizedKickoff;
        emitChunkedText(finalizedKickoff, input.onToken);
        return {
            processedText: finalizedKickoff,
            state: updatedState,
            topic: updatedState.lastStudyTopic || updatedState.lastTopic || input.text,
            suggestedTitle
        };
    }

    // ==============================================================================
    // 2. PRE-PROCESSING (Intent)
    // ==============================================================================
    const intentPromise =
        isVoiceRealtime || !input.forceWebSearch
            ? Promise.resolve(heuristicResearchIntent(input.text, stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic))
            : detectResearchIntent(input.text, stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic);

    console.log('[BRAIN] Detecting Intent...');
    const detectedIntent = await intentPromise;
    const intent = turnPlan.intent || detectedIntent;
    const researchGatingSnapshot = shouldAutoWebResearchWithoutForce({
        intent: String(intent || '').toLowerCase(),
        query: input.text,
        hasActiveTopic: Boolean(String(updatedState?.lastStudyTopic || updatedState?.lastTopic || updatedState?.lastSearchTopic?.[0] || '').trim()),
        likelyFollowUp: isLikelyFollowUpQuery(input.text),
        isMetaModeQuestion: isWebModeMetaQuery(input.text),
        state: updatedState,
        turnPlan,
    });
    let shouldUseResearchRoute = shouldRouteToResearch(
        intent,
        input.forceWebSearch,
        updatedState,
        input.text,
        isVoiceRealtime,
        turnPlan
    );
    if (turnPlan.primaryAction === 'explanation' && turnPlan.secondaryAction === 'video_lookup') {
        shouldUseResearchRoute = false;
    }
    if (!shouldUseResearchRoute) {
        updatedState.lastResearchDecision = 'context';
        updatedState.lastResearchReason = input.forceWebSearch
            ? (hasExplicitNoWebSignal(input.text) ? 'explicit_no_web_request' : 'context_by_policy')
            : researchGatingSnapshot.reason;
        updatedState.lastResearchAt = new Date().toISOString();
        updatedState.lastResearchQuery = String(input.text || '').slice(0, 240);
        updatedState.researchSkipStreak = Math.min(10, Number(updatedState.researchSkipStreak || 0) + 1);

        if (updatedState.lastResearchReason === 'explicit_no_web_request') {
            const contextReply = localizedText(
                languageMode,
                'Using only our previous context as you asked, not searching online. Based on what we already discussed, here is a concise explanation.',
                'Kutumia muktadha wetu uliotangulia kama ulivyoomba, bila kutafuta mtandaoni. Kulingana na tulichojadili, hii ndiyo ufafanuzi mfupi.',
                '\u0627\u0633\u062a\u062e\u062f\u0645\u062a \u0641\u0642\u0637 \u0633\u064a\u0627\u0642\u0646\u0627 \u0627\u0644\u0633\u0627\u0628\u0642 \u0643\u0645\u0627 \u0637\u0644\u0628\u062a \u062f\u0648\u0646 \u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a. \u0627\u0633\u062a\u0646\u0627\u062f\u0627\u064b \u0625\u0644\u0649 \u0645\u0627 \u0646\u0627\u0642\u0634\u0646\u0627\u0647 \u0645\u0633\u0628\u0642\u0627\u064b\u060c \u0647\u0630\u0627 \u0634\u0631\u062d \u0645\u062e\u062a\u0635\u0631.'
            );
            updatedState.lastAssistantMessage = contextReply;
            emitChunkedText(contextReply, input.onToken);
            return {
                processedText: contextReply,
                state: updatedState,
                topic: updatedState.lastStudyTopic || updatedState.lastTopic || input.text,
                suggestedTitle
            };
        }
    }

    // ==============================================================================
    // 2. RESEARCH ORCHESTRATOR ROUTING
    // ==============================================================================
    if (shouldUseResearchRoute) {
        console.log("[Ã°Å¸â€Â TRACE] Handing off to Research Orchestrator");

        emitResearchStatus(input.onStatus, 'research_ready', 'Web research ready for this turn.');
        emitResearchStatus(input.onStatus, 'searching_sources', 'Looking up trusted sources...');
        const researchStartedAtIso = new Date().toISOString();
        const researchResult = await runResearchOrchestrator({
            query: input.text,
            lastSearchTopic: stableStudyTopic || resolvedContextTopic || updatedState.lastTopic,
            forceWebSearch: input.forceWebSearch,
            chatHistory: input.chatHistory.map(m => ({ role: m.role, content: m.content }))
        }) as ResearchOrchestratorResult;

        const didWebResearch = String(researchResult.mode || '').toLowerCase() === 'web_research';
        updatedState.conversationState = 'general';
        updatedState.researchModeActive = didWebResearch;
        updatedState.lastResearchDecision = didWebResearch ? 'web' : 'context';
        updatedState.lastResearchReason = input.forceWebSearch
            ? 'force_web_mode'
            : researchGatingSnapshot.reason;
        updatedState.lastResearchAt = new Date().toISOString();
        updatedState.lastResearchQuery = String(input.text || '').slice(0, 240);
        updatedState.researchSkipStreak = didWebResearch ? 0 : Math.min(10, Number(updatedState.researchSkipStreak || 0) + 1);

        const sources = Array.isArray(researchResult.sources) ? researchResult.sources : [];
        if (didWebResearch && sources.length > 0) {
            emitResearchStatus(input.onStatus, 'first_useful', 'Found reliable sources. Building a clear answer...');
        }
        const researchSourceContext = {
            sourceReuseId: String(researchResult.sourceReuseId || '').trim() || undefined,
            queryUsed: String(researchResult.queryUsed || input.text || '').trim() || undefined,
            sourceCount: sources.length,
            reuseHit: researchResult.reuseHit === true,
            queryPlan: Array.isArray(researchResult.queryPlan) ? researchResult.queryPlan : undefined,
        };
        updatedState.researchQuery = researchSourceContext.queryUsed;
        updatedState.sourceReuseId = researchSourceContext.sourceReuseId;
        updatedState.retrievedSourceSet = sources.map((source) => ({
            title: String(source?.sourceName || 'Source').trim() || 'Source',
            url: String(source?.url || '').trim() || undefined,
            domain: null,
            sourceType: null,
            trustTier: null,
            relevanceReason: null,
            recencyReason: null,
            educationalFit: null,
        }));
        updatedState.researchSourceContext = researchSourceContext;
        updatedState.confidenceState = researchResult.confidenceState || updatedState.confidenceState;
        const nowIso = new Date().toISOString();
        updatedState.researchLatencyState = {
            startedAt: researchStartedAtIso,
            completedAt: nowIso,
            firstUsefulLatencyMs:
                typeof researchResult.firstUsefulLatencyMs === 'number'
                    ? Math.max(0, researchResult.firstUsefulLatencyMs)
                    : undefined,
            completedLatencyMs:
                typeof researchResult.completedLatencyMs === 'number'
                    ? Math.max(0, researchResult.completedLatencyMs)
                    : undefined,
        };
        let rawResponse =
            researchResult.reply ||
            researchResult.response ||
            (sources.length > 0
                ? `Latest info for ${input.text}.`
                : `I could not verify enough reliable external sources for "${input.text}" right now, so I will stay with the trusted context already in this conversation.`);
        const shouldAttachResearchVideo =
            turnPlan.wantsVideo ||
            turnPlan.primaryAction === 'video_lookup' ||
            turnPlan.secondaryAction === 'video_lookup' ||
            Boolean(input.includeVideos);

        // VIDEO HANDLING
        if (researchResult.videoData && shouldAttachResearchVideo) {
            const vData = researchResult.videoData;
            if (vData.id) {
                videoData = vData;
                updatedState.lastSuggestedVideo = {
                    id: vData.id,
                    title: vData.title,
                    channel: vData.channel,
                    thumbnailUrl: vData.thumbnail,
                    videoId: vData.id,
                };
                updatedState.videoSuggested = true;
                rawResponse += `\n\n${localizedText(
                    languageMode,
                    'I have attached the video below so you can watch it here.',
                    'Nimeweka video hapa chini ili uione moja kwa moja hapa.',
                    '\u0623\u0631\u0641\u0642\u062a \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0623\u062f\u0646\u0627\u0647 \u0644\u062a\u0634\u0627\u0647\u062f\u0647 \u0645\u0628\u0627\u0634\u0631\u0629 \u0647\u0646\u0627.'
                )}`;
            }
        }

        if (researchResult.mode === 'teaching' || researchResult.mode === 'web_research') {
            persistStableStudyTopic(updatedState, stableStudyTopic || resolvedContextTopic || input.text);
        }

        emitResearchStatus(input.onStatus, 'synthesizing', 'Synthesizing evidence into a clear explanation...');
        const finalizedResearchText = await finalizeAssistantResponseText({
            text: rawResponse,
            languageMode,
            userInput: input.text,
            topic: updatedState.lastStudyTopic || updatedState.lastTopic,
            strictMathMode,
            isVoiceRealtime,
            sanitize: true,
            conceptualMicroPacingMode,
            conceptualTopic: updatedState.conceptualTopic,
            messagesForCompletion: [{ role: 'user', content: input.text }]
        });
        updatedState.lastAssistantMessage = finalizedResearchText;
        emitResearchStatus(input.onStatus, 'finalizing', 'Finalizing source-backed response...');

        emitChunkedText(finalizedResearchText, input.onToken);
        emitResearchStatus(input.onStatus, 'complete', 'Research response ready.');

        const researchNotices = Array.isArray(researchResult.notices)
            ? researchResult.notices
                .map((notice) => ({
                    code: String(notice?.code || '').trim(),
                    message: String(notice?.message || '').trim(),
                    severity:
                        String(notice?.severity || '').trim().toLowerCase() === 'warning'
                            ? 'warning' as const
                            : 'info' as const,
                }))
                .filter((notice) => notice.code && notice.message)
            : [];

        return {
            processedText: finalizedResearchText,
            state: updatedState,
            topic: updatedState.lastStudyTopic || updatedState.lastTopic,
            sources: sources,
            videoData: videoData,
            suggestedTitle: suggestedTitle,
            assistantMetadata: {
                research: {
                    queryUsed: researchSourceContext.queryUsed || null,
                    trustSummary:
                        updatedState.confidenceState === 'high'
                            ? 'Strong source support'
                            : updatedState.confidenceState === 'medium'
                                ? 'Moderate source support'
                                : updatedState.confidenceState === 'low'
                                    ? 'Limited source support'
                                    : updatedState.confidenceState === 'mixed'
                                        ? 'Mixed source support'
                                        : 'Insufficient source support',
                    limitations:
                        updatedState.confidenceState === 'high' || updatedState.confidenceState === 'medium'
                            ? null
                            : ['Source confidence is limited for this query.'],
                    notices: researchNotices,
                    recommendedVideos:
                        researchResult.videoData?.id
                            ? [
                                {
                                    videoId: String(researchResult.videoData.id),
                                    title: String(researchResult.videoData.title || 'Recommended video').trim(),
                                    channelTitle: String(researchResult.videoData.channel || '').trim() || null,
                                    thumbnailUrl: String(researchResult.videoData.thumbnail || '').trim() || null,
                                    transcriptAvailable: null,
                                    language: null,
                                    intent: null,
                                    whyRecommended: String(researchResult.videoWhyRecommended || '').trim() || null,
                                    trustTier: null,
                                },
                            ]
                            : null,
                    researchIntent: String(turnPlan.intent || '').trim() || null,
                    triggerType: String(researchResult.triggerType || '').trim() || null,
                    sourceReuseId: researchSourceContext.sourceReuseId || null,
                    reuseHit: researchSourceContext.reuseHit,
                    confidenceState: updatedState.confidenceState || null,
                    searchCount:
                        typeof researchResult.searchCount === 'number' ? researchResult.searchCount : null,
                    queryPlan:
                        Array.isArray(researchResult.queryPlan) ? researchResult.queryPlan : null,
                    firstUsefulLatencyMs:
                        typeof researchResult.firstUsefulLatencyMs === 'number'
                            ? researchResult.firstUsefulLatencyMs
                            : null,
                    completedLatencyMs:
                        typeof researchResult.completedLatencyMs === 'number'
                            ? researchResult.completedLatencyMs
                            : null,
                    latency: updatedState.researchLatencyState || null,
                },
            },
        };
    }

    // ==============================================================================
    // 3. PRACTICE QUESTION LOGIC
    // ==============================================================================
    if (updatedState.awaitingPracticeQuestionAnswer) {
            const mathActive =
                Boolean(updatedState.mathModeActive) ||
            isMathFocusedInput(updatedState.activePracticeQuestion || '', stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic);
        const mathTopicType: MathTopicType =
            (updatedState.mathTopicType as MathTopicType | undefined) ||
            detectMathTopicType(
                updatedState.activePracticeQuestion || input.text,
                stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || activeTopic,
                updatedState.activePracticeQuestion || undefined
            );
        let lessonKind = updatedState.mathLessonKind;
        let lessonExpression = updatedState.mathTargetExpression || updatedState.activePracticeQuestion || input.text;
        let lessonStep = Math.max(1, Number(updatedState.mathLessonStep || 1));
        const directAnswerRequest = isDirectAnswerRequest(input.text);
        const workedExampleThreshold = getMathWorkedExampleThreshold(input.studentProfile?.gradeLevel);

        // Self-heal stale sessions where older state lacked math lesson metadata.
        if (mathActive && !lessonKind) {
            const recoveredExpression = recoverFractionDivisionExpressionFromContext(input.text, updatedState, input.chatHistory);
            if (recoveredExpression && parseFractionDivisionExpression(recoveredExpression)) {
                const recoveredParts = parseFractionDivisionExpression(recoveredExpression)!;
                lessonKind = 'fraction_division';
                lessonExpression = recoveredExpression;
                lessonStep = 1;
                updatedState.mathLessonKind = 'fraction_division';
                updatedState.mathLessonStep = 1;
                updatedState.mathTargetExpression = recoveredExpression;
                updatedState.activePracticeQuestion = buildDenominatorQuestionLabel(
                    `${recoveredParts.n2}/${recoveredParts.d2}`,
                    languageMode
                );
                updatedState.correctAnswers = [recoveredParts.d2];
            }
        }

        if (directAnswerRequest) {
            responseText = buildMathNoFinalAnswerSocraticReply({
                expression: lessonExpression,
                languageMode,
                activeQuestion: updatedState.activePracticeQuestion,
                gradeLevel: input.studentProfile?.gradeLevel,
            });
        } else if (mathActive && lessonKind === 'fraction_division' && lessonExpression) {
            if (isMathClarificationInput(input.text)) {
                responseText = buildMathStepClarification(lessonKind, lessonExpression, lessonStep, languageMode);
            } else {
                const isStepCorrect = validateAnswer(input.text, updatedState.correctAnswers || []);
                if (isStepCorrect) {
                    const nextStep = lessonStep + 1;
                    const nextPayload = buildMathLessonStep(
                        lessonKind,
                        lessonExpression,
                        nextStep,
                        languageMode,
                        updatedState.mathExpectedFinalAnswer
                    );

                    if (nextPayload && (nextPayload.expectedAnswers || []).length > 0) {
                        updatedState.mathLessonStep = nextStep;
                        updatedState.activePracticeQuestion = nextPayload.activeQuestion;
                        updatedState.correctAnswers = nextPayload.expectedAnswers;
                        updatedState.validationAttemptCount = 0;
                        responseText = nextPayload.prompt;
                    } else {
                        responseText = buildMathSuccessFeedback(
                            lessonExpression,
                            languageMode,
                            mathTopicType,
                            input.studentProfile?.gradeLevel
                        );
                        updatedState.awaitingPracticeQuestionAnswer = false;
                        updatedState.validationAttemptCount = 0;
                        updatedState.activePracticeQuestion = undefined;
                        updatedState.correctAnswers = [];
                        updatedState.mathModeActive = false;
                        updatedState.mathWorkedExampleStep = 0;
                        updatedState.mathTopicType = undefined;
                        updatedState.mathLessonKind = undefined;
                        updatedState.mathLessonStep = undefined;
                        updatedState.mathTargetExpression = undefined;
                        updatedState.mathExpectedFinalAnswer = undefined;
                    }
                } else {
                    updatedState.validationAttemptCount = (updatedState.validationAttemptCount || 0) + 1;
                    if ((updatedState.validationAttemptCount || 0) >= workedExampleThreshold) {
                        const workedStep = Math.max(1, Number(updatedState.mathWorkedExampleStep || 0) + 1);
                        updatedState.mathWorkedExampleStep = workedStep;
                        responseText = buildMathWorkedExampleScaffold(
                            lessonExpression,
                            workedStep,
                            languageMode,
                            mathTopicType,
                            input.studentProfile?.gradeLevel
                        );
                    } else {
                        responseText = buildMathFoundationRetryScaffold(
                            lessonKind,
                            lessonExpression,
                            lessonStep,
                            updatedState.validationAttemptCount || 1,
                            languageMode
                        );
                    }
                }
            }
        } else {
            const isCorrect = validateAnswer(input.text, updatedState.correctAnswers || []);

            if (isCorrect) {
                if (mathActive) {
                    responseText = buildMathSuccessFeedback(
                        updatedState.activePracticeQuestion || updatedState.lastTopic || 'this step',
                        languageMode,
                        mathTopicType,
                        input.studentProfile?.gradeLevel
                    );
                } else {
                    const topic = updatedState.lastTopic || 'that';
                    responseText = buildGenericPracticeSuccessFeedback(topic, languageMode);
                }
                updatedState.awaitingPracticeQuestionAnswer = false;
                updatedState.validationAttemptCount = 0;
                updatedState.activePracticeQuestion = undefined;
                updatedState.correctAnswers = [];
                updatedState.mathModeActive = false;
                updatedState.mathWorkedExampleStep = 0;
                updatedState.mathTopicType = undefined;
            } else {
                updatedState.validationAttemptCount = (updatedState.validationAttemptCount || 0) + 1;
                if (mathActive) {
                    if ((updatedState.validationAttemptCount || 0) >= workedExampleThreshold) {
                        const workedStep = Math.max(1, Number(updatedState.mathWorkedExampleStep || 0) + 1);
                        updatedState.mathWorkedExampleStep = workedStep;
                        responseText = buildMathWorkedExampleScaffold(
                            updatedState.activePracticeQuestion || input.text,
                            workedStep,
                            languageMode,
                            mathTopicType,
                            input.studentProfile?.gradeLevel
                        );
                    } else {
                        responseText = buildMathRetryScaffold(
                            updatedState.activePracticeQuestion || input.text,
                            updatedState.validationAttemptCount || 1,
                            languageMode,
                            mathTopicType,
                            input.studentProfile?.gradeLevel
                        );
                    }
                } else {
                    responseText = buildGenericPracticeRetryFeedback(
                        updatedState.validationAttemptCount || 1,
                        languageMode
                    );
                }
            }
        }

        if (mathActive && isNearDuplicateReply(responseText, updatedState.lastAssistantMessage || '')) {
            responseText = buildMathNoFinalAnswerSocraticReply({
                expression: lessonExpression,
                languageMode,
                activeQuestion: updatedState.activePracticeQuestion,
                repeated: true,
                gradeLevel: input.studentProfile?.gradeLevel,
            });
        }

        const finalizedPracticeText = await finalizeAssistantResponseText({
            text: responseText,
            languageMode,
            userInput: input.text,
            topic: updatedState.lastStudyTopic || updatedState.lastTopic,
            strictMathMode: mathActive,
            isVoiceRealtime,
            sanitize: true,
            messagesForCompletion: [{ role: 'user', content: input.text }]
        });
        updatedState.lastAssistantMessage = finalizedPracticeText;

        emitChunkedText(finalizedPracticeText, input.onToken);

        return { processedText: finalizedPracticeText, state: updatedState, suggestedTitle: suggestedTitle };
    }

    // ==============================================================================
    // 4. DYNAMIC SYSTEM PROMPT (MULTILINGUAL GOVERNANCE)
    // ==============================================================================

    // Ã¢Å“â€¦ LOG GOVERNANCE LOADING (VERIFY STRICT RULES ARE ACTIVE)
    console.log(`[GOVERNANCE] Loading Strict Rules for: ${languageMode}`);

    // Ã¢Å“â€¦ NEW: Fetch Governed Prompt based on Language + Interests
    const TEACHING_PROMPT = getLanguageGovernance(languageMode, rawInterests);

    const RESEARCH_PROMPT = `
  **IDENTITY**
  Calm, neutral research assistant.
  **RULES**
  - Factual, clear, direct.
  - No metaphors unless helpful.
  - Direct answers.
  - Avoid long bullet/numbered lists unless explicitly requested.
  - End every response with a complete sentence.
  - Presentation-only optimization: improve clarity, engagement, and delivery without changing core reasoning or system logic.
  `;

    const shouldUseResearchSystemPrompt =
        shouldUseResearchRoute ||
        turnPlan.primaryAction === 'research' ||
        turnPlan.primaryAction === 'video_lookup';
    const systemMessage = shouldUseResearchSystemPrompt ? RESEARCH_PROMPT : TEACHING_PROMPT;
    const sessionLanguageDirective = input.sessionLanguageState
        ? [
            '**SESSION LANGUAGE CONTROL**',
            `- Preferred response language mode: ${input.sessionLanguageState.preferredLanguageMode || languageMode}.`,
            `- Preferred response language: ${input.sessionLanguageState.preferredResponseLanguage}.`,
            `- Learning support mode: ${input.sessionLanguageState.learningSupportMode || 'strict_single_language'}.`,
            `- Simplicity level: ${input.sessionLanguageState.simplicityLevel || 'simple'}.`,
            `- Last detected student input language: ${input.sessionLanguageState.lastDetectedInputLanguage || 'unknown'}.`,
            '- Follow the selected learning language for the reply even if the learner wrote in another supported language.',
            '- Keep bilingual support controlled and brief. Do not drift into chaotic language mixing.',
          ].join('\n')
        : '';
    const metacognitiveDirective = input.metacognitiveState
        ? [
            '**LEARNER REFLECTION SIGNALS**',
            input.metacognitiveState.confidence ? `- Confidence signal: ${input.metacognitiveState.confidence}.` : '',
            input.metacognitiveState.problemFraming ? `- Problem framing signal: ${input.metacognitiveState.problemFraming}.` : '',
            input.metacognitiveState.errorType ? `- Error awareness signal: ${input.metacognitiveState.errorType}.` : '',
            input.metacognitiveState.strategyPreference ? `- Support preference signal: ${input.metacognitiveState.strategyPreference}.` : '',
            input.metacognitiveState.transferReadiness ? `- Transfer readiness signal: ${input.metacognitiveState.transferReadiness}.` : '',
            input.metacognitiveState.studentReflectionNote ? `- Student reflection note: ${input.metacognitiveState.studentReflectionNote}.` : '',
            '- Use these signals to improve the next step, but do not overstate certainty when evidence is light.',
          ].filter(Boolean).join('\n')
        : '';
    const steadfastConstitutionLayer = buildSteadfastTutorConstitutionLayer({
        mode: shouldUseResearchSystemPrompt ? 'research' : 'teaching',
        languageMode,
        voiceMode: isVoiceRealtime,
        strictMathMode,
        activeTopic: stableStudyTopic || resolvedContextTopic || updatedState.lastStudyTopic || updatedState.lastTopic,
    });
    const deliveryRefinementLayer = getDeliveryRefinementLayer();
    const adaptiveDeliveryLayer = getAdaptiveDeliveryLayers({
        voiceMode: isVoiceRealtime,
        gradeLevel: input.studentProfile?.gradeLevel,
        examMode: Boolean(input.examMode) ||
            input.workspaceContext?.modeFlags?.exam === true ||
            input.workspaceContext?.studyMode === 'exam',
        userText: input.text,
    });
    const workspaceModeFlags = input.workspaceContext?.modeFlags || {};
    const workspaceFocusMode = Boolean(input.focusMode) || workspaceModeFlags.focus === true || input.workspaceContext?.studyMode === 'focus';
    const workspaceExamMode = Boolean(input.examMode) || workspaceModeFlags.exam === true || input.workspaceContext?.studyMode === 'exam';
    const workspaceResearchMode =
        Boolean(input.forceWebSearch) ||
        workspaceModeFlags.research === true ||
        input.workspaceContext?.researchModeRequested === true;
    const workspaceStudyModeLabel = workspaceFocusMode && workspaceExamMode
        ? 'focus+exam'
        : workspaceExamMode
            ? 'exam'
            : workspaceFocusMode
                ? 'focus'
                : 'standard';
    const workspaceContextDirective = input.workspaceContext
        ? [
            '**WORKSPACE CONTEXT**',
            `- Active destination: ${input.workspaceContext.activeDestination || 'new_session'}.`,
            `- Study mode: ${workspaceStudyModeLabel}.`,
            workspaceResearchMode ? '- Research mode is intentionally active for this turn.' : '',
            input.workspaceContext.plusAction ? `- Latest launcher action: ${input.workspaceContext.plusAction}.` : '',
            input.workspaceContext.revisionItemId ? `- Active revision item id: ${input.workspaceContext.revisionItemId}.` : '',
            input.workspaceContext.mediaItemId ? `- Active media item id: ${input.workspaceContext.mediaItemId}.` : '',
            input.workspaceContext.growthSection ? `- Active growth section: ${input.workspaceContext.growthSection}.` : '',
            '- Keep guidance coherent with this workspace context without exposing internal technical state to the learner.',
          ].filter(Boolean).join('\n')
        : '';
    const focusModeRules = workspaceFocusMode
        ? `
  FOCUS MODE:
  - Keep guidance narrow, stepwise, and low-noise.
  - Ask for one student attempt before moving to the next step.
  - Prefer short, calm prompts over long explanations.
  `
        : '';
    const examModeRules = workspaceExamMode
        ? `
  EXAM MODE:
  - Keep coaching concise, exam-relevant, and outcome-oriented.
  - Prefer checkpoint prompts over full worked answers.
  - Reinforce method, mark common traps, and ask for the student's own attempt.
  `
        : '';
    const hybridModeRules = workspaceFocusMode && workspaceExamMode
        ? `
  FOCUS + EXAM HYBRID:
  - Use one-step pacing from Focus Mode with strict exam discipline from Exam Mode.
  - Give exactly one next action at a time.
  - Avoid optional extras unless the student asks.
  - Keep tone calm, serious, and confidence-building.
  `
        : '';
    const researchModeRules = workspaceResearchMode
        ? `
  RESEARCH MODE:
  - Use trusted and up-to-date sources only when they materially improve this answer.
  - Keep citations concise and learner-friendly.
  - Convert evidence into age-appropriate teaching, not a source dump.
  `
        : '';
    const researchHybridRules = workspaceResearchMode && (workspaceFocusMode || workspaceExamMode)
        ? `
  RESEARCH HYBRID MODE:
  - Keep research-backed answers short and structured.
  - If Focus is active, give one action step at a time even when citing evidence.
  - If Exam is active, prioritize exam-relevant method checks over broad exploration.
  - If Focus + Exam are both active, provide one disciplined next action with minimal noise.
  `
        : '';
    const masterOrchestrationLayer = getMasterBehavioralOrchestrationLayer({
        voiceMode: isVoiceRealtime,
        gradeLevel: input.studentProfile?.gradeLevel,
        examMode: workspaceExamMode,
        userText: input.text,
        validationAttemptCount: updatedState.validationAttemptCount,
        proceduralMode: strictMathMode,
        strugglingHint: Boolean(updatedState.awaitingPracticeQuestionAnswer) && Number(updatedState.validationAttemptCount || 0) >= 2,
    });
    const voiceLatencyRules = `
  VOICE SPEED MODE:
  - Respond quickly with high clarity.
  - Start with a launch chunk of 1 to 2 short sentences that gives the direct answer first.
  - After the launch chunk, continue with brief follow-up sentences only if needed.
  - Keep sentence length short for smooth speech chunking.
  - Avoid long lists unless asked.
  - Avoid unnecessary prefaces.
  `;
    const strictMathRules = strictMathMode
        ? `
  STRICT MATH COACH MODE:
  - Never jump to a final numeric answer.
  - If the student asks for the final answer directly, refuse politely and continue with a checkpoint question tied to their expression.
  - Teach one tiny step at a time and ask one check question before moving on.
  - Do not repeat the same sentence pattern; vary wording while keeping the same learning goal.
  - Never assume prior knowledge; state the basic rule before applying it.
  - Keep notation plain-text and child-friendly.
  - Use only realistic examples for quantities and sharing; do not use impossible objects for partitioning.
  `
        : '';
    const foundationalTheoryRules = conceptualMicroPacingMode
        ? `
  FOUNDATION-FIRST TEACHING MODE:
  - For conceptual/theory tutoring turns, teach one concept at a time.
  - Give one core idea only (max 2 short explanation sentences), then ask one comprehension check question.
  - Do not dump the whole topic in one turn.
  - Do not use "Step one/Step two" labels for theory introductions.
  - Wait for student confirmation before introducing the next concept.
  - Prefer plain point-form clarity for theory when listing is needed, never procedural step labels.
  `
        : '';
    const sexualityScopeRules = sexualityPolicy.detectedTopic
        ? sexualityPolicy.highSchool
            ? `
  SEXUALITY SCOPE LOCK:
  - Allowed only: reproduction and menstruation, plus sperm cell basics for high school.
  - Do not discuss intercourse, contraception, sexual orientation, relationships, or explicit sexual behavior.
  - Keep wording strictly educational, school-safe, and biology-focused.
  `
            : `
  SEXUALITY SCOPE LOCK:
  - Allowed only: reproduction and menstruation.
  - Do not discuss sperm cell content at this level.
  - Do not discuss intercourse, contraception, sexual orientation, relationships, or explicit sexual behavior.
  - Keep wording strictly educational, school-safe, and biology-focused.
  `
        : '';
    const latestArtifactContext = findLatestTutorArtifacts(input.chatHistory);
    const artifactReasoningContext = buildArtifactReasoningContext(latestArtifactContext);
    const masteryPolicy = buildMasteryPolicyContext({
        memory: input.memory,
        activeTopic: stableStudyTopic || resolvedContextTopic || updatedState.lastStudyTopic || updatedState.lastTopic,
    });
    const shouldUseIslamicPedagogy = isIslamicStudyContext(
        input.text,
        stableStudyTopic,
        resolvedContextTopic,
        updatedState.lastAttachmentContextSummary,
        artifactReasoningContext
    );
    const islamicPedagogy = shouldUseIslamicPedagogy
        ? await quran_pedagogy({
            query: input.text,
            topic: stableStudyTopic || resolvedContextTopic || updatedState.lastStudyTopic || updatedState.lastTopic,
            gradeLevel: input.studentProfile?.gradeLevel,
        })
        : null;
    const islamicPedagogyRules = shouldUseIslamicPedagogy
        ? [
            'ISLAMIC PEDAGOGY MODE:',
            String(islamicPedagogy?.message || 'Teach respectfully, educationally, and with care.'),
            String(islamicPedagogy?.scholarCaution || ''),
            String((islamicPedagogy as any)?.scholarlyMethod || ''),
            String(islamicPedagogy?.ageSafeTone || ''),
            Array.isArray((islamicPedagogy as any)?.evidenceReferences) && (islamicPedagogy as any).evidenceReferences.length > 0
                ? `Preferred evidence anchors: ${(islamicPedagogy as any).evidenceReferences.join(' | ')}`
                : '',
            '- If exact wording of a verse or hadith is uncertain, paraphrase carefully instead of inventing a quotation.',
            '- Distinguish clearly between direct evidence, common explanation, and matters where scholars may differ.',
            '- Keep tone Muslim-school appropriate, gentle, and age-aware.',
        ].filter(Boolean).join('\n')
        : '';
    const effectiveSystemMessage = [
        systemMessage,
        sessionLanguageDirective,
        metacognitiveDirective,
        workspaceContextDirective,
        steadfastConstitutionLayer,
        deliveryRefinementLayer,
        adaptiveDeliveryLayer,
        focusModeRules,
        examModeRules,
        hybridModeRules,
        researchModeRules,
        researchHybridRules,
        masterOrchestrationLayer,
        isVoiceRealtime ? voiceLatencyRules : '',
        strictMathRules,
        foundationalTheoryRules,
        sexualityScopeRules,
        islamicPedagogyRules,
    ]
        .filter(Boolean)
        .join('\n');
    const modelHistory = isVoiceRealtime ? input.chatHistory.slice(-8) : input.chatHistory.slice(-16);
    const persistentConversationContext = buildPersistentConversationContext({
        state: updatedState,
        chatHistory: input.chatHistory,
        currentUserText: input.text,
        tutorState: input.tutorState,
    });
    const learnerMemoryContext = buildLearnerMemoryContext(input.memory);
    const masteryPolicyContext = masteryPolicy.context;
    let videoTranscriptContext = '';
    if (isCurrentVideoFollowUp && latestVideoContext?.id) {
        if (input.tutorState?.activeVideoId === latestVideoContext.id && input.tutorState?.activeVideoSummary) {
            videoTranscriptContext = [
                `Current video already in conversation: "${latestVideoContext.title || 'Suggested video'}".`,
                `Use this as the active video context instead of searching for a new video.`,
                `Cached summary: ${input.tutorState.activeVideoSummary}`,
                Array.isArray(input.tutorState.activeVideoConcepts) && input.tutorState.activeVideoConcepts.length > 0
                    ? `Known concepts: ${input.tutorState.activeVideoConcepts.join(', ')}`
                    : '',
            ].filter(Boolean).join('\n');
        } else {
            try {
                const transcript = await runFlow(getYoutubeTranscriptFlow, { videoId: latestVideoContext.id });
                if (typeof transcript === 'string' && transcript.trim() && !transcript.startsWith('Could not')) {
                    const safeTranscript = transcript.length > 12000 ? `${transcript.slice(0, 12000)}...` : transcript;
                    videoTranscriptContext = [
                        `Current video already in conversation: "${latestVideoContext.title || 'Suggested video'}".`,
                        `Use this as the active video context instead of searching for a new video.`,
                        `Transcript excerpt:\n${safeTranscript}`
                    ].join('\n');
                } else {
                    videoTranscriptContext = `Current video already in conversation: "${latestVideoContext.title || 'Suggested video'}". Answer about this existing video instead of searching for a new one.`;
                }
            } catch {
                videoTranscriptContext = `Current video already in conversation: "${latestVideoContext.title || 'Suggested video'}". Answer about this existing video instead of searching for a new one.`;
            }
        }
    }
    const workspaceContextSummary = input.workspaceContext
        ? [
            `Workspace destination: ${input.workspaceContext.activeDestination || 'new_session'}.`,
            `Workspace study mode: ${workspaceStudyModeLabel}.`,
            workspaceResearchMode ? 'Research was intentionally requested from the workspace shell.' : '',
          ].filter(Boolean).join('\n')
        : '';
    const currentUserMessageText = persistentConversationContext
        ? [
            persistentConversationContext,
            learnerMemoryContext,
            masteryPolicyContext,
            artifactReasoningContext,
            videoTranscriptContext,
            workspaceContextSummary,
            '',
            `Student message:\n${input.text}`
        ].filter(Boolean).join('\n')
        : [
            learnerMemoryContext,
            masteryPolicyContext,
            artifactReasoningContext,
            videoTranscriptContext,
            workspaceContextSummary,
            input.text
        ].filter(Boolean).join('\n\n');

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: effectiveSystemMessage },
        ...modelHistory.map(msg => ({
            role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: buildHistoryMessageContent(msg)
        })),
        { role: 'user', content: currentUserMessageText },
    ];

    const providedAttachments = Array.isArray(input.fileData)
        ? input.fileData.filter(Boolean)
        : input.fileData
            ? [input.fileData]
            : [];
    const inferredAttachmentContext =
        providedAttachments.length === 0
            ? findLatestPersistedAttachments(input.chatHistory)
            : null;
    hydrateAttachmentStateFromHistory({
        state: updatedState,
        inferredContext: inferredAttachmentContext,
    });
    const attachments = providedAttachments.length > 0
        ? providedAttachments
        : shouldReusePriorAttachmentContext(input.text)
            ? inferredAttachmentContext?.attachments || []
            : [];

    if (attachments.length > 0) {
        const lastMsgIndex = messages.length - 1;
        if (messages[lastMsgIndex].role === 'user') {
            const attachmentSummaries: string[] = [];
            const imageParts: any[] = [];
            const attachmentLabels: string[] = [];

            for (const attachment of attachments as any[]) {
                if (attachment?.kind === 'text') {
                    const textFile = attachment as { text: string; fileName?: string; truncated?: boolean };
                    attachmentLabels.push(textFile.fileName ? `text file "${textFile.fileName}"` : 'text document');
                    attachmentSummaries.push(buildAttachmentPromptSummary({
                        kind: 'text',
                        fileName: textFile.fileName,
                        extractedText: String(textFile.text || ''),
                        truncated: Boolean(textFile.truncated),
                    }));
                    continue;
                }

                if (attachment?.kind === 'pdf') {
                    const pdfFile = attachment as { base64: string; fileName?: string };
                    attachmentLabels.push(pdfFile.fileName ? `PDF "${pdfFile.fileName}"` : 'PDF document');
                    const extracted = await extractTextFromPdfWithOcrFallback(pdfFile.base64);
                    attachmentSummaries.push(buildAttachmentPromptSummary({
                        kind: 'pdf',
                        fileName: pdfFile.fileName,
                        extractedText: extracted.text || undefined,
                        truncated: extracted.truncated,
                        note: extracted.text
                            ? extracted.usedOcr
                                ? 'OCR fallback was used because this PDF appears image-heavy or scanned.'
                                : undefined
                            : 'Could not reliably extract text from this PDF. It may be scanned or protected.',
                    }));
                    continue;
                }

                const imageFile = attachment as { base64: string; type?: string; mimeType?: string; fileName?: string };
                const mimeType = String(imageFile.mimeType || imageFile.type || 'image/jpeg');
                attachmentLabels.push(imageFile.fileName ? `image "${imageFile.fileName}"` : 'uploaded image');
                const shouldRunOcrAssist = isLikelyDenseTextRequest(
                    input.text,
                    imageFile.fileName,
                    mimeType,
                    isVoiceRealtime
                );
                let imageSummary = buildAttachmentPromptSummary({
                    kind: 'image',
                    fileName: imageFile.fileName,
                    note: 'Use visible labels, diagrams, and layout to answer.',
                });
                if (shouldRunOcrAssist) {
                    const ocrAssist = await runImageOcrAssist(imageFile.base64, mimeType);
                    if (ocrAssist?.dense && ocrAssist.extractedText) {
                        imageSummary = buildAttachmentPromptSummary({
                            kind: 'image',
                            fileName: imageFile.fileName,
                            extractedText: ocrAssist.extractedText,
                            confidence: ocrAssist.confidence,
                            dense: ocrAssist.dense,
                            note: 'Use OCR preview as the primary reference for written content and visual cues for diagrams.',
                        });
                    } else if (ocrAssist?.extractedText) {
                        imageSummary = buildAttachmentPromptSummary({
                            kind: 'image',
                            fileName: imageFile.fileName,
                            extractedText: ocrAssist.extractedText,
                            confidence: ocrAssist.confidence,
                            dense: ocrAssist.dense,
                            note: 'Only a light amount of readable text was detected. Use the image itself as the main source.',
                        });
                    }
                }

                attachmentSummaries.push(imageSummary);
                imageParts.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageFile.base64}` } });
            }

            updatedState.lastAttachmentLabels = attachmentLabels;
            updatedState.lastAttachmentContextSummary = buildAttachmentConversationContext({
                userText: input.text,
                attachmentSummaries,
                attachmentLabels,
            });

            const mergedText = [
                currentUserMessageText,
                inferredAttachmentContext
                    ? `Context: The student is referring to previously uploaded study material in this chat${inferredAttachmentContext.labels.length > 0 ? ` (${inferredAttachmentContext.labels.join(', ')})` : ''}. Use that material as the primary context for this reply.`
                    : '',
                '',
                ...attachmentSummaries.map((summary, index) =>
                    attachments.length > 1 ? `Attachment ${index + 1}\n${summary}` : summary
                ),
            ]
                .filter(Boolean)
                .join('\n\n')
                .trim();

            messages[lastMsgIndex] = imageParts.length > 0
                ? {
                    role: 'user',
                    content: [
                        { type: 'text', text: mergedText || input.text || 'Please analyze the attached files clearly.' },
                        ...imageParts,
                    ],
                }
                : { role: 'user', content: mergedText };
        }
    } else if (!turnTopic.explicitShift && updatedState.lastAttachmentContextSummary) {
        const lastMsgIndex = messages.length - 1;
        if (messages[lastMsgIndex].role === 'user' && typeof messages[lastMsgIndex].content === 'string') {
            messages[lastMsgIndex] = {
                role: 'user',
                content: [
                    messages[lastMsgIndex].content,
                    '',
                    `Active uploaded study material context: ${updatedState.lastAttachmentContextSummary}`,
                    'Use the uploaded study material as live context for this reply unless the student clearly changes topic.',
                ].filter(Boolean).join('\n'),
            };
        }
    }

    const hasImageAttachment = attachments.some((attachment: any) => {
        const kind = String(attachment?.kind || 'image').toLowerCase();
        return kind !== 'text' && kind !== 'pdf';
    });
    const shouldUseAttachmentFastPath = attachments.length > 0 && !Boolean(input.forceWebSearch);

    // ==============================================================================
    // 5. TOOLS & EXECUTION
    // ==============================================================================
    const allTools = [
        { type: 'function' as const, function: { name: 'ask_practice_question', description: 'Ask validation question.', parameters: { type: 'object' as const, properties: { question: { type: 'string' }, correctAnswers: { type: 'array' as const, items: { type: 'string' as const } }, topic: { type: 'string' } }, required: ['question', 'correctAnswers', 'topic'] } } },
        { type: 'function' as const, function: { name: 'youtube_search', description: 'Search educational video.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } } },
        { type: 'function' as const, function: { name: 'get_youtube_transcript', description: "Fetch transcript.", parameters: { type: 'object' as const, properties: { videoId: { type: 'string' } }, required: ['videoId'] } } },
    ];
    const lowerInputText = input.text.toLowerCase();
    const hasExplicitPracticeIntent = turnPlan.wantsPractice || /\b(test me|quiz|practice|question me)\b/.test(lowerInputText);
    const hasExplicitVideoIntent = turnPlan.wantsVideo || /\b(video|youtube|watch|transcript)\b/.test(lowerInputText);
    const tools = allTools.filter((tool) => {
        const name = tool.function.name;
        if (name === 'ask_practice_question') return hasExplicitPracticeIntent;
        if (name === 'youtube_search' || name === 'get_youtube_transcript') {
            if (isCurrentVideoFollowUp) {
                return name === 'get_youtube_transcript';
            }
            return hasExplicitVideoIntent || Boolean(input.forceWebSearch);
        }
        return false;
    });

    console.log('[BRAIN] Querying AI Completion' + (input.onToken ? ' (STREAMING)' : '') + '...');

    // Part 1: Strict Streaming Path
    if (input.onToken && !hasImageAttachment) {
        const streamingRequest: any = {
            messages: messages,
            model: 'gpt-4o-mini',
            temperature: isVoiceRealtime ? 0.28 : 0.65,
            max_tokens: isVoiceRealtime ? 180 : 700,
            stream: true,
        };
        if (tools.length > 0) {
            streamingRequest.tools = tools;
            streamingRequest.tool_choice = 'auto';
        }
        const completion: any = await openai.chat.completions.create(streamingRequest);

        let fullText = '';
        let toolCallDetected = false;
        let stoppedByLength = false;
        const bufferUntilFinal = languageMode === 'arabic_english';

        for await (const chunk of completion) {
            const choice = chunk.choices[0];
            const delta = choice?.delta;
            const content = delta?.content || "";
            if (choice?.finish_reason === 'length') {
                stoppedByLength = true;
            }

            if (delta?.tool_calls) {
                toolCallDetected = true;
                break; // Switch to tool handling path
            }

            if (content) {
                fullText += content;
                if (!bufferUntilFinal) {
                    input.onToken(content);
                }
            }
        }

        if (!toolCallDetected) {
            let completedText = fullText;
            if (shouldAttemptCompletionRepair(completedText, isVoiceRealtime, stoppedByLength)) {
                completedText = await ensureCompleteResponse(messages, completedText, isVoiceRealtime);
            }

            const completeFinalText = await finalizeAssistantResponseText({
                text: completedText,
                languageMode,
                userInput: input.text,
                topic: updatedState.lastStudyTopic || updatedState.lastTopic,
                strictMathMode,
                isVoiceRealtime,
                messagesForCompletion: messages,
                sanitize: true,
                conceptualMicroPacingMode,
                conceptualTopic: updatedState.conceptualTopic
            });
            updatedState.lastAssistantMessage = completeFinalText;

            if (!bufferUntilFinal && completeFinalText.length > fullText.length) {
                const appended = completeFinalText.slice(fullText.length);
                if (appended.trim().length > 0) {
                    input.onToken?.(appended);
                }
            }

            if (bufferUntilFinal) {
                emitChunkedText(completeFinalText, input.onToken);
            }

            const secondaryVideo = await maybeBuildSecondaryVideoRecommendation({
                enabled: turnPlan.secondaryAction === 'video_lookup' && !videoData,
                query: input.text,
                stableTopic: stableStudyTopic || resolvedContextTopic || updatedState.lastStudyTopic || updatedState.lastTopic || input.text,
                chatHistory: input.chatHistory,
                currentVideoId: latestVideoContext?.id,
            });
            let finalStreamingText = completeFinalText;
            if (secondaryVideo.textSuffix) {
                finalStreamingText = `${completeFinalText}\n\n${secondaryVideo.textSuffix}`.trim();
                if (bufferUntilFinal) {
                    emitChunkedText(secondaryVideo.textSuffix, input.onToken);
                } else {
                    input.onToken?.(`\n\n${secondaryVideo.textSuffix}`);
                }
            }
            if (secondaryVideo.videoData) {
                videoData = secondaryVideo.videoData;
            }
            if (secondaryVideo.lastSuggestedVideo) {
                updatedState.lastSuggestedVideo = secondaryVideo.lastSuggestedVideo;
                updatedState.videoSuggested = true;
            }
            updatedState.lastAssistantMessage = finalStreamingText;

            return {
                processedText: finalStreamingText,
                videoData,
                state: updatedState,
                topic: updatedState.lastStudyTopic || updatedState.lastTopic || input.text,
                suggestedTitle
            };
        }
    }

    // Part 2: Non-Streaming Fallback (Tools or simple requests)
    const fallbackRequest: any = {
        messages,
        model: 'gpt-4o-mini',
        temperature: isVoiceRealtime ? 0.28 : 0.65,
        max_tokens: isVoiceRealtime ? 180 : 700,
        stream: false
    };
    if (tools.length > 0) {
        fallbackRequest.tools = tools;
        fallbackRequest.tool_choice = 'auto';
    }
    const completion = await openai.chat.completions.create(fallbackRequest);
    let modelLikelyTruncated = completion.choices?.[0]?.finish_reason === 'length';

    const responseMessage = completion.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        if (!('function' in toolCall)) {
            responseText = localizedText(
                languageMode,
                "Let's continue learning this topic together.",
                'Tuendelee kujifunza mada hii pamoja.',
                '\u0644\u0646\u0648\u0627\u0635\u0644 \u062a\u0639\u0644\u0645 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0645\u0639\u064b\u0627.'
            );
        } else {
            const functionName = toolCall.function.name;
            const args = parseToolArguments(toolCall.function.arguments);

        if (functionName === 'ask_practice_question') {
            const typedArgs = args as AskPracticeToolArgs;
            const normalizedAnswers = normalizeCorrectAnswers(typedArgs.correctAnswers);
            updatedState.awaitingPracticeQuestionAnswer = true;
            updatedState.activePracticeQuestion = String(typedArgs.question || buildFallbackPracticeQuestion(languageMode));
            updatedState.correctAnswers = normalizedAnswers;
            persistStableStudyTopic(updatedState, String(typedArgs.topic || stableStudyTopic || resolvedContextTopic || input.text));
            updatedState.validationAttemptCount = 0;
            responseText = buildPracticeChallengeReply(updatedState.activePracticeQuestion, languageMode);
        }

        else if (functionName === 'youtube_search') {
            try {
                const queryArg = buildContextAwareVideoQuery({
                    userText: String(args.query || input.text).trim(),
                    resolvedTopic: stableStudyTopic || resolvedContextTopic || updatedState.lastTopic || input.text,
                    state: updatedState,
                });
                const results = await runYoutubeSearchSafely(queryArg);

                if (results && results.length > 0) {
                    const video = results[0];
                    if (!video?.id) {
                        responseText = localizedText(
                            languageMode,
                            "Let's explore this topic directly together.",
                            'Tuichunguze mada hii moja kwa moja pamoja.',
                            '\u062f\u0639\u0646\u0627 \u0646\u0633\u062a\u0643\u0634\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639\u064b\u0627.'
                        );
                    } else {
                    const currentTopic = stableStudyTopic || resolvedContextTopic || updatedState.lastStudyTopic || updatedState.lastTopic || input.text;
                    const vidTitleLower = (video.title || "").toLowerCase();
                    const contextLower = currentTopic.toLowerCase();

                    // FUZZY MATCH
                    const stopWords = ['what', 'how', 'when', 'video', 'about'];
                    const keywords = contextLower.split(' ').filter(w => w.length > 3 && !stopWords.includes(w));
                    const isRelevant = keywords.some(k => vidTitleLower.includes(k)) || vidTitleLower.includes(contextLower);

                    if (isRelevant) {
                        const safeChannel = (video.channel || video.channelTitle || '').replace('Unknown Channel', '');
                        const safeTitle = video.title || 'Educational Video';
                        videoData = { id: video.id, title: safeTitle, channel: safeChannel, thumbnail: video.thumbnailUrl };
                        updatedState.videoSuggested = true;
                        persistStableStudyTopic(updatedState, currentTopic);
                        updatedState.lastSuggestedVideo = {
                            id: video.id,
                            title: safeTitle,
                            channel: safeChannel,
                            thumbnailUrl: video.thumbnailUrl,
                            videoId: video.id,
                        };

                        responseText = localizedText(
                            languageMode,
                            `I found a strong video for you: "${safeTitle}". I have attached it below so you can watch it here.`,
                            `Nimekupatia video nzuri: "${safeTitle}". Nimeiambatanisha hapa chini ili uione hapa.`,
                            `\u0648\u062c\u062f\u062a \u0644\u0643 \u0641\u064a\u062f\u064a\u0648 \u0645\u0646\u0627\u0633\u0628\u064b\u0627: "${safeTitle}". \u0623\u0631\u0641\u0642\u062a\u0647 \u0623\u062f\u0646\u0627\u0647 \u0644\u062a\u0634\u0627\u0647\u062f\u0647 \u0647\u0646\u0627.`
                        );
                    } else {
                        responseText = localizedText(
                            languageMode,
                            'Let me break this down step by step myself.',
                            'Ngoja nikuelezee hatua kwa hatua.',
                            '\u0633\u0623\u0634\u0631\u062d \u0644\u0643 \u0647\u0630\u0627 \u062e\u0637\u0648\u0629 \u0628\u062e\u0637\u0648\u0629.'
                        );
                    }
                    }
                } else {
                    responseText = localizedText(
                        languageMode,
                        "Let's explore this topic directly together.",
                        'Tuichunguze mada hii moja kwa moja pamoja.',
                        '\u062f\u0639\u0646\u0627 \u0646\u0633\u062a\u0643\u0634\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639\u064b\u0627.'
                    );
                }
            } catch {
                responseText = localizedText(
                    languageMode,
                    "Let's discuss this directly.",
                    'Tuijadili moja kwa moja.',
                    '\u0644\u0646\u0646\u0627\u0642\u0634 \u0647\u0630\u0627 \u0645\u0628\u0627\u0634\u0631\u0629.'
                );
            }
        }

        else if (functionName === 'get_youtube_transcript') {
            const videoId = String(args.videoId || '').trim();
            if (!videoId) {
                responseText = localizedText(
                    languageMode,
                    "Let's discuss the topic directly.",
                    'Tuijadili mada moja kwa moja.',
                    '\u0644\u0646\u0646\u0627\u0642\u0634 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0645\u0628\u0627\u0634\u0631\u0629.'
                );
            } else {
                const transcript = await runFlow(getYoutubeTranscriptFlow, { videoId });
                if (!transcript || transcript.startsWith('Could not')) {
                    responseText = localizedText(
                        languageMode,
                        "I can't access that transcript right now. Which exact part should I break down first?",
                        'Siwezi kupata transcript hiyo sasa. Ni sehemu gani hasa unataka nieleze kwanza?',
                        '\u0644\u0627 \u0623\u0633\u062a\u0637\u064a\u0639 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0641\u0631\u063a \u0627\u0644\u0622\u0646. \u0623\u064a \u062c\u0632\u0621 \u062a\u0631\u064a\u062f \u0623\u0646 \u0623\u0634\u0631\u062d\u0647 \u0623\u0648\u0644\u064b\u0627\u061f'
                    );
                } else {
                    const safeTranscript = transcript.length > 50000 ? transcript.substring(0, 50000) + "..." : transcript;
                    const newMessages: ChatCompletionMessageParam[] = [...messages, responseMessage, { role: 'tool', tool_call_id: toolCall.id, content: safeTranscript }];
                    const secondCompletion = await openai.chat.completions.create({
                        messages: newMessages,
                        model: 'gpt-4o-mini',
                        max_tokens: isVoiceRealtime ? 180 : 700
                    });
                    modelLikelyTruncated = modelLikelyTruncated || secondCompletion.choices?.[0]?.finish_reason === 'length';
                    responseText = secondCompletion.choices[0].message.content || localizedText(
                        languageMode,
                        'I reviewed the video. What would you like to focus on first?',
                        'Nimepitia video hiyo. Unataka tuanze na sehemu ipi?',
                        '\u0631\u0627\u062c\u0639\u062a \u0627\u0644\u0641\u064a\u062f\u064a\u0648. \u0645\u0627 \u0627\u0644\u062c\u0632\u0621 \u0627\u0644\u0630\u064a \u062a\u0631\u064a\u062f \u0623\u0646 \u0646\u0628\u062f\u0623 \u0628\u0647\u061f'
                    );
                }
            }
        }
        }
    } else {
        responseText = responseMessage.content || localizedText(
            languageMode,
            "I'm here to help. Tell me the part you want to focus on.",
            'Nipo hapa kusaidia. Ni sehemu gani unataka tuanze nayo?',
            '\u0623\u0646\u0627 \u0647\u0646\u0627 \u0644\u0644\u0645\u0633\u0627\u0639\u062f\u0629. \u0645\u0627 \u0627\u0644\u062c\u0632\u0621 \u0627\u0644\u0630\u064a \u062a\u0631\u064a\u062f \u0623\u0646 \u0646\u0628\u062f\u0623 \u0628\u0647\u061f'
        );
    }

    if (resolvedContextTopic && (!updatedState.lastTopic || turnTopic.explicitShift || !turnTopic.shouldReuseContext || VIDEO_INTENT_REGEX.test(input.text))) {
        persistStableStudyTopic(updatedState, stableStudyTopic || resolvedContextTopic);
    } else if (!updatedState.lastTopic && input.forceWebSearch) {
        persistStableStudyTopic(updatedState, stableStudyTopic || resolvedContextTopic || input.text);
    }

    let completedResponseText = responseText;
    if (shouldAttemptCompletionRepair(completedResponseText, isVoiceRealtime, modelLikelyTruncated)) {
        completedResponseText = await ensureCompleteResponse(messages, completedResponseText, isVoiceRealtime);
    }

    const completeFinalText = await finalizeAssistantResponseText({
        text: completedResponseText,
        languageMode,
        userInput: input.text,
        topic: updatedState.lastStudyTopic || updatedState.lastTopic,
        strictMathMode,
        isVoiceRealtime,
        messagesForCompletion: messages,
        sanitize: true,
        conceptualMicroPacingMode,
        conceptualTopic: updatedState.conceptualTopic
    });
    let finalTextWithSecondaryVideo = completeFinalText;

    const secondaryVideo = await maybeBuildSecondaryVideoRecommendation({
        enabled: turnPlan.secondaryAction === 'video_lookup' && !videoData?.id,
        query: input.text,
        stableTopic: stableStudyTopic || resolvedContextTopic || updatedState.lastStudyTopic || updatedState.lastTopic || input.text,
        chatHistory: input.chatHistory,
        currentVideoId: latestVideoContext?.id,
    });
    if (secondaryVideo.textSuffix) {
        finalTextWithSecondaryVideo = `${completeFinalText}\n\n${secondaryVideo.textSuffix}`.trim();
    }
    if (secondaryVideo.videoData) {
        videoData = secondaryVideo.videoData;
    }
    if (secondaryVideo.lastSuggestedVideo) {
        updatedState.lastSuggestedVideo = secondaryVideo.lastSuggestedVideo;
        updatedState.videoSuggested = true;
    }
    updatedState.lastAssistantMessage = finalTextWithSecondaryVideo;

    // Yield final sanitized tokens if they haven't been yielded already (tool-call or fallback paths)
    emitChunkedText(finalTextWithSecondaryVideo, input.onToken);

    return {
        processedText: finalTextWithSecondaryVideo,
        videoData,
        state: updatedState,
        topic: updatedState.lastStudyTopic || updatedState.lastTopic || input.text,
        suggestedTitle
    };
};
