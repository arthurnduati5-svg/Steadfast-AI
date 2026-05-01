"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const mock_auth_1 = require("./mock-auth");
class ApiError extends Error {
    constructor(status, message, payload) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}
exports.ApiError = ApiError;
const DEFAULT_TIMEOUT_MS = 15000;
async function buildHeaders(body, extraHeaders) {
    const token = await (0, mock_auth_1.getMockAuthToken)();
    const headers = { ...(extraHeaders || {}) };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined &&
        !(body instanceof FormData) &&
        !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}
async function requestResponse(options) {
    const headers = await buildHeaders(options.body, options.headers);
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const relayAbort = () => controller.abort();
    if (options.signal) {
        if (options.signal.aborted) {
            controller.abort();
        }
        else {
            options.signal.addEventListener('abort', relayAbort, { once: true });
        }
    }
    try {
        const response = await fetch(options.endpoint, {
            method: options.method,
            headers,
            body: options.body === undefined
                ? undefined
                : options.body instanceof FormData
                    ? options.body
                    : JSON.stringify(options.body),
            signal: controller.signal,
        });
        if (!response.ok) {
            let payload = null;
            let message = `HTTP error! status: ${response.status}`;
            try {
                payload = await response.clone().json();
                if (payload &&
                    typeof payload === 'object' &&
                    'message' in payload &&
                    typeof payload.message === 'string') {
                    message = payload.message;
                }
            }
            catch {
                try {
                    const text = await response.clone().text();
                    if (text.trim()) {
                        payload = text;
                        message = text.trim();
                    }
                }
                catch {
                    // Ignore secondary parsing errors and keep the default message.
                }
            }
            throw new ApiError(response.status, message, payload);
        }
        return response;
    }
    finally {
        clearTimeout(timeoutId);
        if (options.signal) {
            options.signal.removeEventListener('abort', relayAbort);
        }
    }
}
async function requestJson(options) {
    const response = await requestResponse(options);
    return response.json();
}
const genericApi = {
    get(endpoint) {
        return requestJson({ method: 'GET', endpoint });
    },
    post(endpoint, body) {
        return requestJson({ method: 'POST', endpoint, body });
    },
    patch(endpoint, body) {
        return requestJson({ method: 'PATCH', endpoint, body });
    },
    delete(endpoint) {
        return requestJson({ method: 'DELETE', endpoint });
    },
};
const voiceApi = {
    getBalance() {
        return requestJson({
            method: 'GET',
            endpoint: '/api/copilot/voice/balance',
        });
    },
    startSession(payload) {
        return requestJson({
            method: 'POST',
            endpoint: '/api/copilot/voice/session/start',
            body: payload,
        });
    },
    stopSession(payload) {
        return requestJson({
            method: 'POST',
            endpoint: '/api/copilot/voice/session/stop',
            body: payload,
        });
    },
    transcribe(formData, options) {
        return requestJson({
            method: 'POST',
            endpoint: '/voice/stt',
            body: formData,
            headers: options?.sessionUsageId ? { 'X-Voice-Session-Id': options.sessionUsageId } : undefined,
            signal: options?.signal,
        });
    },
    synthesize(payload, options) {
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
exports.default = api;
//# sourceMappingURL=api.js.map