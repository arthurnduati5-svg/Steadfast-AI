import { ConversationState } from '@/lib/types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SensitiveContentClassification = {
  isSensitive: boolean;
  category?: 'Sexual' | 'Violence' | 'Drugs_SelfHarm' | 'PersonalData';
};

export type KidInputClassification = {
  intent:
    | 'Affirmative'
    | 'Negative'
    | 'Answer'
    | 'Search'
    | 'NewTopic'
    | 'PreviousTopic'
    | 'Nonsense'
    | 'Insult'
    | 'OffTopic'
    | 'Vague'
    | 'Curious'
    | 'Unsure'
    | 'SensitiveContent'
    | 'VideoRequest'; // Added VideoRequest
  topic?: string;
  sensitiveCategory?: SensitiveContentClassification['category']; // New field
};

// Keyword-based sensitive content classification
function classifySensitiveContent(input: string): SensitiveContentClassification {
  const lowerInput = input.toLowerCase();

  // Sexual content keywords (basic)
  const sexualKeywords = /\b(sex|porn|penis|vagina|erection|orgasm|masturbate|sexual|intercourse|nude|naked|threesome|blowjob|cunnilingus|anal|bdsm|fetish|slut|whore|tits|dick|pussy)\b/i;
  if (sexualKeywords.test(lowerInput)) {
    return { isSensitive: true, category: 'Sexual' };
  }

  // Violence/Weapons/Self-harm keywords (basic)
  const violenceKeywords = /\b(kill|murder|bomb|gun|knife|suicide|self-harm|shoot|stab|fight|gore|torture|rape|abuse)\b/i;
  if (violenceKeywords.test(lowerInput)) {
    return { isSensitive: true, category: 'Violence' };
  }

  // Drugs keywords (basic)
  const drugKeywords = /\b(drug|weed|cocaine|heroin|meth|fentanyl|lsd|pills|smoke|sniff|high)\b/i;
  if (drugKeywords.test(lowerInput)) {
    return { isSensitive: true, category: 'Drugs_SelfHarm' };
  }

  // Personal data requests (basic)
  const personalDataKeywords = /\b(what is your name|how old are you|where do you live|my name is|my age is|my address is)\b/i;
  if (personalDataKeywords.test(lowerInput)) {
    return { isSensitive: true, category: 'PersonalData' };
  }

  return { isSensitive: false };
}

export async function classifyKidInput(
  input: string,
  state: ConversationState,
  currentTopic?: string,
): Promise<KidInputClassification> {
  const lowerInput = input.toLowerCase().trim();

  // --- Step 1: Sensitive Content Check (NEW) ---
  const sensitiveClassification = classifySensitiveContent(input);
  if (sensitiveClassification.isSensitive) {
    return { intent: 'SensitiveContent', sensitiveCategory: sensitiveClassification.category };
  }

  // --- Heuristic-Based Fast Path ---
  if (/\b(banana|pizza|lol|haha|silly)\b/i.test(lowerInput)) {
    return { intent: 'Nonsense' };
  }
  if (/\b(shut up|stupid|dumb|hate you|angry|upset)\b/i.test(lowerInput)) {
    return { intent: 'Insult' };
  }

  if (state.awaitingPracticeQuestionInvitationResponse) {
    if (/^(yes|yeah|ok|sure|yep|yup|give me one|let's try|i want one)$/.test(lowerInput)) {
      return { intent: 'Affirmative' };
    }
    if (/^(no|nah|nope|not now|don't want|skip)$/.test(lowerInput)) {
      return { intent: 'Negative' };
    }
    if (/\b(not sure|maybe|idk|i don't know|confused)\b/i.test(lowerInput)) {
      return { intent: 'Unsure' };
    }
    if (/\b(what's a practice question|what do you mean|explain question)\b/i.test(lowerInput)) {
      return { intent: 'Curious' };
    }
    if (lowerInput === '') {
      return { intent: 'Vague' };
    }
  }

  // --- LLM-Powered Classification for Nuanced Input ---
  const topicStack = state.lastSearchTopic || [];
  const previousTopic =
    topicStack.length > 1 ? topicStack[topicStack.length - 2] : null;

  const prompt = `
    You are an expert at interpreting a child's input within a learning conversation.
    Your goal is to classify the child's intent based on their message and the current state of the conversation.

    Conversation State:
    - Research Mode Active: ${state.researchModeActive}
    - Current Topic: "${currentTopic || 'None'}"
    - Previous Topic: "${previousTopic || 'None'}"
    - Awaiting Practice Question Invitation Response: ${
      state.awaitingPracticeQuestionInvitationResponse
    }
    - Awaiting Answer to a Practice Question: ${
      state.awaitingPracticeQuestionAnswer
    }
    - Last AI Message: "${state.lastAssistantMessage || ''}"

    Child's Message: "${input}"

    Based on all of this, choose the best INTENT from the list below.
    If the intent is 'NewTopic' or 'Search', you MUST identify the TOPIC.
    If the intent is 'PreviousTopic', the TOPIC MUST be "${previousTopic}".

    INTENTS:
    - Affirmative: The child is saying yes to a question (e.g., "yes", "okay, give me a question").
    - Negative: The child is saying no (e.g., "no", "not right now").
    - Answer: The child is trying to answer the practice question. Choose this if 'Awaiting Answer' is true and the input is a plausible answer.
    - Search: The child is explicitly asking to search for information on the CURRENT topic.
    - NewTopic: The child is asking a question about a completely new topic.
    - PreviousTopic: The child wants to go back to the previous topic of "${previousTopic}".
    - Nonsense: The child's input is silly, random, and completely unrelated (e.g., "banana pizza lol").
    - Insult: The child is being rude or insulting.
    - OffTopic: The child is talking about something unrelated but not nonsensical (e.g., "I saw a cool cartoon yesterday").
    - Vague: The child's input is unclear, says they don't know, or is a silent response.
    - Curious: The child is asking for clarification about the AI's offer or a term (e.g., "What's a practice question?").
    - Unsure: The child expresses indecision or uncertainty (e.g., "not sure", "maybe").
    - SensitiveContent: The child's input contains sensitive or inappropriate content that should not be discussed.
    - VideoRequest: The child explicitly asks for a video (e.g., "show me a video", "I want to watch a video", "can I see a video on this").

    Output in JSON format: {"intent": "INTENT", "topic": "TOPIC" | null}
    `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 100,
    });

    const parsed = JSON.parse(
      response.choices[0].message.content || '{}',
    ) as KidInputClassification;
    return parsed;
  } catch (error) {
    console.error('Error in LLM classification:', error);
    // Fallback for safety
    if (state.awaitingPracticeQuestionAnswer) {
      return { intent: 'Answer' };
    }
    if (state.awaitingPracticeQuestionInvitationResponse) {
      return { intent: 'Unsure' };
    }
    return { intent: 'Vague' };
  }
}
