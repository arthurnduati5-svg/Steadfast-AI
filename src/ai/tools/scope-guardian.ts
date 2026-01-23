/**
 * scope-guardian.ts
 * 
 * DYNAMIC SCOPE ENFORCEMENT
 * Blocks non-educational content with context-aware, natural redirection.
 */

type ViolationCategory = 'sexual' | 'violence' | 'drugs' | 'gossip' | 'harsh_slang' | 'unknown';

const CATEGORY_MAP: Record<ViolationCategory, string[]> = {
  sexual: [
    "sex", "sexual", "sodomy", "gay", "lesbian", "homosexual", "bisexual", "transgender",
    "dating", "romance", "boyfriend", "girlfriend", "kissing", "making out",
    "virgin", "condom", "intercourse", "masturbate", "porn", "onlyfans", "nude"
  ],
  violence: [
    "kill yourself", "suicide", "murder", "how to kill", "bomb", "terrorist",
    "cut myself", "self-harm", "gun", "weapon", "shoot", "fight", "blood"
  ],
  drugs: [
    "cocaine", "heroin", "meth", "weed", "marijuana", "bhang", "cannabis",
    "drunk", "alcohol", "beer", "wine", "vodka", "get high", "smoke"
  ],
  gossip: [
    "diddy", "kanye", "drake", "celebrity", "gossip", "who is dating",
    "rap music", "music video", "concert", "famous people", "drama"
  ],
  harsh_slang: [
    "gyat", "rizz", "skibidi", "sigma", "fanum tax" // Optional: Gen Alpha slang filter
  ],
  unknown: []
};

/**
 * Detects if input is out of scope and returns the category.
 * Returns NULL if safe.
 */
export function detectScopeViolation(input: string): ViolationCategory | null {
  if (!input) return null;
  const normalized = input.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      // Precise matching for short words
      if (keyword.length <= 4) {
         if (new RegExp(`\\b${keyword}\\b`, 'i').test(normalized)) return category as ViolationCategory;
      } else {
         if (normalized.includes(keyword)) return category as ViolationCategory;
      }
    }
  }
  return null;
}

/**
 * Checks if out of scope (Boolean wrapper for simple checks)
 */
export function isOutOfScope(input: string): boolean {
  return detectScopeViolation(input) !== null;
}

/**
 * Generates a Context-Aware, Natural Redirection.
 * No apologies. No lectures. Just a firm, gentle pivot.
 */
export function getDynamicScopeResponse(input: string): string {
  const category = detectScopeViolation(input);

  const pivots = [
    "Let us focus on your studies instead.",
    "I want to help you with your schoolwork.",
    "That is not something we learn in this class.",
    "Let's get back to the lesson.",
    "We are here to build your knowledge."
  ];
  
  const randomPivot = pivots[Math.floor(Math.random() * pivots.length)];

  switch (category) {
    case 'sexual':
      return `That is a personal topic, not for school. ${randomPivot} Do you have a question about Science or Biology?`;
    
    case 'violence':
      return `We do not discuss harmful things here. We focus on building a good future. ${randomPivot}`;
    
    case 'drugs':
      return `That is harmful to the body and mind. As your teacher, I want you to stay healthy. ${randomPivot} Shall we try a math problem instead?`;
    
    case 'gossip':
      return `Celebrities and music are for free time, not study time. ${randomPivot} What subject are you working on?`;
      
    case 'harsh_slang':
      return `Let us use clear, proper English for learning. ${randomPivot}`;

    default:
      // Fallback for generic catches
      return `That topic is outside our learning scope. ${randomPivot} You can ask me about Maths, Science, English, or Religion.`;
  }
}