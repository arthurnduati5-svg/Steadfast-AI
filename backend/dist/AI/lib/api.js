import { getMockAuthToken } from './mock-auth';
// Centralized fetch function to handle API requests
const api = {
    async get(endpoint) {
        const token = await getMockAuthToken();
        const url = endpoint;
        // console.log(`[API] Fetching GET from: ${url}`); 
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
    async post(endpoint, body) {
        const token = await getMockAuthToken();
        const url = endpoint;
        // console.log(`[API] Fetching POST from: ${url}`); 
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
    // ✅ ADDED PATCH (Required for Title Updates)
    async patch(endpoint, body) {
        const token = await getMockAuthToken();
        const url = endpoint;
        // console.log(`[API] Fetching PATCH from: ${url}`); 
        const response = await fetch(url, {
            method: 'PATCH',
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
    // ✅ ADDED DELETE (Required for Deleting Chats)
    async delete(endpoint) {
        const token = await getMockAuthToken();
        const url = endpoint;
        // console.log(`[API] Fetching DELETE from: ${url}`); 
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },
};
export default api;
//# sourceMappingURL=api.js.map