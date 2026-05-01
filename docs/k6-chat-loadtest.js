import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000';
const TOKEN = __ENV.TOKEN || '';

export const options = {
  scenarios: {
    warmup: {
      executor: 'ramping-vus',
      startVUs: 20,
      stages: [
        { duration: '2m', target: 100 },
      ],
      gracefulRampDown: '30s',
    },
    scale: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '5m', target: 400 },
        { duration: '5m', target: 700 },
        { duration: '10m', target: 1000 },
      ],
      gracefulRampDown: '30s',
      startTime: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2500'],
  },
};

const headers = {
  'Content-Type': 'application/json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

function payload() {
  return JSON.stringify({
    currentSessionId: 'load-test-session',
    message: 'Explain one algebra step briefly, then ask a quick check question.',
    chatHistory: [
      { role: 'user', content: 'Help me with algebra.' },
      { role: 'model', content: 'Sure. What part is hard?' },
    ],
    conversationState: {
      researchModeActive: false,
      lastSearchTopic: [],
      awaitingPracticeQuestionInvitationResponse: false,
      awaitingPracticeQuestionAnswer: false,
      validationAttemptCount: 0,
      sensitiveContentDetected: false,
      videoSuggested: false,
      usedExamples: [],
    },
    preferences: {
      name: 'Load Tester',
      gradeLevel: 'Primary',
      preferredLanguage: 'english',
      interests: ['math'],
    },
    studentMemory: { progress: [], mistakes: [] },
  });
}

export default function () {
  const res = http.post(`${BASE_URL}/api/copilot/chat`, payload(), { headers });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'is sse': (r) => String(r.headers['Content-Type'] || '').includes('text/event-stream'),
  });
  sleep(0.2);
}
