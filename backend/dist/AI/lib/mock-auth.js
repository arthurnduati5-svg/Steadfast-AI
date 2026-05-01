"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockAuthToken = getMockAuthToken;
let cachedAuthToken = null;
const readStoredToken = () => {
    if (typeof window === 'undefined')
        return '';
    return (localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('access_token') ||
        '').trim();
};
const fetchTokenFrom = async (url, includeAuthHeader) => {
    try {
        const headers = {};
        if (includeAuthHeader) {
            const localToken = readStoredToken();
            if (localToken)
                headers.Authorization = `Bearer ${localToken}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers,
            credentials: 'include',
            cache: 'no-store',
        });
        if (!response.ok)
            return '';
        const data = await response.json().catch(() => ({}));
        return String(data?.token || '').trim();
    }
    catch {
        return '';
    }
};
async function resolveAuthToken() {
    const localToken = readStoredToken();
    if (localToken)
        return localToken;
    const handoffToken = await fetchTokenFrom('/api/copilot/handoff', true);
    if (handoffToken)
        return handoffToken;
    if (process.env.NODE_ENV !== 'production') {
        const devToken = await fetchTokenFrom('/api/auth/mock-token', false);
        if (devToken)
            return devToken;
    }
    return '';
}
async function getMockAuthToken() {
    const localToken = readStoredToken();
    if (localToken) {
        cachedAuthToken = localToken;
        return localToken;
    }
    if (cachedAuthToken)
        return cachedAuthToken;
    const token = await resolveAuthToken();
    if (token)
        cachedAuthToken = token;
    return token;
}
//# sourceMappingURL=mock-auth.js.map