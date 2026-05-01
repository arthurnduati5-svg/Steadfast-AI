"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTrustedSource = isTrustedSource;
const TRUSTED_BASE_DOMAINS = [
    'khanacademy.org',
    'britannica.com',
    'nationalgeographic.com',
    'openstax.org',
    'nasa.gov',
    'who.int',
    'cdc.gov',
    'unesco.org',
    'oecd.org',
    'bbc.co.uk',
    'mit.edu',
    'harvard.edu',
    'stanford.edu',
    'nature.com',
    'scientificamerican.com',
    'smithsonianmag.com',
    'ncbi.nlm.nih.gov',
    'biologymad.com',
    // Finance / macro
    'bloomberg.com',
    'reuters.com',
    'ft.com',
    'imf.org',
    'worldbank.org',
    'cbk.co.ke',
    'centralbank.go.ke',
    'treasury.gov',
    'treasury.gov.za',
    'oanda.com',
    'xe.com',
];
const TRUSTED_SUFFIXES = ['.edu', '.gov', '.ac.uk'];
const IPV4_PATTERN = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
function isPrivateOrLocalHost(hostname) {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local')) {
        return true;
    }
    if (!IPV4_PATTERN.test(host)) {
        return false;
    }
    if (host.startsWith('10.') || host.startsWith('127.') || host.startsWith('192.168.')) {
        return true;
    }
    const secondOctet = Number(host.split('.')[1]);
    return host.startsWith('172.') && secondOctet >= 16 && secondOctet <= 31;
}
function isTrustedHostname(hostname) {
    const host = hostname.toLowerCase();
    if (TRUSTED_BASE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
        return true;
    }
    return TRUSTED_SUFFIXES.some((suffix) => host.endsWith(suffix));
}
function isTrustedSource(url) {
    try {
        const parsed = new URL(url);
        const protocol = parsed.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
            return false;
        }
        const host = parsed.hostname.toLowerCase();
        if (!host || isPrivateOrLocalHost(host)) {
            return false;
        }
        return isTrustedHostname(host);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=source-trust.js.map