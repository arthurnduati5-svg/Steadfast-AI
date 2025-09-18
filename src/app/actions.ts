'use server';

import { runFlow } from '@genkit-ai/flow';
import {
  emotionalAICopilot,
  EmotionalAICopilotOutput,
} from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives } from '@/ai/flows/personalize-daily-objectives';
import { webSearchFlow } from '@/ai/flows/web_search_flow';
import { generalWebSearchFlow, GeneralWebSearchFlowOutput } from '@/ai/flows/general_web_search_flow';
import { PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';
import OpenAI from 'openai';
import { z } from 'zod'; // Import z from zod for schema definitions

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the state schema that will be passed between frontend and actions
const ConversationStateSchema = z.object({
  researchModeActive: z.boolean().default(false),
  lastSearchTopic: z.string().optional(),
  awaitingPracticeQuestionConfirmation: z.boolean().default(false),
  activePracticeQuestion: z.string().optional(), // The actual question asked
  awaitingPracticeQuestionAnswer: z.boolean().default(false), // When waiting for an answer to activePracticeQuestion
  validationAttemptCount: z.number().default(0), // How many times student has tried to answer current question
  lastAssistantMessage: z.string().optional(), // To avoid direct repetition
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

// The output from the server action will include the AI's response and the updated state
export interface AssistantResponseOutput {
  processedText: string;
  videoData?: EmotionalAICopilotOutput['videoData'];
  state: ConversationState; // The updated state
}

// Enum for response types for initial input handling
enum ResponseType {
  Valid = "valid",
  Empty = "empty",
  OffTopic = "offTopic",
  Vague = "vague",
  Insult = "insult",
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
  "That’s okay 💙. Can you try giving me one word for your answer?",
  "Hmm, I'm not quite sure what you mean. Could you explain it differently?",
  "No worries! Sometimes it's hard to find the right words. What are you thinking?",
  "I'm here to help you learn. Can you tell me a little more?",
];

const offTopicResponses = [
  "Haha 😊 that's a fun thought! But let’s try to stick to our lesson. What were we talking about?",
  "That's an interesting idea, but let's refocus on our topic for a moment.",
  "Nice! But let’s bring it back to our main subject. What do you remember?",
  "I love your creativity! Now, back to our topic: what's your answer?",
];

const insultResponses = [
  "I hear you’re upset 💙. But let’s keep our words kind. Do you want to take a short break, or should we try another question?",
  "I'm here to help, and I'd appreciate it if we could communicate respectfully.",
  "It's okay to feel frustrated, but let's use polite language. How can I assist you?",
  "My job is to help you learn, and to do that, we need to be kind to each other.",
];

// Define arrays for diverse feedback responses for answer validation
const praiseResponses = [
  "Exactly 🎉👏. That's spot on!",
  "You got it! Brilliant work!",
  "Excellent! You're really understanding this.",
  "That's correct! Well done!",
  "Fantastic! You've really mastered that concept.",
];

const hintResponses = [
  "Good try 👏, let’s look again. Think about this hint: {hint}",
  "Almost there! Remember this detail: {hint}",
  "Not quite 😊. Want me to break it down? Here’s a clue: {hint}",
  "That’s a common mix-up 🙂. Let’s fix it together. Consider: {hint}",
  "You're on the right track, but let's refine that. Here's a thought: {hint}",
];

const reframeQuestionResponses = [
  "Let's try that question again, maybe a little differently. {new_question}",
  "It's a tricky one! How about we rephrase it to: {new_question}",
  "To make it clearer, let me ask it like this: {new_question}",
];

const encouragementResponses = [
  "That’s okay 💙. Many students feel this way. Let me give you a hint: {hint}",
  "It's tricky, but we'll do it step by step. Here's a small clue: {hint}",
  "Don't worry, I'll help you out. Try thinking about: {hint}",
  "Learning takes time, and that's perfectly fine! What if we focus on this: {hint}",
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

  // Insult detection
  const insultKeywords = new RegExp(
    "fuck|shit|bitch|asshole|damn|idiot|stupid|dumb|useless|suck|crap|bloody|bastard", "i"
  );
  if (insultKeywords.test(trimmedInput)) {
    return { type: ResponseType.Insult, content: input };
  }

  const offTopicKeywords = ['banana', 'asdfgh', 'football', 'game', 'play', 'random', 'blah', 'poop', 'fart', 'silly'];
  if (offTopicKeywords.some(keyword => trimmedInput.includes(keyword))) {
    return { type: ResponseType.OffTopic, content: input };
  }

  const vagueKeywords = [
    "yes", "hmmm", "idk", "i don't know", "i am unsure", "i don't understand",
    "can you explain that again", "what does that mean", "am not sure", "i'm not sure",
    "huh", "what", "um", "uh", "maybe", "what is the question", "repeat the question"
  ];
  if (vagueKeywords.some(keyword => trimmedInput.includes(keyword))) {
    return { type: ResponseType.Vague };
  }

  return { type: ResponseType.Valid, content: input };
}

/**
 * Generates a teacher-toned fallback response based on the normalized input type.
 * @param responseType The type of the normalized response.
 @param originalInput The original input, useful for off-topic redirection.
 @returns A string with a teacher-toned fallback.
 */
function getTeacherFallback(responseType: ResponseType, originalInput: string): string {
  switch (responseType) {
    case ResponseType.Empty:
      return getRandomResponse(emptyResponses);
    case ResponseType.Vague:
      return getRandomResponse(vagueResponses);
    case ResponseType.OffTopic:
      return getRandomResponse(offTopicResponses).replace('{original_input}', originalInput.toLowerCase());
    case ResponseType.Insult:
      return getRandomResponse(insultResponses);
    case ResponseType.Valid:
      return ""; // Should not be called for valid types, or should return an empty string.
  }
}

// Helper function for intent classification after a practice question
async function classifyUserIntent(userInput: string, topic: string): Promise<'Accept' | 'Decline' | 'New Topic'> {
  const prompt = `
    A student was just asked if they want a practice question about "${topic}".
    The student's response is: "${userInput}"

    Classify this response into one of three categories:
    1.  **Accept**: The student wants a practice question (e.g., "yes", "okay", "sure!", "hit me").
    2.  **Decline**: The student does not want a practice question, or is unsure (e.g., "no", "not right now", "maybe later", "am not sure", "I don't know").
    3.  **New Topic**: The student is asking a new question or changing the subject entirely (e.g., "what is a mitochondria?", "can you explain fractions?", "who is the president?").

    Return ONLY one word: "Accept", "Decline", or "New Topic".
  `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 10,
    });

    const intent = response.choices[0].message.content?.trim();

    if (intent === 'Accept' || intent === 'Decline' || intent === 'New Topic') {
      return intent;
    }
  } catch (error) {
    console.error('[ACTIONS-DEBUG] ERROR during intent classification:', error);
  }

  // Fallback logic
  const lowerInput = userInput.toLowerCase().trim();
  if (['yes', 'yep', 'yeah', 'ok', 'okay', 'sure', 'go on', 'hit me'].some(term => lowerInput.includes(term))) {
    return 'Accept';
  }
  if (['no', 'nope', 'nah', 'not now', 'later', 'am not sure', "i don't know", "i am unsure"].some(term => lowerInput.includes(term))) {
    return 'Decline';
  }
  return 'New Topic';
}

// Helper function for intelligent LLM-based answer validation
async function validateStudentAnswer(
  question: string,
  studentAnswer: string,
  topic: string,
  gradeHint: 'Primary' | 'LowerSecondary' | 'UpperSecondary',
  attemptCount: number // To provide progressive hints
): Promise<{ feedback: string; status: 'Correct' | 'Incorrect' | 'Stuck' | 'PartiallyCorrect'; newQuestion?: string; hint?: string }> {
  const validationPrompt = `
    You are a patient and encouraging teacher. A student was asked the following question about "${topic}" (Grade Level: ${gradeHint}):
    Question: "${question}"
    Student's Answer: "${studentAnswer}"
    Attempt Number: ${attemptCount + 1}

    Carefully evaluate the student's answer.
    1.  If the answer is fully correct: Respond with a brief, enthusiastic praise.
 2.  If the answer is partially correct or close: Respond with a gentle hint related to the missing or incorrect part, then re-ask the original question or a slightly rephrased version.
 3.  If the answer is incorrect or the student seems stuck/confused (e.g., asking "what is the question?" or giving a completely unrelated answer): Provide a more direct hint or reframe the question to guide them, then re-ask.
 4.  If the student's answer is very vague or indicates they don't know after a few tries (attemptCount > 1 and status is not Correct): Offer a stronger hint or suggest breaking down the problem.

    Format your output as follows. ONLY provide this format:
    STATUS: [Correct|PartiallyCorrect|Incorrect|Stuck]
    FEEDBACK: [Your teacher-like feedback, including a hint if applicable, and then re-ask the question if not correct. Example: "That's a great start! Think about *why* we breathe oxygen. What gas do we *exhale*?"]
    HINT_CONTENT: [A concise, single-sentence hint or rephrased question if STATUS is not Correct, otherwise empty]
  `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'system', content: validationPrompt }],
      model: 'gpt-4o',
      temperature: 0.2 + (attemptCount * 0.1), // Increase temperature slightly with attempts for varied hints
      max_tokens: 200,
    });

    const llmOutput = response.choices[0].message.content?.trim() || "";
    console.log(`[ACTIONS-DEBUG] Validation LLM Output: ${llmOutput}`);

    const statusMatch = llmOutput.match(/STATUS:\s*(.*)/i);
    const feedbackMatch = llmOutput.match(/FEEDBACK:\s*([\s\S]*?)(?=(HINT_CONTENT:|$))/i);
    const hintContentMatch = llmOutput.match(/HINT_CONTENT:\s*([\s\S]*)/i);

    let status: 'Correct' | 'PartiallyCorrect' | 'Incorrect' | 'Stuck' = 'Stuck';
    let feedback = "I'm having a little trouble understanding your answer. Can you try again?";
    let hint = "";

    if (statusMatch) {
      const parsedStatus = statusMatch[1].trim().toLowerCase();
      if (parsedStatus.includes('correct')) status = 'Correct';
      else if (parsedStatus.includes('partiallycorrect')) status = 'PartiallyCorrect';
      else if (parsedStatus.includes('incorrect')) status = 'Incorrect';
      else if (parsedStatus.includes('stuck')) status = 'Stuck';
    }

    if (feedbackMatch && feedbackMatch[1]) {
      feedback = feedbackMatch[1].trim();
    } else {
        // Fallback if regex fails to extract feedback
        switch (status) {
            case 'Correct': feedback = getRandomResponse(praiseResponses); break;
            case 'PartiallyCorrect': feedback = getRandomResponse(hintResponses).replace('{hint}', 'Try to be more specific.'); break;
            case 'Incorrect': feedback = getRandomResponse(reframeQuestionResponses).replace('{new_question}', question); break;
            case 'Stuck': feedback = getRandomResponse(encouragementResponses).replace('{hint}', 'Let\'s break it down.'); break;
        }
    }
    
    if (hintContentMatch && hintContentMatch[1]) {
        hint = hintContentMatch[1].trim();
    }

    // Blend predefined responses for diversity if LLM feedback is too generic or missing key parts
    if (status === 'Correct') {
        feedback = getRandomResponse(praiseResponses) + (feedback ? ` ${feedback}` : '');
    } else if (status === 'PartiallyCorrect' || status === 'Incorrect' || status === 'Stuck') {
        let selectedResponse = getRandomResponse(status === 'Stuck' ? encouragementResponses : hintResponses);
        // Replace {hint} placeholder if a hint is available from LLM
        if (hint) {
            selectedResponse = selectedResponse.replace('{hint}', hint);
        } else {
            // Remove {hint} placeholder if no hint is available
            selectedResponse = selectedResponse.replace('{hint}', 'think a little deeper!');
        }
        feedback = selectedResponse + (feedback && !selectedResponse.includes(feedback) ? ` ${feedback}` : '');
    }

    // Ensure the feedback always ends with a question if not correct
    if (status !== 'Correct' && !feedback.toLowerCase().includes('?')) {
        feedback += `\n\n${hint || question}`; // Re-ask the question or use the hint as a question
    }


    return { feedback, status, hint };

  } catch (error) {
    console.error('[ACTIONS-DEBUG] ERROR during answer validation:', error);
    return { feedback: "I had a little trouble checking your answer. Please try again.", status: 'Stuck' };
  }
}


// Helper function for intent classification within research mode - adjusted to focus on 'Search' and 'Exit' for valid inputs
async function classifyResearchModeUserIntent(userInput: string): Promise<'Search' | 'GeneralResponse' | 'ExitResearch'> {
  const prompt = `
    The user is currently in "research mode" with an AI copilot.
    The user's response is: "${userInput}"

    Classify this response into one of three categories:
    1.  **Search**: The user is asking a new question or clearly wants to perform a new web search (e.g., "tell me more about this", "what about X?", "search for Y", "who invented Z?").
    2.  **GeneralResponse**: The user is providing a conversational response that does NOT require a new web search, such as asking for clarification on previous information, or making a simple statement.
    3.  **ExitResearch**: The user wants to explicitly exit research mode (e.g., "stop searching", "exit research mode", "go back to normal chat", "turn off search").

    Return ONLY one word: "Search", "GeneralResponse", or "ExitResearch".
  `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 10,
    });

    const intent = response.choices[0].message.content?.trim();
    console.log(`[ACTIONS-DEBUG] Research mode user intent classified as: ${intent}`);

    if (intent === 'Search' || intent === 'GeneralResponse' || intent === 'ExitResearch') {
      return intent;
    }
  } catch (error) {
    console.error('[ACTIONS-DEBUG] ERROR during research mode intent classification:', error);
  }

  // Fallback logic for research mode
  const lowerInput = userInput.toLowerCase().trim();
  if (['stop searching', 'exit research', 'go back to normal', 'turn off search'].some(term => lowerInput.includes(term))) {
    return 'ExitResearch';
  }
  if (['tell me more', 'what about', 'search for', 'who invented', 'how does'].some(term => lowerInput.includes(term)) || lowerInput.length > 10) {
    return 'Search';
  }
  return 'GeneralResponse'; // Default to GeneralResponse if no other intent is matched
}

// Function to generate a specific practice question (will be implemented more robustly in general_web_search_flow.ts)
async function generateSpecificPracticeQuestion(topic: string, gradeHint: 'Primary' | 'LowerSecondary' | 'UpperSecondary'): Promise<string> {
    try {
        const questionPrompt = `You are a teacher. Based on the topic "${topic}" (suitable for a ${gradeHint} student), generate *one* clear, concise, and age-appropriate practice question. Do NOT include the answer.`;
        const response = await openai.chat.completions.create({
            messages: [{ role: 'system', content: questionPrompt }],
            model: 'gpt-4o',
            temperature: 0.7, // Higher temp for creativity
            max_tokens: 100,
        });
        return response.choices[0].message.content?.trim() || `Can you tell me more about ${topic}?`;
    } catch (error) {
        console.error('[ACTIONS-DEBUG] ERROR generating specific practice question:', error);
        return `Let\'s test your knowledge on ${topic}! What is one important thing you learned?`;
    }
}


export async function getAssistantResponse(
  message: string,
  chatHistory: { role: 'user' | 'model'; content: string }[],
  currentState: ConversationState, // The full state object from the frontend
  pathname: string, // Keep if needed for other logic
  fileDataBase66: { type: string; base64: string } | undefined, // Keep if needed for other logic
  forceWebSearch: boolean,
  includeVideos: boolean,
  gradeHint: 'Primary' | 'LowerSecondary' | 'UpperSecondary',
  languageHint: 'English' | 'Swahili mix',
): Promise<AssistantResponseOutput> {
  let updatedState: ConversationState = { ...currentState }; // Start with a copy of the current state
  let responseText: string = "";
  let videoData: EmotionalAICopilotOutput['videoData'] | undefined = undefined;

  console.log(`[ACTIONS-DEBUG] Received message: "${message}" with state:`, updatedState);

  // --- START KID-FRIENDLY INPUT NORMALIZATION AND FALLBACK (INCLUDING INSULTS) ---
  const normalizedInput = normalizeKidInput(message);
  if (normalizedInput.type !== ResponseType.Valid) {
    const fallbackMessage = getTeacherFallback(normalizedInput.type, message);
    console.log(`[ACTIONS-DEBUG] Kid-friendly fallback triggered: ${fallbackMessage}`);
    // Keep context alive
    updatedState.lastAssistantMessage = fallbackMessage;
    return {
      processedText: fallbackMessage,
      state: updatedState,
    };
  }
  const processedMessage = normalizedInput.content!;
  // --- END KID-FRIENDLY INPUT NORMALIZATION AND FALLBACK ---

  // --- Handle Awaiting Practice Question Answer ---
  if (updatedState.awaitingPracticeQuestionAnswer && updatedState.activePracticeQuestion && updatedState.lastSearchTopic) {
    console.log('[ACTIONS-DEBUG] AI is awaiting practice question answer.');
    const { feedback, status, hint } = await validateStudentAnswer(
      updatedState.activePracticeQuestion,
      processedMessage,
      updatedState.lastSearchTopic,
      gradeHint,
      updatedState.validationAttemptCount
    );

    responseText = feedback;
    updatedState.validationAttemptCount++;

    if (status === 'Correct') {
      updatedState.awaitingPracticeQuestionAnswer = false;
      updatedState.activePracticeQuestion = undefined;
      updatedState.validationAttemptCount = 0;
      responseText += `\n\nWould you like another practice question on ${updatedState.lastSearchTopic}, or should we explore a new topic?`;
    } else {
      responseText += `\n\n${updatedState.activePracticeQuestion}`;
    }

    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, state: updatedState };
  }


  // --- Handle Awaiting Practice Question Confirmation ---
  if (updatedState.awaitingPracticeQuestionConfirmation && updatedState.lastSearchTopic) {
    console.log('[ACTIONS-DEBUG] AI is awaiting practice question confirmation.');
    const intent = await classifyUserIntent(processedMessage, updatedState.lastSearchTopic);
    console.log(`[ACTIONS-DEBUG] User intent classified as: ${intent}`);

    updatedState.awaitingPracticeQuestionConfirmation = false; // Reset

    switch (intent) {
      case 'Accept':
        const specificQuestion = await generateSpecificPracticeQuestion(updatedState.lastSearchTopic, gradeHint);
        responseText = `Great! Here's a practice question:\n\n${specificQuestion}`;
        updatedState.activePracticeQuestion = specificQuestion;
        updatedState.awaitingPracticeQuestionAnswer = true;
        updatedState.validationAttemptCount = 0;
        updatedState.researchModeActive = true;
        break;

      case 'Decline':
        responseText = "Okay, no problem! We can skip the question for now. What would you like to learn about next?";
        updatedState.researchModeActive = false;
        updatedState.lastSearchTopic = undefined;
        break;

      case 'New Topic':
      default:
        console.log('[ACTIONS-DEBUG] User introduced a new topic. Exiting research mode.');
        updatedState.researchModeActive = false;
        updatedState.lastSearchTopic = undefined;
        // Recursively call getAssistantResponse to process the new topic from a fresh state
        return getAssistantResponse(processedMessage, chatHistory, updatedState, pathname, fileDataBase66, forceWebSearch, includeVideos, gradeHint, languageHint);
    }

    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, videoData, state: updatedState };
  }

  // --- Conditional Web Search (Initial Query / Research Mode) ---
  // If forceWebSearch is true OR a specific search intent is detected in normal mode
  if (forceWebSearch || /search the web|research|look online/i.test(processedMessage)) {
    console.log('[ACTIONS-DEBUG] Web search initiated or forceWebSearch is true.');
    let researchIntent: 'Search' | 'GeneralResponse' | 'ExitResearch' = 'Search'; // Default to Search if forceWebSearch is true

    // If forceWebSearch is explicitly true from the UI toggle, we classify the *current* processed message
    // to decide if it's a new search, a general chat, or an exit command.
    if (forceWebSearch && !updatedState.awaitingPracticeQuestionAnswer) { // Only classify if not awaiting answer
        researchIntent = await classifyResearchModeUserIntent(processedMessage);
    }

    switch (researchIntent) {
      case 'ExitResearch':
        responseText = "Okay, I've exited research mode. What would you like to chat about?";
        updatedState.researchModeActive = false;
        updatedState.lastSearchTopic = undefined;
        updatedState.awaitingPracticeQuestionAnswer = false; // Ensure reset
        updatedState.activePracticeQuestion = undefined; // Ensure reset
        updatedState.validationAttemptCount = 0; // Ensure reset
        break;

      case 'GeneralResponse':
        // If in research mode but user gives a general response, transition to emotionalAICopilot
        console.log('[ACTIONS-DEBUG] User in research mode, but intent is GeneralResponse. Using emotionalAICopilot.');
        updatedState.researchModeActive = false; // Exit research mode for general conversation
        updatedState.awaitingPracticeQuestionAnswer = false; // Ensure reset
        updatedState.activePracticeQuestion = undefined; // Ensure reset
        updatedState.validationAttemptCount = 0; // Ensure reset
        // Fall through to emotionalAICopilot
        break;

      case 'Search':
      default: // If not ExitResearch or GeneralResponse, it's a Search (default case for clarity)
        console.log('[ACTIONS-DEBUG] User in research mode and intent is Search. Initiating web search.');
        try {
          const webSearchArgs = {
            query: processedMessage, // Pass the processedMessage here
            history: chatHistory,
            lastSearchTopic: updatedState.lastSearchTopic, // Pass existing topic if any
            forceWebSearch: true,
            includeVideos: includeVideos,
            gradeHint: gradeHint,
            languageHint: languageHint,
          };

          const webResults: GeneralWebSearchFlowOutput = await runFlow(generalWebSearchFlow, webSearchArgs);
          
          responseText = webResults.reply;
          videoData = webResults.videoData;

          updatedState.researchModeActive = webResults.conversationState !== 'general'; 
          updatedState.lastSearchTopic = webResults.lastSearchTopic || processedMessage; 
          updatedState.awaitingPracticeQuestionConfirmation = webResults.conversationState === 'awaiting_practice_response';
          
          // Set activePracticeQuestion if the flow returned one directly
          if (webResults.conversationState === 'providing_practice_question' && webResults.reply.includes('Here\'s a practice question')) {
            const questionMatch = webResults.reply.match(/Here\'s a practice question:\\n\\n([\s\S]*)/);
            if (questionMatch && questionMatch[1]) {
              updatedState.activePracticeQuestion = questionMatch[1].trim();
              updatedState.awaitingPracticeQuestionAnswer = true;
              updatedState.validationAttemptCount = 0;
            }
          } else {
            updatedState.awaitingPracticeQuestionAnswer = false; // Not awaiting answer yet, only confirmation
            updatedState.activePracticeQuestion = undefined; // Not active question yet
            updatedState.validationAttemptCount = 0; // Reset attempts
          }

        } catch (error) {
          console.error('Error during web search:', error);
          responseText = "I'm sorry, I had trouble searching online. Please try again.";
          updatedState = { // Reset state on error
            researchModeActive: false, 
            lastSearchTopic: undefined, 
            awaitingPracticeQuestionConfirmation: false,
            activePracticeQuestion: undefined,
            awaitingPracticeQuestionAnswer: false,
            validationAttemptCount: 0,
            lastAssistantMessage: undefined,
          };
        }
        break; // Break from switch, then return
    }

    updatedState.lastAssistantMessage = responseText;
    return {
        processedText: responseText.trim(),
        videoData: videoData,
        state: updatedState,
    };
  }

  // --- Normal Conversation Mode (if not handling practice question or web search) ---
  console.log('[ACTIONS-DEBUG] Initiating normal conversation mode.');
  try {
    // Call the emotionalAICopilot, which is now stateless and only takes 'text'
    const result = await emotionalAICopilot({
      text: chatHistory.map((m) => `${m.role}: ${m.content}`).join('\n') + '\n' + `user: ${processedMessage}`,
    });

    // For normal mode, ensure the state is reset, as we are no longer in a research context.
    updatedState = {
      researchModeActive: false,
      lastSearchTopic: undefined,
      awaitingPracticeQuestionConfirmation: false,
      activePracticeQuestion: undefined,
      awaitingPracticeQuestionAnswer: false,
      validationAttemptCount: 0,
      lastAssistantMessage: result.processedText, // Store AI's message
    };

    return {
      processedText: result.processedText,
      videoData: result.videoData,
      state: updatedState,
    };
  } catch (error) {
    console.error('Error in emotional AI copilot:', error);
    updatedState.lastAssistantMessage = "I'm sorry, I'm having trouble connecting right now. Please try again later."; // Store AI's message
    return {
      processedText: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
      state: updatedState, // Return the last known state on error
    };
  }
}

export async function getDailyObjectives(
  studentPerformance: string,
  curriculum: string,
  loggedMisconceptions: string,
): Promise<string[]> {
  try {
    const objectivesInput: PersonalizedObjectivesInput = {
      studentPerformance,
      curriculum,
      loggedMisconceptions,
    };
    const result = await personalizedObjectives(objectivesInput);
    return result.dailyObjectives;
  } catch (error) {
    console.error('Error getting daily objectives:', error);
    return ['Could not load objectives. Please try again later.'];
  }
}

export async function searchYouTube(query: string) {
  try {
    // Note: webSearchFlow in src/ai/flows/web_search_flow.ts already contains normalization and fallback logic.
    // The query passed here will be re-normalized within that flow, which is fine.
    // Correctly destructure `response` instead of `fallbackResponse` and pass `isAnswerMode`.\n

    const { results, response } = await runFlow(webSearchFlow, {
      query, isAnswerMode: false,
      awaitingPracticeQuestionConfirmation: false,
      awaitingPracticeQuestionAnswer: false,
      correctAnswers: [],
      validationAttemptCount: 0
    });
    
    // If webSearchFlow returned a response but no results, it's likely a fallback message.
    if (results === undefined && response) {
      return { results: [], fallbackResponse: response };
    }
    return { results, fallbackResponse: undefined }; // Ensure fallbackResponse is always returned, even if undefined
  } catch (error) {
    console.error('Error in YouTube search flow:', error);
    return { results: [], fallbackResponse: "I'm sorry, I had trouble searching YouTube. Please try again." };
  }
}