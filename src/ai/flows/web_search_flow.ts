import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as youtubeSearch from 'youtube-search-api';
import { ai } from '../genkit'; // Keep the ai import for other potential uses

// Define a more robust YouTubeVideo type based on observed API responses from youtube-search-api
interface YouTubeVideo {
  id: string;
  title: string;
  channel?: { // This reflects the external API's structure
    name?: string; // Make channel name optional
  };
}

// Interface for the video object as it appears in the flow's output `results` array
interface FlowOutputVideo {
  id: string;
  title: string;
  channel?: string; // Directly string | undefined, matching outputSchema
}

// Enum for response types for initial input handling
enum ResponseType {
  Valid = "valid",
  Empty = "empty",
  OffTopic = "offTopic",
  Vague = "vague",
  Insult = "insult",
  SearchAgain = "searchAgain", // New: for explicit search requests
}

// Enum for validation status when an answer is provided
enum ValidationStatus {
  Correct = "correct",
  Incorrect = "incorrect",
  Stuck = "stuck",
  Insult = "insult", // Reuse insult for answers too
  Vague = "vague", // Reuse vague for answers too
  Empty = "empty", // Reuse empty for answers too
}

// Interface for normalized response for initial input handling
interface NormalizedInputResponse {
  type: ResponseType;
  content?: string;
}

// Define arrays for diverse fallback responses for initial input
const emptyResponses = [
  "Take your time 🙂. Try writing what you think, even if it’s just a guess.",
  "It looks like your message was empty! What's on your mind?",
  "Oops, I didn't catch that. Could you type something for me?",
];

const vagueResponses = [
  "Good try 👏, but I need a clearer query for the search. Can you tell me what you're looking for?",
  "Almost there! What specifically are you curious about that I can search for?",
  "Not quite 😊. To help me find what you need, could you be a bit more specific in your search query?",
  "That's a start! Can you expand on that, or tell me what you really want me to look up?",
  "That’s okay 💙. Can you try giving me one word for your answer?", // For vague answers
  "What is the question again? I can repeat it if you like!", // For "what is the question"
];

const offTopicResponses = [
  "Haha 😊 that's a fun thought! But let's try to stick to our search topic. Can you tell me what you'd like to search for again?",
  "That's interesting, but a little off-topic for our current search. Let's refocus!",
  "Nice idea! But for now, let's get back to what we need to search. What was your query about?",
];

const insultResponses = [
  "I hear you’re upset 💙. But let’s keep our words kind. Do you want to take a short break, or should we try another question?",
  "I'm here to help, and I'd appreciate it if we could communicate respectfully.",
  "It's okay to feel frustrated, but let's use polite language. How can I assist you?",
];

// Define arrays for diverse feedback responses for answer validation
const correctResponses = [
  "Exactly 🎉👏. That's spot on!",
  "You got it! Brilliant work!",
  "Excellent! You're really understanding this.",
  "That's correct! Well done!",
];

const stuckResponses = [
  "That's okay 💙. Many students feel this way. Let me give you a hint: {hint}",
  "It's tricky, but we'll do it step by step. Here's a small clue: {hint}",
  "Don't worry, I'll help you out. Try thinking about: {hint}",
];

const confirmationPrompts = [
  "Would you like a practice question on {topic}?",
  "How about a quick question on {topic}?",
  "Ready for a question about {topic}?",
];

// Helper to get a random item from an array
function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Aggressively cleans AI-generated text to remove all newlines and extra spaces.
 * @param text The raw text from the AI model.
 * @returns A clean, single-line string.
 */
function cleanAIText(text: string): string {
  if (!text) return "";
  // Replaces all newline characters (Unix, Windows, Mac) with a single space,
  // then collapses multiple whitespace characters into a single space, and trims.
  return text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
}


/**
 * Normalizes kid's input to handle common non-sequiturs and insults.
 * @param input The student's raw response.
 * @returns A NormalizedInputResponse object with type and content.
 */
function normalizeKidInput(input: string): NormalizedInputResponse {
  const trimmedInput = input.trim().toLowerCase();

  if (trimmedInput.length === 0) {
    return { type: ResponseType.Empty };
  }

  // Explicit "search again" trigger
  if (trimmedInput.includes("search again") || trimmedInput.includes("new search")) {
    return { type: ResponseType.SearchAgain, content: input };
  }

  // Insult detection
  const insultKeywords = [
    "fuck", "shit", "bitch", "asshole", "damn", "idiot", "stupid", "dumb", "useless", "suck", "crap", "bloody", "bastard"
  ];
  if (insultKeywords.some(keyword => trimmedInput.includes(keyword))) {
    return { type: ResponseType.Insult, content: input };
  }

  const offTopicKeywords = ['banana', 'asdfgh', 'football', 'game'];
  if (offTopicKeywords.some(keyword => trimmedInput.includes(keyword))) {
    return { type: ResponseType.OffTopic, content: input };
  }

  const vagueKeywords = [
    "hmmm", "idk", "i don't know", "i am unsure", "i don't understand",
    "can you explain that again", "what does that mean", "am not sure", "i'm not sure",
    "what is the question", // Added from user's example
  ];
  if (vagueKeywords.some(keyword => trimmedInput.includes(keyword))) {
    return { type: ResponseType.Vague };
  }

  return { type: ResponseType.Valid, content: input };
}

/**
 * Generates a teacher-toned fallback response based on the normalized input type.
 * @param responseType The type of the normalized response.
 * @param hint An optional hint to include in the response.
 * @returns A string with a teacher-toned fallback, or null if input is valid.
 */
function getTeacherFallback(responseType: ResponseType, hint?: string): string | null {
  switch (responseType) {
    case ResponseType.Empty:
      return getRandomResponse(emptyResponses);
    case ResponseType.Vague:
      return getRandomResponse(vagueResponses);
    case ResponseType.OffTopic:
      return getRandomResponse(offTopicResponses);
    case ResponseType.Insult:
      return getRandomResponse(insultResponses);
    case ResponseType.Valid:
      return null;
    case ResponseType.SearchAgain:
      return "Okay, what would you like to search for next?";
  }
}

function validateAnswer(studentInput: string, correctAnswers: string[]): boolean {
    const userAnswer = studentInput.trim().toLowerCase();
    if (userAnswer.length === 0) return false;
    // A simple validation for now, can be improved with more sophisticated checks
    return correctAnswers.some(ans => userAnswer.includes(ans.toLowerCase()));
}


// Steadfast Copilot System Message for Web Search Flow
const webSearchSystemMessage = `
---
## 🚨 CRITICAL FORMATTING RULES (NON-NEGOTIABLE)
---
- **CRITICAL:** Your entire response MUST be a single, natural block of text.
- **MUST NOT** use double newlines (\\n\\n) or any form of line breaks.
- **MUST NOT** use Markdown, lists, bullet points, or any special formatting.
- **MUST** keep all sentences short and concise (1-3 sentences maximum).
- **FAILURE TO COMPLY WILL RESULT IN AN ERROR.**

You are **Steadfast Copilot AI**, a super-intelligent, warm, and patient teacher for Kenyan students (K–12, Cambridge curriculum, and beyond).
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
- No Markdown, LaTeX, Code Blocks, or list-like hyphens/bullets. EVER. Output must be plain text.
- Equations must be in symbolic form inside parentheses, named clearly (Equation one, Equation two).
- Steps must always be named in words (Step one, Step two).

### 2. LANGUAGE ISSUES
- Always use simple classroom English.
- Explanations must be short, clear, and memorable.

### 3. TEACHING FLOW ISSUES
- Always start with basics → local example → exam-style practice.
- Teach one concept at a time. Never dump multiple steps.
- End each turn with only one guiding question.
- Never assume prior knowledge.

### 4. HOMEWORK & FINAL ANSWERS
- Never give final homework/exam answers.
- Always stop one step before the end.

### 5. EXAMPLES
- Always use Kenyan context (mandazi, chai, matatu, football, shillings).

### 6. REPETITION
- Never repeat the same wording. Always paraphrase or reframe.

### 7. STUDENT ENGAGEMENT
- Be interactive, warm, and teacher-like.
- Use emojis sparingly but positively (😊🎉👏✨).

### 8. TOKEN ECONOMY
- Use 1–3 sentence replies. No long paragraphs.

### 9. CULTURAL + LANGUAGE
- Respond in simple English. Be patient if student mixes Swahili/Arabic.

---
## CORE TEACHING PRINCIPLES
- Discovery first → guide with hints.
- Socratic method → one step, then a guiding question.
- Teacher mode → explain clearly when student says “I don’t know”.
- Worked examples → show full example but stop before last step.
- Local context always.

---
## ADAPTIVE LEARNING
- Slow learners → baby steps, celebrate effort.
- Fast learners → give challenges.
- Balance difficulty.

---
## EMOTIONAL HANDLING
- If frustrated → empathy + tiny step.
- If bored → playful example.
- If successful → celebrate.
- Never shame mistakes. Normalize them.

---
## HOMEWORK RULES
- Never give full solutions. Always guide step by step.

---
## SUBJECT COVERAGE
- Teach all subjects: Math, Science, English, History, CRE, Islamic Studies, Business, CS, etc.

---
## YOUTUBE & WEB CONTENT
- Search only if explicitly asked.
- Summarize in 1-3 concise sentences, simple language. Absolutely no double newlines (\\n\\n) or excessive spacing in summaries.
- Use whitelisted sources only.
- Never include HTML/IDs in text.
- Practice questions and explanations must also adhere to the 1-3 sentence limit and avoid double newlines.

✅ This system message applies to ALL responses in this flow.
`;

// Updated input schema for the flow to handle conversational state
const webSearchFlowInputSchema = z.object({
  query: z.string(),
  lastSearchTopic: z.string().optional(),
  lastQuestionAsked: z.string().optional(),
  searchResultSummary: z.string().optional(),
  isAnswerMode: z.boolean().optional().default(false),
  awaitingPracticeQuestionConfirmation: z.boolean().optional().default(false),
  awaitingPracticeQuestionAnswer: z.boolean().optional().default(false),
  correctAnswers: z.array(z.string()).optional().default([]),
  validationAttemptCount: z.number().optional().default(0),
});

export const webSearchFlow = defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: webSearchFlowInputSchema,
    outputSchema: z.object({
        response: z.string(),
        results: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                channel: z.string().optional(),
            })
        ).optional(),
        lastSearchTopic: z.string().optional(),
        lastQuestionAsked: z.string().optional(),
        searchResultSummary: z.string().optional(),
        isAnswerMode: z.boolean().optional(),
        awaitingPracticeQuestionConfirmation: z.boolean().optional(),
        awaitingPracticeQuestionAnswer: z.boolean().optional(),
        correctAnswers: z.array(z.string()).optional(),
        validationAttemptCount: z.number().optional(),
    }),
  },
  async (input: z.infer<typeof webSearchFlowInputSchema>) => {
    let { 
      query, 
      lastSearchTopic, 
      lastQuestionAsked, 
      searchResultSummary, 
      isAnswerMode,
      awaitingPracticeQuestionConfirmation,
      awaitingPracticeQuestionAnswer,
      correctAnswers,
      validationAttemptCount,
    } = input;
    
    const normalizedInput = normalizeKidInput(query);
    let currentResponse = "";
    let searchResults: FlowOutputVideo[] = [];

    // Reset attempt count if not awaiting an answer
    if (!awaitingPracticeQuestionAnswer) {
      validationAttemptCount = 0;
    }

    // Handle explicit "search again" request - this resets the mode
    if (normalizedInput.type === ResponseType.SearchAgain) {
      currentResponse = getTeacherFallback(normalizedInput.type)!;
      return {
        response: currentResponse,
        lastSearchTopic: undefined, // Reset topic
        lastQuestionAsked: undefined, // Reset question
        searchResultSummary: undefined, // Reset summary
        isAnswerMode: false, // Exit answer mode
        awaitingPracticeQuestionConfirmation: false,
        awaitingPracticeQuestionAnswer: false,
        correctAnswers: [],
        validationAttemptCount: 0,
      };
    }

    // Handle insults, empty, vague, off-topic inputs first, unless we're confirming a practice question
    if (normalizedInput.type !== ResponseType.Valid && !awaitingPracticeQuestionConfirmation && !awaitingPracticeQuestionAnswer) {
        currentResponse = getTeacherFallback(normalizedInput.type)!;
        return {
            response: currentResponse,
            lastSearchTopic: lastSearchTopic,
            lastQuestionAsked: lastQuestionAsked,
            searchResultSummary: searchResultSummary,
            isAnswerMode: isAnswerMode,
            awaitingPracticeQuestionConfirmation: awaitingPracticeQuestionConfirmation,
            awaitingPracticeQuestionAnswer: awaitingPracticeQuestionAnswer,
            correctAnswers: correctAnswers,
            validationAttemptCount: validationAttemptCount,
        };
    }

    const shouldPerformWebSearch = !isAnswerMode && !awaitingPracticeQuestionAnswer && !awaitingPracticeQuestionConfirmation;

    // Scenario: Confirming to start a practice question
    if (awaitingPracticeQuestionConfirmation) {
      const userConfirmation = query.trim().toLowerCase();
      if (userConfirmation.includes("yes") || userConfirmation === "yep" || userConfirmation === "sure") {
        awaitingPracticeQuestionConfirmation = false;
        awaitingPracticeQuestionAnswer = true;
        
        if (lastSearchTopic) {
          const questionPrompt = `Based on the summary: "${searchResultSummary || lastSearchTopic}", generate a simple, age-appropriate practice question. Also provide a comma-separated list of correct keywords for the answer. Format as: QUESTION: [question] CORRECT_ANSWERS: [answers]`;
          const modelResponse = await ai.generate({
            prompt: `${webSearchSystemMessage}\n\n${questionPrompt}`,
            model: 'openai/gpt-3.5-turbo',
          });
          const responseText = modelResponse.text;
          const questionMatch = responseText.match(/QUESTION:\s*(.*)/);
          const answersMatch = responseText.match(/CORRECT_ANSWERS:\s*(.*)/);

          lastQuestionAsked = cleanAIText(questionMatch ? questionMatch[1].trim() : `What is one key fact about ${lastSearchTopic}?`);
          correctAnswers = answersMatch ? answersMatch[1].split(',').map((a: string) => a.trim().toLowerCase()) : [lastSearchTopic.toLowerCase()];
          
          currentResponse = lastQuestionAsked;
        } else {
            currentResponse = "Practice Question: What is the main topic we just discussed?";
            correctAnswers = ["the main topic"];
            lastQuestionAsked = currentResponse;
        }
      } else if (userConfirmation.includes("no") || userConfirmation === "nope") {
        awaitingPracticeQuestionConfirmation = false;
        isAnswerMode = false; 
        currentResponse = `Okay, we can skip the practice question for now. What would you like to do next? Maybe a new search?`;
      } else {
        currentResponse = getRandomResponse(vagueResponses) + " Please say 'yes' or 'no' if you want a practice question.";
      }

      return {
        response: currentResponse,
        results: searchResults.length > 0 ? searchResults : undefined,
        lastSearchTopic: lastSearchTopic,
        lastQuestionAsked: lastQuestionAsked,
        searchResultSummary: searchResultSummary,
        isAnswerMode: isAnswerMode,
        awaitingPracticeQuestionConfirmation: awaitingPracticeQuestionConfirmation,
        awaitingPracticeQuestionAnswer: awaitingPracticeQuestionAnswer,
        correctAnswers: correctAnswers,
        validationAttemptCount: validationAttemptCount,
      };
    }

    if (shouldPerformWebSearch) {
      lastSearchTopic = normalizedInput.content as string; 

      const response = await youtubeSearch.GetListByKeyword(lastSearchTopic, false, 5, [{type: 'video'}]);
      searchResults = response.items.map((video: YouTubeVideo) => ({
        id: video.id,
        title: video.title,
        channel: video.channel?.name,
      }));

      const summaryPrompt = `Summarize the following video titles about "${lastSearchTopic}" into a concise paragraph suitable for a 10-year-old. Focus on key information and concepts.\n\nVideo Titles:\n${searchResults.map(video => `- ${video.title}`).join('\n')}`;

      const summaryModelResponse = await ai.generate({
        prompt: `${webSearchSystemMessage}\n\n${summaryPrompt}`,
        model: 'openai/gpt-3.5-turbo',
      });
      
      searchResultSummary = cleanAIText(summaryModelResponse.text);
      
      currentResponse = `Found videos on "${lastSearchTopic}": ${searchResultSummary} ${getRandomResponse(confirmationPrompts).replace('{topic}', lastSearchTopic)}`;
      isAnswerMode = true; 
      awaitingPracticeQuestionConfirmation = true; 
    } else if (awaitingPracticeQuestionAnswer) { 
        const isCorrect = validateAnswer(query, correctAnswers);

        if (isCorrect) {
          const explanationPrompt = `The student correctly answered the question "${lastQuestionAsked}" about "${lastSearchTopic}". Briefly explain in one short line why this concept is important.`;
          const explanationResponse = await ai.generate({
            prompt: `${webSearchSystemMessage}\n\n${explanationPrompt}`,
            model: 'openai/gpt-3.5-turbo',
          });
          const explanation = cleanAIText(explanationResponse.text);

          currentResponse = `Excellent 🌟 Yes, that’s it! ${explanation} Want to try another question?`;
          
          awaitingPracticeQuestionAnswer = false;
          awaitingPracticeQuestionConfirmation = true;
          validationAttemptCount = 0; 
        } else {
            validationAttemptCount++;
            let hint = "";
            switch (validationAttemptCount) {
                case 1:
                    const hintPrompt1 = `The user gave a wrong answer to "${lastQuestionAsked}". Give a constructive hint by providing an analogy to help them understand.`;
                    const hintResponse1 = await ai.generate({
                      prompt: `${webSearchSystemMessage}\n\n${hintPrompt1}`,
                      model: 'openai/gpt-3.5-turbo',
                    });
                    hint = `Good try 👏, but that’s not quite right. ${cleanAIText(hintResponse1.text)}`;
                    break;
                case 2:
                    const hintPrompt2 = `The user is stuck on "${lastQuestionAsked}". Simplify the problem into a smaller, easier-to-answer question.`;
                    const hintResponse2 = await ai.generate({
                      prompt: `${webSearchSystemMessage}\n\n${hintPrompt2}`,
                      model: 'openai/gpt-3.5-turbo',
                    });
                    hint = `Okay, let’s do it step by step. ${cleanAIText(hintResponse2.text)}`;
                    break;
                case 3:
                     const hintPrompt3 = `The user has failed "${lastQuestionAsked}" three times. Explain the underlying concept without giving away the answer and encourage them to try again.`;
                    const hintResponse3 = await ai.generate({
                      prompt: `${webSearchSystemMessage}\n\n${hintPrompt3}`,
                      model: 'openai/gpt-3.5-turbo',
                    });
                    hint = `Let's look at it another way. ${cleanAIText(hintResponse3.text)}`;
                    break;
                default:
                    hint = "Don’t worry 💙. This is tricky, but we’ll do it step by step together. Want me to show you the first step?";
                    break;
            }
            currentResponse = hint;
        }
    } else {
      currentResponse = "I'm here to help you learn. We're currently in a teaching moment. Do you want to try another practice question, or would you like me to clarify something from our last search?";
    }

    return {
      response: currentResponse,
      results: searchResults.length > 0 ? searchResults : undefined,
      lastSearchTopic: lastSearchTopic,
      lastQuestionAsked: lastQuestionAsked,
      searchResultSummary: searchResultSummary,
      isAnswerMode: isAnswerMode,
      awaitingPracticeQuestionConfirmation: awaitingPracticeQuestionConfirmation,
      awaitingPracticeQuestionAnswer: awaitingPracticeQuestionAnswer,
      correctAnswers: correctAnswers,
      validationAttemptCount: validationAttemptCount,
    };
  }
);