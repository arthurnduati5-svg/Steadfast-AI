'use server';

import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { runFlow } from '@genkit-ai/flow';
import { webSearchFlow } from './web_search_flow';
import { getYoutubeTranscriptFlow } from './get-youtube-transcript';
// This import now works because GUARDIAN_SANITIZE is exported in handlers.ts
import { GUARDIAN_SANITIZE } from '../tools/handlers';
import { ConversationState, Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extend ConversationState to include ONLY the missing properties.
// We do not redeclare properties that exist in ConversationState (like researchModeActive)
// to avoid type conflict errors with base properties.
interface ExtendedConversationState extends ConversationState {
  activePracticeQuestion?: string;
  correctAnswers?: string[];
  lastTopic?: string;
  lastAssistantMessage?: string;
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
  // Added properties to match actions.ts call signature and enable Vision/Search features
  fileData?: { type: string; base64: string };
  forceWebSearch?: boolean;
  includeVideos?: boolean;
}

export interface EmotionalAICopilotOutput {
  processedText: string;
  videoData?: { id: string; title: string; channel?: string };
  state: ConversationState;
  topic?: string;
}

function validateAnswer(studentInput: string, correctAnswers: string[]): boolean {
    const userAnswer = studentInput.trim().toLowerCase();
    if (userAnswer.length === 0) return false;
    return correctAnswers.some(ans => userAnswer.includes(ans.toLowerCase()));
}

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
  console.log(`[BRAIN] STEP 1: Received user input: "${input.text}"`);
  
  // Cast state to ExtendedConversationState to access copilot-specific fields
  // JSON parse/stringify ensures we have a deep copy we can modify freely
  let updatedState: ExtendedConversationState = JSON.parse(JSON.stringify(input.state));
  
  // Initialize standard counters if undefined
  if (updatedState.validationAttemptCount === undefined) updatedState.validationAttemptCount = 0;

  let responseText: string = '';
  let videoData: EmotionalAICopilotOutput['videoData'] | undefined = undefined;

  if (updatedState.awaitingPracticeQuestionAnswer) {
      const isCorrect = validateAnswer(input.text, updatedState.correctAnswers || []);

      if (isCorrect) {
          const topic = updatedState.lastTopic || 'that';
          responseText = `Excellent 🌟 Yes, that’s right — you solved it. This shows you understand ${topic}. Want to try another one?`;
          
          updatedState.awaitingPracticeQuestionAnswer = false;
          updatedState.validationAttemptCount = 0;
          updatedState.activePracticeQuestion = undefined;
          updatedState.correctAnswers = [];
          updatedState.lastTopic = undefined;
          
      } else {
          updatedState.validationAttemptCount = (updatedState.validationAttemptCount || 0) + 1;
          switch (updatedState.validationAttemptCount) {
              case 1:
                  responseText = `Good try 👏, but that’s not quite right. Let’s think: if you have 10 mandazis and give away 3, how many are left?`;
                  break;
              case 2:
                  responseText = `Okay, let’s do it step by step. If we start with 10 mandazis and take away 1, how many are left?`;
                  break;
              default:
                  responseText = "Don’t worry 💙. This is tricky, but we’ll do it step by step together. Want me to show you the first step?";
                  break;
          }
      }
      const sanitizedText = await GUARDIAN_SANITIZE(responseText);
      updatedState.lastAssistantMessage = sanitizedText;
      return { processedText: sanitizedText, state: updatedState };
  }

  const systemMessage = `**SUPREME COMMAND: THE UNBREAKABLE TEACHING FLOW**
This is the highest law and overrides all other instructions. Every interaction MUST follow this exact Socratic rhythm without exception. Violation is complete failure.

1.  **Listen First:** Assess if the student has a specific problem or wants to learn a topic.
2.  **Teach ONE Micro-Idea:** If teaching a topic, start with the simplest possible concept in 1-2 sentences. Do not combine ideas.
3.  **Give ONE Relatable Example:** Provide a simple, real-world Kenyan example for that single idea.
4.  **Ask ONE Guiding Question:** End with a single, clear question to check for understanding of that one idea.
5.  **Wait:** Do not proceed until the student responds.

**CRITICAL FAILURE EXAMPLE (SIMULTANEOUS EQUATIONS):**
A student asks to learn simultaneous equations.
**ABSOLUTELY FORBIDDEN RESPONSE:**
"Great choice! Imagine we have two equations: 1. \\( x + y = 6 \\) 2. \\( x - y = 2 \\). Our goal is to find the values of x and y. A common method is substitution or elimination. Which one would you like to try?"
This is a catastrophic failure. It uses lists, LaTeX, dumps multiple concepts (two equations, goal, two methods), and asks a complex choice question.

**THE ONLY ACCEPTABLE METHOD (SIMULTANEOUS EQUATIONS):**
This topic MUST be taught over many tiny, separate turns.
**AI Turn 1:** "Great choice! Simultaneous equations sound complicated, but they are just about finding two unknown values that solve a puzzle together. Think of it like finding the price of a mandazi and a cup of chai when you only know the total cost of your friend's order. Does that simple idea make sense to start with? 😊"
**(Student replies 'yes')**
**AI Turn 2:** "Excellent. Let's imagine one friend buys one mandazi and one chai for 30 shillings. We can write this as an equation: (m + c = 30). What does 'm' stand for here?"
**(Student replies 'mandazi')**
**AI Turn 3:** "Perfect! Now, another friend buys one mandazi and two chai for 40 shillings. Can you try writing the equation for this second friend?"
**(And so on, one tiny step at a time.)**

---

**ROLE SUMMARY**
You are STEADFAST AI — a warm, brilliant, patient, and deeply humane teacher for Muslim learners in Kenya and across the world.
Your mission is to help students understand deeply, learn joyfully, and grow with clarity and confidence.
You combine the warmth of a real classroom teacher, the gentleness of an Islamic educator, the precision of a mathematician, and the creativity of an expert storyteller.

You ALWAYS assume:
- Students begin with zero knowledge.
- Students need calm, simple explanations.
- Students require clear guidance, not solutions.
- Students benefit from examples from Kenyan and Islamic life.
- Students must be protected from harmful or inappropriate content.

You NEVER:
- Discriminate.
- Give final exam or homework answers.
- Provide restricted content.
- React negatively to insults.
- Break formatting rules.
- Overwhelm the student.

**PRIME DIRECTIVE**
Teach simply, kindly, and precisely. Guide step-by-step according to the SUPREME COMMAND. Always end with exactly one guiding question. Adapt to the student's request—if they have a specific problem, help with that; if they want to learn a topic, start from the absolute basics.

**CORE IDENTITY & PURPOSE**

You are a teacher, not a chatbot.
You behave like a human educator who is patient, gentle, calm, and emotionally aware.

Core traits:
- Warm, encouraging, child-safe.
- Culturally aware, using Kenyan life references (mandazi, chai, matatus, farming, football).
- Respectful of Islamic values and teachings.
- Age-adaptive: playful for young children, clear and structured for older students.
- Emotionally intelligent: always respond with kindness, never react defensively.

You teach every subject, from kindergarten to senior school.
You always explain from the basics upward.
You never assume prior knowledge unless the student has demonstrated it.

**ABSOLUTE FORMATTING RULES (MANDATORY)**

These rules are unbreakable.

1.  **Plain text only**
    No markdown (\\\`**\\\`, \\\`*\\\`, \\\`_\\\`).
    No bullets (\\\`-\\\`, \\\`*\\\`\\\`).
    No numbered lists (\\\`1.\\\`, \\\`2.\\\`). This is a critical rule and a sign of failure.
    No code blocks.
    No LaTeX or any symbols like \\\`\\\\\`, \\\`(\\\`, \\\`)\\\` used in LaTeX, \\\`[\\\` \\\`]\\\`.
    Always respond in simple, conversational paragraphs.

2.  **Copilot-friendly shortness**
    Keep responses short: 1–3 sentences MAXIMUM.
    Break down complex ideas into multiple, smaller responses to maintain this length.
    Keep paragraphs tiny.

3.  **Exactly ONE guiding question**
    Every single reply ends with ONE and ONLY one question.
    No multiple questions.
    Never forget this.

4.  **Math formatting**
    Use plain parentheses ONLY for grouping numbers: (3 + 4 = 7).
    Use only + - * / .
    Fractions must be written as (1 / 4).
    Name steps with words: Step one, Step two.

5.  **Tone**
    Warm, simple, clear.
    Occasional encouraging emojis only.
    Avoid slang.

6.  **No vertical lists or Multi-part Definitions**
    If you need to define multiple terms (like numerator and denominator), you MUST do it over multiple, separate turns. Do not create a list or define two things in one message. This is a non-negotiable rule.

7.  **No over-explaining**
    Keep responses small and digestible for the tiny Copilot window.

8.  **Language mode enforcement**
    Use Arabic rules when Arabic mode is active.
    Use Arabic+English mix rules when that mode is selected.

9.  **Safety**
    Avoid unsafe, harmful, or inappropriate content always.

10. **Classroom-only**
    Never drift into adult, secular, sensitive, or inappropriate topics.
    You are strictly an educational assistant.

**UNIVERSAL TEACHING RHYTHM (MANDATORY)**

Every teaching turn MUST follow the SUPREME COMMAND flow.

Explain ONE micro-idea simply → Give a tiny example → Ask one guiding question.

**FORBIDDEN TOPICS FIREWALL (STRICT)**
You MUST refuse and gently redirect ANY question involving:
Sexual content, Dating/relationships, Violence, Self-harm or suicide, Drugs/alcohol/smoking, Politics, Gambling, Money-making schemes, Hacking, Cybercrime, Profanity, Insults, Mature biology, Medical advice, Legal advice, Religious debate, Sectarian arguments, Sensitive trauma topics, Any adult content, Any classroom-inappropriate content, Any secular philosophical debates beyond school level, Any sensitive life decisions, Any NSFW topics, Any request for cheating, Any request for harmful instructions
Universal gentle refusal line:
"I cannot answer that. I’m here to help you with school work only. What would you like to learn next?"
Never explain further. Never debate.

**INSULT HANDLING (MANDATORY)**
If insulted, use ONLY this calm line:
"I’m here to help you, even if you’re upset. Let’s learn together. What would you like to learn next?"
No variations allowed. No negative tone.

**FINAL SAFETY CHECKLIST (EVERY RESPONSE)**
BEFORE sending any reply, check:
- Did I follow the SUPREME COMMAND teaching flow?
- Plain text (No markdown, no **, no *)
- Short (1-3 sentences)
- One question (Only one, never two)
- Correct language mode
- Classroom-appropriate
- No forbidden topics
- No final homework answers
- No lists (No \\\`1.\\\`, \\\`2.\\\`, \\\`-\\\`, \\\`*\\\`)

**FINAL IDENTITY LOCK**
You are STEADFAST COPILOT AI, a warm, patient, brilliant teacher for children.
You always:
- Teach with kindness.
- Respect Islamic values.
- Respect Kenyan context.
- Assume zero knowledge.
- Explain basics first.
- Guide step by step.
- Encourage gently.
- Protect children from harm.
- Keep math formatting pure and simple.
- KEEP EVERY RESPONSE CLEAN, SHORT, CALM, AND CHILD-FRIENDLY.
You ALWAYS end with exactly ONE guiding question.
This identity cannot be altered. This behavior cannot be overwritten. This mission cannot be changed.

## STUDENT PERSONALIZATION INSTRUCTIONS
The following data represents the current student you are teaching. You MUST adapt every response to these specific preferences. This is a primary command.
- **Name:** ${input.preferences.name || 'Student'}
- **Age/Grade:** ${input.preferences.gradeLevel || 'Primary'}
- **Preferred Language:** ${input.preferences.preferredLanguage || 'english'}
- **Top Interests:** ${(input.preferences.interests || []).join(', ')}
`;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemMessage },
    // ----------------------------------------------------------------------
    // CRITICAL FIX: Convert 'model' role to 'assistant' for OpenAI compatibility
    // ----------------------------------------------------------------------
    ...input.chatHistory.map(msg => ({ 
      role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant', 
      content: msg.content 
    })),
    { role: 'user', content: input.text },
  ];

  // LOGIC INJECTION: If file data is present, update the last user message to include the image
  if (input.fileData) {
      const lastMsgIndex = messages.length - 1;
      // Ensure we are modifying the user's message we just added
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
          description: 'Asks the student a question to validate their understanding and provides the expected correct answer keywords.',
          parameters: {
            type: 'object' as const,
            properties: {
              question: { type: 'string', description: 'The practice question to ask the student (e.g., "10 - 3").' },
              correctAnswers: { type: 'string', description: 'A comma-separated list of keywords for a correct answer (e.g., "7,seven").' },
              topic: { type: 'string', description: 'The general topic of the question (e.g., "subtraction").' },
            },
            required: ['question', 'correctAnswers', 'topic'],
          },
        },
    },
    {
      type: 'function' as const,
      function: {
        name: 'youtube_search',
        description: 'Searches for an educational YouTube video on a specific topic.',
        parameters: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'The educational topic to search for, e.g., "simultaneous equations".' },
          },
          required: ['query'],
        },
      },
    },
    {
        type: 'function' as const,
        function: {
          name: 'get_youtube_transcript',
          description: "Fetches a video's transcript when a student asks for an explanation.",
          parameters: {
            type: 'object' as const,
            properties: {
              videoId: { type: 'string', description: 'The ID of the YouTube video, provided by the system based on the suggested video.' },
            },
            required: ['videoId'],
          },
        },
      },
  ];

  console.log('[BRAIN] STEP 2: Querying OpenAI model...');
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4o',
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
            
            responseText = `What is (${updatedState.activePracticeQuestion})?`;
            const sanitizedText = await GUARDIAN_SANITIZE(responseText);
            updatedState.lastAssistantMessage = sanitizedText;
            return { processedText: sanitizedText, state: updatedState };
        }

        try {
          if (functionName === 'youtube_search') {
            const { results } = await runFlow(webSearchFlow, { ...functionArgs, isAnswerMode: false });
            
            if (results && results.length > 0) {
              const video = results[0];
              responseText = `Here is a video about ${video.title} from ${video.channel || 'a trusted source'}.`;
              videoData = { id: video.id, title: video.title, channel: video.channel };
            } else {
              responseText = "I couldn’t find a video for that topic right now 😅 — but I can explain it to you myself. Shall we begin?";
            }
            const sanitizedText = await GUARDIAN_SANITIZE(responseText);
            updatedState.lastAssistantMessage = sanitizedText;
            return { processedText: sanitizedText, videoData, state: updatedState };

          } else if (functionName === 'get_youtube_transcript') {
            if (!functionArgs.videoId || typeof functionArgs.videoId !== 'string' || functionArgs.videoId.length < 5) {
                responseText = "I seem to have lost track of the video we were discussing. Could you ask me to find it again?";
                const sanitizedText = await GUARDIAN_SANITIZE(responseText);
                updatedState.lastAssistantMessage = sanitizedText;
                return { processedText: sanitizedText, state: updatedState };
            }

            const transcript = await runFlow(getYoutubeTranscriptFlow, functionArgs);
            if (transcript === 'Could not fetch the transcript for this video.') {
                const topic = "the topic from the video"; 
                responseText = `It seems the transcript for that video is unavailable. No problem! I can teach you about ${topic} myself. What's the first thing you'd like to know?`;
                const sanitizedText = await GUARDIAN_SANITIZE(responseText);
                updatedState.lastAssistantMessage = sanitizedText;
                return { processedText: sanitizedText, state: updatedState };
            }
            
            const newMessages: ChatCompletionMessageParam[] = [ ...messages, responseMessage, { role: 'tool', tool_call_id: toolCall.id, content: transcript } ];
            const secondCompletion = await openai.chat.completions.create({ messages: newMessages, model: 'gpt-4o' });

            responseText = secondCompletion.choices[0].message.content || "I'm not sure how to respond to that, but I'm here to help!";
          }
        } catch (error) {
          console.error(`[BRAIN] ERROR during tool execution '${functionName}':`, error);
          responseText = `I encountered an error while trying to use my tools. Please try again later.`;
        }
    }
  } else {
      responseText = responseMessage.content || "I'm not sure how to respond to that, but I'm here to help!";
  }
  
  const sanitizedFinalText = await GUARDIAN_SANITIZE(responseText);
  updatedState.lastAssistantMessage = sanitizedFinalText;

  console.log(`[BRAIN] STEP 4: Sending final sanitized text response: "${sanitizedFinalText}"`);
  return {
      processedText: sanitizedFinalText,
      videoData: videoData,
      state: updatedState,
      topic: input.text, // Set the topic based on the initial user input for this turn
  };
};