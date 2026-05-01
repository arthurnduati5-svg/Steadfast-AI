#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const BASE_URL = String(process.env.BASE_URL || 'http://127.0.0.1:9000')
  .trim()
  .replace(/\/+$/, '');
const TOKEN = String(process.env.TOKEN || '').trim();
const USER_ID = String(process.env.USER_ID || '').trim();
const SUITE_FILE = String(process.env.SUITE_FILE || 'docs/copilot-qa-suite.example.json').trim();
const OUTPUT_FILE = String(process.env.OUTPUT_FILE || 'docs/copilot-qa-report.json').trim();
const DELAY_MS = Math.max(0, Number(process.env.DELAY_MS || 250));
const APPLY_CASE_PREFERENCES = String(process.env.APPLY_CASE_PREFERENCES || 'true').trim().toLowerCase() !== 'false';

const DEFAULT_STATE = {
  researchModeActive: false,
  lastSearchTopic: [],
  awaitingPracticeQuestionInvitationResponse: false,
  activePracticeQuestion: undefined,
  awaitingPracticeQuestionAnswer: false,
  validationAttemptCount: 0,
  lastAssistantMessage: undefined,
  sensitiveContentDetected: false,
  videoSuggested: false,
  usedExamples: [],
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

const resolvePath = (p) => (path.isAbsolute(p) ? p : path.resolve(process.cwd(), p));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowIso = () => new Date().toISOString();

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  return normalizeText(text).split(' ').filter(Boolean).length;
}

function countQuestionMarks(text) {
  const raw = String(text || '');
  const matches = raw.match(/[?؟]/g);
  const punctCount = matches ? matches.length : 0;
  if (punctCount > 0) return punctCount;

  const interrogativeCue =
    /\b(question|which|what|how|why|where|when|who|swali|je|suala)\b|سؤال|كيف|ما\b/i.test(raw);
  return interrogativeCue ? 1 : 0;
}

function hasArabicScript(text) {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function getByPath(input, pathExpr) {
  const parts = String(pathExpr || '')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  let cur = input;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) {
      return undefined;
    }
    cur = cur[part];
  }
  return cur;
}

function hasRepeatedSegments(text) {
  const sentences = String(text || '')
    .split(/[.!?]\s+/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length >= 18);
  const counts = new Map();
  for (const sentence of sentences) {
    counts.set(sentence, (counts.get(sentence) || 0) + 1);
  }
  return Array.from(counts.values()).some((count) => count >= 3);
}

function toMessage(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.message === 'string') return value.message;
  return JSON.stringify(value);
}

function extractConversationState(meta) {
  const stateCandidate =
    meta?.state && typeof meta.state === 'object'
      ? meta.state
      : meta?.conversationState && typeof meta.conversationState === 'object'
        ? meta.conversationState
        : null;
  if (!stateCandidate) return null;
  try {
    return JSON.parse(JSON.stringify(stateCandidate));
  } catch {
    return null;
  }
}

function readSuite() {
  const full = resolvePath(SUITE_FILE);
  const raw = fs.readFileSync(full, 'utf8');
  const parsed = JSON.parse(raw);
  const cases = Array.isArray(parsed.cases) ? parsed.cases : [];
  return {
    config: {
      name: String(parsed?.config?.name || 'copilot_qa_suite'),
      newSessionPerCase: Boolean(parsed?.config?.newSessionPerCase),
      failOnRepeatedSegments: parsed?.config?.failOnRepeatedSegments !== false,
      applyCasePreferences:
        typeof parsed?.config?.applyCasePreferences === 'boolean'
          ? parsed.config.applyCasePreferences
          : APPLY_CASE_PREFERENCES,
      defaultMaxLatencyMs: Number.isFinite(Number(parsed?.config?.defaultMaxLatencyMs))
        ? Number(parsed.config.defaultMaxLatencyMs)
        : 30000,
    },
    cases,
  };
}

async function getToken() {
  if (TOKEN) return TOKEN;

  const url = `${BASE_URL}/api/auth/mock-token${USER_ID ? `?userId=${encodeURIComponent(USER_ID)}` : ''}`;
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.token) {
    throw new Error(
      `Could not fetch dev token from ${url}. ` +
      `Set TOKEN manually. Status=${res.status}. Details=${toMessage(payload)}`
    );
  }
  return String(payload.token).trim();
}

async function createSession(token) {
  const res = await fetch(`${BASE_URL}/api/copilot/new-session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    cache: 'no-store',
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.sessionId) {
    throw new Error(
      `Could not create session. Status=${res.status}. Details=${toMessage(payload)}`
    );
  }
  return String(payload.sessionId);
}

async function updatePreferences(token, preferredLanguage, interests) {
  const res = await fetch(`${BASE_URL}/api/copilot/preferences/update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      preferredLanguage: String(preferredLanguage || 'english').toLowerCase(),
      interests: Array.isArray(interests) ? interests : [],
    }),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Could not update preferences. Status=${res.status}. Details=${toMessage(payload)}`
    );
  }
}

async function readSseResponse(response) {
  if (!response.body) {
    return { text: '', meta: null, firstTokenMs: null };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let text = '';
  let meta = null;
  let firstTokenMs = null;
  const startedAt = performance.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.type === 'token') {
          if (firstTokenMs === null) {
            firstTokenMs = Math.round(performance.now() - startedAt);
          }
          text += String(parsed?.content || '');
        } else if (parsed?.type === 'done') {
          meta = parsed?.metadata || null;
        }
      } catch {
        // ignore malformed event lines
      }
    }
  }

  return { text: text.trim(), meta, firstTokenMs };
}

function evaluateCase(testCase, result, maxLatencyMsDefault, failOnRepeatedSegments) {
  const mustContain = Array.isArray(testCase.mustContain) ? testCase.mustContain : [];
  const mustContainAny = Array.isArray(testCase.mustContainAny) ? testCase.mustContainAny : [];
  const mustMatchRegex = Array.isArray(testCase.mustMatchRegex) ? testCase.mustMatchRegex : [];
  const mustNotContain = Array.isArray(testCase.mustNotContain) ? testCase.mustNotContain : [];
  const maxLatencyMs = Number.isFinite(Number(testCase.maxLatencyMs))
    ? Number(testCase.maxLatencyMs)
    : maxLatencyMsDefault;
  const minChars = Number.isFinite(Number(testCase.minChars)) ? Number(testCase.minChars) : 1;
  const minWords = Number.isFinite(Number(testCase.minWords)) ? Number(testCase.minWords) : 0;
  const maxWords = Number.isFinite(Number(testCase.maxWords)) ? Number(testCase.maxWords) : Number.POSITIVE_INFINITY;
  const minQuestions = Number.isFinite(Number(testCase.minQuestions)) ? Number(testCase.minQuestions) : 0;
  const maxQuestions = Number.isFinite(Number(testCase.maxQuestions)) ? Number(testCase.maxQuestions) : Number.POSITIVE_INFINITY;
  const expectedStatus = Number.isFinite(Number(testCase.expectedStatus)) ? Number(testCase.expectedStatus) : 200;
  const requireSources = Boolean(testCase.requireSources);
  const requireVideo = Boolean(testCase.requireVideo);
  const forbidSources = Boolean(testCase.forbidSources);
  const forbidVideo = Boolean(testCase.forbidVideo);
  const requireArabicScript = Boolean(testCase.requireArabicScript);
  const expectedState = testCase?.expectedState && typeof testCase.expectedState === 'object'
    ? testCase.expectedState
    : {};

  const responseNorm = normalizeText(result.responseText);
  const wordCount = countWords(result.responseText);
  const questionCount = countQuestionMarks(result.responseText);
  const sourcesCount = Array.isArray(result?.metadata?.sources) ? result.metadata.sources.length : 0;
  const hasVideo = Boolean(result?.metadata?.video || result?.metadata?.videoData);
  const stateObj = result?.metadata?.state || result?.metadata?.conversationState || {};
  const containsFailures = mustContain.filter((item) => !responseNorm.includes(normalizeText(item)));
  const containsAnySatisfied =
    mustContainAny.length === 0 ||
    mustContainAny.some((item) => responseNorm.includes(normalizeText(item)));
  const regexFailures = mustMatchRegex.filter((pattern) => {
    try {
      return !(new RegExp(String(pattern), 'i')).test(result.responseText);
    } catch {
      return true;
    }
  });
  const forbiddenHits = mustNotContain.filter((item) => responseNorm.includes(normalizeText(item)));
  const repeatedSegments = hasRepeatedSegments(result.responseText);
  const latencyFail = Number.isFinite(maxLatencyMs) && result.totalMs > maxLatencyMs;
  const stateMismatches = Object.entries(expectedState).filter(([pathExpr, expected]) => {
    return getByPath(stateObj, pathExpr) !== expected;
  }).map(([pathExpr]) => pathExpr);

  const checks = {
    statusMatches: result.status === expectedStatus,
    hasResponse: result.responseText.trim().length >= minChars,
    minWordsMet: wordCount >= minWords,
    maxWordsMet: wordCount <= maxWords,
    minQuestionsMet: questionCount >= minQuestions,
    maxQuestionsMet: questionCount <= maxQuestions,
    containsRequired: containsFailures.length === 0,
    containsAnyRequired: containsAnySatisfied,
    matchesRegex: regexFailures.length === 0,
    avoidsForbidden: forbiddenHits.length === 0,
    hasRequiredSources: requireSources ? sourcesCount > 0 : true,
    hasRequiredVideo: requireVideo ? hasVideo : true,
    noSourcesWhenForbidden: forbidSources ? sourcesCount === 0 : true,
    noVideoWhenForbidden: forbidVideo ? !hasVideo : true,
    hasArabicScript: requireArabicScript ? hasArabicScript(result.responseText) : true,
    expectedStateMatched: stateMismatches.length === 0,
    latencyWithinLimit: !latencyFail,
    noHeavyRepetition: failOnRepeatedSegments ? !repeatedSegments : true,
  };
  const ok = Object.values(checks).every(Boolean);

  return {
    ok,
    checks,
    expectedStatus,
    maxLatencyMs,
    minChars,
    minWords,
    maxWords: Number.isFinite(maxWords) ? maxWords : null,
    minQuestions,
    maxQuestions: Number.isFinite(maxQuestions) ? maxQuestions : null,
    wordCount,
    questionCount,
    sourcesCount,
    hasVideo,
    missingRequired: containsFailures,
    missingAnyRequired: containsAnySatisfied ? [] : mustContainAny,
    missingRegex: regexFailures,
    stateMismatches,
    forbiddenHits,
    repeatedSegments,
  };
}

async function runCase(testCase, token, sessionId, conversationState) {
  const prompt = String(testCase.prompt || '').trim();
  if (!prompt) {
    return {
      ok: false,
      id: String(testCase.id || 'unnamed_case'),
      prompt: '',
      status: 0,
      totalMs: 0,
      firstTokenMs: null,
      responseText: '',
      error: 'Prompt is empty.',
    };
  }

  const payload = {
    currentSessionId: sessionId,
    message: prompt,
    responseMode: 'default',
    forceWebSearch: Boolean(testCase.forceWebSearch),
    includeVideos: Boolean(testCase.includeVideos),
    chatHistory: Array.isArray(testCase.chatHistory) ? testCase.chatHistory : [],
    conversationState:
      conversationState && typeof conversationState === 'object'
        ? conversationState
        : cloneDefaultState(),
    preferences: {
      name: 'QA Student',
      gradeLevel: String(testCase.gradeLevel || 'Primary'),
      preferredLanguage: String(testCase.preferredLanguage || 'english'),
      interests: Array.isArray(testCase.interests) ? testCase.interests : [],
    },
    studentMemory: { progress: [], mistakes: [] },
  };

  const startedAt = performance.now();
  const response = await fetch(`${BASE_URL}/api/copilot/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  let responseText = '';
  let firstTokenMs = null;
  let meta = null;
  let error = '';

  if (contentType.includes('text/event-stream')) {
    const streamed = await readSseResponse(response);
    responseText = streamed.text;
    firstTokenMs = streamed.firstTokenMs;
    meta = streamed.meta;
  } else {
    const parsed = await response.json().catch(() => ({}));
    responseText = String(parsed?.response || parsed?.message || '').trim();
    meta = parsed;
  }

  if (!response.ok) {
    error = responseText || toMessage(meta) || `HTTP ${response.status}`;
  }

  const totalMs = Math.round(performance.now() - startedAt);

  return {
    id: String(testCase.id || 'unnamed_case'),
    prompt,
    status: response.status,
    totalMs,
    firstTokenMs,
    responseText,
    responsePreview: responseText.slice(0, 220),
    metadata: meta,
    error,
    ok: response.ok,
  };
}

function summarize(results) {
  const failed = results.filter((item) => !item.ok);
  const passed = results.length - failed.length;
  const latencies = results.map((item) => item.totalMs).filter((v) => Number.isFinite(v));
  latencies.sort((a, b) => a - b);
  const p95Index = latencies.length ? Math.max(0, Math.ceil(latencies.length * 0.95) - 1) : 0;
  const byCategory = {};
  for (const item of results) {
    const key = String(item.category || 'uncategorized');
    if (!byCategory[key]) {
      byCategory[key] = { all: 0, passed: 0, failed: 0 };
    }
    byCategory[key].all += 1;
    if (item.ok) byCategory[key].passed += 1;
    else byCategory[key].failed += 1;
  }

  return {
    totals: {
      all: results.length,
      passed,
      failed: failed.length,
    },
    latencyMs: {
      min: latencies.length ? latencies[0] : null,
      p95: latencies.length ? latencies[p95Index] : null,
      max: latencies.length ? latencies[latencies.length - 1] : null,
    },
    byCategory,
    failedCases: failed.map((item) => ({
      id: item.id,
      category: item.category || 'uncategorized',
      status: item.status,
      error: item.error || null,
      missingRequired: item.missingRequired || [],
      missingAnyRequired: item.missingAnyRequired || [],
      missingRegex: item.missingRegex || [],
      stateMismatches: item.stateMismatches || [],
      forbiddenHits: item.forbiddenHits || [],
      repeatedSegments: Boolean(item.repeatedSegments),
    })),
  };
}

async function main() {
  const suite = readSuite();
  if (!suite.cases.length) {
    throw new Error(`No test cases found in ${SUITE_FILE}`);
  }

  const token = await getToken();
  const startedAt = performance.now();

  let sharedSessionId = '';
  const groupedSessionIds = new Map();
  const groupedConversationStates = new Map();
  let sharedConversationState = cloneDefaultState();
  if (!suite.config.newSessionPerCase) {
    sharedSessionId = await createSession(token);
  }

  const results = [];
  for (let i = 0; i < suite.cases.length; i += 1) {
    const testCase = suite.cases[i];
    if (suite.config.applyCasePreferences) {
      await updatePreferences(token, testCase.preferredLanguage, testCase.interests);
    }
    const group = String(testCase.sessionGroup || '').trim();
    let sessionId = sharedSessionId;
    if (group) {
      const shouldResetGroup = Boolean(testCase.resetSession);
      if (shouldResetGroup || !groupedSessionIds.has(group)) {
        groupedSessionIds.set(group, await createSession(token));
        groupedConversationStates.set(group, cloneDefaultState());
      }
      sessionId = groupedSessionIds.get(group);
    } else if (suite.config.newSessionPerCase) {
      sessionId = await createSession(token);
      sharedConversationState = cloneDefaultState();
    }

    let conversationState = group
      ? groupedConversationStates.get(group) || cloneDefaultState()
      : sharedConversationState;

    if (testCase.resetState) {
      conversationState = cloneDefaultState();
      if (group) {
        groupedConversationStates.set(group, conversationState);
      } else {
        sharedConversationState = conversationState;
      }
    }
    const rawResult = await runCase(testCase, token, sessionId, conversationState);
    const nextState = extractConversationState(rawResult.metadata);
    if (nextState) {
      if (group) {
        groupedConversationStates.set(group, nextState);
      } else {
        sharedConversationState = nextState;
      }
    }
    const evaluated = evaluateCase(
      testCase,
      rawResult,
      suite.config.defaultMaxLatencyMs,
      suite.config.failOnRepeatedSegments
    );
    results.push({
      ...rawResult,
      ...evaluated,
      category: String(testCase.category || 'uncategorized'),
      sessionGroup: group || null,
      sessionId,
      index: i + 1,
      totalCases: suite.cases.length,
    });
    if (i < suite.cases.length - 1 && DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }

  const summary = summarize(results);
  const report = {
    generatedAt: nowIso(),
    baseUrl: BASE_URL,
    suite: {
      file: SUITE_FILE,
      name: suite.config.name,
      config: suite.config,
    },
    durationMs: Math.round(performance.now() - startedAt),
    summary,
    results,
  };

  fs.writeFileSync(resolvePath(OUTPUT_FILE), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));

  if (summary.totals.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Copilot QA runner failed:', error);
  process.exit(1);
});
