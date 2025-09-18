
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { ai, serperSearchTool } from '../genkit';

// Whitelisted domains for educational content - corrected based on user's original strict list.
const WHITELISTED_DOMAINS = [
  'khanacademy.org',
  'britannica.com',
  'nationalgeographic.com',
  'openstax.org',
  'phet.colorado.edu',
  'ocw.mit.edu',
  'stanford.edu',
  'harvard.edu',
  'bbc.co.uk/bitesize',
  'who.int',
  'cdc.gov',
  'nasa.gov',
  'unesco.org',
  'oecd.org',
];

// Whitelisted YouTube channels for educational content
const WHITELISTED_YOUTUBE_CHANNELS = [
  'KhanAcademy',
  'CrashCourse',
  '3Blue1rown',
  'BBCBitesize',
  'Veritasium',
  'TED-Ed',
];

const generalWebSearchFlowInputSchema = z.object({
  query: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
  lastSearchTopic: z.string().optional(), // Frontend MUST pass this back for reliable context
  forceWebSearch: z.boolean().default(false),
  includeVideos: z.boolean().default(false),
  gradeHint: z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
  languageHint: z.enum(['English', 'Swahili mix']).optional(),
});

export const GeneralWebSearchResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  summaryText: z.string(),
  sourceName: z.string().optional(),
  isYoutubeVideo: z.boolean().default(false),
  videoData: z.object({
    id: z.string(),
    title: z.string(),
    channel: z.string().optional(),
    timestamp: z.string().optional(),
    summarySnippet: z.string().optional(),
  }).optional(),
});

const generalWebSearchFlowOutputSchema = z.object({
    reply: z.string(),
    sources: z.array(z.object({
      sourceName: z.string(),
      url: z.string(),
    })).optional(),
    videoData: GeneralWebSearchResultSchema.shape.videoData.optional(),
    mode: z.string().default('web_search'),
    sources_count: z.number().optional(),
    conversationState: z.enum(['initial_search', 'awaiting_practice_response', 'providing_practice_question', 'general']).default('general'),
    lastSearchTopic: z.string().optional(), // Output current topic for frontend to store
  });

export type GeneralWebSearchFlowOutput = z.infer<typeof generalWebSearchFlowOutputSchema>;

async function scrapePage(url: string): Promise<string> {
  console.log(`🚀 Scraping with fetch/cheerio: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10-second timeout
    });

    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove common non-content elements
    $('header, nav, footer, aside, form, script, style, noscript, svg').remove();

    // Extract text from the body, which is more likely to contain the main content
    const bodyText = $('body').text();
    
    const cleanedText = bodyText.replace(/\s\s+/g, ' ').trim();
    console.log(`✅ Successfully scraped ${url} (length: ${cleanedText.length})`);
    return cleanedText.substring(0, 8000); // Increased content limit
  } catch (error) {
    console.error(`❌ fetch/cheerio scraping failed for ${url}:`, (error as Error).message);
    return ''; // Return empty on failure for graceful fallback
  }
}

export async function summarizeContent(topic: string, content: string, gradeHint?: string): Promise<string> {
  const summarizerPrompt = `
You are a school tutor summarizer. Your task is to create a very short, student-friendly summary about "${topic}" based on the provided article text.
The provided text might be a short snippet if the full page could not be read.
Rules:
- Synthesize a helpful 2-3 sentence summary from the provided text.
- If the text is just a snippet and lacks context, say "I could only see a preview, but it seems to be about..." and then summarize the snippet.
- Cite 1-3 student-friendly sources (BBC Bitesize, Britannica, Khan Academy, National Geographic Kids, GradeHint).
- Always finish with the question: "Would you like me to give you a practice question?"
Article text:
${content}
GradeHint: ${gradeHint || 'LowerSecondary'}
  `;
  const llmResponse = await ai.generate({
    model: 'openai/gpt-4o',
    prompt: summarizerPrompt,
    output: { format: 'text' },
  });
  return llmResponse.text;
}

export async function generatePracticeQuestion(topic: string, gradeHint?: string): Promise<string> {
  const practiceQuestionPrompt = `
    Generate one clear practice question about the last researched topic: "${topic}".
    The question should be suitable for a ${gradeHint || 'LowerSecondary'} student.
    WAIT for the student's answer before moving forward.
    Practice Question:
  `;
  try {
    const llmResponse = await ai.generate({
      model: 'openai/gpt-4o',
      prompt: practiceQuestionPrompt,
      output: { format: 'text' },
      config: { temperature: 0.7 } // Higher temperature for question creativity
    });
    return llmResponse.text.trim();
  } catch (error) {
    console.error(`❌ Error generating practice question for topic "${topic}":`, error);
    return "I had a bit of trouble coming up with a question right now. Could you please ask me about the topic again?";
  }
}

function buildFocusedSearchQueries(query: string, gradeHint?: string, includeVideos: boolean = false): string[] {
  const baseQuery = query;
  let queries: string[] = [];
  const gradeKeyword = gradeHint === 'Primary' ? 'primary education' :
                       gradeHint === 'LowerSecondary' ? 'junior secondary' :
                       '';
  const siteRestriction = WHITELISTED_DOMAINS.map((domain: string) => `site:${domain}`).join(' OR ');

  queries.push(`${baseQuery} ${gradeKeyword} explain ${siteRestriction}`);
  queries.push(`${baseQuery} ${siteRestriction}`);

  if (includeVideos) {
    const youtubeSiteRestriction = WHITELISTED_YOUTUBE_CHANNELS.map(channel => `site:youtube.com/user/${channel} OR site:youtube.com/c/${channel}`).join(' OR ');
    queries.push(`${baseQuery} video explanation ${gradeKeyword} ${youtubeSiteRestriction}`);
  }
  return queries.slice(0, 3);
}

interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
}

function filterSearchResults(
  results: SerperSearchResult[],
  includeVideos: boolean,
  originalQuery: string
): SerperSearchResult[] {
  const filtered = results.filter((item: SerperSearchResult) => {
    const title = item.title?.toLowerCase() || '';
    const snippet = item.snippet?.toLowerCase() || '';
    const link = item.link?.toLowerCase() || '';
    const blacklistPatterns = ['lyrics', 'shorts', 'remix', 'reaction', 'trailer', 'vevo', 'fans', 'prank', 'viral', 'subscribe', 'download', 'music', 'gossip', 'recipe', 'how to make'];
    if (blacklistPatterns.some(pattern => title.includes(pattern) || snippet.includes(pattern))) return false;

    const isVideo = link.includes('youtube.com');
    if (isVideo && !includeVideos && !originalQuery.toLowerCase().includes('video')) return false;
    if (!isVideo && !WHITELISTED_DOMAINS.some((domain: string) => link.includes(domain))) return false;
    if (link.endsWith('.pdf') || link.endsWith('.ppt') || link.endsWith('.doc')) return false;

    return true;
  });
  const uniqueResults = Array.from(new Map(filtered.map(item => [item.link, item])).values());
  return uniqueResults.slice(0, 5);
}

export const generalWebSearchFlow = defineFlow(
  {
    name: 'generalWebSearchFlow',
    inputSchema: generalWebSearchFlowInputSchema,
    outputSchema: generalWebSearchFlowOutputSchema,
  },
  async (input: z.infer<typeof generalWebSearchFlowInputSchema>): Promise<GeneralWebSearchFlowOutput> => {
    
    if (!input.forceWebSearch) {
      return {
          reply: "I am in web search mode, but the 'forceWebSearch' flag was not set.",
          mode: 'error',
          conversationState: 'general',
          lastSearchTopic: input.lastSearchTopic, // Preserve topic if available
      };
    }

    // === CONTEXT GUARDRAIL V13: Unified Active Topic Derivation and Immediate Return for Practice Questions ===
    const isAffirmativeResponse = /^\s*(yes|yep|yeah|ok|okay|sure|go on)\s*$/i.test(input.query);
    let currentConversationState: z.infer<typeof generalWebSearchFlowOutputSchema>['conversationState'] = 'general';
    let activeTopic = input.query; // Default to current query if no context is found/used

    // Prioritize context from lastSearchTopic if provided by frontend and it's a follow-up
    if (input.lastSearchTopic && isAffirmativeResponse) {
        activeTopic = input.lastSearchTopic;
        console.log(`🔍 Using frontend-provided lastSearchTopic for follow-up: "${activeTopic}"`);
    } else if (isAffirmativeResponse && input.history && input.history.length > 0) {
        // Fallback: if no lastSearchTopic from frontend, try to infer from history for follow-ups
        const lastModelMessage = input.history.filter(h => h.role === 'model').pop()?.content;
        if (lastModelMessage && lastModelMessage.toLowerCase().includes('would you like me to give you a practice question?')) {
            // Use LLM to extract topic from previous AI response for better context
            const topicExtractionPrompt = `What was the main educational subject or topic of the following AI response? Respond with only the topic. AI Response: "${lastModelMessage}" Topic:`;
            try {
                const topicResponse = await ai.generate({
                    model: 'openai/gpt-4o',
                    prompt: topicExtractionPrompt,
                    output: { format: 'text' },
                    config: { temperature: 0.0 }
                });
                const inferredTopic = topicResponse.text.trim();
                if (inferredTopic && inferredTopic.toLowerCase() !== input.query.toLowerCase()) { // Only use if different and meaningful
                    activeTopic = inferredTopic;
                    console.log(`🔍 Fallback context: Inferred topic "${activeTopic}" from history for follow-up.`);
                }
            } catch (error) {
                console.error("❌ Error inferring topic from history for follow-up:", error);
            }
        }
    }

    // IMMEDIATE RETURN for practice question generation if conditions met
    if (isAffirmativeResponse && activeTopic && input.history && input.history.length > 0) {
      const lastModelMessage = input.history.filter(h => h.role === 'model').pop()?.content;
      
      if (lastModelMessage && lastModelMessage.toLowerCase().includes('would you like me to give you a practice question?')) {
        console.log(`✅ CONTEXT GUARDRAIL ACTIVE: Detected request for practice question about "${activeTopic}". Bypassing web search.`);
        
        const practiceQuestion = await generatePracticeQuestion(activeTopic, input.gradeHint);

        return {
            reply: `Great! Here's a practice question:\n\n${practiceQuestion}`,
            sources: [],
            mode: 'answered_from_context',
            sources_count: 0,
            conversationState: 'providing_practice_question',
            lastSearchTopic: activeTopic, // Maintain topic
        };
      }
    }
    // === END CONTEXT GUARDRAIL ===

    // If we reach here, it's either a new search query or a follow-up not specifically for a practice question.
    // The web search should proceed with the derived 'activeTopic'.
    // If activeTopic was derived from a previous follow-up but not for a practice question, it will be used here.
    // If it's a fresh query (not a follow-up), activeTopic will still be input.query.
    const topicForCurrentSearch = activeTopic; 
    const focusedQueries = buildFocusedSearchQueries(topicForCurrentSearch, input.gradeHint, input.includeVideos);
    let allSearchResults: SerperSearchResult[] = [];

    for (const query of focusedQueries) {
      try {
        const searchResponse = await serperSearchTool({ query });
        if (searchResponse.results) allSearchResults = allSearchResults.concat(searchResponse.results);
      } catch (error) {
        console.error(`❌ Error performing SerpAPI search for query "${query}":`, error);
      }
    }

    const filteredResults = filterSearchResults(allSearchResults, input.includeVideos, topicForCurrentSearch);
    let contentSummaries: string[] = [];
    let sources: { sourceName: string; url: string }[] = [];
    let processedLinks = new Set<string>();

    for (const item of filteredResults) {
      if (processedLinks.has(item.link)) continue;

      let contentToSummarize = '';
      const pageText = await scrapePage(item.link);

      if (pageText && pageText.length > 50) { 
        contentToSummarize = pageText;
      } else {
        console.warn(`⚠️ Scraping failed or content too short for ${item.link}, falling back to snippet.`);
        contentToSummarize = item.snippet; // Graceful fallback
      }

      if (contentToSummarize) {
        const summary = await summarizeContent(topicForCurrentSearch, contentToSummarize, input.gradeHint);
        contentSummaries.push(summary);
        const sourceNameMatch = item.link.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
        const sourceName = sourceNameMatch ? sourceNameMatch[1] : 'Web Source';
        sources.push({ sourceName: sourceName, url: item.link });
        processedLinks.add(item.link);
      }
      if (contentSummaries.length >= 3) break;
    }

    let finalReply = '';
    
    if (contentSummaries.length > 0) {
      const synthesisPrompt = `
You are a friendly and helpful school tutor for a Kenyan K-12 student.
Synthesize the following summaries into ONE coherent, student-friendly reply about "${topicForCurrentSearch}".
Rules:
- Output a short, clear paragraph (2-3 sentences).
- Cite 1-3 student-friendly sources (BBC Bitesize, Britannica, Khan Academy, National Geographic Kids, GradeHint).
- End with the guiding question: "Would you like me to give you a practice question?"
- If the content is insufficient, state: "I couldn't find a clear educational result on the web. I can still explain from class knowledge — would you like that?"
Summaries:
${contentSummaries.join('\n\n')}
Synthesized Reply:
      `;
      try {
        const llmResponse = await ai.generate({
          model: 'openai/gpt-4o',
          prompt: synthesisPrompt,
          output: { format: 'text' },
          config: { temperature: 0.2 },
        });
        finalReply = llmResponse.text.trim();
        
        if (finalReply.toLowerCase().includes('would you like me to give you a practice question?')) {
          currentConversationState = 'awaiting_practice_response';
        } else if (finalReply.toLowerCase().includes('here\'s a practice question')) {
          currentConversationState = 'providing_practice_question';
        } else {
          currentConversationState = 'general';
        }
      } catch (error) {
        console.error('❌ Error during synthesis LLM call:', error);
        finalReply = "I'm sorry, I encountered an issue while synthesizing the search results. Please try again.";
        currentConversationState = 'general';
      }
    } else {
      finalReply = "I couldn't find a clear educational result on the web. I can still explain from class knowledge — would you like that?";
      currentConversationState = 'general';
    }

    return {
      reply: finalReply,
      sources: sources,
      mode: 'web_search',
      sources_count: sources.length,
      conversationState: currentConversationState,
      lastSearchTopic: topicForCurrentSearch, // Store the active topic for the next turn
    };
  }
);
