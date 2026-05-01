import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('copilot catch-all proxy', () => {
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

  it('forwards revision mutation requests with auth and content-type intact', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ item: { id: 'rev-1' }, message: 'Revision item updated.' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { PATCH } = await import('../app/api/copilot/[...path]/route');
    const req = new NextRequest('http://localhost:3000/api/copilot/revision/rev-1', {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ isPinned: true }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ path: ['revision', 'rev-1'] }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.internal:8080/api/copilot/revision/rev-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ isPinned: true }),
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('forwards research and learning-effect POST requests through the shared JSON proxy', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ mode: 'web_research', result: { summary: 'Fractions are equal parts.', sources: [] } }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ event: { id: 'evt-1', eventType: 'used_practice_path' } }), {
          status: 201,
          headers: {
            'content-type': 'application/json',
          },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/api/copilot/[...path]/route');
    const researchReq = new NextRequest('http://localhost:3000/api/copilot/research', {
      method: 'POST',
      headers: {
        authorization: 'Bearer research-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: 'fractions', topic: 'Fractions', forceWebSearch: true }),
    });

    const researchRes = await POST(researchReq, {
      params: Promise.resolve({ path: ['research'] }),
    });

    const effectReq = new NextRequest('http://localhost:3000/api/copilot/learning-effect-event', {
      method: 'POST',
      headers: {
        authorization: 'Bearer quality-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ eventType: 'used_practice_path', topic: 'Fractions' }),
    });

    const effectRes = await POST(effectReq, {
      params: Promise.resolve({ path: ['learning-effect-event'] }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://backend.internal:8080/api/copilot/research',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer research-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ query: 'fractions', topic: 'Fractions', forceWebSearch: true }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://backend.internal:8080/api/copilot/learning-effect-event',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer quality-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ eventType: 'used_practice_path', topic: 'Fractions' }),
      })
    );
    expect(researchRes.status).toBe(200);
    expect(effectRes.status).toBe(201);
  });

  it('forwards founder-quality and video-context GET requests with query params intact', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ periodLabel: 'Last 14 days', strengths: [] }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ videoId: 'abc123', transcriptAvailable: false, concepts: [] }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { GET } = await import('../app/api/copilot/[...path]/route');
    const founderReq = new NextRequest(
      'http://localhost:3000/api/copilot/founder-truth?days=14&studentId=student-2',
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token',
        },
      }
    );

    const founderRes = await GET(founderReq, {
      params: Promise.resolve({ path: ['founder-truth'] }),
    });

    const videoReq = new NextRequest(
      'http://localhost:3000/api/copilot/video/abc123/context?sessionId=session-1&topic=Fractions',
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer learner-token',
        },
      }
    );

    const videoRes = await GET(videoReq, {
      params: Promise.resolve({ path: ['video', 'abc123', 'context'] }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://backend.internal:8080/api/copilot/founder-truth?days=14&studentId=student-2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://backend.internal:8080/api/copilot/video/abc123/context?sessionId=session-1&topic=Fractions',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer learner-token',
        }),
      })
    );
    expect(founderRes.status).toBe(200);
    expect(videoRes.status).toBe(200);
  });

  it('forwards media recap and asset requests through the shared copilot proxy', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ asset: { id: 'asset-video-1' }, recapText: 'Video recap', keyPoints: [], quickChecks: [], saveReadyNote: '' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ assets: [{ id: 'asset-audio-1', assetKind: 'audio_recap' }] }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ asset: { id: 'asset-audio-1', revisionItemId: 'rev-1' } }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { POST, GET } = await import('../app/api/copilot/[...path]/route');
    const recapReq = new NextRequest('http://localhost:3000/api/copilot/media/video-recap', {
      method: 'POST',
      headers: {
        authorization: 'Bearer media-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ videoId: 'vid-1', topic: 'Fractions' }),
    });
    const recapRes = await POST(recapReq, {
      params: Promise.resolve({ path: ['media', 'video-recap'] }),
    });

    const listReq = new NextRequest('http://localhost:3000/api/copilot/media/assets?assetKind=audio_recap&sessionId=session-1', {
      method: 'GET',
      headers: {
        authorization: 'Bearer media-token',
      },
    });
    const listRes = await GET(listReq, {
      params: Promise.resolve({ path: ['media', 'assets'] }),
    });

    const linkReq = new NextRequest('http://localhost:3000/api/copilot/media/assets/asset-audio-1/link-revision', {
      method: 'POST',
      headers: {
        authorization: 'Bearer media-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ revisionItemId: 'rev-1' }),
    });
    const linkRes = await POST(linkReq, {
      params: Promise.resolve({ path: ['media', 'assets', 'asset-audio-1', 'link-revision'] }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://backend.internal:8080/api/copilot/media/video-recap',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://backend.internal:8080/api/copilot/media/assets?assetKind=audio_recap&sessionId=session-1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://backend.internal:8080/api/copilot/media/assets/asset-audio-1/link-revision',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ revisionItemId: 'rev-1' }),
      })
    );
    expect(recapRes.status).toBe(200);
    expect(listRes.status).toBe(200);
    expect(linkRes.status).toBe(200);
  });

  it('uses the discovered dev backend URL when the backend is not on port 8080', async () => {
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
        new Response(JSON.stringify({ sessionId: 'session-8093' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/api/copilot/[...path]/route');
    const req = new NextRequest('http://localhost:3000/api/copilot/new-session', {
      method: 'POST',
      headers: {
        authorization: 'Bearer dev-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ['new-session'] }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8093/api/health',
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8093/api/copilot/new-session',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(200);
  });
});
