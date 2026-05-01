import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('voice route proxy', () => {
  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://backend.internal:8080';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.BACKEND_INTERNAL_URL;
  });

  it('proxies TTS requests through the backend with auth headers intact', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(Buffer.from('mp3-bytes'), {
        status: 200,
        headers: {
          'content-type': 'audio/mpeg',
          'content-length': '9',
          'x-tts-voice': 'alloy',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/voice/tts/route');
    const req = new NextRequest('http://localhost:9000/voice/tts', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-voice-session-id': 'voice-session-1',
      },
      body: JSON.stringify({ text: 'Hello world', sessionUsageId: 'voice-session-1' }),
    });

    const res = await POST(req);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.internal:8080/api/copilot/tts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
          'X-Voice-Session-Id': 'voice-session-1',
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('audio/mpeg');
    expect(res.headers.get('x-tts-voice')).toBe('alloy');
  });

  it('proxies STT multipart payloads through the backend with auth headers intact', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'hello there' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/voice/stt/route');
    const form = new FormData();
    form.append('audio', new Blob(['voice-data'], { type: 'audio/webm' }), 'sample.webm');
    form.append('languageMode', 'english');
    form.append('sessionUsageId', 'voice-session-2');

    const req = new NextRequest('http://localhost:9000/voice/stt', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'x-voice-session-id': 'voice-session-2',
      },
      body: form,
    });

    const res = await POST(req);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.internal:8080/api/copilot/stt',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': expect.stringContaining('multipart/form-data'),
          'X-Voice-Session-Id': 'voice-session-2',
        }),
      })
    );
    const payload = await res.json();
    expect(payload).toEqual({ text: 'hello there' });
  });

  it('fails over to secondary backend candidate during transient network degradation', async () => {
    delete process.env.BACKEND_INTERNAL_URL;
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED primary'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ text: 'fallback success' }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../app/voice/stt/route');
    const form = new FormData();
    form.append('audio', new Blob(['voice-data'], { type: 'audio/webm' }), 'sample.webm');

    const req = new NextRequest('http://localhost:9000/voice/stt', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: form,
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('http://127.0.0.1:8080/api/copilot/stt'),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('http://localhost:8080/api/copilot/stt'),
      expect.any(Object)
    );
    expect(payload).toEqual({ text: 'fallback success' });
  });
});
