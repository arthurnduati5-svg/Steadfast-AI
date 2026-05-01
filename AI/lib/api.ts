import { getMockAuthToken } from './mock-auth';
import type { DetectedInputLanguage, SupportedLearningLanguage } from './types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type VoiceBalanceResponse = {
  remainingSeconds: number;
  remainingMinutesRoundedDown: number;
  display: string;
};

type VoiceSessionStartRequest = {
  chatSessionId?: string;
};

type VoiceSessionStartResponse = {
  allowed: boolean;
  sessionUsageId?: string;
  mode?: string;
  remainingSeconds?: number;
  reason?: string;
  message?: string;
};

type VoiceSessionStopRequest = {
  sessionUsageId: string;
  stopReason: string;
  listeningSecondsUsed: number;
  ttsSecondsUsed: number;
  metadata?: Record<string, unknown>;
};

type VoiceSessionStopResponse = {
  sessionUsageId: string;
  billedSeconds: number;
  remainingSeconds: number;
  reason: string;
  mode?: string;
};

type SpeechToTextResponse = {
  text: string;
  detectedInputLanguage?: DetectedInputLanguage | null;
  preferredResponseLanguage?: SupportedLearningLanguage | null;
};

type TextToSpeechRequest = {
  text: string;
  voice?: string;
  speed?: number;
  languageMode?: string;
  sessionUsageId?: string | null;
  sessionLanguageState?: Record<string, unknown> | null;
};

type RequestOptions = {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

async function buildHeaders(
  body: unknown,
  extraHeaders?: Record<string, string>
): Promise<Record<string, string>> {
  const token = await getMockAuthToken();
  const headers: Record<string, string> = { ...(extraHeaders || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function requestResponse(options: RequestOptions): Promise<Response> {
  const headers = await buildHeaders(options.body, options.headers);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const relayAbort = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', relayAbort, { once: true });
    }
  }

  try {
    const response = await fetch(options.endpoint, {
      method: options.method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let payload: unknown = null;
      let message = `HTTP error! status: ${response.status}`;
      try {
        payload = await response.clone().json();
        if (
          payload &&
          typeof payload === 'object' &&
          'message' in (payload as Record<string, unknown>) &&
          typeof (payload as Record<string, unknown>).message === 'string'
        ) {
          message = (payload as Record<string, unknown>).message as string;
        }
      } catch {
        try {
          const text = await response.clone().text();
          if (text.trim()) {
            payload = text;
            message = text.trim();
          }
        } catch {
          // Ignore secondary parsing errors and keep the default message.
        }
      }
      throw new ApiError(response.status, message, payload);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener('abort', relayAbort);
    }
  }
}

async function requestJson<T = unknown>(options: RequestOptions): Promise<T> {
  const response = await requestResponse(options);
  return response.json() as Promise<T>;
}

const genericApi = {
  get<T = unknown>(endpoint: string) {
    return requestJson<T>({ method: 'GET', endpoint });
  },
  post<T = unknown>(endpoint: string, body: unknown) {
    return requestJson<T>({ method: 'POST', endpoint, body });
  },
  patch<T = unknown>(endpoint: string, body: unknown) {
    return requestJson<T>({ method: 'PATCH', endpoint, body });
  },
  delete<T = unknown>(endpoint: string) {
    return requestJson<T>({ method: 'DELETE', endpoint });
  },
};

const voiceApi = {
  getBalance(): Promise<VoiceBalanceResponse> {
    return requestJson<VoiceBalanceResponse>({
      method: 'GET',
      endpoint: '/api/copilot/voice/balance',
    });
  },
  startSession(payload: VoiceSessionStartRequest): Promise<VoiceSessionStartResponse> {
    return requestJson<VoiceSessionStartResponse>({
      method: 'POST',
      endpoint: '/api/copilot/voice/session/start',
      body: payload,
    });
  },
  stopSession(payload: VoiceSessionStopRequest): Promise<VoiceSessionStopResponse> {
    return requestJson<VoiceSessionStopResponse>({
      method: 'POST',
      endpoint: '/api/copilot/voice/session/stop',
      body: payload,
    });
  },
  transcribe(
    formData: FormData,
    options?: { sessionUsageId?: string; signal?: AbortSignal }
  ): Promise<SpeechToTextResponse> {
    return requestJson<SpeechToTextResponse>({
      method: 'POST',
      endpoint: '/voice/stt',
      body: formData,
      headers: options?.sessionUsageId ? { 'X-Voice-Session-Id': options.sessionUsageId } : undefined,
      signal: options?.signal,
    });
  },
  synthesize(
    payload: TextToSpeechRequest,
    options?: { sessionUsageId?: string; signal?: AbortSignal; timeoutMs?: number }
  ): Promise<Response> {
    return requestResponse({
      method: 'POST',
      endpoint: '/voice/tts',
      body: payload,
      headers: options?.sessionUsageId ? { 'X-Voice-Session-Id': options.sessionUsageId } : undefined,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  },
};

const api = {
  ...genericApi,
  voice: voiceApi,
};

export default api;
