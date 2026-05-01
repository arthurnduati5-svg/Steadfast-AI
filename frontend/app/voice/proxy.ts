import { NextRequest, NextResponse } from 'next/server';

function getBackendCandidates(): string[] {
  const configuredBackendUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    '';
  if (configuredBackendUrl.trim()) {
    return [configuredBackendUrl.trim()];
  }

  return ['http://127.0.0.1:8080', 'http://localhost:8080'];
}

function getForwardAuthHeader(req: NextRequest): string {
  const direct = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (direct.trim()) return direct.trim();

  const cookieToken =
    req.cookies.get('token')?.value ||
    req.cookies.get('auth_token')?.value ||
    req.cookies.get('access_token')?.value;

  return cookieToken ? `Bearer ${cookieToken}` : '';
}

function buildVoiceTarget(baseUrl: string, endpoint: 'stt' | 'tts', req: NextRequest): string {
  const url = new URL(req.url);
  return `${baseUrl.replace(/\/$/, '')}/api/copilot/${endpoint}${url.search}`;
}

export async function proxyVoiceRequest(
  req: NextRequest,
  endpoint: 'stt' | 'tts'
): Promise<NextResponse> {
  const method = req.method.toUpperCase();
  const bodyBuffer =
    method === 'GET' || method === 'HEAD' ? null : Buffer.from(await req.arrayBuffer());
  const authHeader = getForwardAuthHeader(req);
  const contentType = req.headers.get('content-type') || '';
  const sessionUsageId = req.headers.get('x-voice-session-id') || '';
  const errors: string[] = [];

  for (const candidate of getBackendCandidates()) {
    try {
      const upstream = await fetch(buildVoiceTarget(candidate, endpoint, req), {
        method,
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(contentType ? { 'Content-Type': contentType } : {}),
          ...(sessionUsageId ? { 'X-Voice-Session-Id': sessionUsageId } : {}),
        },
        body: bodyBuffer ?? undefined,
        cache: 'no-store',
      });

      const responseBody = await upstream.arrayBuffer();
      const response = new NextResponse(responseBody, {
        status: upstream.status,
        headers: {
          'Cache-Control': upstream.headers.get('cache-control') || 'no-store',
        },
      });

      const upstreamContentType = upstream.headers.get('content-type');
      if (upstreamContentType) {
        response.headers.set('Content-Type', upstreamContentType);
      }

      const upstreamContentLength = upstream.headers.get('content-length');
      if (upstreamContentLength) {
        response.headers.set('Content-Length', upstreamContentLength);
      }

      const upstreamVoice = upstream.headers.get('x-tts-voice');
      if (upstreamVoice) {
        response.headers.set('X-TTS-Voice', upstreamVoice);
      }

      return response;
    } catch (error) {
      errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json(
    {
      message: `Voice ${endpoint.toUpperCase()} proxy failed.`,
      details: errors.join(' | ') || 'No backend candidates responded.',
    },
    {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
