'use server';

import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { runFlow } from '@genkit-ai/flow';
import { webSearchFlow } from './web_search_flow';
import { getYoutubeTranscriptFlow } from './get-youtube-transcript';
import { youtubeSearchFlow } from './youtube-search-flow'; // Import youtubeSearchFlow
import { runResearchOrchestrator } from './research-orchestrator';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
import { ConversationState, Message } from '@/lib/types';
import { generateChatTitle } from './title-generator';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extend ConversationState to include ONLY the missing properties.
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
  preferences: {
    name?: string;
    gradeLevel?: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
    preferredLanguage?: 'english' | 'swahili' | 'arabic' | 'english_sw';
    interests?: string[];
  };
  fileData?: { type: string; base64: string };
  forceWebSearch?: boolean;
  includeVideos?: boolean;
  memory?: {
    progress: any[];
    mistakes: any[];
  };
  // ✅ ADDED: Pass current title to know if we need to generate one
  currentTitle?: string;
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
  console.log(`[🔍 DEEP TRACE] [COPILOT] Input: "${input.text}" | ForceWeb: ${input.forceWebSearch}`);
  
  let updatedState: ExtendedConversationState = JSON.parse(JSON.stringify(input.state));
  if (updatedState.validationAttemptCount === undefined) updatedState.validationAttemptCount = 0;

  // ✅ DEFINE VARIABLES AT TOP SCOPE
  let responseText: string = '';
  let videoData: EmotionalAICopilotOutput['videoData'] | undefined = undefined;
  let suggestedTitle: string | undefined = undefined;

  // ==============================================================================
  // 🧠 SIMPLIFIED TITLE GENERATION LOGIC (Guaranteed Trigger)
  // ==============================================================================
  const needsTitle = !input.currentTitle || input.currentTitle === 'New Chat' || input.currentTitle === 'Untitled';
  const hasContent = input.text.length > 5;

  if (needsTitle && hasContent) {
      console.log(`[🔍 DEEP TRACE] Generating Title for: "${input.text}"`);
      const newTitle = await generateChatTitle(input.chatHistory, input.text);
      if (newTitle && newTitle !== "New Chat") {
          suggestedTitle = newTitle;
          console.log(`[🔍 DEEP TRACE] ✨ Generated: "${suggestedTitle}"`);
      }
  }

  // --------------------------------------------------------------------------
  // LOGIC BLOCK 1: ROUTING TO RESEARCH ORCHESTRATOR
  // --------------------------------------------------------------------------
  if (input.forceWebSearch || updatedState.conversationState === 'awaiting_practice_response') {
      console.log("[🔍 DEEP TRACE] [COPILOT] >> Handing off to Research Orchestrator");
      
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
      
      // ✅ CAPTURE VIDEO DATA & HARD LOCK RELEVANCE
      if ((researchResult as any).videoData) {
          const vData = (researchResult as any).videoData;
          
          // CRITICAL: Hard Lock Relevance Check
          // Only show video if title roughly matches current topic/query to prevent "QRadar" errors
          const currentContext = (updatedState.lastTopic || input.text).toLowerCase();
          const videoTitleLower = (vData.title || "").toLowerCase();
          
          // Simple relevance check: does the video title contain ANY word from the topic (excluding fillers)?
          const topicKeywords = currentContext.split(' ').filter(w => w.length > 3);
          const isRelevant = topicKeywords.some(w => videoTitleLower.includes(w));

          if (isRelevant && vData.id) {
             videoData = vData;
             const thumb = videoData!.thumbnail || `https://img.youtube.com/vi/${videoData!.id}/0.jpg`;
             const cleanTitle = (videoData!.title || "Educational Video").replace(/[\[\]]/g, '');
             rawResponse += `\n\n[![${cleanTitle}](${thumb})](https://www.youtube.com/watch?v=${videoData!.id})\n*Tap to watch: ${cleanTitle}*`;
          } else {
             console.log(`[COPILOT] Skipped irrelevant video: "${vData.title}" for topic "${updatedState.lastTopic}"`);
          }
      }

      if ((researchResult as any).mode === 'teaching' || (researchResult as any).mode === 'web_research') {
          updatedState.lastTopic = input.text;
      }
      
      const sanitizedResponse = await GUARDIAN_SANITIZE(rawResponse, updatedState.lastTopic);
      updatedState.lastAssistantMessage = sanitizedResponse;

      console.log(`[🔍 DEEP TRACE] [COPILOT] << Orchestrator finished.`);
      return { 
          processedText: sanitizedResponse, 
          state: updatedState, 
          topic: updatedState.lastTopic,
          sources: sources,
          videoData: videoData,
          suggestedTitle: suggestedTitle
      };
  }

  // --------------------------------------------------------------------------
  // LOGIC BLOCK 2: Handling Active Practice Questions (Local Chat Validation)
  // --------------------------------------------------------------------------
  if (updatedState.awaitingPracticeQuestionAnswer) {
      const isCorrect = validateAnswer(input.text, updatedState.correctAnswers || []);

      if (isCorrect) {
          const topic = updatedState.lastTopic || 'that';
          responseText = `Excellent 🌟! Mashallah, yes, that’s right — you solved it. This shows you understand ${topic}. Are you ready to try another small step?`;
          
          updatedState.awaitingPracticeQuestionAnswer = false;
          updatedState.validationAttemptCount = 0;
          updatedState.activePracticeQuestion = undefined;
          updatedState.correctAnswers = [];
          updatedState.lastTopic = undefined;
          
      } else {
          updatedState.validationAttemptCount = (updatedState.validationAttemptCount || 0) + 1;
          
          switch (updatedState.validationAttemptCount) {
              case 1:
                  responseText = `Good try 👏, but that’s not quite right. Let’s think about it differently.`;
                  break;
              case 2:
                  responseText = `Okay, let us take it slowly. If we start with 10 and take away 1, how many are left?`;
                  break;
              case 3:
                  responseText = `I see this is a bit tricky. That is okay! Let's count them together.`;
                  break;
              default:
                  responseText = "Don’t worry 💙. This concept is tricky, but we will solve it together. Shall I show you the first step?";
                  break;
          }
      }
      
      const sanitizedText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
      updatedState.lastAssistantMessage = sanitizedText;
      return { 
          processedText: sanitizedText, 
          state: updatedState, 
          suggestedTitle: suggestedTitle
      };
  }

  // --------------------------------------------------------------------------
  // LOGIC BLOCK 3: NORMAL CHAT & TOOLS
  // --------------------------------------------------------------------------
  const hasInterests = input.preferences.interests && input.preferences.interests.length > 0;
  const interestsString = hasInterests ? input.preferences.interests!.join(', ') : 'general Kenyan topics like chai, mandazi, and boda bodas';

  const mistakesList = input.memory?.mistakes?.map((m: any) => `${m.topic} (${m.error})`).join(', ') || 'None recorded yet';
  const masteryList = input.memory?.progress?.filter((p: any) => p.mastery > 80).map((p: any) => p.topic).join(', ') || 'None recorded yet';

  // --------------------------------------------------------------------------
  // DYNAMIC SYSTEM PROMPT: SPLIT TEACHING VS RESEARCH
  // --------------------------------------------------------------------------
  
  // Base Teaching Prompt (Standard Mode)
  const TEACHING_PROMPT = `
**IDENTITY & ROLE**
You are STEADFAST, the world’s most intelligent, patient, warm, and engaging Muslim educational AI teacher.
You teach children with Kenyan clarity, Islamic manners, and true compassion.

**CORE TEACHING RHYTHM (DEFAULT)**
1. **Teach ONE Micro-Idea:** Simplest possible concept (1-2 sentences).
2. **Give ONE Relatable Example:** Connected to interests (${interestsString}).
3. **Wait or Check:** You may ask a guiding question OR simply pause for them to absorb it.

**CRITICAL RULES (NON-NEGOTIABLE)**
1. **NO PRESSURE:** You do NOT always have to ask a question. If the student is unsure, confused, or upset, simply explain calmly and wait.
2. **CONDITIONAL STEPS:** Use "Step one", "Step two" ONLY for actual procedures. Never for definitions.
3. **NO ROBOTICS:** Never say "As an AI". Never apologize excessively. Speak like a human teacher.
4. **SAFETY FIRST:** If a topic is inappropriate, firmly redirect to learning.
5. **ISLAMIC MANNERS:** Be respectful. No fatwas. No deep fiqh. Simple, beautiful character lessons only.

**FORMATTING LAWS**
- Start with a capital letter.
- Use simple punctuation.
- No Markdown lists.
- No LaTeX (use plain text fractions like 1/2).
- One parenthesis pair max (1/2).

**STUDENT CONTEXT**
- Name: ${input.preferences.name || 'Student'}
- Grade: ${input.preferences.gradeLevel || 'Primary'}
- Struggles: ${mistakesList}
- Mastery: ${masteryList}
`;

  // Research/Tool Prompt (Brief & Factual)
  const RESEARCH_PROMPT = `
**IDENTITY**
You are a calm, neutral educational assistant helping with research.

**RULES**
- Stay factual and clear.
- Do not show uncertainty.
- Do not apologize.
- Do not use metaphors unless they make the specific fact clearer.
- Answer the user's question directly.
- If the user asks for a video summary, give the summary clearly without extra fluff.
`;

  // Select Prompt based on input intent (Basic Heuristic)
  const isResearchIntent = input.text.toLowerCase().includes('search') || input.text.toLowerCase().includes('find') || input.forceWebSearch;
  const systemMessage = isResearchIntent ? RESEARCH_PROMPT : TEACHING_PROMPT;

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

  const tools = [
    {
        type: 'function' as const,
        function: {
          name: 'ask_practice_question',
          description: 'Asks the student a question to validate their understanding.',
          parameters: {
            type: 'object' as const,
            properties: {
              question: { type: 'string', description: 'The practice question.' },
              correctAnswers: { type: 'string', description: 'Comma-separated correct keywords.' },
              topic: { type: 'string', description: 'The topic.' },
            },
            required: ['question', 'correctAnswers', 'topic'],
          },
        },
    },
    {
      type: 'function' as const,
      function: {
        name: 'youtube_search',
        description: 'Searches for an educational YouTube video.',
        parameters: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'The topic to search for.' },
          },
          required: ['query'],
        },
      },
    },
    {
        type: 'function' as const,
        function: {
          name: 'get_youtube_transcript',
          description: "Fetches a video's transcript.",
          parameters: {
            type: 'object' as const,
            properties: {
              videoId: { type: 'string', description: 'The YouTube video ID.' },
            },
            required: ['videoId'],
          },
        },
      },
  ];

  console.log('[BRAIN] STEP 2: Querying OpenAI model...');
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4o-mini',
    tools: tools,
    tool_choice: 'auto',
  });

  const responseMessage = completion.choices[0].message;
  console.log('[BRAIN] STEP 3: Received raw response from OpenAI:', JSON.stringify(responseMessage, null, 2));

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    console.log('[BRAIN] STEP 4: AI decided to use a tool.');
    const toolCall = responseMessage.tool_calls[0];

    if (toolCall.type === 'function') {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
  
        console.log(`[BRAIN] STEP 5: Executing '${functionName}' with arguments:`, functionArgs);
  
        if (functionName === 'ask_practice_question') {
            updatedState.awaitingPracticeQuestionAnswer = true;
            updatedState.activePracticeQuestion = functionArgs.question;
            updatedState.correctAnswers = functionArgs.correctAnswers.split(',').map((a: string) => a.trim().toLowerCase());
            updatedState.lastTopic = functionArgs.topic;
            updatedState.validationAttemptCount = 0;
            
            responseText = `Here is a small challenge: What is (${updatedState.activePracticeQuestion})?`;
            const sanitizedText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
            updatedState.lastAssistantMessage = sanitizedText;
            return { 
                processedText: sanitizedText, 
                state: updatedState,
                suggestedTitle: suggestedTitle
            };
        }

        try {
          if (functionName === 'youtube_search') {
            const results = await runFlow(youtubeSearchFlow, { query: functionArgs.query }); // Corrected to youtubeSearchFlow
            
            if (results && results.length > 0) {
              // 🔒 VIDEO RELEVANCE CHECK (Hard Lock)
              const video = results[0];
              const currentTopic = updatedState.lastTopic || input.text;
              const isRelevant = (video.title || "").toLowerCase().includes(currentTopic.toLowerCase().split(' ')[0]); // Check at least first keyword match

              if (isRelevant) {
                  const safeChannel = (video.channel || video.channelTitle || '').replace('Unknown Channel', '');
                  videoData = { id: video.id, title: video.title, channel: safeChannel, thumbnail: video.thumbnailUrl };
                  
                  const thumb = video.thumbnailUrl || `https://img.youtube.com/vi/${video.id}/0.jpg`;
                  const cleanTitle = (video.title || "Educational Video").replace(/[\[\]]/g, '');
                  
                  responseText = `I found a great video for you: "${video.title}".\n\n[![${cleanTitle}](${thumb})](https://www.youtube.com/watch?v=${video.id})\n*Tap to watch: ${cleanTitle}*`;
              } else {
                  responseText = "I couldn’t find a perfectly matching video, but I can explain it myself! Shall we start?";
              }
            } else {
              responseText = "I couldn’t find a video right now, but I can explain it to you myself! Shall we begin?";
            }
            const sanitizedText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
            updatedState.lastAssistantMessage = sanitizedText;
            return { 
                processedText: sanitizedText, 
                videoData, 
                state: updatedState, 
                suggestedTitle: suggestedTitle
            };

          } else if (functionName === 'get_youtube_transcript') {
            if (!functionArgs.videoId) {
                responseText = "I seem to have lost track of the video. Let's discuss the topic directly!";
                const sanitizedText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
                return { processedText: sanitizedText, state: updatedState };
            }

            const transcript = await runFlow(getYoutubeTranscriptFlow, functionArgs);
            if (!transcript || transcript.startsWith('Could not')) {
                responseText = `I can't access that transcript right now. What specific part would you like me to explain?`;
                const sanitizedText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
                return { processedText: sanitizedText, state: updatedState };
            }
            
            const safeTranscript = transcript.length > 50000 ? transcript.substring(0, 50000) + "..." : transcript;

            const newMessages: ChatCompletionMessageParam[] = [ ...messages, responseMessage, { role: 'tool', tool_call_id: toolCall.id, content: safeTranscript } ];
            const secondCompletion = await openai.chat.completions.create({ messages: newMessages, model: 'gpt-4o' });

            responseText = secondCompletion.choices[0].message.content || "I watched the video. What would you like to know?";
          }
        } catch (error) {
          console.error(`[BRAIN] ERROR during tool execution '${functionName}':`, error);
          responseText = `I encountered a small hiccup. Let's just talk about it directly.`;
        }
    }
  } else {
      responseText = responseMessage.content || "I'm here to help you learn!";
  }
  
  // FINAL SAFETY NET: If we have no topic yet, anchor it to input text
  if (!updatedState.lastTopic && input.forceWebSearch) {
      updatedState.lastTopic = input.text;
  }

  const sanitizedFinalText = await GUARDIAN_SANITIZE(responseText, updatedState.lastTopic);
  updatedState.lastAssistantMessage = sanitizedFinalText;

  console.log(`[BRAIN] STEP 4: Sending final sanitized text response: "${sanitizedFinalText}"`);
  return {
      processedText: sanitizedFinalText,
      videoData: videoData,
      state: updatedState,
      topic: updatedState.lastTopic || input.text, 
      suggestedTitle: suggestedTitle
  };
};
