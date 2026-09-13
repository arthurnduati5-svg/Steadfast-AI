export function createApiSuccess<T>(data: T, meta?: Record<string, unknown>): Record<string, unknown> {
  return {
    ok: true,
    ...(data as Record<string, unknown>),
    meta: meta || { timestamp: new Date().toISOString() },
  };
}

export function createApiError(messageOrOptions: string | Record<string, unknown>, status?: number, meta?: Record<string, unknown>): Record<string, unknown> {
  if (typeof messageOrOptions === 'object') {
    return {
      ok: false,
      error: messageOrOptions,
    };
  }
  return {
    ok: false,
    error: { message: messageOrOptions, status: status || 500 },
    meta: meta || { timestamp: new Date().toISOString() },
  };
}
