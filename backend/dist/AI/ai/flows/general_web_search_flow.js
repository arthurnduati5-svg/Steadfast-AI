import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { ai, serperSearchTool } from '../genkit';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
/* ======================================================
   1. STRICT CONFIGURATION (UPDATED)
====================================================== */
const SPECIFIC_TRUSTED_DOMAINS = [
    'khanacademy.org', 'britannica.com', 'nationalgeographic.com',
    'openstax.org', 'nasa.gov', 'who.int', 'cdc.gov', 'unesco.org',
    'oecd.org', 'bbc.co.uk', 'mit.edu', 'harvard.edu', 'stanford.edu',
    'nature.com', 'scientificamerican.com', 'smithsonianmag.com',
    'ncbi.nlm.nih.gov', 'biologymad.com'
];
const TRUSTED_TLDS = ['.edu', '.gov', '.ac.uk', '.org'];
const MAX_SOURCES = 4;
const MAX_FACTS = 5; // Reduced to focus on core concepts
const FETCH_TIMEOUT_MS = 8000;
/* ======================================================
   2. SCHEMAS
====================================================== */
const InputSchema = z.object({
    query: z.string(),
    forceWebSearch: z.boolean().default(false),
    gradeHint: z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
});
const OutputSchema = z.object({
    reply: z.string(),
    sources: z.array(z.object({
        sourceName: z.string(),
        url: z.string(),
    })).optional(),
    mode: z.literal('web_research'),
});
/* ======================================================
   3. UTILS
====================================================== */
function cleanText(text) {
    return text.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
}
/* ======================================================
   4. STEP FUNCTIONS
====================================================== */
async function shouldUseWeb(query, force) {
    console.log(`[🔍 DEEP TRACE] Checking Web Intent. Force=${force}, Query="${query}"`);
    if (force)
        return true;
    const prompt = `
Question: "${query}"
Decide if answering this requires REAL-TIME or CURRENT web information.
Respond ONLY with JSON: { "needsWeb": true | false }
`;
    const res = await ai.generate({ model: 'openai/gpt-4o-mini', prompt, output: { format: 'json' } });
    const decision = Boolean(res.output?.needsWeb);
    console.log(`[🔍 DEEP TRACE] Web Intent Decision: ${decision}`);
    return decision;
}
async function generateResearchPlan(query) {
    console.log(`[🔍 DEEP TRACE] Generating Research Plan...`);
    const prompt = `
Create a neutral research plan for: "${query}"
Rules: No teaching language. Max 4 search queries. Output plain lines.
`;
    const res = await ai.generate({ model: 'openai/gpt-4o-mini', prompt });
    const plan = cleanText(res.text).split('. ').map(q => q.trim()).filter(Boolean).slice(0, 4);
    console.log(`[🔍 DEEP TRACE] Plan Created: ${JSON.stringify(plan)}`);
    return plan;
}
async function scrape(url) {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: controller.signal,
        });
        if (!res.ok)
            return '';
        const html = await res.text();
        const $ = cheerio.load(html);
        // Remove junk & ads
        $('script, style, nav, footer, header, aside, iframe, img, video, noscript, .ad, .advertisement').remove();
        const text = cleanText($('body').text());
        // 🛑 ANTI-GARBAGE FILTER: Detect Security Block Pages
        const lower = text.toLowerCase();
        if (lower.includes("access denied") ||
            lower.includes("security check") ||
            lower.includes("cloudflare") ||
            lower.includes("captcha") ||
            lower.includes("verify you are human")) {
            console.log(`[🔍 DEEP TRACE] 🗑️ Rejected Garbage Page: ${url}`);
            return ""; // Reject this source immediately
        }
        return text.slice(0, 6000);
    }
    catch {
        return '';
    }
}
function isTrusted(url) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        if (SPECIFIC_TRUSTED_DOMAINS.some(d => hostname.endsWith(d)))
            return true;
        if (TRUSTED_TLDS.some(tld => hostname.endsWith(tld)))
            return true;
        return false;
    }
    catch {
        return false;
    }
}
async function extractFacts(rawText, source, url) {
    const prompt = `
Extract clear educational facts.
Rules: No opinions, No technical warnings, Max 3 facts.
TEXT: ${rawText.slice(0, 2000)}
`;
    const res = await ai.generate({ model: 'openai/gpt-4o-mini', prompt });
    const lines = cleanText(res.text).split('. ').slice(0, 3);
    return lines.map(line => ({ claim: line.trim(), source, url }));
}
// ✅ UPDATED: STRICT MICRO-TEACHING SYNTHESIS
async function synthesizeAnswer(query, facts) {
    const hasFacts = facts.length > 0;
    console.log(`[🔍 DEEP TRACE] Synthesizing Answer. Facts available: ${hasFacts ? facts.length : 'NONE'}`);
    const prompt = hasFacts
        ? `
    SYSTEM ROLE: WORLD-CLASS PRIVATE TUTOR
    You are introducing a new topic to a student.

    Student Question: "${query}"
    Research Data:
    ${facts.map(f => `- ${f.claim}`).join('\n')}

    **STRICT TEACHING RULES:**
    1. **THE 10% RULE:** Teach ONLY the basic definition/concept first. Do NOT explain stages (like Krebs/Glycolysis), types, or complex chemistry yet. Save that for the next turn.
    2. **LENGTH:** Write exactly 3 to 5 clear sentences.
    3. **NO VOMIT:** Do not list facts. Weave them into a simple explanation.
    4. **NO SOURCES:** Never mention "I searched", "NCBI", "JavaScript", or "Browsers".
    5. **CHECKING QUESTION:** End with a simple question to verify they understood the definition (e.g., "Does that general idea make sense?").
    `
        : `
    SYSTEM ROLE: WORLD-CLASS PRIVATE TUTOR
    Student Question: "${query}"
    
    TASK:
    1. Introduce the concept simply using your internal knowledge.
    2. **THE 10% RULE:** Definition ONLY. No complex sub-steps yet.
    3. **LENGTH:** 3-5 sentences.
    4. End with a simple question to check understanding.
    `;
    const res = await ai.generate({ model: 'openai/gpt-4o', prompt });
    return GUARDIAN_SANITIZE(cleanText(res.text));
}
/* ======================================================
   10. FLOW IMPLEMENTATION
====================================================== */
export const generalWebResearchFlow = defineFlow({
    name: 'generalWebResearchFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
}, async (input) => {
    console.log(`[🔍 DEEP TRACE] Starting General Web Research Flow...`);
    const useWeb = await shouldUseWeb(input.query, input.forceWebSearch);
    if (!useWeb) {
        return {
            reply: await GUARDIAN_SANITIZE('This topic does not need web research. I can explain it directly.'),
            mode: 'web_research',
        };
    }
    const plan = await generateResearchPlan(input.query);
    const collectedFacts = [];
    const sources = [];
    const seen = new Set();
    for (const q of plan) {
        console.log(`[🔍 DEEP TRACE] 🔎 Executing Query: "${q}"`);
        try {
            const res = await serperSearchTool({ query: q });
            const results = res.results?.slice(0, 3) || [];
            console.log(`[🔍 DEEP TRACE] found ${results.length} raw links.`);
            for (const r of results) {
                if (seen.has(r.link))
                    continue;
                if (!isTrusted(r.link)) {
                    console.log(`[🔍 DEEP TRACE] ⚠️ Untrusted Domain skipped: ${r.link}`);
                    continue;
                }
                console.log(`[🔍 DEEP TRACE] 🕷️ Attempting to scrape: ${r.link}`);
                let text = await scrape(r.link);
                // Fallback to snippet if scrape is blocked or empty
                if (!text || text.length < 50) {
                    console.log(`[🔍 DEEP TRACE] ⚠️ Scrape blocked/empty. Falling back to Search Snippet.`);
                    text = r.snippet || "";
                }
                if (!text) {
                    console.log(`[🔍 DEEP TRACE] ❌ No data available.`);
                    continue;
                }
                const facts = await extractFacts(text, r.title, r.link);
                console.log(`[🔍 DEEP TRACE] 🧪 Extracted ${facts.length} facts.`);
                collectedFacts.push(...facts);
                sources.push({ sourceName: r.title, url: r.link });
                seen.add(r.link);
                if (collectedFacts.length >= MAX_FACTS)
                    break;
            }
        }
        catch (e) {
            console.error("[🔍 DEEP TRACE] 💥 Search Step Exception:", e);
        }
        if (sources.length >= MAX_SOURCES)
            break;
    }
    console.log(`[🔍 DEEP TRACE] 🏁 Research Complete. Total Facts: ${collectedFacts.length}`);
    const answer = await synthesizeAnswer(input.query, collectedFacts);
    return {
        reply: answer,
        sources,
        mode: 'web_research',
    };
});
//# sourceMappingURL=general_web_search_flow.js.map