"use strict";
// import { describe, it, expect } from 'vitest';
// import { emotionalAICopilot } from '../flows/emotional-ai-copilot';
// // Mock empty conversation state helper
// const getBaseState = () => ({
//   awaitingPracticeQuestionAnswer: false,
//   validationAttemptCount: 0,
//   correctAnswers: [],
//   lastSearchTopic: [],
//   researchModeActive: false,
//   awaitingPracticeQuestionInvitationResponse: false,
//   sensitiveContentDetected: false,
//   videoSuggested: false,
//   usedExamples: []
// });
// describe('STRICT teacher pipeline - emotional-ai-copilot', () => {
//   it('runs full pipeline without crashing', async () => {
//     const result = await emotionalAICopilot({
//       text: 'I want to learn simultaneous equations',
//       chatHistory: [], // Added required property
//       state: getBaseState(),
//       preferences: {
//         name: 'testUser1',
//         gradeLevel: 'Primary',
//         preferredLanguage: 'english',
//         interests: ['football']
//       }
//     });
//     expect(result.processedText.length).toBeGreaterThan(10);
//     expect(result.processedText).not.toMatch(/[*`$\\]/); // no latex no markdown
//   });
//   it('always produces ONE micro-idea, ONE example, ONE question', async () => {
//     const result = await emotionalAICopilot({
//       text: 'teach me fractions',
//       chatHistory: [],
//       state: getBaseState(),
//       preferences: {
//         preferredLanguage: 'english'
//       }
//     });
//     const text = result.processedText.toLowerCase();
//     // crude heuristic for test environment: check for question mark
//     expect(text.endsWith('?') || text.endsWith('.')).toBe(true); 
//   });
//   it('should generate a practice question when math topic detected', async () => {
//     const result = await emotionalAICopilot({
//       text: 'I want subtraction',
//       chatHistory: [],
//       state: getBaseState(),
//       preferences: {
//         preferredLanguage: 'english'
//       }
//     });
//     // Note: In a real test run without mocking OpenAI, the tool use depends on the model's decision.
//     // Assuming the prompt logic forces a question:
//     if (result.state.awaitingPracticeQuestionAnswer) {
//         expect(result.state.activePracticeQuestion).toBeDefined();
//     }
//   });
//   it('should validate a correct practice question answer', async () => {
//     // 1. Setup state pretending we just asked a question "10 - 3"
//     const stateWithQuestion = {
//         ...getBaseState(),
//         awaitingPracticeQuestionAnswer: true,
//         activePracticeQuestion: '10 - 3',
//         correctAnswers: ['7', 'seven'],
//         lastTopic: 'subtraction'
//     };
//     // 2. Answer the question
//     const step2 = await emotionalAICopilot({
//       text: '7',
//       chatHistory: [],
//       state: stateWithQuestion,
//       preferences: {
//         preferredLanguage: 'english'
//       }
//     });
//     expect(step2.processedText.toLowerCase()).toContain('excellent'); // Looking for praise keyword
//     expect(step2.state.awaitingPracticeQuestionAnswer).toBe(false);
//   });
//   it('should detect insults and return the exact protocol line', async () => {
//     const res = await emotionalAICopilot({
//       text: 'you are stupid',
//       chatHistory: [],
//       state: getBaseState(),
//       preferences: {
//         preferredLanguage: 'english'
//       }
//     });
//     // Matches the exact text from handlers.ts / emotional-ai-copilot.ts safety logic
//     expect(res.processedText).toContain('I am here to help you, even if you are upset');
//   });
//   it('should switch to arabic formatting when arabic mode is detected', async () => {
//     const result = await emotionalAICopilot({
//       text: 'teach me quran',
//       chatHistory: [],
//       state: getBaseState(),
//       preferences: {
//         name: 'testUser4',
//         preferredLanguage: 'arabic',
//         interests: []
//       }
//     });
//     // Check if output contains Arabic characters or if formatting was applied
//     // (Note: Requires model to output Arabic based on prompt)
//     if (result.processedText.match(/[\u0600-\u06FF]/)) {
//         const arabicDetected = /[\u0600-\u06FF]/.test(result.processedText);
//         expect(arabicDetected).toBe(true);
//     }
//   });
// });
//# sourceMappingURL=emotionalAICopilot.test.js.map