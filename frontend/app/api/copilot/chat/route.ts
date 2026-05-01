import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidates, isUsableBackendCandidate } from '../backend-targets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getForwardAuthHeader(req: NextRequest): string {
  const direct = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (direct.trim()) return direct.trim();

  const cookieToken =
    req.cookies.get('token')?.value ||
    req.cookies.get('auth_token')?.value ||
    req.cookies.get('access_token')?.value;

  return cookieToken ? `Bearer ${cookieToken}` : '';
}

function buildTarget(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, '')}/api/copilot/chat?stream=true`;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const authHeader = getForwardAuthHeader(req);
  const contentType = req.headers.get('content-type') || 'application/json';

  for (const candidate of getBackendCandidates()) {
    try {
      if (!(await isUsableBackendCandidate(candidate))) continue;

      const upstream = await fetch(buildTarget(candidate.url), {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: bodyText,
        cache: 'no-store',
      });

      const responseHeaders = new Headers();
      responseHeaders.set(
        'Content-Type',
        upstream.headers.get('content-type') || 'text/event-stream'
      );
      responseHeaders.set(
        'Cache-Control',
        upstream.headers.get('cache-control') || 'no-cache, no-transform'
      );
      responseHeaders.set(
        'Connection',
        upstream.headers.get('connection') || 'keep-alive'
      );
      responseHeaders.set(
        'X-Accel-Buffering',
        upstream.headers.get('x-accel-buffering') || 'no'
      );

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (error) {
      void error;
    }
  }

  return NextResponse.json(
    {
      message: "I couldn't connect just now. Please try sending that again.",
    },
    {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
