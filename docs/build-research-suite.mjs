#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const outFile = path.resolve(process.cwd(), 'docs/copilot-qa-suite.research.generated.json');

let idSeq = 1;
const nextId = (prefix) => `${prefix}_${String(idSeq++).padStart(3, '0')}`;

const mkCase = (overrides) => ({
  id: nextId('case'),
  category: 'research_misc',
  gradeLevel: 'Secondary',
  preferredLanguage: 'english',
  forceWebSearch: false,
  ...overrides,
});

const freshLookupPrompts = [
  'What is the latest inflation rate in Kenya today? Include sources.',
  'Who is the current president of France right now? Cite sources.',
  'What is the latest USD to KES exchange rate?',
  'Give recent WHO malaria updates with source links.',
  'What is the current CEO of OpenAI?',
  'What is the latest Python release version?',
  'Summarize recent NASA Artemis news with sources.',
  'What is today\'s Bitcoin price in USD with sources?',
  'What are current EPL standings this week with sources?',
  'What is the latest IMF growth forecast for Kenya?',
  'Any recent changes in Kenya education curriculum this year?',
  'What is the current Bank of England base rate?',
  'Latest update on El Nino impact in East Africa with sources.',
  'What is the current population estimate of Nairobi?',
  'Give updated global oil price range today with sources.',
  'Who is the current UN Secretary-General?',
  'Latest iPhone iOS version released this month?',
  'Current weather alerts in Mombasa today with sources.',
  'What are current gold prices per ounce today?',
  'Recent global AI policy news with links.'
];

const forcedWebPrompts = [
  'Search online: latest climate summit updates with sources.',
  'Look up current gold price and cite sources.',
  'Find latest WHO guidance on cholera and cite source.',
  'Search the web for today\'s exchange rate KES to USD.',
  'Look up current Kenya treasury bill rate with source.',
  'Find recent UN climate statement and link source.',
  'Search online for latest WHO vaccine advisory.',
  'Find current inflation report for Tanzania with sources.',
  'Look up recent COP climate agreement summary with links.',
  'Search web for latest NASA launch update with citation.',
  'Find current FAO food price index value.',
  'Look up latest OECD education report with source.',
  'Search online for current silver price.',
  'Find latest ECB policy decision with source.',
  'Search web for recent IMF debt outlook.'
];

const noWebOverridePrompts = [
  'Do not search the web. Explain osmosis from context only.',
  'No web lookup please, just teach me photosynthesis simply.',
  'Without internet, explain demand and supply basics.',
  'Don\'t search online. Teach Pythagoras theorem.',
  'No research mode. Continue from context and explain fractions.',
  'Use only our conversation context to explain inflation conceptually.',
  'Without external sources, teach me what GDP means.',
  'Please do not browse the web; explain Newton\'s first law.',
  'No internet mode, just teach me active recall.',
  'Do not look up anything online, explain osmosis again.'
];

const metaPrompts = [
  'Are you searching online right now or using our context?',
  'Why are you searching online for this?',
  'Did you just look this up on the web?',
  'Are those sources from web research mode?',
  'Can you explain from context instead of searching?'
];

const contextOnlyPrompts = [
  'What is photosynthesis?',
  'Explain 3/4 + 1/8 step by step.',
  'Teach me one idea about sabr for students.',
  'How do I revise for exams in one evening?',
  'Explain what a noun is for class 5.',
  'What is an algorithm in simple terms?',
  'Explain supply and demand with one example.',
  'Teach me osmosis in simple words.',
  'How do I stay consistent in study?',
  'What is kinetic energy?'
];

const multilingualFreshPrompts = [
  {
    prompt: 'Tafadhali nipe taarifa za hivi punde kuhusu mfumuko wa bei Kenya na vyanzo.',
    preferredLanguage: 'swahili'
  },
  {
    prompt: 'ما آخر أخبار الاقتصاد اليوم في كينيا؟ مع المصادر.',
    preferredLanguage: 'arabic',
    requireArabicScript: true
  },
  {
    prompt: 'Nipe latest updates za NASA Artemis na sources.',
    preferredLanguage: 'english_sw'
  },
  {
    prompt: 'أعطني آخر سعر الذهب اليوم مع المصادر.',
    preferredLanguage: 'arabic',
    requireArabicScript: true
  },
  {
    prompt: 'Habari za hivi karibuni kuhusu WHO malaria guidance na links.',
    preferredLanguage: 'swahili'
  },
  {
    prompt: 'Latest global AI policy news today with sources.',
    preferredLanguage: 'english'
  },
  {
    prompt: 'ما آخر إصدار من بايثون الآن؟ مع المصدر.',
    preferredLanguage: 'arabic',
    requireArabicScript: true
  },
  {
    prompt: 'Bei ya dola kwa shilingi leo ni ngapi? Taja chanzo.',
    preferredLanguage: 'swahili'
  }
];

const videoPrompts = [
  'Find a YouTube video explaining photosynthesis for students.',
  'Find a YouTube lesson on Newton laws.',
  'Get an educational video for algebra basics.',
  'Find a video about climate change for class 8.',
  'Find a tutorial video about fractions.',
  'Find a video explaining osmosis in simple terms.'
];

const cases = [];

for (const prompt of freshLookupPrompts) {
  cases.push(
    mkCase({
      id: nextId('research_auto'),
      category: 'research_auto',
      prompt,
      forceWebSearch: false,
      requireSources: true,
      minWords: 12,
    })
  );
}

for (const prompt of forcedWebPrompts) {
  cases.push(
    mkCase({
      id: nextId('research_forced'),
      category: 'research_forced',
      prompt,
      forceWebSearch: true,
      requireSources: true,
      minWords: 12,
    })
  );
}

for (const prompt of noWebOverridePrompts) {
  cases.push(
    mkCase({
      id: nextId('research_no_web'),
      category: 'research_no_web_override',
      prompt,
      forceWebSearch: true,
      forbidSources: true,
    })
  );
}

for (const prompt of metaPrompts) {
  cases.push(
    mkCase({
      id: nextId('research_meta'),
      category: 'research_meta',
      prompt,
      forceWebSearch: true,
      forbidSources: true,
    })
  );
}

for (const prompt of contextOnlyPrompts) {
  cases.push(
    mkCase({
      id: nextId('research_context'),
      category: 'research_context',
      prompt,
      forceWebSearch: false,
      forbidSources: true,
    })
  );
}

for (const item of multilingualFreshPrompts) {
  cases.push(
    mkCase({
      id: nextId('research_multi'),
      category: 'research_multilingual',
      prompt: item.prompt,
      preferredLanguage: item.preferredLanguage,
      forceWebSearch: false,
      requireSources: true,
      requireArabicScript: Boolean(item.requireArabicScript),
    })
  );
}

for (const prompt of videoPrompts) {
  cases.push(
    mkCase({
      id: nextId('research_video'),
      category: 'research_video',
      prompt,
      forceWebSearch: false,
      requireVideo: true,
    })
  );
}

// Follow-up context locking groups under forced web mode
for (let i = 1; i <= 6; i += 1) {
  const group = `ctx_followup_${i}`;
  cases.push(
    mkCase({
      id: nextId('research_followup_seed'),
      category: 'research_context_followup',
      sessionGroup: group,
      prompt: `Search latest inflation updates in East Africa with sources. (group ${i})`,
      forceWebSearch: true,
      requireSources: true,
    }),
    mkCase({
      id: nextId('research_followup_turn'),
      category: 'research_context_followup',
      sessionGroup: group,
      prompt: 'Can you explain that part again in simple words?',
      forceWebSearch: true,
      forbidSources: true,
    }),
    mkCase({
      id: nextId('research_followup_turn'),
      category: 'research_context_followup',
      sessionGroup: group,
      prompt: 'What does that mean for students practically?',
      forceWebSearch: true,
      forbidSources: true,
    })
  );
}

const payload = {
  config: {
    name: 'copilot_research_routing_generated_suite',
    newSessionPerCase: true,
    applyCasePreferences: true,
    failOnRepeatedSegments: true,
    defaultMaxLatencyMs: 45000,
  },
  cases,
};

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Generated ${cases.length} research-mode cases at ${outFile}`);
