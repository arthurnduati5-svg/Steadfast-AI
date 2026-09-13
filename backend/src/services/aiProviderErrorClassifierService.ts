import type { AiProviderErrorCategory } from '../contracts/aiRuntimeReliabilityContracts';

export type ClassifiedAiError = {
  category: AiProviderErrorCategory;
  retryable: boolean;
  statusCode?: number;
  retryAfterMs?: number;
  safeMessage: string;
};

const HTTP_STATUS_CATEGORIES: Record<number, { category: AiProviderErrorCategory; retryable: boolean; defaultSafeMessage: string }> = {
  400: { category: 'invalid_request', retryable: false, defaultSafeMessage: 'I encountered an issue processing your request. Could you rephrase what you need help with?' },
  401: { category: 'auth_error', retryable: false, defaultSafeMessage: 'The tutor engine is experiencing an authentication issue. Please try again later.' },
  403: { category: 'auth_error', retryable: false, defaultSafeMessage: 'The tutor engine is experiencing an authentication issue. Please try again later.' },
  404: { category: 'invalid_request', retryable: false, defaultSafeMessage: 'The requested resource was not found. Please try again.' },
  408: { category: 'timeout', retryable: true, defaultSafeMessage: 'The request timed out. Please try again.' },
  422: { category: 'invalid_request', retryable: false, defaultSafeMessage: 'I encountered an issue processing your request. Could you rephrase what you need help with?' },
  429: { category: 'rate_limited', retryable: true, defaultSafeMessage: 'Too many requests. Please wait a moment and try again.' },
  500: { category: 'provider_unavailable', retryable: true, defaultSafeMessage: 'The AI service encountered an internal error. Please try again shortly.' },
  502: { category: 'provider_unavailable', retryable: true, defaultSafeMessage: 'The AI service is temporarily unavailable. Please try again shortly.' },
  503: { category: 'provider_unavailable', retryable: true, defaultSafeMessage: 'The AI service is temporarily unavailable. Please try again shortly.' },
  504: { category: 'provider_unavailable', retryable: true, defaultSafeMessage: 'The AI service timed out. Please try again shortly.' },
};

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    if ('status' in error && typeof (error as Record<string, unknown>).status === 'number') {
      return (error as Record<string, number>).status;
    }
    if ('statusCode' in error && typeof (error as Record<string, unknown>).statusCode === 'number') {
      return (error as Record<string, number>).statusCode;
    }
  }
  return undefined;
}

function extractRetryAfterMs(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const headers = (error as Record<string, unknown>).headers as Record<string, unknown> | undefined;
    if (headers && typeof headers['retry-after-ms'] === 'number') {
      return headers['retry-after-ms'] as number;
    }
    if (headers && typeof headers['retry-after'] === 'string') {
      const parsed = parseInt(headers['retry-after'] as string, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 3600) {
        return parsed * 1000;
      }
    }
  }
  return undefined;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error && typeof error === 'object' && (error as Error).name === 'AbortError') return true;
  return false;
}

function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const msg = String((error as Error).message || '');
    if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET') || msg.includes('network') || msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('econnrefused')) {
      return true;
    }
  }
  return false;
}

function isTimeoutError(error: unknown): boolean {
  if (isAbortError(error)) return true;
  if (error && typeof error === 'object') {
    const msg = String((error as Error).message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('time_out')) return true;
  }
  return false;
}

export function classifyAiProviderError(error: unknown): ClassifiedAiError {
  const statusCode = extractStatusCode(error);
  const retryAfterMs = extractRetryAfterMs(error);

  if (statusCode !== undefined && HTTP_STATUS_CATEGORIES[statusCode]) {
    const mapping = HTTP_STATUS_CATEGORIES[statusCode];
    return {
      category: mapping.category,
      retryable: mapping.retryable,
      statusCode,
      retryAfterMs: mapping.category === 'rate_limited' ? retryAfterMs : undefined,
      safeMessage: mapping.defaultSafeMessage,
    };
  }

  if (isTimeoutError(error)) {
    return {
      category: 'timeout',
      retryable: true,
      statusCode: statusCode || 408,
      safeMessage: 'The request timed out. Please try again.',
    };
  }

  if (isNetworkError(error)) {
    return {
      category: 'network_error',
      retryable: true,
      safeMessage: 'There seems to be a network issue reaching the tutor engine. Please try again shortly.',
    };
  }

  return {
    category: 'unknown',
    retryable: false,
    statusCode,
    safeMessage: 'I encountered an unexpected issue. Please try rephrasing your question or try again later.',
  };
}
