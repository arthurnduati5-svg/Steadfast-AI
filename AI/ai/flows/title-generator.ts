import OpenAI from 'openai';
import { Message } from '../../lib/types'; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatTitle(history: Message[], currentMessage: string): Promise<string | null> {
  // 1. CONTEXT ASSEMBLY
  // Get the last 3 turns to understand the "Flow"
  // This allows us to title "Yes" correctly based on the previous question.
  const relevantHistory = history.slice(-3);
  const conversationSnippet = [
    ...relevantHistory,
    { role: 'user', content: currentMessage }
  ].map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

  const systemPrompt = `
  TASK: Generate a lively, relevant, and short title (2-5 words) for this chat session.

  CONTEXT AWARENESS:
  - If the user says "Yes" or "Okay", look at the previous message to see WHAT they agreed to. (e.g. "Math Lesson Start").
  - If it is a greeting, make it friendly (e.g. "Warm Welcome").
  - If it is a question, capture the core topic (e.g. "Photosynthesis Query").
  
  RULES:
  1. NO quotes.
  2. NO "New Chat", "Untitled", or "General Discussion".
  3. Be specific but concise.
  4. Capitalize First Letters.

  EXAMPLES:
  - User: "I want to learn Algebra" -> Title: Algebra Practice
  - User: "Hi" -> Title: Friendly Greeting
  - AI: "Ready for math?" User: "Yes" -> Title: Math Lesson Setup
  - User: "Who is the president?" -> Title: Kenya Civics Inquiry
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `CONVERSATION LOG:\n${conversationSnippet}` }
      ],
      temperature: 0.7, // Higher temp = More creative/human titles
      max_tokens: 15,
    });
    
    let title = completion.choices[0].message.content?.trim().replace(/["']/g, '') || "";

    // 2. FINAL SAFETY NET (Smart Fallback)
    // If the AI fails or returns forbidden generic words, we construct a title manually
    const lowerTitle = title.toLowerCase();
    const forbidden = ["new chat", "untitled", "general discussion", "conversation"];
    
    if (!title || title.length < 3 || forbidden.some(w => lowerTitle.includes(w))) {
        // Fallback: Use the first meaningful words of the user's input
        // e.g. "I want to learn about atoms" -> "Learn About Atoms"
        const words = currentMessage.split(' ').filter(w => w.length > 2);
        if (words.length > 0) {
             title = words.slice(0, 4).join(' ');
             title = title.charAt(0).toUpperCase() + title.slice(1);
        } else {
             title = "Chat Session";
        }
    }

    return title;

  } catch (error) {
    console.error(`[TITLE GEN] Error:`, error);
    // Even on error, try to extract a title from input instead of "Error"
    const fallback = currentMessage.substring(0, 20) + (currentMessage.length > 20 ? "..." : "");
    return fallback || "Chat Session";
  }
}