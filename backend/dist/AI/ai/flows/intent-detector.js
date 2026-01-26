import { ai } from '../genkit';
import { enforceNoPersona } from '../../lib/research/persona-lock';
export async function detectResearchIntent(query, lastTopic) {
    const prompt = enforceNoPersona(`
Classify the student's intent based on their input and the conversation context.

Student input: "${query}"
Active Topic: "${lastTopic || 'none'}"

CATEGORIES:
1. **dialogue_continuation**: Short conversational replies (e.g., "Yes", "No", "Okay", "Go on", "I understand", "Next", "Sure").
2. **clarification**: Asking follow-up questions about the ACTIVE TOPIC (e.g., "What about plants?", "Explain that part again", "Why?").
3. **video_lookup**: Explicitly asking for a video.
4. **greeting**: "Hi", "Hello".
5. **fact_lookup**: Asking for a specific NEW fact (e.g., "Who discovered oxygen?").
6. **deep_research**: Asking to learn a completely NEW broad topic (e.g. "I want to research Photosynthesis").
7. **practice**: "Test me", "Give me a quiz".

RULES:
- If the input is "Yes", "Okay", or "Continue", it is ALWAYS 'dialogue_continuation'.
- If the input refers to the Active Topic (e.g. "How does *it* work?"), it is 'clarification'.
- Only use 'deep_research' if the user explicitly changes the subject.

Respond ONLY with the category name.
`);
    try {
        const res = await ai.generate({
            model: 'openai/gpt-4o-mini',
            prompt,
        });
        return res.text.trim().toLowerCase();
    }
    catch {
        return 'clarification'; // Default to chat, not search
    }
}
//# sourceMappingURL=intent-detector.js.map