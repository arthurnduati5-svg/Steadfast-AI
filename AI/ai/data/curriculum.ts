// src/ai/data/curriculum.ts

export interface CurriculumItem {
    microIdea: string;
    example: string;
    question: string;
  }
  
  // ⚡ O(1) Lookup Map for Curriculum Content
  // Edit this file to add new topics (Biology, Physics, Islamic Studies)
  // without touching the main code.
  
  export const CURRICULUM_MAP = new Map<string, CurriculumItem>([
    ["simultaneous", {
      microIdea: "A simultaneous equation is just a puzzle where we use two clues to find two prices.",
      example: "Imagine you go to the kiosk. One friend buys 2 Mandazis and 1 Chai for 40 shillings. That is your first clue.",
      question: "Can you write that clue as a simple math sentence? Use M for Mandazi and C for Chai."
    }],
    ["equation", {
      microIdea: "An equation is like a balance scale. Both sides must weigh the same.",
      example: "If you have 1kg of Sugar on one side, you need 1kg of weight on the other.",
      question: "If x + 5 = 10, what must 'x' be to keep the scale balanced?"
    }],
    ["fraction", {
      microIdea: "A fraction is simply sharing one whole thing into equal parts.",
      example: "Think of one hot Chapati. If you cut it into 4 equal pieces for your friends, one piece is (1 / 4).",
      question: "If you eat two of those pieces, how much of that Chapati is gone?"
    }],
    ["geometry", {
      microIdea: "Geometry helps us measure the space and shapes around us.",
      example: "Think of the rectangle of a football field, or the circle of a bicycle wheel.",
      question: "If we walk all the way around the field, what do we call that distance?"
    }],
    ["photosynthesis", {
      microIdea: "Plants are like chefs. They cook their own food using nothing but sunlight.",
      example: "Think of the maize in the shamba standing in the sun all day. It's working hard to grow food.",
      question: "What is the one thing the maize must take from the air to finish its cooking?"
    }],
    ["ratios", {
      microIdea: "A ratio is just comparing two groups using a colon : ",
      example: "If you are mixing concrete for a house, you might mix 1 bucket of cement with 3 buckets of sand.",
      question: "How would you write the ratio of cement to sand? (Hint: Use the : symbol)"
    }]
  ]);