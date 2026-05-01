let cachedAuthToken: string | null = null;

const readStoredToken = (): string => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('access_token') ||
    ''
  ).trim();
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

async function resolveAuthToken(): Promise<string> {
  const localToken = readStoredToken();
  if (localToken) return localToken;

  const handoffToken = await fetchTokenFrom('/api/copilot/handoff', true);
  if (handoffToken) return handoffToken;

  if (process.env.NODE_ENV !== 'production') {
    const devToken = await fetchTokenFrom('/api/auth/mock-token', false);
    if (devToken) return devToken;
  }

  return '';
}

export async function getMockAuthToken(): Promise<string> {
  const localToken = readStoredToken();
  if (localToken) {
    cachedAuthToken = localToken;
    return localToken;
  }

  if (cachedAuthToken) return cachedAuthToken;

  const token = await resolveAuthToken();
  if (token) cachedAuthToken = token;
  return token;
}
