import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('chat route proxy', () => {
  const discoveryDir = path.join(process.cwd(), 'frontend', '.next-dev');
  const discoveryPath = path.join(discoveryDir, 'backend-url.json');

  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://backend.internal:8080';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.BACKEND_INTERNAL_URL;
    fs.rmSync(discoveryPath, { force: true });
  });

  it('proxies chat streaming requests through the backend with auth and content-type intact', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('data: {"type":"done"}\n\n', {
        status: 200,
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
          'x-accel-buffering': 'no',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/api/copilot/chat/route');
    const req = new NextRequest('http://localhost:3000/api/copilot/chat', {
      method: 'POST',
      headers: {
        authorization: 'Bearer stream-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ message: 'Explain fractions' }),
    });

    const res = await POST(req);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.internal:8080/api/copilot/chat?stream=true',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer stream-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ message: 'Explain fractions' }),
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    expect(res.headers.get('cache-control')).toBe('no-cache, no-transform');
  });

  it('streams through the discovered dev backend URL when the backend is not on port 8080', async () => {
    delete process.env.BACKEND_INTERNAL_URL;
    fs.mkdirSync(discoveryDir, { recursive: true });
    fs.writeFileSync(
      discoveryPath,
      JSON.stringify({ url: 'http://127.0.0.1:8093', port: 8093 })
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'ok', version: '0.1.0' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response('data: {"type":"done"}\n\n', {
          status: 200,
          headers: {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache, no-transform',
          },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/api/copilot/chat/route');
    const req = new NextRequest('http://localhost:3000/api/copilot/chat', {
      method: 'POST',
      headers: {
        authorization: 'Bearer stream-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ message: 'Explain fractions' }),
    });

    const res = await POST(req);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8093/api/health',
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8093/api/copilot/chat?stream=true',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer stream-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ message: 'Explain fractions' }),
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
  });
});
