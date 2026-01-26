const TRUSTED_DOMAINS = [
    'khanacademy.org',
    'britannica.com',
    'nasa.gov',
    'who.int',
    'cdc.gov',
    'nationalgeographic.com',
    'openstax.org',
    'bbc.co.uk',
    'mit.edu',
    'harvard.edu',
    'stanford.edu',
];
export function isTrustedSource(url) {
    return TRUSTED_DOMAINS.some(domain => url.includes(domain));
}
//# sourceMappingURL=source-trust.js.map