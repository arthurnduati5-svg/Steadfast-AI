import { getMockAuthToken } from './mock-auth';

// No BACKEND_URL constant is needed here anymore; Next.js rewrites handle the proxying to the backend.

// Centralized fetch function to handle API requests
const api = {
  async get(endpoint: string) {
    const token = await getMockAuthToken();
    // For /api/auth/* routes, we use the relative path (handled by Next.js API routes)
    // For other /api/* routes, Next.js rewrites will proxy them from the frontend server to the backend service.
    const url = endpoint;
    console.log(`[API] Fetching GET from: ${url}`); 
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint: string, body: any) {
    const token = await getMockAuthToken();
    // For /api/auth/* routes, we use the relative path (handled by Next.js API routes)
    // For other /api/* routes, Next.js rewrites will proxy them from the frontend server to the backend service.
    const url = endpoint;
    console.log(`[API] Fetching POST from: ${url}`); 
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};

export default api;