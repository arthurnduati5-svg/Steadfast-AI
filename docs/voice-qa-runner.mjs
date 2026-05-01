#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { performance } from 'perf_hooks';

const baseUrl = String(process.env.BASE_URL || '').trim().replace(/\/+$/, '');
const token = String(process.env.TOKEN || '').trim();
const suiteFile = String(process.env.SUITE_FILE || 'docs/voice-qa-suite.example.json').trim();
const outputFile = String(process.env.OUTPUT_FILE || 'docs/voice-qa-report.json').trim();

if (!baseUrl) {
  console.error('BASE_URL is required. Example: https://your-frontend.up.railway.app');
  process.exit(1);
}

const resolvePath = (p) => (path.isAbsolute(p) ? p : path.resolve(process.cwd(), p));
const headers = token ? { Authorization: `Bearer ${token}` } : {};
const jsonHeaders = {
  ...headers,
  'Content-Type': 'application/json',
};

const nowIso = () => new Date().toISOString();

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const wordErrorRate = (expected, actual) => {
  const exp = normalizeText(expected).split(' ').filter(Boolean);
  const got = normalizeText(actual).split(' ').filter(Boolean);
  if (exp.length === 0) return got.length === 0 ? 0 : 1;
  return levenshtein(exp, got) / exp.length;
};

const probeAudioDurationSec = (buffer, extension = 'bin') => {
  const ffprobeCheck = spawnSync('ffprobe', ['-version'], { encoding: 'utf8' });
  if (ffprobeCheck.status !== 0) return null;
  const safeExtension = String(extension || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin';
  const tempName = `voice-qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
  const tempPath = path.resolve(process.cwd(), tempName);
  fs.writeFileSync(tempPath, buffer);
  try {
    const out = spawnSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nokey=1:noprint_wrappers=1', tempPath],
      { encoding: 'utf8' }
    );
    if (out.status !== 0) return null;
    const parsed = Number(String(out.stdout || '').trim());
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } finally {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }
  }
};

const requireToken = () => {
  if (!token) {
    throw new Error('TOKEN is required so QA runs against authenticated voice limits.');
  }
};

const startVoiceSession = async (metadata) => {
  requireToken();
  const response = await fetch(`${baseUrl}/api/voice/session/start`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ metadata }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.sessionUsageId) {
    throw new Error(payload?.message || `Unable to start voice session (${response.status})`);
  }
  return payload;
};

const stopVoiceSession = async (payload) => {
  requireToken();
  await fetch(`${baseUrl}/api/voice/session/stop`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
};

const readSuite = () => {
  const fullPath = resolvePath(suiteFile);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    stt: Array.isArray(parsed.stt) ? parsed.stt : [],
    tts: Array.isArray(parsed.tts) ? parsed.tts : [],
  };
};

const runSttCase = async (testCase) => {
  const caseName = String(testCase.name || 'stt-case');
  const expected = String(testCase.expected || '');
  const filePath = resolvePath(String(testCase.file || ''));
  const language = String(testCase.language || 'en');
  const languageMode = String(testCase.languageMode || (language === 'ar' ? 'arabic' : language === 'sw' ? 'swahili' : 'english'));
  const maxWer = Number.isFinite(Number(testCase.maxWer)) ? Number(testCase.maxWer) : 0.25;

  if (!fs.existsSync(filePath)) {
    return {
      name: caseName,
      ok: false,
      reason: `Missing audio file: ${filePath}`,
    };
  }

  const form = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const fileExtension = path.extname(filePath).replace(/^\./, '') || 'webm';
  const session = await startVoiceSession({ qaCase: caseName, qaType: 'stt', startedAt: nowIso() });
  const sessionHeaders = {
    ...headers,
    'X-Voice-Session-Id': String(session.sessionUsageId),
  };
  form.append('audio', new Blob([fileBuffer]), path.basename(filePath));
  form.append('language', language);
  form.append('languageMode', languageMode);
  form.append('sessionUsageId', String(session.sessionUsageId));

  let response;
  let latencyMs = 0;
  let payload = {};
  try {
    const startedAt = performance.now();
    response = await fetch(`${baseUrl}/voice/stt`, {
      method: 'POST',
      headers: sessionHeaders,
      body: form,
    });
    latencyMs = Math.round(performance.now() - startedAt);
    payload = await response.json().catch(() => ({}));
  } finally {
    const durationSec =
      Number.isFinite(Number(testCase.durationSec))
        ? Number(testCase.durationSec)
        : probeAudioDurationSec(fileBuffer, fileExtension) || 1;
    await stopVoiceSession({
      sessionUsageId: String(session.sessionUsageId),
      stopReason: 'user_stop',
      listeningSecondsUsed: Math.max(1, Math.ceil(durationSec)),
      ttsSecondsUsed: 0,
      metadata: { qaCase: caseName, qaType: 'stt' },
    });
  }

  const text = String(payload?.text || '');
  const wer = expected ? wordErrorRate(expected, text) : null;
  const ok = Boolean(response?.ok) && (wer === null || wer <= maxWer);

  return {
    name: caseName,
    ok,
    status: response?.status || 0,
    latencyMs,
    languageMode,
    expected,
    actual: text,
    wer,
    maxWer,
  };
};

const runTtsCase = async (testCase) => {
  const caseName = String(testCase.name || 'tts-case');
  const text = String(testCase.text || '');
  const languageMode = String(testCase.languageMode || 'english');
  const voice = String(testCase.voice || 'alloy');
  const speed = Number.isFinite(Number(testCase.speed)) ? Number(testCase.speed) : 1.12;
  const maxStartMs = Number.isFinite(Number(testCase.maxStartMs)) ? Number(testCase.maxStartMs) : 2500;
  const minCps = Number.isFinite(Number(testCase.minCharsPerSec)) ? Number(testCase.minCharsPerSec) : 7;
  const maxCps = Number.isFinite(Number(testCase.maxCharsPerSec)) ? Number(testCase.maxCharsPerSec) : 24;

  const session = await startVoiceSession({ qaCase: caseName, qaType: 'tts', startedAt: nowIso() });
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/voice/tts`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      'X-Voice-Session-Id': String(session.sessionUsageId),
    },
    body: JSON.stringify({
      text,
      languageMode,
      voice,
      speed,
      sessionUsageId: String(session.sessionUsageId),
    }),
  });
  const startMs = Math.round(performance.now() - startedAt);

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const durationSec = probeAudioDurationSec(audioBuffer, 'mp3');
  await stopVoiceSession({
    sessionUsageId: String(session.sessionUsageId),
    stopReason: 'user_stop',
    listeningSecondsUsed: 0,
    ttsSecondsUsed: Math.max(1, Math.ceil(durationSec || 1)),
    metadata: { qaCase: caseName, qaType: 'tts' },
  });
  const charsPerSec = durationSec && durationSec > 0 ? Number((text.length / durationSec).toFixed(2)) : null;
  const paceOk =
    charsPerSec === null
      ? true
      : charsPerSec >= minCps && charsPerSec <= maxCps;
  const ok = response.ok && startMs <= maxStartMs && paceOk;

  return {
    name: caseName,
    ok,
    status: response.status,
    startMs,
    maxStartMs,
    durationSec: durationSec ? Number(durationSec.toFixed(2)) : null,
    charsPerSec,
    minCharsPerSec: minCps,
    maxCharsPerSec: maxCps,
    bytes: audioBuffer.length,
    languageMode,
    voice,
  };
};

const summarize = (report) => {
  const all = [...report.stt, ...report.tts];
  const failed = all.filter((item) => !item.ok);
  return {
    generatedAt: nowIso(),
    baseUrl,
    totals: {
      stt: report.stt.length,
      tts: report.tts.length,
      all: all.length,
      failed: failed.length,
      passed: all.length - failed.length,
    },
    failed,
  };
};

const main = async () => {
  const suite = readSuite();

  const sttResults = [];
  for (const testCase of suite.stt) {
    sttResults.push(await runSttCase(testCase));
  }

  const ttsResults = [];
  for (const testCase of suite.tts) {
    ttsResults.push(await runTtsCase(testCase));
  }

  const report = {
    generatedAt: nowIso(),
    baseUrl,
    stt: sttResults,
    tts: ttsResults,
  };
  const summary = summarize(report);

  fs.writeFileSync(resolvePath(outputFile), JSON.stringify({ ...report, summary }, null, 2), 'utf8');

  console.log(JSON.stringify(summary, null, 2));
  if (summary.totals.failed > 0) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Voice QA runner failed:', error);
  process.exit(1);
});
