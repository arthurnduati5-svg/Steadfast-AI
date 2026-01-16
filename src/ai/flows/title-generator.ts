import { ai } from '../genkit';
import { Message } from '@/lib/types';

export async function generateChatTitle(history: Message[], currentMessage: string): Promise<string | null> {
  // Combine history + current message to see the full context
  const conversationSnippet = [
    ...history.slice(-5),
    { role: 'user', content: currentMessage }
  ].map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

  const prompt = `
  TASK: Generate a short, relevant title (1-5 words) for this conversation.

  CONVERSATION:
  ${conversationSnippet}

  STRICT NAMING RULES:
  1. **GREETINGS:** If the user only says "Hi", "Hello", "Mambo", set the title as "Greeting" or "Introduction".
  2. **SHORT REPLIES:** If the input is just "Yes", "No", "Okay", set the title as "General Discussion".
  3. **TOPIC DETECTION:** If the user asks about a subject (e.g., "Respiration"), use that (e.g., "Respiration Study").
  4. **FORBIDDEN WORDS:** Do NOT return "New Chat", "Untitled", "Chat", or "Conversation". The title must be descriptive.

  EXAMPLES:
  - Input: "Hi" -> Output: "Greeting"
  - Input: "Yes" -> Output: "General Discussion"
  - Input: "I want to learn algebra" -> Output: "Algebra Lesson"
  - Input: "Show me a video" -> Output: "Video Search"
  `;

  try {
    const res = await ai.generate({
      model: 'openai/gpt-4o-mini', // Fast & Cheap
      prompt,
    });
    
    let title = res.text.trim().replace(/"/g, '');

    console.log(`[TITLE GEN] Raw Output: "${title}"`);

    const lower = title.toLowerCase();

    // Final Safety Checks
    if (
        lower.includes("new chat") || 
        lower.includes("untitled") ||
        title.length < 2
    ) {
        // If AI fails to give a good name, fallback to a sensible default based on input length
        return currentMessage.length < 10 ? "Greeting" : "General Inquiry";
    }

    return title;
  } catch (error) {
    console.error(`[TITLE GEN] Error:`, error);
    return "General Discussion"; // Fallback if API fails
  }
}