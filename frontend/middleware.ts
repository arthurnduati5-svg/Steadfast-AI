import { NextRequest, NextResponse } from 'next/server';

const RAW_EMBED_ORIGIN =
  process.env.COPILOT_EMBED_ORIGIN ||
  process.env.NEXT_PUBLIC_COPILOT_EMBED_ORIGIN ||
  '';

const resolveOrigin = (value: string) => {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
};

const EMBED_ORIGIN = resolveOrigin(RAW_EMBED_ORIGIN);

const mergeDirective = (csp: string, directive: string, value: string) => {
  const trimmed = csp.trim();
  const directiveRegex = new RegExp(`${directive}[^;]*`, 'i');
  if (directiveRegex.test(trimmed)) {
    return trimmed.replace(directiveRegex, (match) => {
      if (match.includes(value)) return match;
      return `${match} ${value}`;
    });
  }
  const separator = trimmed.endsWith(';') || trimmed.length === 0 ? ' ' : '; ';
  return `${trimmed}${separator}${directive} 'self' ${value};`.trim();
};

export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  if (!EMBED_ORIGIN) return response;

  const existing = response.headers.get('Content-Security-Policy') || '';
  let csp = existing;
  csp = mergeDirective(csp, 'frame-src', EMBED_ORIGIN);
  csp = mergeDirective(csp, 'child-src', EMBED_ORIGIN);
  csp = mergeDirective(csp, 'frame-ancestors', EMBED_ORIGIN);

  response.headers.set('Content-Security-Policy', csp);
  response.headers.delete('X-Frame-Options');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
