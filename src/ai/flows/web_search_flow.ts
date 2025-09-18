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

const incorrectResponses = [
  "Not quite 😊. That’s the gas we breathe out. Try again — which one do we breathe in?",
  "Almost! Think about oxygen and glucose.",
  "Good effort 👏. Want a little hint?",
];

const stuckResponses = [
  "That's okay 💙. Many students feel this way. Let me give you a hint: {hint}",
  "It's tricky, but we'll do it step by step. Here's a small clue: {hint}",
  "Don't worry, I'll help you out. Try thinking about: {hint}",
];

const confirmationPrompts = [
  "Would you like a practice question related to what we just learned about {topic}?",
  "How about a quick practice question on {topic} to check your understanding?",
  "Ready for a question about {topic}?",
];

// Helper to get a random item from an array
function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
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
    "yes", "hmmm", "idk", "i don't know", "i am unsure", "i don't understand",
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
    if (normalizedInput.type !== ResponseType.Valid && !awaitingPracticeQuestionConfirmation) {
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

    // --- Fix 3: Guardrails for Web Search Mode ---
    // Web search is only for initial research or explicit "search again".
    // Once in teaching/validation flow, never search the web again.
    const shouldPerformWebSearch = !isAnswerMode; // Only search if not in answer mode


    // Scenario: Confirming to start a practice question
    if (awaitingPracticeQuestionConfirmation) {
      const userConfirmation = query.trim().toLowerCase();
      if (userConfirmation.includes("yes") || userConfirmation === "yep" || userConfirmation === "sure") {
        awaitingPracticeQuestionConfirmation = false;
        awaitingPracticeQuestionAnswer = true;
        
        // --- Fix 1: Intelligent Practice Question Generator ---
        // Generate a question linked to lastSearchTopic
        if (lastSearchTopic && lastSearchTopic.toLowerCase().includes("respiration")) {
          currentResponse = "Practice Question: Which gas do humans breathe in during respiration?";
          correctAnswers = ["oxygen"];
        } else if (lastSearchTopic && lastSearchTopic.toLowerCase().includes("photosynthesis")) {
          currentResponse = "Practice Question: What gas do plants release during photosynthesis?";
          correctAnswers = ["oxygen"];
        } else {
          // Fallback if topic is not specifically handled, or if lastSearchTopic is undefined
          const questionPrompt = `Based on the summary: "${searchResultSummary || lastSearchTopic}", generate a simple, age-appropriate practice question.`;
          const modelResponse = await ai.generate({ prompt: questionPrompt, model: 'gemini-pro' });
          currentResponse = `Practice Question: ${modelResponse.text.trim()}`;
          // For AI-generated questions, we might need a more sophisticated way to get correct answers,
          // for now, a simple keyword might suffice, or we acknowledge this limitation.
          // For simplicity in this implementation, we will expect a generic "fact" answer if not specific.
          correctAnswers = [lastSearchTopic ? lastSearchTopic.toLowerCase() : "fact"]; // Placeholder
        }
        lastQuestionAsked = currentResponse; // Store the generated question
      } else if (userConfirmation.includes("no") || userConfirmation === "nope") {
        awaitingPracticeQuestionConfirmation = false;
        isAnswerMode = false; // Exit teaching mode if they don't want a question
        currentResponse = `Okay, we can skip the practice question for now. What would you like to do next? Maybe a new search?`;
      } else {
        // --- Fix 4: Teacher-style fallback for confirmation ---
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


    // Scenario A: Initial Search Query
    if (shouldPerformWebSearch) {
      lastSearchTopic = normalizedInput.content!; // Update lastSearchTopic with the new query

      const response = await youtubeSearch.GetListByKeyword(lastSearchTopic, false, 5, [{type: 'video'}]);
      searchResults = response.items.map((video: YouTubeVideo) => ({
        id: video.id,
        title: video.title,
        channel: video.channel?.name,
      }));

      // Summarize search results
      const summaryPrompt = `Summarize the following video titles about "${lastSearchTopic}" into a concise paragraph suitable for a 10-year-old. Focus on key information and concepts. Also, create a simple, age-appropriate practice question based on this summary.\n\nVideo Titles:\n${searchResults.map(video => `- ${video.title}`).join('\n')}\n\nProvide the summary and then the question, clearly labeled "SUMMARY:" and "QUESTION:".`;

      const summaryModelResponse = await ai.generate({
        prompt: summaryPrompt,
        model: 'gemini-pro',
      });
      
      const summaryText = summaryModelResponse.text;
      const summaryMatch = summaryText.match(/SUMMARY:\s*([\s\S]*?)(?=\nQUESTION:)/);
      const questionMatch = summaryText.match(/QUESTION:\s*([\s\S]*)/);

      searchResultSummary = summaryMatch ? summaryMatch[1].trim() : "I couldn't generate a clear summary from the search results.";
      lastQuestionAsked = questionMatch ? questionMatch[1].trim() : `Can you tell me one key fact about ${lastSearchTopic}?`;
      
      currentResponse = `Okay, I found some videos about "${lastSearchTopic}":\n${searchResultSummary}\n\n${getRandomResponse(confirmationPrompts).replace('{topic}', lastSearchTopic)}`;
      isAnswerMode = true; // Enter answer mode after initial search and summary
      awaitingPracticeQuestionConfirmation = true; // Await confirmation for practice question
    } else if (awaitingPracticeQuestionAnswer) { // Scenario B: Student Answering a Practice Question
        // --- Fix 2: Validation Before Moving On ---
        const userAnswer = query.trim().toLowerCase();
        let isCorrect = false;

        if (correctAnswers.some(ans => userAnswer.includes(ans.toLowerCase()))) {
            isCorrect = true;
        }

        if (isCorrect) {
          currentResponse = getRandomResponse(correctResponses);
          awaitingPracticeQuestionAnswer = false; // Exit answer mode for this question
          validationAttemptCount = 0; // Reset attempts

          // Offer another question or suggest next steps (e.g., new search or deeper dive)
          const followUpPrompt = `The student answered correctly about "${lastSearchTopic}". Based on the summary: "${searchResultSummary}", generate a new, slightly different age-appropriate practice question about the same topic, or suggest exploring a related aspect if no more simple questions are available. Conclude by asking if they want another question or to search for something new.`;
          const followUpModelResponse = await ai.generate({ prompt: followUpPrompt, model: 'gemini-pro' });
          currentResponse += `\n\n${followUpModelResponse.text.trim()}`;
          lastQuestionAsked = followUpModelResponse.text.trim(); // Store the new follow-up
        } else {
            validationAttemptCount++;
            // --- Fix 4: Teacher-style fallback pool for incorrect answers ---
            const hint = "Remember what we discussed about how humans get energy."; // Example hint
            if (validationAttemptCount >= incorrectResponses.length) {
              // Cycle through hints or provide a more direct one after multiple attempts
              currentResponse = getRandomResponse(incorrectResponses); // Use a generic incorrect response
            } else {
              currentResponse = incorrectResponses[validationAttemptCount - 1].replace('{hint}', hint);
            }
            currentResponse = `Not quite 😊. ${currentResponse} Try again!`;
        }
    } else {
      // Fallback for when in isAnswerMode but not awaiting a practice question answer
      // This might happen if the student is just chatting while in teaching mode.
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