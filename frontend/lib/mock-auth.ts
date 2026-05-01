let cachedAuthToken: string | null = null;
const DEV_TOKEN_STORAGE_KEY = 'token';

const readStoredToken = (): string => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('access_token') ||
    ''
  ).trim();
};

const persistDevToken = (token: string) => {
  if (typeof window === 'undefined' || !token || process.env.NODE_ENV === 'production') return;
  try {
    localStorage.setItem(DEV_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage issues and continue with in-memory auth fallback.
  }
};

const fetchTokenFrom = async (url: string, includeAuthHeader: boolean): Promise<string> => {
  try {
    const headers: Record<string, string> = {};
    if (includeAuthHeader) {
      const localToken = readStoredToken();
      if (localToken) headers.Authorization = `Bearer ${localToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) return '';
    const data = await response.json().catch(() => ({}));
    return String(data?.token || '').trim();
  } catch {
    return '';
  }
};

async function resolveAuthToken(options?: { forceRefresh?: boolean }): Promise<string> {
  if (!options?.forceRefresh) {
    const localToken = readStoredToken();
    if (localToken) return localToken;
  }

  const handoffToken = await fetchTokenFrom('/api/copilot/handoff', true);
  if (handoffToken) return handoffToken;

  if (process.env.NODE_ENV !== 'production') {
    const devToken = await fetchTokenFrom('/api/auth/mock-token', false);
    if (devToken) return devToken;
  }

  return '';
}

export async function getMockAuthToken(options?: { forceRefresh?: boolean }): Promise<string> {
  const forceRefresh = Boolean(options?.forceRefresh);

  if (!forceRefresh) {
    const localToken = readStoredToken();
    if (localToken) {
      cachedAuthToken = localToken;
      return localToken;
    }

    if (cachedAuthToken) return cachedAuthToken;
  }

  cachedAuthToken = null;

  const token = await resolveAuthToken({ forceRefresh });
  if (token) {
    cachedAuthToken = token;
    if (forceRefresh) persistDevToken(token);
  }
  return token;
}
