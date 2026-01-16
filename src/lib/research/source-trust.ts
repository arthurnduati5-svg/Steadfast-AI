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
  
  export function isTrustedSource(url: string): boolean {
    return TRUSTED_DOMAINS.some(domain => url.includes(domain));
  }
  