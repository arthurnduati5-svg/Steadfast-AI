import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { ai, serperSearchTool } from '../genkit';
import { ConversationState } from '@/lib/types';

// Whitelisted domains for educational content
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

/**
 * Aggressively cleans AI-generated text to remove all newlines and extra spaces.
 * @param text The raw text from the AI model.
 * @returns A clean, single-line string.
 */
export function cleanAIText(text: string): string {
  if (!text) return "";
  // Replaces all newline characters (Unix, Windows, Mac) with a single space,
  // then collapses multiple whitespace characters into a single space, and trims.
  return text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
}

const generalWebSearchFlowInputSchema = z.object({
  query: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
  lastSearchTopic: z.string().optional(),
  forceWebSearch: z.boolean().default(false),
  includeVideos: z.boolean().default(false),
  gradeHint: z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
  languageHint: z.enum(['English', 'Swahili mix']).optional(),
  awaitingPracticeQuestionConfirmation: z.boolean().default(false),
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
    lastSearchTopic: z.string().optional(),
  });

export type GeneralWebSearchFlowOutput = z.infer<typeof generalWebSearchFlowOutputSchema>;

async function scrapePage(url: string): Promise<string> {
  console.log(`🚀 Scraping with fetch/cheerio: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('header, nav, footer, aside, form, script, style, noscript, svg').remove();

    const bodyText = $('body').text();
    
    const cleanedText = bodyText.replace(/\s\s+/g, ' ').trim();
    console.log(`✅ Successfully scraped ${url} (length: ${cleanedText.length})`);
    return cleanedText.substring(0, 8000);
  } catch (error) {
    console.error(`❌ fetch/cheerio scraping failed for ${url}:`, (error as Error).message);
    return '';
  }
}

export async function summarizeContent(topic: string, content: string, gradeHint?: string): Promise<string> {
  const summarizerPrompt = `
You are a school tutor summarizer. Your task is to create a very short, student-friendly summary about "${topic}" based on the provided article text.
The provided text might be a short snippet if the full page could not be read.
Rules:
- Synthesize a helpful 1-6 sentence summary from the provided text.
- If the text is just a snippet and lacks context, say "I could only see a preview, but it seems to be about..." and then summarize the snippet.
- Do not include extra newlines or bullet points.
- CRITICAL: DO NOT mention or integrate any sources in the summary. Just provide the summary content.
- CRITICAL: DO NOT ask any follow-up questions at the end of the summary.
Article text:
${content}
GradeHint: ${gradeHint || 'LowerSecondary'}
  `;
  const llmResponse = await ai.generate({
    model: 'openai/gpt-4o',
    prompt: summarizerPrompt,
    output: { format: 'text' },
    config: { temperature: 0.2, maxTokens: 180 }, // Increased maxTokens for 1-6 sentences
  });
  return llmResponse.text;
}

export async function generatePracticeQuestion(topic: string, gradeHint?: string): Promise<string> {
  const practiceQuestionPrompt = `
    Generate one clear practice question about the last researched topic: "${topic}".
    The question should be suitable for a ${gradeHint || 'LowerSecondary'} student.
    Practice Question:
  `;
  try {
    const llmResponse = await ai.generate({
      model: 'openai/gpt-4o',
      prompt: practiceQuestionPrompt,
      output: { format: 'text' },
      config: { temperature: 0.7 }
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
          lastSearchTopic: input.lastSearchTopic,
      };
    }

    if (input.awaitingPracticeQuestionConfirmation && /^\s*(yes|yep|yeah|ok|okay|sure|go on)\s*$/i.test(input.query)) {
      const activeTopic = input.lastSearchTopic || "the topic we just discussed";
      console.log(`✅ CONTEXT GUARDRAIL ACTIVE: Detected request for practice question about "${activeTopic}". Bypassing web search.`);
        
      const practiceQuestion = await generatePracticeQuestion(activeTopic, input.gradeHint);

      return {
          reply: `Great! Here's a practice question: ${cleanAIText(practiceQuestion)}`,
          sources: [],
          mode: 'answered_from_context',
          sources_count: 0,
          conversationState: 'providing_practice_question',
          lastSearchTopic: activeTopic,
      };
    }

    let currentConversationState: z.infer<typeof generalWebSearchFlowOutputSchema>['conversationState'] = 'general';

    const topicForCurrentSearch = input.lastSearchTopic || input.query; 
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
    let collectedSources: { sourceName: string; url: string }[] = []; 
    let processedLinks = new Set<string>();

    for (const item of filteredResults) {
      if (processedLinks.has(item.link)) continue;

      let contentToSummarize = '';
      const pageText = await scrapePage(item.link);

      if (pageText && pageText.length > 50) { 
        contentToSummarize = pageText;
      } else {
        console.warn(`⚠️ Scraping failed or content too short for ${item.link}, falling back to snippet.`);
        contentToSummarize = item.snippet;
      }

      if (contentToSummarize) {
        const summary = await summarizeContent(topicForCurrentSearch, contentToSummarize, input.gradeHint);
        contentSummaries.push(cleanAIText(summary)); 
        const sourceNameMatch = item.link.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
        const sourceName = sourceNameMatch ? sourceNameMatch[1] : 'Web Source';
        collectedSources.push({ sourceName: sourceName, url: item.link }); // Collect sources here
        processedLinks.add(item.link);
      }
      if (contentSummaries.length >= 3) break;
    }

    let finalReply = '';
    
    if (contentSummaries.length > 0) {
      const synthesisPrompt = `
CRITICAL: Your entire response MUST be a single, natural block of text.
CRITICAL: The summary MUST be 1-6 sentences maximum.
CRITICAL: DO NOT use newlines. DO NOT use Markdown, bullet points, or any special formatting. Just plain text.
CRITICAL: DO NOT include any phrases about sources.
CRITICAL: DO NOT ask any follow-up questions at the end of the summary. Just provide the summary content.

You are a friendly and helpful school tutor for a Kenyan K-12 student.
Synthesize the following summaries into ONE coherent, student-friendly paragraph (1-6 sentences) about "${topicForCurrentSearch}".
Rules:
- Output a short, clear paragraph (1-6 sentences).
- Avoid extra newlines or unnecessary spacing. Keep the output as a compact paragraph.
- If the content is insufficient, state: "I couldn't find enough clear educational results on the web to give a good summary. I can still explain from class knowledge — would you like that?"
Summaries:
${contentSummaries.join(' ')}
Synthesized Reply:
      `;
      try {
        const llmResponse = await ai.generate({
          model: 'openai/gpt-3.5-turbo',
          prompt: synthesisPrompt,
          output: { format: 'text' },
          config: { temperature: 0.2, maxTokens: 180 }, // Increased maxTokens for 1-6 sentences
        });
        finalReply = cleanAIText(llmResponse.text);
        
        // The client will handle displaying sources based on the 'sources' array
        // and the practice question based on 'conversationState'.
        // No manual appending of sources or practice question to finalReply here.

        currentConversationState = 'awaiting_practice_response'; // Signal client for practice question

      } catch (error) {
        console.error('❌ Error during synthesis LLM call:', error);
        finalReply = "I'm sorry, I encountered an issue while synthesizing the search results. Please try again.";
        currentConversationState = 'general';
      }
    } else {
      finalReply = "I couldn't find enough clear educational results on the web. I can still explain from class knowledge — would you like that?";
      currentConversationState = 'general';
    }

    return {
      reply: finalReply,
      sources: collectedSources, // Return the collected sources for client to render
      mode: 'web_search',
      sources_count: collectedSources.length, // Return the count of collected sources
      conversationState: currentConversationState,
      lastSearchTopic: topicForCurrentSearch,
    };
  }
);
