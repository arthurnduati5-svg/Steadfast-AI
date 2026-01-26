
// This module is responsible for fetching a mock authentication token during development.

// We store the token in a singleton pattern to avoid re-fetching it on every API call.
let mockAuthToken: string | null = null;

/**
 * Fetches a mock JWT from our new API endpoint.
 * This avoids the security risks and technical problems of generating tokens on the client-side.
 */
async function fetchMockToken(): Promise<string> {
  try {
    // We make a request to our new, server-side endpoint.
    const response = await fetch('/api/auth/mock-token');
    if (!response.ok) {
      console.error(`[MockAuth] Failed to fetch mock token: HTTP error! status: ${response.status}`);
      throw new Error(`Failed to fetch mock token: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[MockAuth] Successfully fetched mock token.');
    return data.token;
  } catch (error) {
    console.error('[MockAuth] Error fetching mock auth token:', error);
    // If we can't get a token, we return an empty string. This will cause API
    // calls to fail, which is better than letting the app hang.
    return '';
  }
}

/**
 * Asynchronously retrieves the mock auth token.
 *
 * It fetches the token on the first call and caches it for subsequent requests.
 * This is the main function that other parts of the app will use.
 */
export async function getMockAuthToken(): Promise<string> {
  if (mockAuthToken === null) {
    mockAuthToken = await fetchMockToken();
  }
  return mockAuthToken;
}
