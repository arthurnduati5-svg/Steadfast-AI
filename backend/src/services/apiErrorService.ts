const ERROR_CATEGORY_STATUS: Record<string, number> = {
  validation_error: 400,
  authentication_required: 401,
  forbidden_scope: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  source_unverified: 422,
  cache_unsafe: 422,
  privacy_blocked: 403,
  safeguarding_exception: 403,
  academic_integrity_redirect: 403,
  internal_error: 500,
  upstream_unavailable: 503,
};

const ERROR_TYPE_URLS: Record<string, string> = {
  validation_error: 'https://steadfast.ai/errors/validation-error',
  authentication_required: 'https://steadfast.ai/errors/authentication-required',
  forbidden_scope: 'https://steadfast.ai/errors/forbidden-scope',
  not_found: 'https://steadfast.ai/errors/not-found',
  conflict: 'https://steadfast.ai/errors/conflict',
  rate_limited: 'https://steadfast.ai/errors/rate-limited',
  source_unverified: 'https://steadfast.ai/errors/source-unverified',
  cache_unsafe: 'https://steadfast.ai/errors/cache-unsafe',
  privacy_blocked: 'https://steadfast.ai/errors/privacy-blocked',
  safeguarding_exception: 'https://steadfast.ai/errors/safeguarding-exception',
  academic_integrity_redirect: 'https://steadfast.ai/errors/academic-integrity-redirect',
  internal_error: 'https://steadfast.ai/errors/internal-error',
  upstream_unavailable: 'https://steadfast.ai/errors/upstream-unavailable',
};

const ERROR_CODE_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
};

export function apiErrorFromCategory(
  category: string,
  message: string,
  meta?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ok: false,
    error: {
      category,
      code: category,
      type: ERROR_TYPE_URLS[category],
      message,
      status: ERROR_CATEGORY_STATUS[category] || 500,
    },
    meta: meta || { timestamp: new Date().toISOString() },
  };
}

export function apiErrorFromCode(
  code: string,
  message: string,
  meta?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ok: false,
    error: {
      code,
      message,
      status: ERROR_CODE_STATUS[code] || 500,
    },
    meta: meta || { timestamp: new Date().toISOString() },
  };
}

export function apiErrorStacktraceBlocked(): string {
  return 'An internal error occurred. Stack traces are not exposed in production responses.';
}
