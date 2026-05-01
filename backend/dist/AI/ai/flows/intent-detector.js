"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heuristicResearchIntent = heuristicResearchIntent;
exports.detectResearchIntent = detectResearchIntent;
exports.detectLearningTurnPlan = detectLearningTurnPlan;
const genkit_1 = require("../genkit");
const VALID_INTENTS = [
    'greeting',
    'clarification',
    'dialogue_continuation',
    'definition',
    'concept_explanation',
    'fact_lookup',
    'deep_research',
    'practice',
    'video_lookup',
    'off_topic',
    'artifact_followup',
    'video_followup',
    'source_request',
    'verification_request',
    'latest_info_request',
    'revision_request',
    'summarize_request',
    'compare_request',
    'hint_request',
];
const VALID_INTENT_SET = new Set(VALID_INTENTS);
const VALID_EVIDENCE_MODES = [
    'topic_context',
    'artifact_context',
    'video_context',
    'revision_context',
    'web_research',
    'source_verification',
];
const VALID_EVIDENCE_MODE_SET = new Set(VALID_EVIDENCE_MODES);
function normalizeIntentText(raw) {
    return raw.toLowerCase().replace(/[^a-z_]/g, ' ').replace(/\s+/g, ' ').trim().replace(/ /g, '_');
}
function isWebModeMetaQuery(query) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    if (/\b(web research mode|research mode)\b/.test(lower))
        return true;
    return (/\b(are you|did you|why are you|how are you|can you|will you)\b[^?.!]{0,120}\b(search|searching|look up|web|online|source|sources|citation|verify)\b/.test(lower) ||
        /\b(are you searching|did you search|why are you searching|did you look up)\b/.test(lower));
}
function hasExplicitNoWebSignal(query) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    return (/\b(no web|don't search|do not search|without searching|no internet|without internet|from your knowledge|from context only)\b/.test(lower) || /\bjust explain|no lookup|no research\b/.test(lower));
}
function hasRecentAssistantContext(turns) {
    return Array.isArray(turns)
        ? turns.some((turn) => turn?.role === 'assistant' && String(turn.content || '').trim().length > 0)
        : false;
}
function isLikelyFollowUpQuery(query, recentTurns) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    const words = lower.split(/\s+/).filter(Boolean);
    const hasAssistantContext = hasRecentAssistantContext(recentTurns);
    if (words.length > 28 && !hasAssistantContext)
        return false;
    return (/\b(this|that|it|those|these|above|earlier|previous|same|part|point|line|step|answer)\b/.test(lower) ||
        /\b(you said|your answer|that answer|this answer|explain that|explain this|continue from that)\b/.test(lower) ||
        /^(and|so|then|but|okay|ok|continue)\b/.test(lower) ||
        (hasAssistantContext &&
            /^(why|how|what do you mean|can you explain|explain again|break (it|that) down|summari[sz]e that|what about|which part)\b/.test(lower)));
}
function hasExplicitTopicShift(query) {
    return /\b(new topic|another topic|different topic|change topic|switch topic|unrelated|instead|let'?s talk about|move to)\b/i.test(query);
}
function wantsExplanation(query) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    return (/\b(explain|teach|help me understand|walk me through|analyse|analyze|review|break down|what does this mean)\b/.test(lower) || /\b(why|how does|how do)\b/.test(lower));
}
function wantsSummary(query) {
    return /\b(summarise|summarize|give me a summary|short recap|recap)\b/i.test(query);
}
function wantsCompare(query) {
    return /\b(compare|difference between|versus|vs\b|how is .* different)\b/i.test(query);
}
function wantsHint(query) {
    return /\b(hint|small hint|nudge|clue)\b/i.test(query);
}
function wantsPractice(query) {
    return /\b(test me|quiz|practice|question me|give me a question|checkpoint|similar question)\b/i.test(query);
}
function wantsVideo(query) {
    return /\b(video|youtube|watch|transcript|clip|lesson video)\b/i.test(query);
}
function wantsSources(query) {
    return /\b(source|sources|citation|citations|cite|references|reference links?)\b/i.test(query);
}
function wantsVerification(query) {
    return /\b(verify|verification|fact check|is this true|is that true|is this correct|check if this is correct|confirm)\b/i.test(query);
}
function wantsLatestInfo(query) {
    return /\b(latest|current|today|recent|updated|update|news|this week|this month|this year|now)\b/i.test(query);
}
function wantsExplicitResearch(query, forceWebSearch) {
    if (forceWebSearch)
        return true;
    return /\b(research|look up|search online|search the web|use the web|browse online|find reliable sources)\b/i.test(query);
}
function isCurrentVideoFollowUp(query) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    if (!/\b(video|youtube|watch|transcript|clip)\b/.test(lower))
        return false;
    return /\b(content|contents|about|summary|summari[sz]e|explain|cover|covers|teach|what is in|what's in|what does the video say|that part)\b/.test(lower);
}
function isCurrentFileFollowUp(query) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    return /\b(file|image|document|pdf|attachment|attached|uploaded|poster|design|page|worksheet|notes|diagram|graph|table)\b/.test(lower);
}
function isRevisionFollowUp(query) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    return /\b(revision|saved note|saved item|saved card|this note|this revision item|revise this|quiz me on this saved)\b/.test(lower);
}
function isDialogueContinuation(query) {
    return /^(yes|ok|okay|sure|continue|go on|next|understood|i understand|got it)\b/i.test(query);
}
function isGreeting(query) {
    return /^(hi|hello|hey|jambo|good morning|good afternoon|good evening)\b/i.test(query);
}
function isDefinitionRequest(query) {
    return /\b(what is|define|definition of)\b/i.test(query);
}
function inferTopicStability(query, lastTopic) {
    const sample = `${lastTopic || ''} ${query}`.toLowerCase();
    if (/\b(latest|current|today|recent|updated|news|breaking|price|stock|rate|exchange rate|inflation|election|president|prime minister|ceo|version|release|live|currently)\b/.test(sample) || /\b(202[4-9]|203[0-9])\b/.test(sample)) {
        return 'time_sensitive';
    }
    if (/\b(policy|regulation|rules|guideline|medical advice|health recommendation|admissions|application deadline|technology|software|library|framework)\b/.test(sample)) {
        return 'semi_stable';
    }
    return 'stable';
}
function coercePrimaryAction(raw) {
    const normalized = normalizeIntentText(raw);
    if (normalized.includes('current_video'))
        return 'current_video';
    if (normalized.includes('video_lookup') || normalized === 'video')
        return 'video_lookup';
    if (normalized.includes('practice'))
        return 'practice';
    if (normalized.includes('research') || normalized.includes('lookup'))
        return 'research';
    if (normalized.includes('greeting'))
        return 'greeting';
    if (normalized.includes('explain') ||
        normalized.includes('summary') ||
        normalized.includes('compare')) {
        return 'explanation';
    }
    return 'clarification';
}
function coerceSecondaryAction(raw) {
    const normalized = normalizeIntentText(raw || '');
    if (!normalized)
        return undefined;
    if (normalized.includes('video'))
        return 'video_lookup';
    if (normalized.includes('practice'))
        return 'practice';
    if (normalized.includes('research') || normalized.includes('lookup'))
        return 'research';
    return undefined;
}
function coerceEvidenceMode(raw, fallback) {
    const normalized = normalizeIntentText(raw);
    return VALID_EVIDENCE_MODE_SET.has(normalized) ? normalized : fallback;
}
function coerceIntent(raw, query, lastTopic) {
    const normalized = normalizeIntentText(raw);
    if (VALID_INTENT_SET.has(normalized)) {
        return normalized;
    }
    for (const intent of VALID_INTENTS) {
        if (normalized.includes(intent)) {
            return intent;
        }
    }
    return heuristicResearchIntent(query, lastTopic);
}
function resolveContextTarget(query, activeTopic, likelyFollowUp, options) {
    if (options?.hasVideoContext && isCurrentVideoFollowUp(query)) {
        return 'video';
    }
    if (options?.hasAttachmentContext && isCurrentFileFollowUp(query)) {
        return 'file';
    }
    if (options?.hasRevisionContext && isRevisionFollowUp(query)) {
        return 'revision';
    }
    if (activeTopic && likelyFollowUp) {
        return 'topic';
    }
    return 'none';
}
function isResearchWorthwhile(query, contextTarget, likelyFollowUp) {
    const lower = query.trim().toLowerCase();
    if (!lower)
        return false;
    if (hasExplicitNoWebSignal(lower) || isWebModeMetaQuery(lower))
        return false;
    if (contextTarget !== 'none' && likelyFollowUp)
        return false;
    if (/^(why|how|what do you mean|can you explain|explain again|break it down|summari[sz]e that|what about this line|quiz me|similar question)\b/.test(lower)) {
        return false;
    }
    return true;
}
function buildHeuristicTurnPlan(query, lastTopic, options) {
    const lower = query.trim().toLowerCase();
    const activeTopic = String(lastTopic || '').trim();
    const likelyFollowUp = isLikelyFollowUpQuery(lower, options?.recentTurns);
    const explicitTopicShift = hasExplicitTopicShift(lower);
    const explanation = wantsExplanation(lower);
    const summary = wantsSummary(lower);
    const compare = wantsCompare(lower);
    const hint = wantsHint(lower);
    const practice = wantsPractice(lower);
    const video = wantsVideo(lower);
    const sources = wantsSources(lower);
    const verification = wantsVerification(lower);
    const latestInfo = wantsLatestInfo(lower);
    const explicitResearch = wantsExplicitResearch(lower, options?.forceWebSearch);
    const noWeb = hasExplicitNoWebSignal(lower);
    const metaMode = isWebModeMetaQuery(lower);
    const topicStability = inferTopicStability(lower, activeTopic);
    const currentContextTarget = explicitTopicShift
        ? 'none'
        : resolveContextTarget(lower, activeTopic, likelyFollowUp, options);
    let evidenceMode = currentContextTarget === 'video'
        ? 'video_context'
        : currentContextTarget === 'file'
            ? 'artifact_context'
            : currentContextTarget === 'revision'
                ? 'revision_context'
                : 'topic_context';
    let researchRequired = false;
    let researchReason = 'context_first';
    if (noWeb) {
        researchRequired = false;
        researchReason = 'explicit_no_web_request';
    }
    else if (metaMode) {
        researchRequired = false;
        researchReason = 'meta_mode_question';
    }
    else if (currentContextTarget !== 'none' &&
        !explicitTopicShift &&
        !latestInfo &&
        !verification &&
        !(sources && explicitResearch)) {
        researchRequired = false;
        researchReason = 'context_anchor';
    }
    else if ((verification || sources) && isResearchWorthwhile(lower, currentContextTarget, likelyFollowUp)) {
        researchRequired = true;
        researchReason = 'source_or_verification_request';
        evidenceMode = 'source_verification';
    }
    else if ((latestInfo || topicStability === 'time_sensitive') &&
        isResearchWorthwhile(lower, currentContextTarget, likelyFollowUp)) {
        researchRequired = true;
        researchReason = 'time_sensitive_topic';
        evidenceMode = 'web_research';
    }
    else if (explicitResearch &&
        isResearchWorthwhile(lower, currentContextTarget, likelyFollowUp)) {
        researchRequired = true;
        researchReason = options?.forceWebSearch ? 'guided_web_mode' : 'explicit_research_request';
        evidenceMode = sources || verification ? 'source_verification' : 'web_research';
    }
    let intent = 'clarification';
    let primaryAction = 'clarification';
    let secondaryAction;
    let intentConfidence = 0.72;
    if (isGreeting(lower)) {
        intent = 'greeting';
        primaryAction = 'greeting';
        intentConfidence = 0.98;
    }
    else if (currentContextTarget === 'video') {
        intent = 'video_followup';
        primaryAction = 'current_video';
        intentConfidence = 0.92;
    }
    else if (practice && video) {
        intent = 'practice';
        primaryAction = 'practice';
        secondaryAction = 'video_lookup';
        intentConfidence = 0.9;
    }
    else if (practice) {
        intent = 'practice';
        primaryAction = 'practice';
        intentConfidence = 0.94;
    }
    else if (video) {
        intent = 'video_lookup';
        primaryAction = 'video_lookup';
        intentConfidence = 0.9;
    }
    else if (verification) {
        intent = 'verification_request';
        primaryAction = researchRequired ? 'research' : 'clarification';
        intentConfidence = 0.92;
    }
    else if (sources) {
        intent = 'source_request';
        primaryAction = researchRequired ? 'research' : 'clarification';
        intentConfidence = 0.9;
    }
    else if (latestInfo) {
        intent = 'latest_info_request';
        primaryAction = researchRequired ? 'research' : 'clarification';
        intentConfidence = 0.9;
    }
    else if (summary) {
        intent = currentContextTarget === 'none' ? 'summarize_request' : 'clarification';
        primaryAction = 'explanation';
        intentConfidence = 0.84;
    }
    else if (compare) {
        intent = 'compare_request';
        primaryAction = 'explanation';
        intentConfidence = 0.84;
    }
    else if (hint) {
        intent = 'hint_request';
        primaryAction = 'clarification';
        intentConfidence = 0.84;
    }
    else if (currentContextTarget === 'file') {
        intent = 'artifact_followup';
        primaryAction = explanation ? 'explanation' : 'clarification';
        intentConfidence = 0.9;
    }
    else if (currentContextTarget === 'revision') {
        intent = 'revision_request';
        primaryAction = explanation ? 'explanation' : 'clarification';
        intentConfidence = 0.86;
    }
    else if (isDialogueContinuation(lower)) {
        intent = 'dialogue_continuation';
        primaryAction = 'clarification';
        intentConfidence = 0.95;
    }
    else if (isDefinitionRequest(lower)) {
        intent = activeTopic && likelyFollowUp ? 'clarification' : 'definition';
        primaryAction = activeTopic && likelyFollowUp ? 'clarification' : 'explanation';
        intentConfidence = 0.8;
    }
    else if (explanation || likelyFollowUp) {
        intent = activeTopic || currentContextTarget !== 'none' ? 'clarification' : 'concept_explanation';
        primaryAction = 'explanation';
        intentConfidence = likelyFollowUp ? 0.86 : 0.78;
    }
    else if (researchRequired) {
        intent = activeTopic ? 'fact_lookup' : 'deep_research';
        primaryAction = 'research';
        intentConfidence = 0.78;
    }
    if (primaryAction !== 'video_lookup' && primaryAction !== 'practice' && video) {
        secondaryAction = 'video_lookup';
    }
    if (primaryAction !== 'research' && researchRequired) {
        secondaryAction = 'research';
    }
    return {
        intent,
        primaryAction,
        secondaryAction,
        explicitTopicShift,
        likelyFollowUp,
        wantsExplanation: explanation || summary || compare,
        wantsPractice: practice,
        wantsVideo: video,
        wantsWebResearch: explicitResearch || latestInfo || sources || verification,
        wantsSources: sources,
        wantsVerification: verification,
        wantsLatestInfo: latestInfo,
        currentContextTarget,
        contextAnchor: currentContextTarget,
        evidenceMode,
        researchRequired,
        researchReason,
        topicStability,
        intentConfidence,
    };
}
function heuristicResearchIntent(query, lastTopic) {
    return buildHeuristicTurnPlan(query, lastTopic).intent;
}
async function detectResearchIntent(query, lastTopic) {
    const heuristicPlan = buildHeuristicTurnPlan(query, lastTopic);
    if (heuristicPlan.intentConfidence >= 0.84 ||
        heuristicPlan.currentContextTarget !== 'none' ||
        heuristicPlan.researchRequired) {
        return heuristicPlan.intent;
    }
    const prompt = `
Classify the student's latest turn using ONLY one of these labels:
${VALID_INTENTS.join(', ')}

Student input: "${query}"
Active topic: "${lastTopic || 'none'}"

Rules:
- Follow-up on current topic, current file, revision item, or current video should not become new research.
- "latest/current/today" only becomes latest_info_request if the learner is asking for time-sensitive facts.
- Asking for sources or verification should use source_request or verification_request.
- Normal "explain again", "why", "how", "summarize that", and "break it down" are clarification or concept_explanation, not research.

Return strict JSON only:
{"intent":"one_label"}
`;
    try {
        const response = await genkit_1.ai.generate({
            model: 'openai/gpt-4o-mini',
            prompt,
            output: { format: 'json' },
        });
        const modelIntent = response.output?.intent;
        if (typeof modelIntent === 'string') {
            return coerceIntent(modelIntent, query, lastTopic);
        }
        return coerceIntent(response.text || '', query, lastTopic);
    }
    catch {
        return heuristicPlan.intent;
    }
}
async function detectLearningTurnPlan(query, lastTopic, options) {
    const heuristicPlan = buildHeuristicTurnPlan(query, lastTopic, options);
    const lower = query.trim().toLowerCase();
    const mixedIntent = heuristicPlan.wantsExplanation &&
        (heuristicPlan.wantsVideo || heuristicPlan.wantsWebResearch || heuristicPlan.wantsPractice);
    if (heuristicPlan.intentConfidence >= 0.86 ||
        heuristicPlan.primaryAction === 'greeting' ||
        heuristicPlan.primaryAction === 'current_video' ||
        (heuristicPlan.currentContextTarget !== 'none' && !mixedIntent) ||
        lower.length < 14) {
        return heuristicPlan;
    }
    const prompt = `
Analyze the student's latest turn and build a tutoring action plan.

Student input: "${query}"
Active topic: "${lastTopic || 'none'}"
Has current video context: ${options?.hasVideoContext ? 'yes' : 'no'}
Has current file context: ${options?.hasAttachmentContext ? 'yes' : 'no'}
Has current revision context: ${options?.hasRevisionContext ? 'yes' : 'no'}
Forced web mode: ${options?.forceWebSearch ? 'yes' : 'no'}
Recent turns:
${(options?.recentTurns || [])
        .slice(-6)
        .map((turn) => `- ${turn.role || 'unknown'}: ${String(turn.content || '').slice(0, 180)}`)
        .join('\n') || '- none'}

Return strict JSON only:
{
  "intent": "${VALID_INTENTS.join('" | "')}",
  "primaryAction": "greeting | clarification | explanation | practice | research | video_lookup | current_video",
  "secondaryAction": "practice | research | video_lookup | none",
  "explicitTopicShift": false,
  "likelyFollowUp": false,
  "wantsExplanation": true,
  "wantsPractice": false,
  "wantsVideo": false,
  "wantsWebResearch": false,
  "wantsSources": false,
  "wantsVerification": false,
  "wantsLatestInfo": false,
  "currentContextTarget": "video | file | topic | revision | none",
  "evidenceMode": "topic_context | artifact_context | video_context | revision_context | web_research | source_verification",
  "researchRequired": false,
  "researchReason": "context_first | context_anchor | explicit_research_request | source_or_verification_request | time_sensitive_topic | guided_web_mode | explicit_no_web_request | meta_mode_question",
  "topicStability": "stable | semi_stable | time_sensitive",
  "intentConfidence": 0.85
}

Rules:
- Resolve current context first: active topic, current file, current video, or revision context.
- Normal follow-ups like "explain again", "why", "how", "summarize that", and "break it down" stay in context.
- Only set researchRequired=true when current context is insufficient and a web-backed answer materially improves truth, recency, or verification.
- Latest/current/source-backed verification requests can require web research.
- A vague keyword alone does not justify research if the student is clearly continuing the current lesson.
`;
    try {
        const response = await genkit_1.ai.generate({
            model: 'openai/gpt-4o-mini',
            prompt,
            output: { format: 'json' },
        });
        const output = response.output || {};
        const intent = typeof output.intent === 'string'
            ? coerceIntent(output.intent, query, lastTopic)
            : heuristicPlan.intent;
        const primaryAction = typeof output.primaryAction === 'string'
            ? coercePrimaryAction(output.primaryAction)
            : heuristicPlan.primaryAction;
        const secondaryAction = typeof output.secondaryAction === 'string' && output.secondaryAction.toLowerCase() !== 'none'
            ? coerceSecondaryAction(output.secondaryAction)
            : heuristicPlan.secondaryAction;
        const currentContextTarget = output.currentContextTarget === 'video' ||
            output.currentContextTarget === 'file' ||
            output.currentContextTarget === 'topic' ||
            output.currentContextTarget === 'revision' ||
            output.currentContextTarget === 'none'
            ? output.currentContextTarget
            : heuristicPlan.currentContextTarget;
        const evidenceMode = typeof output.evidenceMode === 'string'
            ? coerceEvidenceMode(output.evidenceMode, heuristicPlan.evidenceMode)
            : heuristicPlan.evidenceMode;
        const topicStability = output.topicStability === 'stable' ||
            output.topicStability === 'semi_stable' ||
            output.topicStability === 'time_sensitive'
            ? output.topicStability
            : heuristicPlan.topicStability;
        const researchReason = output.researchReason === 'context_first' ||
            output.researchReason === 'context_anchor' ||
            output.researchReason === 'explicit_research_request' ||
            output.researchReason === 'source_or_verification_request' ||
            output.researchReason === 'time_sensitive_topic' ||
            output.researchReason === 'guided_web_mode' ||
            output.researchReason === 'explicit_no_web_request' ||
            output.researchReason === 'meta_mode_question'
            ? output.researchReason
            : heuristicPlan.researchReason;
        const intentConfidence = Math.max(0, Math.min(1, typeof output.intentConfidence === 'number'
            ? output.intentConfidence
            : heuristicPlan.intentConfidence));
        return {
            intent,
            primaryAction,
            secondaryAction,
            explicitTopicShift: typeof output.explicitTopicShift === 'boolean'
                ? output.explicitTopicShift
                : heuristicPlan.explicitTopicShift,
            likelyFollowUp: typeof output.likelyFollowUp === 'boolean'
                ? output.likelyFollowUp
                : heuristicPlan.likelyFollowUp,
            wantsExplanation: typeof output.wantsExplanation === 'boolean'
                ? output.wantsExplanation
                : heuristicPlan.wantsExplanation,
            wantsPractice: typeof output.wantsPractice === 'boolean'
                ? output.wantsPractice
                : heuristicPlan.wantsPractice,
            wantsVideo: typeof output.wantsVideo === 'boolean' ? output.wantsVideo : heuristicPlan.wantsVideo,
            wantsWebResearch: typeof output.wantsWebResearch === 'boolean'
                ? output.wantsWebResearch
                : heuristicPlan.wantsWebResearch,
            wantsSources: typeof output.wantsSources === 'boolean' ? output.wantsSources : heuristicPlan.wantsSources,
            wantsVerification: typeof output.wantsVerification === 'boolean'
                ? output.wantsVerification
                : heuristicPlan.wantsVerification,
            wantsLatestInfo: typeof output.wantsLatestInfo === 'boolean'
                ? output.wantsLatestInfo
                : heuristicPlan.wantsLatestInfo,
            currentContextTarget,
            contextAnchor: currentContextTarget,
            evidenceMode,
            researchRequired: typeof output.researchRequired === 'boolean'
                ? output.researchRequired
                : heuristicPlan.researchRequired,
            researchReason,
            topicStability,
            intentConfidence,
        };
    }
    catch {
        return heuristicPlan;
    }
}
//# sourceMappingURL=intent-detector.js.map