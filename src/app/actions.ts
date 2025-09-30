'use server';

import { runFlow } from '@genkit-ai/flow';
import {
  emotionalAICopilot,
  EmotionalAICopilotOutput,
} from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives } from '@/ai/flows/personalize-daily-objectives';

import {
  generalWebSearchFlow,
  GeneralWebSearchFlowOutput,
} from '@/ai/flows/general_web_search_flow';
import { PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';
import OpenAI from 'openai';
import { z } from 'zod';
import { ConversationState, ConversationStateSchema } from '@/lib/types';
import {
  classifyKidInput,
  KidInputClassification,
} from '@/lib/research-mode-helpers';
import { youtubeSearchFlow, YoutubeSearchFlowOutput } from '@/ai/flows/youtube-search-flow';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AssistantResponseOutput {
  processedText: string;
  videoData?: EmotionalAICopilotOutput['videoData'];
  state: ConversationState;
}

// Whitelisted educational YouTube channels
const whitelistedChannels = [
  'Khan Academy',
  'National Geographic',
  'BBC Earth',
  'TED-Ed',
  'SciShow Kids',
  'CrashCourse',
];

// A library of varied, human-like responses
const responseTemplates = {
  praise: [
    'Exactly! Fantastic job! ✨',
    'That’s it! You got it! 🥳',
    'Wonderful! That’s spot on. 🎯',
    'Yes! You’re a star! ⭐',
  ],
  encouragement: [
    'Hmm, not quite. Let’s think again 💡. ',
    'That’s a good try! But let’s look at it differently. 🤔',
    'Almost there! Consider this: ',
    'You’re on the right track! What if we thought about it this way: ',
  ],
  redirect: {
    nonsense: [
      'Haha 🍕🍌, that’s funny! But seriously, ',
      'That’s a silly one!🤪 Let’s get back to our learning. ',
      'You have a great imagination! 🎨 But for now, ',
    ],
    insult: [
      'I hear you’re upset 💙. Learning can be tough, but let’s slow it down together. ',
      'It’s okay to feel that way. How about we try a simpler step? 🤝',
    ],
    offTopic: [
      'That’s an interesting thought! Let’s hold onto that 📌 and come back to it later. For now, ',
      'Cartoons are fun 🎨! But in real life, ',
    ],
    unsure: [
      'No worries 💙. Do you want me to explain first, or shall we try a small question together?',
      'That’s okay 😊. How about we try one small question together, step by step?',
    ],
    curious: [
      'A practice question is just a small challenge to check if you understood. Do you want me to give you one?',
      'Great question 🌟. A practice question is like a mini challenge to check your understanding. Want me to show you one?',
    ],
    silent: [
      'No worries 🙂. Let’s start small — I’ll ask you a gentle question: ',
    ],
    // NEW: Sensitive Content Redirection
    sexual: [
      'Sorry 💙, I can’t talk about that. Let’s stick to school topics like science, maths, or history. Do you want me to give you a fun science question instead?',
    ],
    violence: [
      'I’m here to keep learning safe 💙. That’s not something I can discuss. Want to learn about the human body or space instead?',
    ],
    drugs_selfHarm: [
      'That’s a serious topic, and I’m here to help you with schoolwork. Let’s focus on something safe and interesting like animals or inventions. How about that? ',
    ],
    personalData: [
      'I can’t ask for or share personal details 🙂. But I’d love to keep helping you with schoolwork — what subject shall we do?',
    ],
  },
  practiceOffer: ['Would you like me to give you a practice question on this?'],
  explainMore: ['Alright 😊. Would you like me to explain a bit more, or share another fun fact?'],
  nextStep: [
    'Want to try another question or explore a new topic?',
    'What’s next on our learning adventure? Another question or a new subject?',
  ],
};

// Helper to get a random, non-repeating response
function getDynamicResponse(
  category: string[],
  lastResponse?: string,
): string {
  let options = category.filter((r) => r !== lastResponse);
  if (options.length === 0) {
    options = category;
  }
  return options[Math.floor(Math.random() * options.length)];
}

// Core state transition and response logic
export async function getAssistantResponse(
  message: string,
  chatHistory: { role: 'user' | 'model'; content: string }[],
  currentState: ConversationState,
  pathname: string,
  fileDataBase66: { type: string; base64: string } | undefined,
  forceWebSearch: boolean,
  includeVideos: boolean,
  gradeHint: 'Primary' | 'LowerSecondary' | 'UpperSecondary',
  languageHint: 'English' | 'Swahili mix',
): Promise<AssistantResponseOutput> {
  let updatedState: ConversationState = JSON.parse(
    JSON.stringify(currentState),
  );
  let responseText: string = '';
  let videoData: EmotionalAICopilotOutput['videoData'] | undefined = undefined;

  // Ensure lastSearchTopic is an array
  if (!Array.isArray(updatedState.lastSearchTopic)) {
    updatedState.lastSearchTopic = updatedState.lastSearchTopic
      ? [updatedState.lastSearchTopic]
      : [];
  }

  const currentTopic =
    updatedState.lastSearchTopic[updatedState.lastSearchTopic.length - 1];

  const classification: KidInputClassification = await classifyKidInput(
    message,
    updatedState,
    currentTopic,
  );
  console.log('[ACTIONS-DEBUG] Input Classification:', classification);

  // NEW: Handle Sensitive Content Detection first
  if (classification.intent === 'SensitiveContent') {
    updatedState.sensitiveContentDetected = true;
    // Reset all research/practice states
    updatedState.researchModeActive = false;
    updatedState.awaitingPracticeQuestionInvitationResponse = false;
    updatedState.awaitingPracticeQuestionAnswer = false;
    updatedState.activePracticeQuestion = undefined;
    updatedState.validationAttemptCount = 0;
    updatedState.videoSuggested = false; // Reset video suggested state

    switch (classification.sensitiveCategory) {
      case 'Sexual':
        responseText = getDynamicResponse(responseTemplates.redirect.sexual, updatedState.lastAssistantMessage);
        break;
      case 'Violence':
        responseText = getDynamicResponse(responseTemplates.redirect.violence, updatedState.lastAssistantMessage);
        break;
      case 'Drugs_SelfHarm':
        responseText = getDynamicResponse(responseTemplates.redirect.drugs_selfHarm, updatedState.lastAssistantMessage);
        break;
      case 'PersonalData':
        responseText = getDynamicResponse(responseTemplates.redirect.personalData, updatedState.lastAssistantMessage);
        break;
      default:
        responseText = 'I’m here to help you learn, but I can’t discuss that topic. Let’s find something else fun to learn!';
        break;
    }
    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, state: updatedState };
  }

  // If sensitive content was detected previously but current input is safe, reset the flag.
  if (updatedState.sensitiveContentDetected) {
    updatedState.sensitiveContentDetected = false;
    // Optionally, give a gentle nudge back to learning if the previous message was a sensitive redirect
    if (updatedState.lastAssistantMessage?.includes('Sorry 💙') || updatedState.lastAssistantMessage?.includes('I’m here to keep learning safe')) {
        responseText = `Great! What would you like to learn about today?`;
        updatedState.lastAssistantMessage = responseText;
        return { processedText: responseText, state: updatedState };
    }
  }

  // If sensitive content is still detected, bypass other flows and ask for a new topic
  if (updatedState.sensitiveContentDetected) {
    responseText = 'Let’s try focusing on school topics. What subject are you interested in today?';
    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, state: updatedState };
  }

  // --- Handle Non-Learning Inputs First (if not in practice question answer mode) ---
  if (!updatedState.awaitingPracticeQuestionAnswer) {
    if (classification.intent === 'Nonsense') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.nonsense,
        updatedState.lastAssistantMessage,
      );
      responseText += `But seriously, ${updatedState.lastAssistantMessage?.includes('question') ? 'what do you think is the answer?' : 'what would you like to learn about?'}`;
      updatedState.lastAssistantMessage = responseText;
      return { processedText: responseText, state: updatedState };
    }

    if (classification.intent === 'Insult') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.insult,
        updatedState.lastAssistantMessage,
      );
      responseText += `Ready for a small step?`;
      updatedState.lastAssistantMessage = responseText;
      return { processedText: responseText, state: updatedState };
    }

    if (classification.intent === 'OffTopic') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.offTopic,
        updatedState.lastAssistantMessage,
      );
      if (currentTopic) {
        responseText += `Let’s get back to ${currentTopic}.`;
      } else {
        responseText += `What were we learning about?`;
      }
      updatedState.lastAssistantMessage = responseText;
      return { processedText: responseText, state: updatedState };
    }
  }


  // --- State-Based Learning Flow ---

  // 1. Awaiting Answer to a Practice Question
  if (updatedState.awaitingPracticeQuestionAnswer) {
    // Always allow new topic switching, even during a question
    if (classification.intent === 'NewTopic') {
      responseText = `Alright, let’s park this for now 🚗. Let’s explore ${classification.topic}!`;
      updatedState.lastSearchTopic.push(classification.topic!);
      updatedState.awaitingPracticeQuestionAnswer = false;
      updatedState.activePracticeQuestion = undefined;
      updatedState.validationAttemptCount = 0;
      updatedState.awaitingPracticeQuestionInvitationResponse = false; // Reset invitation state
      updatedState.videoSuggested = false; // Reset video suggested state
      // Immediately trigger a search for the new topic
      return getAssistantResponse(
        classification.topic!,
        chatHistory,
        updatedState,
        pathname,
        fileDataBase66,
        true,
        includeVideos,
        gradeHint,
        languageHint,
      );
    }

    if (classification.intent === 'Answer') {
      const { feedback, status } = await validateAnswerSocratically(
        updatedState.activePracticeQuestion!,
        message,
        currentTopic,
        updatedState.validationAttemptCount,
      );

      responseText = feedback;
      updatedState.validationAttemptCount++;

      if (status === 'Correct') {
        // The LLM now generates the full "Correct" response, including praise, context, summary, and next step.
        updatedState.awaitingPracticeQuestionAnswer = false;
        updatedState.activePracticeQuestion = undefined;
        updatedState.validationAttemptCount = 0;
        updatedState.awaitingPracticeQuestionInvitationResponse = false; // Reset invitation state
        updatedState.videoSuggested = false; // Reset video suggested state
      } 
    } else if (classification.intent === 'Nonsense') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.nonsense,
        updatedState.lastAssistantMessage,
      );
      responseText += `But seriously, ${updatedState.activePracticeQuestion}`; 
    } else if (classification.intent === 'Insult') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.insult,
        updatedState.lastAssistantMessage,
      );
      responseText += `Ready for a small step? Let’s think about: ${updatedState.activePracticeQuestion}`; 
    } else if (classification.intent === 'OffTopic') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.offTopic,
        updatedState.lastAssistantMessage,
      );
      responseText += `Remember, we were talking about: ${updatedState.activePracticeQuestion}`; 
    } else {
      // Vague, Clarify, etc. if not an answer
      responseText = getDynamicResponse(
        responseTemplates.encouragement,
        updatedState.lastAssistantMessage,
      );
      responseText += updatedState.activePracticeQuestion;
    }
    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, state: updatedState };
  }

  // 2. Awaiting Invitation Response for Practice Question (NEW STATE)
  if (updatedState.awaitingPracticeQuestionInvitationResponse) {
    if (classification.intent === 'Affirmative') {
      const question = await generatePracticeQuestion(currentTopic!, gradeHint);
      responseText = `Great! 🎉 Here’s one: ${question}`;
      updatedState.activePracticeQuestion = question;
      updatedState.awaitingPracticeQuestionAnswer = true;
      updatedState.awaitingPracticeQuestionInvitationResponse = false;
      updatedState.validationAttemptCount = 0;
      updatedState.videoSuggested = false; // Reset video suggested state
    } else if (classification.intent === 'Negative') {
      responseText = getDynamicResponse(responseTemplates.explainMore, updatedState.lastAssistantMessage);
      updatedState.awaitingPracticeQuestionInvitationResponse = false;
    } else if (classification.intent === 'Unsure') {
      responseText = getDynamicResponse(responseTemplates.redirect.unsure, updatedState.lastAssistantMessage);
    } else if (classification.intent === 'Curious') {
      responseText = getDynamicResponse(responseTemplates.redirect.curious, updatedState.lastAssistantMessage);
    } else if (classification.intent === 'Nonsense') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.nonsense,
        updatedState.lastAssistantMessage,
      );
      responseText += `But here’s the choice — do you want me to explain more, or give you a quick question to try?`;
    } else if (classification.intent === 'Insult') {
      responseText = getDynamicResponse(
        responseTemplates.redirect.insult,
        updatedState.lastAssistantMessage,
      );
      responseText += `Want me to slow it down and explain simply, or give you a small question to try?`;
    } else if (classification.intent === 'Vague' && message.trim() === '') { // Silent response
      const question = await generatePracticeQuestion(currentTopic!, gradeHint);
      responseText = getDynamicResponse(responseTemplates.redirect.silent, updatedState.lastAssistantMessage);
      responseText += question;
      updatedState.activePracticeQuestion = question;
      updatedState.awaitingPracticeQuestionAnswer = true;
      updatedState.awaitingPracticeQuestionInvitationResponse = false;
      updatedState.validationAttemptCount = 0;
      updatedState.videoSuggested = false; // Reset video suggested state
    } else if (classification.intent === 'NewTopic') {
      responseText = `Of course, let’s look into ${classification.topic!}.`;
      updatedState.lastSearchTopic.push(classification.topic!);
      updatedState.awaitingPracticeQuestionInvitationResponse = false;
      updatedState.videoSuggested = false; // Reset video suggested state
      // Immediately trigger a search for the new topic
      return getAssistantResponse(
        classification.topic!,
        chatHistory,
        updatedState,
        pathname,
        fileDataBase66,
        true,
        includeVideos,
        gradeHint,
        languageHint,
      );
    } else {
      // Fallback for other vague/unhandled inputs when awaiting invitation response
      responseText = getDynamicResponse(responseTemplates.redirect.unsure, updatedState.lastAssistantMessage);
    }
    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, state: updatedState };
  }

  // 3. Handling a "Back to Previous Topic" Request
  if (
    classification.intent === 'PreviousTopic' &&
    updatedState.lastSearchTopic.length > 1
  ) {
    updatedState.lastSearchTopic.pop(); // Remove current topic
    const newCurrentTopic =
      updatedState.lastSearchTopic[updatedState.lastSearchTopic.length - 1];
    responseText = `Okay, let’s get back to ${newCurrentTopic}! We can continue where we left off.`;
    responseText +=
      '\\n\\n' +
      getDynamicResponse(
        responseTemplates.practiceOffer,
        updatedState.lastAssistantMessage,
      );
    updatedState.researchModeActive = true;
    updatedState.awaitingPracticeQuestionInvitationResponse = true; // Offer practice again
    updatedState.videoSuggested = false; // Reset video suggested state
    updatedState.lastAssistantMessage = responseText;
    return { processedText: responseText, state: updatedState };
  }

  // 4. Default: Search or General Conversation
  const isSearchIntent =
    classification.intent === 'Search' ||
    classification.intent === 'NewTopic';

  if (isSearchIntent && classification.topic) {
    // STRICT GUARDRAIL
    if (!updatedState.researchModeActive && !forceWebSearch) {
      // Fallback to emotional copilot to answer from existing knowledge.
      try {
        const result = await emotionalAICopilot({
          text:
            chatHistory.map((m) => `${m.role}: ${m.content}`).join('\\n') +
            '\\n' +
            `user: ${message}`,
        });
        responseText = result.processedText;
        updatedState.lastAssistantMessage = responseText;
        return {
          processedText: responseText,
          state: updatedState,
        };
      } catch (error) {
         console.error('Error in emotional AI copilot fallback:', error);
         // If copilot also fails, provide a generic error message.
         responseText = 'I’m sorry, I’m having a little trouble right now. Please try again in a moment.';
         updatedState.lastAssistantMessage = responseText;
         return {
            processedText: responseText,
            state: updatedState,
         };
      }
    }
    
    // If guardrail is passed, proceed with web search
    try {
      const searchTopic = classification.topic;
      const webResults: GeneralWebSearchFlowOutput = await runFlow(
        generalWebSearchFlow,
        { 
          query: searchTopic,
          forceWebSearch: forceWebSearch,
          includeVideos: includeVideos,
          awaitingPracticeQuestionConfirmation: updatedState.awaitingPracticeQuestionInvitationResponse,
          lastSearchTopic: currentTopic,
          history: chatHistory,
          gradeHint: gradeHint,
          languageHint: languageHint,
        },
      );

      let sourcesText = '';
      if (webResults.sources && webResults.sources.length > 0) {
        sourcesText = '\\n\\nHere are some sources 🌍\\n' +
          webResults.sources.map(s => `${s.sourceName}: ${s.url}`).join('\\n');
      }

      responseText = `${webResults.reply}${sourcesText}\\n\\n` +
        getDynamicResponse(
          responseTemplates.practiceOffer,
          updatedState.lastAssistantMessage,
        );

      // Video suggestion logic
      if (includeVideos && !updatedState.videoSuggested) {
        const youtubeResults = await searchYouTube(searchTopic);
        const safeVideo = youtubeResults.find(video =>
          whitelistedChannels.some(channel => video.channelTitle?.includes(channel))
        );

        if (safeVideo) {
          videoData = { id: safeVideo.videoId, title: safeVideo.title };
          responseText += `\\n\\nHere’s a short video that might help you understand better 🎥 ${safeVideo.title} — from ${safeVideo.channelTitle}`;
          updatedState.videoSuggested = true;
        }
      }

      // Update state for the new topic
      if (!updatedState.lastSearchTopic.includes(searchTopic)) {
        updatedState.lastSearchTopic.push(searchTopic);
      }
      updatedState.researchModeActive = true;
      updatedState.awaitingPracticeQuestionInvitationResponse = true; // Set new state here
      updatedState.awaitingPracticeQuestionAnswer = false;
      updatedState.activePracticeQuestion = undefined;
    } catch (error) {
      console.error('Error during web search:', error);
      responseText =
        'I’m sorry, I had a little trouble searching for that. Could you please ask me again?';
    }
    updatedState.lastAssistantMessage = responseText;
    return {
      processedText: responseText,
      videoData: videoData,
      state: updatedState,
    };
  }


  // Handle explicit video request (if not already handled by general search)
  if (classification.intent === 'VideoRequest' && currentTopic) {
    if (!updatedState.videoSuggested) {
      const youtubeResults = await searchYouTube(currentTopic);
      const safeVideo = youtubeResults.find(video =>
        whitelistedChannels.some(channel => video.channelTitle?.includes(channel))
      );

      if (safeVideo) {
        videoData = { id: safeVideo.videoId, title: safeVideo.title };
        responseText = `Great! 🎉 Here’s one that explains it step by step: ${safeVideo.title} — from ${safeVideo.channelTitle}`;
        updatedState.videoSuggested = true;
        updatedState.lastAssistantMessage = responseText;
        return { processedText: responseText, videoData: videoData, state: updatedState };
      } else {
        responseText = 'I couldn’t find a suitable educational video for that topic right now. Would you like me to explain more, or try a practice question?';
        updatedState.lastAssistantMessage = responseText;
        return { processedText: responseText, state: updatedState };
      }
    } else {
      responseText = 'I’ve already suggested a video. Would you like to review it or try a practice question?';
      updatedState.lastAssistantMessage = responseText;
      return { processedText: responseText, state: updatedState };
    }
  }

  // Post-video engagement: If a video was suggested and the user isn't making another video request or new search
  if (updatedState.videoSuggested && classification.intent !== 'VideoRequest' && classification.intent !== 'NewTopic' && classification.intent !== 'Search') {
    // This ensures we don't re-offer a question if a practice question is already active or invited
    if (!updatedState.awaitingPracticeQuestionInvitationResponse && !updatedState.awaitingPracticeQuestionAnswer) {
      responseText = `Did you understand the video? Would you like me to ask a question on what you watched?`;
      updatedState.awaitingPracticeQuestionInvitationResponse = true;
      updatedState.lastAssistantMessage = responseText;
      updatedState.videoSuggested = false; // Reset after asking for engagement
      return { processedText: responseText, state: updatedState };
    }
  }

  // 5. Fallback to Emotional Copilot for general chat
  try {
    const result = await emotionalAICopilot({
      text:
        chatHistory.map((m) => `${m.role}: ${m.content}`).join('\\n') +
        '\\n' +
        `user: ${message}`,
    });

    // Reset research state as it’s a general conversation
    Object.assign(updatedState, {
      researchModeActive: false,
      awaitingPracticeQuestionInvitationResponse: false,
      awaitingPracticeQuestionAnswer: false,
      activePracticeQuestion: undefined,
      sensitiveContentDetected: false, 
      videoSuggested: false, // Reset video suggested state on general chat fallback
    });

    return {
      processedText: result.processedText,
      videoData: result.videoData,
      state: updatedState,
    };
  } catch (error) {
    console.error('Error in emotional AI copilot:', error);
    const fallback =
      'I’m sorry, I’m having a little trouble right now. Please try again in a moment.';
    updatedState.lastAssistantMessage = fallback;
    return {
      processedText: fallback,
      state: updatedState,
    };
  }
}

// Socratic validation function - NO WEB SEARCH
async function validateAnswerSocratically(
  question: string,
  answer: string,
  topic: string,
  attempt: number,
): Promise<{ feedback: string; status: 'Correct' | 'Incorrect' }> {
  const prompt = `
    You are a patient, Socratic teacher for K-12 students in Kenya. Your goal is to guide, not to give answers directly. Use simple, Kenyan classroom English.
    The student is learning about "${topic}".
    The current practice question is: "${question}"
    Student’s Answer: "${answer}"
    Attempt Number: ${attempt + 1}

    Analyze the student’s answer to the current practice question.

    1.  If the student's answer is CORRECT:
        -   Start with a short, warm positive phrase (e.g., “Great job 🎉”, “Excellent 🌟”).
        -   Briefly remind the student of what the question was about (e.g., “We were talking about what trees need to make food.”).
        -   Explain in one simple sentence why the answer is important (e.g., “Trees take in carbon dioxide from the air and water from the soil, and they use these in photosynthesis to create energy.”).
        -   End with a guiding choice to keep the flow alive (e.g., “Do you want me to ask you another question or explore a new topic?”).
        -   Combine all these parts into a single, cohesive response of 2-4 sentences max. Do not use bullet points or numbered lists.

    2.  If the student's answer is INCORRECT or PARTIAL:
        -   DO NOT give the correct answer directly.
        -   Instead, create a gentle, guiding, Socratic hint that helps them think step-by-step.
        -   The hint should either:
            a. Break down the original question into a simpler, leading question.
            b. Rephrase the original question in a simpler way.
            c. Build on a *partially correct* aspect of their previous answer, if any, to nudge them further.
        -   Refer back to the original question or its core idea to maintain context.
        -   Use local and playful examples when helpful (e.g., mandazi 🥯, matatu 🚐, football ⚽).
        -   Your hint should be a new, fresh thought, not a repetition of a previous hint or the original question.
        -   Always end the hint with a guiding question. Keep hints to 2-3 sentences max.

    3.  If the student’s input is NONSENSE, SILLY, or completely OFF-TOPIC:
        -   Playfully redirect them back to the *current practice question*.
        -   (e.g., “Haha 🍕🍌, that’s funny! But seriously, which gas do we breathe in to stay alive?”)
        -   Do NOT change the topic or start new research.

    4.  If the student’s input is an INSULT or ANGRY:
        -   Calmly de-escalate and gently redirect them back to the *current practice question*.
        -   (e.g., “I hear you’re upset 💙. Learning can be tough, but let’s slow it down together. Ready for a small step? Let’s think about: [original question]”)

    Output ONLY in this format:
    STATUS: [Correct|Incorrect]
    FEEDBACK: [Your Socratic, teacher-like feedback/hint. Keep it to 2-4 sentences max for correct answers, 2-3 for hints.]
    `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 180, // Increased max tokens for more elaborate hints
    });
    const llmOutput = response.choices[0].message.content?.trim() || '';

    const statusMatch = llmOutput.match(/STATUS:\s*(Correct|Incorrect)/);
    const feedbackMatch = llmOutput.match(/FEEDBACK:\s*([\s\S]*)/);

    const status =
      statusMatch && statusMatch[1] === 'Correct' ? 'Correct' : 'Incorrect';
    let feedback =
      feedbackMatch && feedbackMatch[1]
        ? feedbackMatch[1].trim()
        : getDynamicResponse(responseTemplates.encouragement);

    // The LLM is now instructed to end with a question for incorrect, so this might be redundant but keeping for safety
    if (status === 'Incorrect' && !/[?!.]$/.test(feedback)) {
      feedback += ` What do you think?`;
    }

    return { feedback, status };
  } catch (error) {
    console.error('[ACTIONS-DEBUG] Socratic Validation Error:', error);
    return {
      feedback: 'I had a little trouble processing that. Let’s try again!',
      status: 'Incorrect',
    };
  }
}

async function generatePracticeQuestion(
  topic: string,
  gradeHint: string,
): Promise<string> {
  const prompt = `Create one, and only one, practice question for a ${gradeHint}-level student in Kenya on the topic of "${topic}". The question should be clear, encourage thinking, use simple Kenyan classroom English, and ideally relate to a real-life Kenyan context or an analogy a Kenyan child would understand (e.g., mandazi 🥯, matatu 🚐, local animals). Do not provide the answer.`;
  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4o',
      max_tokens: 120, // Increased max tokens for more detailed questions
    });
    return (
      response.choices[0].message.content?.trim() ||
      `What is the most interesting thing about ${topic}?`
    );
  } catch (error) {
    console.error('Error generating practice question:', error);
    return `What is one key fact about ${topic}?`;
  }
}

// These functions are placeholders and would be used by other parts of the app
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
    return ['Could not load objectives.'];
  }
}

export async function searchYouTube(query: string): Promise<YoutubeSearchFlowOutput[]> {
  try {
    const results = await runFlow(youtubeSearchFlow, { query });
    return results;
  } catch (error) {
    console.error('Error in YouTube search flow:', error);
    return [];
  }
}

export type { ConversationState };
