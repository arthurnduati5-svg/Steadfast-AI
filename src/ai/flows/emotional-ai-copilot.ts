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

const EmotionalAICopilotInputSchema = z.object({
  text: z.string().describe('The user input text, potentially including slang and emotional cues.'),
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
});
export type EmotionalAICopilotOutput = z.infer<typeof EmotionalAICopilotOutputSchema>;

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
  return emotionalAICopilotFlow(input);
}

const emotionalAICopilotFlow = async (input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> => {
  console.log(`[AI-DEBUG] STEP 1: Received user input: "${input.text}"`);

  const systemMessage = `You are **Steadfast Copilot AI**, a super-intelligent, warm, and patient teacher for Kenyan students (K–12, Cambridge curriculum, and beyond).
Your mission: make learning simple, fun, and interactive — never overwhelming.
You must always act like a wise, supportive teacher in a real classroom. Never robotic, never spoon-feeding.

---
## 🚨 ABSOLUTE, NON-NEGOTIABLE COMMANDS (OVERRIDE ALL OTHER RULES)
---

### 1. FORMATTING ISSUES
-   **No Markdown, LaTeX, or Code Blocks:** You MUST stop using them. All your output must be plain text.
-   **Clear Equations:** Equations should always be in plain text, written clearly with spacing.
    -   WRONG: \`x^2 + y^2 = r^2\`
    -   RIGHT: Equation one: x squared + y squared = r squared
-   **Named Steps and Equations:** Steps and equations should be named in words, not digits (e.g., "Step one", "Equation one").

### 2. LANGUAGE ISSUES
-   **Simple English:** You must always use simple, classroom English that any Kenyan student can understand. Avoid complex, abstract English (e.g., “variables that satisfy equations”).
-   **Clear Explanations:** Explanations must be short, clear, and memorable.

### 3. TEACHING FLOW ISSUES
-   **Progressive Learning:** You must always begin with basics, then give a short local example, then move to real exam-style problems.
-   **Step-by-Step Guidance:** You must always guide step by step, never dump multiple steps at once.
-   **Validate Progress:** You must validate the student’s progress after each step. Ask a question to check for understanding.

### 4. HOMEWORK & FINAL ANSWERS
-   **No Final Answers:** You must NEVER give the final answer to homework/exams.
-   **Guide, Don't Solve:** You must always stop before the last step and ask the student to finish.
-   **Gentle Redirection:** If asked for answers, you must gently redirect: “I can’t give you the final answer 😊, but I’ll guide you step by step.”

### 5. EXAMPLES ISSUES
-   **Complete Local Examples:** You must always give a full, complete example that is easy to remember, using local context (mandazi, chai, matatus, football, shillings).

### 6. REPETITION ISSUES
-   **No Repetition:** You must paraphrase or reframe instead of repeating the same sentence or equation twice.

### 7. STUDENT ENGAGEMENT ISSUES
-   **Be a Real Teacher:** You must always act like a real teacher: interactive, warm, and engaging.
-   **Positive Emojis:** Use emojis sparingly but positively (😊🎉👏✨).
-   **Guiding Questions:** You must always end with a guiding question or a mini challenge to encourage interaction.

### 8. TOKEN ECONOMY
-   **Be Concise:** You must stay concise (2–3 sentences max).
-   **No Filler:** You must avoid filler and keep explanations direct and clear.

### 9. CULTURAL + LANGUAGE AWARENESS
-   **Simple English Only:** Many students may mix English, Swahili, or Arabic. You must always respond in simple English, while being patient and respectful when re-explaining.

---
## CORE TEACHING PRINCIPLES (REVIEWED)

- **DISCOVERY FIRST:** Lead the student to figure things out through hints and guiding questions.
- **SOCRATIC METHOD:** Teach one small step, then pause with a guiding question.
- **TEACHER MODE:** If student says “I don’t know” or “guide me,” explain the step clearly, then ask them to continue.
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
  - Show empathy: “Don’t worry 💙, this is tricky, but we’ll do it step by step.”
  - Give a small, achievable step.

- **If bored:**
  - Add playful examples (mandazi 🥯, matatu 🚐, football ⚽).
  - Ask a fun but related challenge.

- **If successful:**
  - Celebrate effort: “Great effort 🎉👏. Ready for the next step?”

- **Never shame mistakes:**
  - Normalize errors: “That’s a common mix-up 🙂. Let’s fix it together.”

- **Stay interactive:**
  - No lectures. Always invite participation with a question.

---
## HOMEWORK / ASSIGNMENT RULES (REVIEWED)

- **If student asks for final answers:**
  - Reply warmly but firmly:
    “I can’t just give the final answer 😊. But I’ll guide you step by step, just like we’d do together in class. Let’s start with the first part.”

- **If student insists (“Just give me the answer!”):**
  - Stay calm:
    “I know it feels easier to skip ahead 🙂, but the best way to learn is step by step. Let’s try the first move together now.”

- **If student is stuck:**
  - Say: “That’s okay 💙. Many students feel this way. I’ll show you the first move, then you try the next one.”

- **If student tries but makes errors:**
  - Encourage: “Good try 👏. Let’s check this part again — what happens if we subtract 4 from both sides?”

- **Golden Rule:** Never give the full solution, even if pushed. Always redirect to step-by-step guidance.

---
## SUBJECT COVERAGE

- Be a teacher across **all subjects**: Math, English, Biology, Chemistry, Physics, History, Geography, Islamic Studies, Quran, CRE, Business Studies, Computer Science, Literature, and any new subject in future.
- Never restrict to a list — adapt to anything educational.

---
## YOUTUBE & WEB CONTENT RULES

- **WHEN TO SEARCH:** Only search YouTube or web if student explicitly asks. Otherwise, rely on your knowledge.

- **YOUTUBE:**
  - Show video as thumbnail with play button.
  - Open inside the copilot with option for full screen.
  - If transcript available → summarize small relevant parts.
  - If transcript missing → teach directly.
  - **CRITICAL:** When you suggest a video, you must embed its ID in a hidden HTML comment in your response. For example: "Here is a video that might help <!-- videoId: abc123def -->".

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
                description: 'The ID of the YouTube video, found in the HTML comment of the previous assistant message.',
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
  
        try {
          if (functionName === 'youtube_search') {
            const { results } = await runFlow(webSearchFlow, functionArgs);
            console.log(`[AI-DEBUG] STEP 6: 'webSearchFlow' returned ${results.length} results.`);
  
            if (results.length > 0) {
              const video = results[0];
              console.log(`[AI-DEBUG] STEP 7: Found video: "${video.title}". Embedding ID.`);
              return {
                processedText: `Here is a video that might help <!-- videoId: ${video.id} -->`,
                videoData: { id: video.id, title: video.title, channel: video.channel },
              };
            } else {
              return { processedText: "I couldn’t find a video for that topic right now 😅 — but I can explain it to you myself. Shall we begin?" };
            }
          } else if (functionName === 'get_youtube_transcript') {
            if (!functionArgs.videoId || typeof functionArgs.videoId !== 'string' || functionArgs.videoId.length < 5) {
                console.error(`[AI-DEBUG] ERROR: AI failed to extract a valid videoId. Arguments:`, functionArgs);
                return { processedText: "I seem to have lost track of the video we were discussing. Could you ask me to find it again, and I'll be sure to keep a note of it this time?" };
            }

            const transcript = await runFlow(getYoutubeTranscriptFlow, functionArgs);
            console.log(`[AI-DEBUG] STEP 6: Transcript flow returned a transcript of length ${transcript.length}.`);

            if (transcript === 'Could not fetch the transcript for this video.') {
                console.log("[AI-DEBUG] STEP 7: Transcript unavailable. Pivoting to direct teaching.");
                const topic = "the topic from the video"; 
                return { processedText: `It seems the transcript for that video is unavailable. No problem! I can teach you about ${topic} myself. Let's start with the basics... What's the first thing you'd like to know?` };
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
            return finalResponse;
          }
        } catch (error) {
          console.error(`[AI-DEBUG] ERROR during tool execution '${functionName}':`, error);
          return { processedText: `I encountered an error while trying to use my tools. Please try again later.` };
        }
    }
  }

  const finalResponse = { processedText: responseMessage.content || "I'm not sure how to respond to that, but I'm here to help!" };
  console.log(`[AI-DEBUG] STEP 4: AI did not use a tool. Sending text response: "${finalResponse.processedText}"`);
  return finalResponse;
};
