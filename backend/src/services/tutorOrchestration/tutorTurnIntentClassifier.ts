import type { TutorTurnIntent } from './tutorOrchestrationContracts';

export function classifyLearnerIntent(messageText: string, deenRelated?: boolean): TutorTurnIntent {
  const trimmed = messageText.trim().toLowerCase();

  if (deenRelated) {
    return 'ask_deen_question';
  }

  if (isSeriousSafetyRisk(trimmed)) {
    return 'serious_safety_risk';
  }

  if (isFinalAnswerRequest(trimmed)) {
    return 'ask_for_final_answer';
  }

  if (isAttempt(trimmed)) {
    return 'submit_attempt';
  }

  if (isPracticeRequest(trimmed)) {
    return 'ask_for_practice';
  }

  if (isHintRequest(trimmed)) {
    return 'ask_for_hint';
  }

  if (isRevisionRequest(trimmed)) {
    return 'ask_for_revision';
  }

  if (isConfusion(trimmed)) {
    return 'express_confusion';
  }

  if (isFrustration(trimmed)) {
    return 'express_frustration';
  }

  if (isConceptQuestion(trimmed)) {
    return 'ask_concept';
  }

  return 'unknown';
}

function isSeriousSafetyRisk(text: string): boolean {
  const safetyPatterns = [
    'kill myself',
    'want to die',
    'end my life',
    'suicide',
    'harm myself',
    'hurt myself',
  ];
  return safetyPatterns.some(p => text.includes(p));
}

function isFinalAnswerRequest(text: string): boolean {
  const patterns = [
    'give me the answer',
    'tell me the answer',
    'what is the answer',
    'just give me',
    'give answer',
    'solve it for me',
    'do it for me',
    'write the essay',
    'complete my homework',
    'do my homework',
    'give me the solution',
    'tell me what to write',
  ];
  return patterns.some(p => text.includes(p));
}

function isAttempt(text: string): boolean {
  const attemptPatterns = [
    'my answer is',
    'i think',
    'i got',
    'my answer:',
    'i calculate',
    'i solved',
    'i tried',
    'here is my',
    'is this correct',
    'is it correct',
    'am i right',
    'am i correct',
    'i wrote',
  ];
  return attemptPatterns.some(p => text.includes(p));
}

function isPracticeRequest(text: string): boolean {
  const patterns = [
    'give me practice',
    'practice question',
    'give me a question',
    'more practice',
    'i want to practice',
    'give me a problem',
    'another question',
    'practice on',
    'test me',
    'quiz me',
  ];
  return patterns.some(p => text.includes(p));
}

function isHintRequest(text: string): boolean {
  const patterns = [
    'give me a hint',
    'hint',
    'can i have a hint',
    'need a hint',
    'give hint',
    'hint please',
    'a hint',
  ];
  return patterns.some(p => text.includes(p));
}

function isRevisionRequest(text: string): boolean {
  const patterns = [
    'revision',
    'review',
    'revise',
    'i need to revise',
    'help me revise',
    'go over',
    'recap',
  ];
  return patterns.some(p => text.includes(p));
}

function isConfusion(text: string): boolean {
  const patterns = [
    'i don\'t understand',
    'i dont understand',
    'confused',
    'not clear',
    'doesn\'t make sense',
    'i\'m lost',
    'i am lost',
    'what do you mean',
    'i don\'t get it',
    'i dont get it',
  ];
  return patterns.some(p => text.includes(p));
}

function isFrustration(text: string): boolean {
  const patterns = [
    'this is hard',
    'too hard',
    'too difficult',
    'i can\'t do this',
    'i cant do this',
    'i give up',
    'this is too much',
    'i\'m stuck',
    'i am stuck',
    'frustrated',
  ];
  return patterns.some(p => text.includes(p));
}

function isConceptQuestion(text: string): boolean {
  const patterns = [
    'explain',
    'what is',
    'how does',
    'why does',
    'can you explain',
    'tell me about',
    'what does',
    'define',
    'meaning of',
    'what are',
    'how do',
    'teach me',
    'help me understand',
    'i want to learn',
  ];
  return patterns.some(p => text.startsWith(p) || text.includes(p));
}
