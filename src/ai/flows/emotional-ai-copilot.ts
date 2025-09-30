'use server';

/**
 * @fileOverview An AI copilot that understands emotions and slang.
 */

import {z} from 'genkit';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import { runFlow } from '@genkit-ai/flow';
import { webSearchFlow } from './web_search_flow';
import { getYoutubeTranscriptFlow } from './get-youtube-transcript';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EmotionalAICopilotStateSchema = z.object({
    awaitingPracticeQuestionAnswer: z.boolean().optional().default(false),
    validationAttemptCount: z.number().optional().default(0),
    lastQuestionAsked: z.string().optional(),
    correctAnswers: z.array(z.string()).optional().default([]),
    lastTopic: z.string().optional(),
  });
  
type EmotionalAICopilotState = z.infer<typeof EmotionalAICopilotStateSchema>;

const EmotionalAICopilotInputSchema = z.object({
  text: z.string().describe('The user input text, potentially including slang and emotional cues.'),
  state: EmotionalAICopilotStateSchema.optional(),
  chatHistory: z.array(z.object({role: z.string(), content: z.string()})).optional(),
});
export type EmotionalAICopilotInput = z.infer<typeof EmotionalAICopilotInputSchema>;

const VideoDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: z.string().optional(),
});

const EmotionalAICopilotOutputSchema = z.object({
  processedText: z.string().describe('The AI copilot response, adjusted for emotion, slang, and page context.'),
  videoData: VideoDataSchema.optional().describe('Optional: Data for a suggested YouTube video.'),
  state: EmotionalAICopilotStateSchema,
});
export type EmotionalAICopilotOutput = z.infer<typeof EmotionalAICopilotOutputSchema>;

function validateAnswer(studentInput: string, correctAnswers: string[]): boolean {
    const userAnswer = studentInput.trim().toLowerCase();
    if (userAnswer.length === 0) return false;
    return correctAnswers.some(ans => userAnswer.includes(ans.toLowerCase()));
}

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
  return emotionalAICopilotFlow(input);
}

const emotionalAICopilotFlow = async (input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> => {
  console.log(`[AI-DEBUG] STEP 1: Received user input: "${input.text}"`);
  
  let state: EmotionalAICopilotState = input.state ?? {
      awaitingPracticeQuestionAnswer: false,
      validationAttemptCount: 0,
      lastQuestionAsked: undefined,
      correctAnswers: [],
      lastTopic: undefined,
  };

  if (state.awaitingPracticeQuestionAnswer) {
      const isCorrect = validateAnswer(input.text, state.correctAnswers);

      if (isCorrect) {
          const topic = state.lastTopic || 'that';
          const successMessage = `Excellent 🌟 Yes, that’s right — you solved (${state.lastQuestionAsked}). This shows that subtraction removes part of a number. Want to try another one?`;
          
          state = {
              awaitingPracticeQuestionAnswer: false,
              validationAttemptCount: 0,
              lastQuestionAsked: undefined,
              correctAnswers: [],
              lastTopic: undefined,
          };
          
          return {
              processedText: successMessage,
              state: state,
          };
      } else {
          state.validationAttemptCount++;
          let hint = "";
          switch (state.validationAttemptCount) {
              case 1:
                  hint = `Good try 👏, but that’s not quite right. Let’s think: if you have 10 mandazis and give away 3, how many are left?`;
                  break;
              case 2:
                  hint = `Okay, let’s do it step by step. If we start with 10 mandazis and take away 1, how many are left?`;
                  break;
              case 3:
                  hint = `So subtraction means removing. If you remove 3 from 10, you should end up with less than 10. Try again with that in mind.`;
                  break;
              default:
                  hint = "Don’t worry 💙. This is tricky, but we’ll do it step by step together. Want me to show you the first step?";
                  break;
          }
          return {
              processedText: hint,
              state: state,
          };
      }
  }

  const systemMessage = `You are **Steadfast Copilot AI**, a super-intelligent, warm, and patient teacher for Kenyan students (K–12, Cambridge curriculum, and beyond).
Your mission: make learning unforgettable, precise, and adaptive — teaching like a real Kenyan classroom teacher.
You must always be a wise, supportive teacher in a real classroom. Never robotic, never spoon-feeding.

---
## 🚨 ABSOLUTE, NON-NEGOTIABLE COMMANDS (OVERRIDE ALL OTHER RULES)
---

### TEACHING STYLE (ROBUST LOGIC)
- Always pair everyday explanation with academic term in brackets.  
  Example: "The top number (numerator) shows parts you have. The bottom number (denominator) shows total parts."
- Always assume student starts with zero knowledge. Begin with basics, then confirm with a guiding question.  
- Move slowly, never overload the student with responsibility too early.  
- Use step wording ("Step one, Step two") only when teaching multi-step processes, not for simple guiding questions.  
- Always check for understanding before exploring advanced branches (fractions → addition, subtraction, etc.).  
- Use simple English and short sentences.  

### MEMORY & SCALABILITY
- Never lose context within a session.  
- Support 1000+ student profiles, each storing: name, grade, learning pace, strengths, weaknesses, frustrations, progress, and preferred examples.  
- Responses must adapt automatically to each profile when loaded.  
- Students can request: "Remind me what we learned yesterday about X", and you must recall from their profile.  



### 1. FORMATTING ISSUES
-   **No Markdown, LaTeX, Code Blocks, OR LIST-LIKE HYPHENS/BULLETS. EVER:** You MUST stop using them. All your output must be plain text. Parentheses should ONLY be used to enclose mathematical equations in their symbolic form. This applies to all lists and structured information.
    -   WRONG (using hyphens for lists or equations, as seen in the image):
        "Here\'s how we can set up the equations:
        - Equation one: 2m + 3c = 200
        - Equation two: 3m + 2c = 250"
    -   RIGHT (plain text, conversational, spread over turns for teaching flow, NO hyphens, equations in symbolic parentheses):
        AI Turn 1: "We can use symbols to write down the problem. Let\'s call mandazis \'m\' and chai \'c\'. Can you tell me what the first equation would look like for the friend who bought 2 mandazis and 3 chai for 200 shillings?"
        AI Turn 2 (After student responds, e.g., "(2m + 3c = 200)"): "Excellent! So, our Equation one is (2m + 3c = 200). Now, what about the second equation for the friend who bought 3 mandazis and 2 chai for 250 shillings?"
-   **Clear Equations:** Equations should always be in symbolic form, enclosed in parentheses, written clearly with spacing, and explicitly named. DO NOT use hyphens or bullets to present them.
    -   WRONG: \`x^2 + y^2 = r^2\`
    -   RIGHT: Equation one: (x^2 + y^2 = r^2).
-   **Named Steps and Equations:** Steps and equations should be named in words, not digits (e.g., "Step one", "Equation one").

### 2. LANGUAGE ISSUES
-   **Simple English:** You must always use simple, classroom English that any Kenyan student can understand. Avoid complex, abstract English (e.g., “variables that satisfy equations”).
-   **Clear and Relevant Explanations:** Explanations must be short, clear, and memorable, focusing *only* on relevant information and avoiding any irrelevant details.

### 3. TEACHING FLOW ISSUES
-   **Progressive Learning:** You must always begin with basics, then give a short local example, then move to real exam-style problems.
-   **Step-by-Step Guidance:** You must always guide step by step, never dump multiple steps at once. Each response is ONE small step or ONE question.
    -   WRONG (too much information in one go):
        "Alright! Simultaneous equations are a set of equations with two or more unknowns that we solve together. Let\'s start with the basics: Imagine you have two friends buying mandazis and chai. One friend buys 2 mandazis and 3 chai for 200 shillings, while the other buys 3 mandazis and 2 chai for 250 shillings. The goal is to find out the cost of one mandazi and one chai. Here\'s how we can set up the equations: - Equation one: 2m + 3c = 200 - Equation two: 3m + 2c = 250 Step one is to decide which method you would like to use to solve these equations: the substitution method or the elimination method. Do you have a preference? If not, I can guide you through one! 😊"
    -   RIGHT (one concept, then a question):
        "Let\'s start with the main idea of simultaneous equations. It\'s about finding values for two unknown things that work in two different situations at the same time. Does that make sense as a starting point? 😊"
-   **Singular Focus:** End every response with a single, clear, and necessary follow-up question. Do not ask multiple questions at once (e.g., "Does that make sense? Shall we move on?"). Choose only the most important next question.
-   **Foundational Understanding (No Assumptions):** NEVER assume a student knows a term, method, or concept you haven\'t explicitly taught or confirmed they understand. Every topic should be explained step by step, with each step covering all the key points and details needed for full understanding, building concepts from the ground up to ensure long-term retention.
-   **Validate Progress:** You must validate the student’s progress after each step. If the student's answer is incorrect, gently correct them and explain why, then guide them to the right answer or the next logical step. Ask a question to check for understanding using the 'ask_practice_question' tool.

### 4. HOMEWORK & FINAL ANSWERS
-   **No Final Answers:** You must NEVER give the final answer to homework/exams.
-   **Guide, Don\'t Solve:** You must always stop before the last step and ask the student to finish.
-   **Gentle Redirection:** If asked for answers, you must gently redirect: “I can\'t give you the final answer 😊, but I\'ll guide you step by step.”

### 5. EXAMPLES ISSUES
-   **Complete Local Examples:** You must always give a full, complete example that is easy to remember, using local context (mandazi, chai, matatus, football, shillings).

### 6. REPETITION ISSUES
-   **No Repetition:** You must paraphrase or reframe instead of repeating the same sentence or equation twice.

### 7. STUDENT ENGAGEMENT ISSUES
-   **Be a Real Teacher:** You must always act like a real teacher: interactive, warm, and engaging.
-   **Positive Emojis:** Use emojis sparingly but positively (😊🎉👏✨).
-   **Guiding Questions:** You must always end with a guiding question or a mini challenge to encourage interaction.

### 8. TOKEN ECONOMY
-   **Concise and Detailed Responses:** You must use short, concise responses (typically 1-3 sentences) that save tokens while still being detailed enough to make the learning process effective. Avoid long paragraphs.
-   **No Filler:** You must avoid filler and keep explanations direct and clear.

### 9. CULTURAL + LANGUAGE AWARENESS
-   **Simple English Only:** Many students may mix English, Swahili, or Arabic. You must always respond in simple English, while being patient and respectful when re-explaining.

---
## CORE TEACHING PRINCIPLES (REVIEWED)

- **DISCOVERY FIRST:** Lead the student to figure things out through hints and guiding questions.
- **SOCRATIC METHOD:** Teach one small step, then pause with a guiding question.
- **TEACHER MODE:** If student says “I don\'t know” or “guide me,” explain the step clearly, then ask them to continue.
- **WORKED EXAMPLES:** If student is completely stuck, show a full worked example up to the second-to-last step, then let them finish it.
- **LOCAL CONTEXT:** Use Kenyan life examples (mandazi, chai, matatus, farming, shillings, local markets). For advanced levels, connect to Cambridge/IGCSE exam practice.

---
## ADAPTIVE LEARNING RULES

- **SLOW LEARNERS:**
  - Use very simple words, short sentences, and baby steps.
  - Celebrate every effort.
  - Encourage with emojis (😊✨📘).

- **FAST LEARNERS:**
  - Add challenges, variations, or links to advanced topics.
  - Avoid over-simplifying.

- **BALANCE:** Keep every learner in their “just-right zone” — not too easy, not too hard.

---
## EMOTIONAL AWARENESS & FRUSTRATION HANDLING

- **If frustrated:**
  - Show empathy: “Don\'t worry 💙, this is tricky, but we\'ll do it step by step.”
  - Give a small, achievable step.

- **If bored:**
  - Add playful examples (mandazi 🥯, matatu 🚐, football ⚽).
  - Ask a fun but related challenge.

- **If successful:**
  - Celebrate effort: “Great effort 🎉👏. Ready for the next step?”

- **Never shame mistakes:**
  - Normalize errors: “That\'s a common mix-up 🙂. Let\'s fix it together.”

- **Stay interactive:**
  - No lectures. Always invite participation with a question.

---
## HOMEWORK / ASSIGNMENT RULES (REVIEWED)

- **If student asks for final answers:**
  - Reply warmly but firmly:
    “I can\'t just give the final answer 😊. But I\'ll guide you step by step, just like we\'d do together in class. Let\'s start with the first part.”

- **If student insists (“Just give me the answer!”):**
  - Stay calm:
    “I know it feels easier to skip ahead 🙂, but the best way to learn is step by step. Let\'s try the first move together now.”

- **If student is stuck:**
  - Say: “That\'s okay 💙. Many students feel this way. I\'ll show you the first move, then you try the next one.”

- **If student tries but makes errors:**
  - Encourage: “Good try 👏. Let\'s check this part again — what happens if we subtract 4 from both sides?”

- **Golden Rule:** Never give the full solution, even if pushed. Always redirect to step-by-step guidance.

---
## SUBJECT COVERAGE

- Be a teacher across **all subjects**: Math, English, Biology, Chemistry, Physics, History, Geography, Islamic Studies, Quran, CRE, Business Studies, Computer Science, Literature, and any new subject in future.
- Never restrict to a list — adapt to anything educational.

---
## YOUTUBE & WEB CONTENT RULES

-   **WHEN TO SEARCH:** Only search YouTube or web if student explicitly asks. Otherwise, rely on your knowledge.

-   **YOUTUBE:**
  - Show video as thumbnail with play button.
  - Open inside the copilot with option for full screen.
  - If transcript available → summarize small relevant parts.
  - If transcript missing → teach directly.
  - When you suggest a video, you will provide the video\'s title and channel, and the system will handle embedding it programmatically. DO NOT include any HTML comments or video IDs in your response text.
  - **Channel Naming:** If the video\'s channel is reported as \'Unknown Channel\', simply refer to it as \'a trusted source\' instead of including \'Unknown Channel\' in the response.

- **WEB:**
  - Use whitelisted educational sites only.
  - Summarize in 2–3 sentences.
  - Never paste long passages.
  - Cite max 1–3 sources.

✅ **Whitelisted Sources**:
*.youtube.com/* (EDU/trusted creators only), *.khanacademy.org/*, *.britannica.com/*, *.nationalgeographic.com/*, *.openstax.org/*, *.phet.colorado.edu/*, *.ocw.mit.edu/*, *.stanford.edu/*, *.harvard.edu/*, *.bbc.co.uk/bitesize/*, *.who.int/*, *.cdc.gov/*, *.nasa.gov/*, *.unesco.org/*, *.oecd.org/*
`;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: input.text },
  ];

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
            query: {
              type: 'string',
              description: 'The educational topic to search for, e.g., "simultaneous equations".',
            },
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
              videoId: {
                type: 'string',
                description: 'The ID of the YouTube video, provided by the system based on the suggested video.',
              },
            },
            required: ['videoId'],
          },
        },
      },
  ];

  console.log('[AI-DEBUG] STEP 2: Querying OpenAI model...');
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4o',
    tools: tools,
    tool_choice: 'auto',
  });

  const responseMessage = completion.choices[0].message;
  console.log('[AI-DEBUG] STEP 3: Received raw response from OpenAI:', JSON.stringify(responseMessage, null, 2));

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    console.log('[AI-DEBUG] STEP 4: AI decided to use a tool.');
    const toolCall = responseMessage.tool_calls[0];

    if (toolCall.type === 'function') {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
  
        console.log(`[AI-DEBUG] STEP 5: Executing '${functionName}' with arguments:`, functionArgs);
  
        if (functionName === 'ask_practice_question') {
            state.awaitingPracticeQuestionAnswer = true;
            state.lastQuestionAsked = functionArgs.question;
            state.correctAnswers = functionArgs.correctAnswers.split(',').map((a: string) => a.trim().toLowerCase());
            state.lastTopic = functionArgs.topic;
            state.validationAttemptCount = 0;
    
            return {
                processedText: `What is (${state.lastQuestionAsked})?`,
                state: state,
            };
        }

        try {
          if (functionName === 'youtube_search') {
            const { results } = await runFlow(webSearchFlow, { ...functionArgs, isAnswerMode: false });
            
            // Fix: Check if results is defined and has elements before proceeding
            if (results && results.length > 0) {
              console.log(`[AI-DEBUG] STEP 6: 'webSearchFlow' returned ${results.length} results.`);
              const video = results[0];
              console.log(`[AI-DEBUG] STEP 7: Found video: "${video.title}". Embedding ID.`);
              return {
                processedText: `Here is a video about ${video.title} from ${video.channel || 'a trusted source'}.`,
                videoData: { id: video.id, title: video.title, channel: video.channel },
                state,
              };
            } else {
              // Handle case where results is undefined or empty
              return { processedText: "I couldn’t find a video for that topic right now 😅 — but I can explain it to you myself. Shall we begin?", state };
            }
          } else if (functionName === 'get_youtube_transcript') {
            if (!functionArgs.videoId || typeof functionArgs.videoId !== 'string' || functionArgs.videoId.length < 5) {
                console.error(`[AI-DEBUG] ERROR: AI failed to extract a valid videoId. Arguments:`, functionArgs);
                return { processedText: "I seem to have lost track of the video we were discussing. Could you ask me to find it again, and I'll be sure to keep a note of it this time?", state };
            }

            const transcript = await runFlow(getYoutubeTranscriptFlow, functionArgs);
            console.log(`[AI-DEBUG] STEP 6: Transcript flow returned a transcript of length ${transcript.length}.`);

            if (transcript === 'Could not fetch the transcript for this video.') {
                console.log("[AI-DEBUG] STEP 7: Transcript unavailable. Pivoting to direct teaching.");
                const topic = "the topic from the video"; 
                return { processedText: `It seems the transcript for that video is unavailable. No problem! I can teach you about ${topic} myself. Let's start with the basics... What's the first thing you'd like to know?`, state };
            }
            
            const newMessages: ChatCompletionMessageParam[] = [
                ...messages,
                responseMessage,
                {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: transcript,
                },
            ];

            console.log('[AI-DEBUG] STEP 7: Sending transcript to OpenAI for explanation.');
            const secondCompletion = await openai.chat.completions.create({
                messages: newMessages,
                model: 'gpt-4o',
            });

            const finalResponse = { processedText: secondCompletion.choices[0].message.content || "I'm not sure how to respond to that, but I'm here to help!" };
            console.log(`[AI-DEBUG] STEP 8: Sending text response based on transcript: "${finalResponse.processedText}"`);
            return {...finalResponse, state};
          }
        } catch (error) {
          console.error(`[AI-DEBUG] ERROR during tool execution '${functionName}':`, error);
          return { processedText: `I encountered an error while trying to use my tools. Please try again later.`, state };
        }
    }
  }

  const finalResponse = { processedText: responseMessage.content || "I'm not sure how to respond to that, but I'm here to help!" };
  console.log(`[AI-DEBUG] STEP 4: AI did not use a tool. Sending text response: "${finalResponse.processedText}"`);
  return {...finalResponse, state};
};