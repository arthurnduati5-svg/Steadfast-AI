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

function buildBackendTarget(baseUrl: string, req: NextRequest, path: string[]): string {
  const url = new URL(req.url);
  const joinedPath = path.map(encodeURIComponent).join('/');
  return `${baseUrl.replace(/\/$/, '')}/api/copilot/${joinedPath}${url.search}`;
}

async function proxyToBackend(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const method = req.method.toUpperCase();
  const bodyText =
    method === 'GET' || method === 'HEAD' || method === 'DELETE'
      ? ''
      : await req.text();

  const authHeader = getForwardAuthHeader(req);
  const contentType = req.headers.get('content-type') || '';

  for (const candidate of getBackendCandidates()) {
    try {
      if (!(await isUsableBackendCandidate(candidate))) continue;

      const upstream = await fetch(buildBackendTarget(candidate.url, req, path), {
        method,
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(contentType && bodyText ? { 'Content-Type': contentType } : {}),
        },
        body: bodyText || undefined,
        cache: 'no-store',
      });

      const responseBody = await upstream.arrayBuffer();
      const response = new NextResponse(responseBody, {
        status: upstream.status,
        headers: {
          'Cache-Control': 'no-store',
        },
      });

      const upstreamContentType = upstream.headers.get('content-type');
      if (upstreamContentType) {
        response.headers.set('Content-Type', upstreamContentType);
      }

      return response;
    } catch (error) {
      void error;
    }
  }

  return NextResponse.json(
    {
      message: "We couldn't load this part of your study workspace right now. Please try again.",
    },
    {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, context);
}
