'use server';

import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { runFlow } from '@genkit-ai/flow';
import { webSearchFlow } from './web_search_flow';
import { getYoutubeTranscriptFlow } from './get-youtube-transcript';
import { youtubeSearchFlow } from './youtube-search-flow';
import { runResearchOrchestrator } from './research-orchestrator';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
import { generateChatTitle } from './title-generator';
import { detectResearchIntent } from './intent-detector';

// ✅ Import Scope Guardian
import { isOutOfScope, getDynamicScopeResponse } from '../tools/scope-guardian';

// ✅ NEW: Import Multilingual Governance
import { getLanguageGovernance } from '../tools/multilingual-governance';

// ✅ Relative Import
import { ConversationState, Message } from '../../lib/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface ExtendedConversationState extends ConversationState {
    activePracticeQuestion?: string;
    correctAnswers?: string[];
    lastTopic?: string;
    lastAssistantMessage?: string;
    conversationState?: 'initial_search' | 'awaiting_practice_response' | 'providing_practice_question' | 'general';
}

export interface EmotionalAICopilotInput {
    text: string;
    chatHistory: Message[];
    state: ConversationState;
    studentProfile: {
        name: string;
        gradeLevel: string;
    };
    preferences: {
        preferredLanguage?: 'english' | 'swahili' | 'arabic' | 'english_sw';
        interests?: string[];
    };
    fileData?: { type: string; base64: string };
    forceWebSearch?: boolean;
    includeVideos?: boolean;
    currentTitle?: string;
    memory?: {
        progress?: any[];
        mistakes?: any[];
    };
    onToken?: (token: string) => void; // New callback for streaming
}

export interface EmotionalAICopilotOutput {
    processedText: string;
    videoData?: { id: string; title: string; channel?: string; thumbnail?: string };
    state: ConversationState;
    topic?: string;
    sources?: { sourceName: string; url: string }[];
    suggestedTitle?: string;
}

function validateAnswer(studentInput: string, correctAnswers: string[]): boolean {
    const userAnswer = studentInput.trim().toLowerCase();
    if (userAnswer.length === 0) return false;
    return correctAnswers.some(ans => userAnswer.includes(ans.toLowerCase()));
}

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
    const rawInterests = input.preferences?.interests || [];
    console.log(`[🔍 TRACE] Student: ${input.studentProfile.name} | Interests: ${rawInterests.join(', ')}`);

    // ==============================================================================
    // 🔒 SCOPE GUARDIAN (SAFETY LOCK)
    // ==============================================================================
    if (isOutOfScope(input.text)) {
        console.log(`[🛡️ SCOPE GUARDIAN] Blocked input: "${input.text}"`);
        const blockText = getDynamicScopeResponse(input.text);

        // Word+Space pacing for a natural feel even on blocked content
        if (input.onToken) {
            const chunks = blockText.match(/(\S+\s*)/g) || [blockText];
            for (const chunk of chunks) {
                input.onToken(chunk);
            }
        }

        return {
            processedText: blockText,
            state: input.state,
            topic: input.state.lastSearchTopic?.[0] || "General",
            suggestedTitle: input.currentTitle,
            videoData: undefined,
            sources: []
        };
    }

    // --- Normal Flow Continues Below ---

    let updatedState: ExtendedConversationState = JSON.parse(JSON.stringify(input.state));
    if (updatedState.validationAttemptCount === undefined) updatedState.validationAttemptCount = 0;
    if (updatedState.awaitingPracticeQuestionAnswer === undefined) updatedState.awaitingPracticeQuestionAnswer = false;

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
        const text = "Hello! How can I help you study today?";
        if (input.onToken) {
            const chunks = text.match(/(\S+\s*)/g) || [text];
            for (const chunk of chunks) {
                input.onToken(chunk);
            }
        }
        return {
            processedText: text,
            state: updatedState,
            topic: updatedState.lastTopic || 'general'
        };
    }

    // ==============================================================================
    // 2. PARALLEL PRE-PROCESSING (Intent + Title)
    // ==============================================================================
    const isGenericTitle = !input.currentTitle ||
        input.currentTitle === 'New Chat' ||
        input.currentTitle === 'Untitled';

    console.log('[BRAIN] Detecting Intent & Generating Title in parallel...');
    const [intent, maybeNewTitle] = await Promise.all([
        detectResearchIntent(input.text, updatedState.lastTopic),
        isGenericTitle && input.text.length > 3 ? generateChatTitle(input.chatHistory, input.text) : Promise.resolve(null)
    ]);

    if (maybeNewTitle && maybeNewTitle !== "New Chat" && maybeNewTitle !== "General Discussion") {
        suggestedTitle = maybeNewTitle;
    }

    // ==============================================================================
    // 2. RESEARCH ORCHESTRATOR ROUTING
    // ==============================================================================
    if (input.forceWebSearch || updatedState.conversationState === 'awaiting_practice_response') {
        console.log("[🔍 TRACE] Handing off to Research Orchestrator");

        const researchResult = await runResearchOrchestrator({
            query: input.text,
            lastSearchTopic: updatedState.lastTopic,
            forceWebSearch: input.forceWebSearch,
            chatHistory: input.chatHistory.map(m => ({ role: m.role, content: m.content }))
        });

        updatedState.conversationState = 'general';

        let rawResponse =
            (researchResult as any).reply ||
            (researchResult as any).response ||
            "I checked, but I couldn't generate a clear answer. Let's try chatting about it directly.";

        const sources = (researchResult as any).sources || [];

        // VIDEO HANDLING
        if ((researchResult as any).videoData) {
            const vData = (researchResult as any).videoData;
            const currentContext = (updatedState.lastTopic || input.text).toLowerCase();
            const videoTitleLower = (vData.title || "").toLowerCase();

            const stopWords = ['about', 'what', 'how', 'when', 'why', 'video', 'show', 'me'];
            const topicKeywords = currentContext.split(' ').filter(w => w.length > 3 && !stopWords.includes(w));

            const isRelevant = topicKeywords.some(w => videoTitleLower.includes(w)) || videoTitleLower.includes(currentContext);

            if (isRelevant && vData.id) {
                videoData = vData;
                const cleanTitle = (videoData!.title || "Educational Video").replace(/[\[\]]/g, '');
                rawResponse += `\n\n[Watch Video: ${cleanTitle}](https://www.youtube.com/watch?v=${vData.id})`;
            }
        }

        if ((researchResult as any).mode === 'teaching' || (researchResult as any).mode === 'web_research') {
            updatedState.lastTopic = input.text;
        }

        const sanitizedResponse = await GUARDIAN_SANITIZE(rawResponse, updatedState.lastTopic);
        updatedState.lastAssistantMessage = sanitizedResponse;

        if (input.onToken) {
            // For research results, we might have a bulk string, so we simulate streaming for UX consistency
            for (const char of sanitizedResponse) {
                input.onToken(char);
            }
        }

        return {
            processedText: sanitizedResponse,
            state: updatedState,
            topic: updatedState.lastTopic,
            sources: sources,
            videoData: videoData,
            suggestedTitle: suggestedTitle
        };
    }

    // ==============================================================================
    // 3. PRACTICE QUESTION LOGIC
    // ==============================================================================
    if (updatedState.awaitingPracticeQuestionAnswer) {
        const isCorrect = validateAnswer(input.text, updatedState.correctAnswers || []);

        if (isCorrect) {
            const topic = updatedState.lastTopic || 'that';
            responseText = `Excellent 🌟! Mashallah, yes. You understand ${topic}. Ready for the next step?`;
            updatedState.awaitingPracticeQuestionAnswer = false;
            updatedState.validationAttemptCount = 0;
            updatedState.activePracticeQuestion = undefined;
            updatedState.correctAnswers = [];
        } else {
            updatedState.validationAttemptCount = (updatedState.validationAttemptCount || 0) + 1;
            responseText = updatedState.validationAttemptCount > 1
                ? "Let us take it slowly. Let's count together."
                : "Good try, but let's look closer.";
        }

        const sanitizedText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
        updatedState.lastAssistantMessage = sanitizedText;

        if (input.onToken) {
            for (const char of sanitizedText) {
                input.onToken(char);
            }
        }

        return { processedText: sanitizedText, state: updatedState, suggestedTitle: suggestedTitle };
    }

    // ==============================================================================
    // 4. DYNAMIC SYSTEM PROMPT (MULTILINGUAL GOVERNANCE)
    // ==============================================================================

    const languageMode = input.preferences?.preferredLanguage || 'english';

    // ✅ LOG GOVERNANCE LOADING (VERIFY STRICT RULES ARE ACTIVE)
    console.log(`[GOVERNANCE] Loading Strict Rules for: ${languageMode}`);

    // ✅ NEW: Fetch Governed Prompt based on Language + Interests
    const TEACHING_PROMPT = getLanguageGovernance(languageMode, rawInterests);

    const RESEARCH_PROMPT = `
  **IDENTITY**
  Calm, neutral research assistant.
  **RULES**
  - Factual, clear, direct.
  - No metaphors unless helpful.
  - Direct answers.
  `;

    const shouldUseResearchSystemPrompt = input.text.toLowerCase().includes('search') || input.text.toLowerCase().includes('find') || input.forceWebSearch;
    const systemMessage = shouldUseResearchSystemPrompt ? RESEARCH_PROMPT : TEACHING_PROMPT;

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemMessage },
        ...input.chatHistory.map(msg => ({
            role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: msg.content
        })),
        { role: 'user', content: input.text },
    ];

    if (input.fileData) {
        const lastMsgIndex = messages.length - 1;
        if (messages[lastMsgIndex].role === 'user') {
            messages[lastMsgIndex] = {
                role: 'user',
                content: [
                    { type: 'text', text: input.text },
                    { type: 'image_url', image_url: { url: `data:${input.fileData.type};base64,${input.fileData.base64}` } }
                ]
            };
        }
    }

    // ==============================================================================
    // 5. TOOLS & EXECUTION
    // ==============================================================================
    const tools = [
        { type: 'function' as const, function: { name: 'ask_practice_question', description: 'Ask validation question.', parameters: { type: 'object' as const, properties: { question: { type: 'string' }, correctAnswers: { type: 'string' }, topic: { type: 'string' } }, required: ['question', 'correctAnswers', 'topic'] } } },
        { type: 'function' as const, function: { name: 'youtube_search', description: 'Search educational video.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } } },
        { type: 'function' as const, function: { name: 'get_youtube_transcript', description: "Fetch transcript.", parameters: { type: 'object' as const, properties: { videoId: { type: 'string' } }, required: ['videoId'] } } },
    ];

    console.log('[BRAIN] Querying AI Completion' + (input.onToken ? ' (STREAMING)' : '') + '...');

    // Part 1: Strict Streaming Path
    if (input.onToken) {
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: 'gpt-4o-mini',
            tools: tools,
            tool_choice: 'auto',
            stream: true,
        });

        let fullText = '';
        let toolCallDetected = false;

        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            const content = delta?.content || "";

            if (delta?.tool_calls) {
                toolCallDetected = true;
                break; // Switch to tool handling path
            }

            if (content) {
                fullText += content;
                input.onToken(content);
            }
        }

        if (!toolCallDetected) {
            const sanitizedFinalText = await GUARDIAN_SANITIZE(fullText, updatedState.lastTopic);
            updatedState.lastAssistantMessage = sanitizedFinalText;
            return { processedText: sanitizedFinalText, videoData, state: updatedState, topic: updatedState.lastTopic || input.text, suggestedTitle };
        }
    }

    // Part 2: Non-Streaming Fallback (Tools or simple requests)
    const completion = await openai.chat.completions.create({
        messages,
        model: 'gpt-4o-mini',
        tools,
        tool_choice: 'auto',
        stream: false
    });

    const finalCompletion = completion as any;

    const responseMessage = (finalCompletion as any).choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const functionName = (toolCall as any).function.name;
        const args = JSON.parse((toolCall as any).function.arguments);

        if (functionName === 'ask_practice_question') {
            updatedState.awaitingPracticeQuestionAnswer = true;
            updatedState.activePracticeQuestion = args.question;
            updatedState.correctAnswers = args.correctAnswers.split(',').map((a: string) => a.trim().toLowerCase());
            updatedState.lastTopic = args.topic;
            updatedState.validationAttemptCount = 0;
            responseText = `Here is a small challenge: What is (${updatedState.activePracticeQuestion})?`;
        }

        else if (functionName === 'youtube_search') {
            try {
                const results = await runFlow(youtubeSearchFlow, { query: args.query });

                if (results && results.length > 0) {
                    const video = results[0];
                    const currentTopic = updatedState.lastTopic || input.text;
                    const vidTitleLower = (video.title || "").toLowerCase();
                    const contextLower = currentTopic.toLowerCase();

                    // FUZZY MATCH
                    const stopWords = ['what', 'how', 'when', 'video', 'about'];
                    const keywords = contextLower.split(' ').filter(w => w.length > 3 && !stopWords.includes(w));
                    const isRelevant = keywords.some(k => vidTitleLower.includes(k)) || vidTitleLower.includes(contextLower);

                    if (isRelevant) {
                        const safeChannel = (video.channel || video.channelTitle || '').replace('Unknown Channel', '');
                        videoData = { id: video.id, title: video.title, channel: safeChannel, thumbnail: video.thumbnailUrl };

                        const cleanTitle = (video.title || "Video").replace(/[\[\]]/g, '');
                        // ✅ Text Link Only
                        responseText = `I found a great video for you: "${video.title}".\n\n[Watch Video: ${cleanTitle}](https://www.youtube.com/watch?v=${video.id})`;
                    } else {
                        responseText = "Let me explain this to you step by step myself!";
                    }
                } else {
                    responseText = "Let's explore this topic directly together.";
                }
            } catch (error) {
                console.error('[BRAIN] Video Search Error:', error);
                responseText = "Let's just talk about this directly.";
            }
        }

        else if (functionName === 'get_youtube_transcript') {
            if (!args.videoId) {
                responseText = "Let's discuss the topic directly!";
            } else {
                const transcript = await runFlow(getYoutubeTranscriptFlow, args);
                if (!transcript || transcript.startsWith('Could not')) {
                    responseText = `I can't access that transcript right now. What specific part would you like me to explain?`;
                } else {
                    const safeTranscript = transcript.length > 50000 ? transcript.substring(0, 50000) + "..." : transcript;
                    const newMessages: ChatCompletionMessageParam[] = [...messages, responseMessage, { role: 'tool', tool_call_id: toolCall.id, content: safeTranscript }];
                    const secondCompletion = await openai.chat.completions.create({ messages: newMessages, model: 'gpt-4o' });
                    responseText = secondCompletion.choices[0].message.content || "I watched the video. What would you like to know?";
                }
            }
        }
    } else {
        responseText = responseMessage.content || "I'm here to help!";
    }

    if (!updatedState.lastTopic && input.forceWebSearch) updatedState.lastTopic = input.text;

    // Pass user interests to sanitizer for fine-tuning
    const sanitizedFinalText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
    updatedState.lastAssistantMessage = sanitizedFinalText;

    // Yield final sanitized tokens if they haven't been yielded already (tool-call or fallback paths)
    if (input.onToken) {
        const chunks = sanitizedFinalText.match(/(\S+\s*)/g) || [sanitizedFinalText];
        for (const chunk of chunks) {
            input.onToken(chunk);
        }
    }

    return { processedText: sanitizedFinalText, videoData, state: updatedState, topic: updatedState.lastTopic || input.text, suggestedTitle };
};