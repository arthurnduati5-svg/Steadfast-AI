import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/mock-auth', () => ({
  getMockAuthToken: vi.fn(),
}));

describe('frontend api bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://backend.internal:8080';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  });

  it('uses the relative Next bridge for workspace preload requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ready: true,
          studentId: 'student-1',
          lastSession: null,
          revisionOverview: null,
          history: [],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('test-token');

    const { default: api } = await import('../lib/api');
    await api.sessions.preload();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/copilot/preload',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('opens chat streaming through the dedicated relative chat route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('data: {"type":"done"}\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('stream-token');

    const { default: api } = await import('../lib/api');
    await api.chat.openStream({ message: 'Explain fractions' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/copilot/chat',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer stream-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('persists normalized chat messages through the typed relative bridge endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Message saved',
          savedMessage: {
            id: 'msg-1',
            role: 'model',
            content: 'Research summary ready.',
            timestamp: '2026-03-30T09:00:00.000Z',
            metadata: { research: { trustSummary: 'Used higher-trust sources.' } },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('persist-token');

    const { default: api } = await import('../lib/api');
    await api.chat.persistMessage({
      sessionId: 'session-1',
      message: {
        id: 'msg-1',
        role: 'model',
        content: 'Research summary ready.',
        timestamp: new Date('2026-03-30T09:00:00.000Z'),
        metadata: { research: { trustSummary: 'Used higher-trust sources.' } },
      },
      conversationState: {
        researchModeActive: false,
        lastStudyTopic: 'Fractions',
        awaitingPracticeQuestionInvitationResponse: false,
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        sensitiveContentDetected: false,
        videoSuggested: false,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/copilot/message',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer persist-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          sessionId: 'session-1',
          message: {
            id: 'msg-1',
            role: 'model',
            content: 'Research summary ready.',
            timestamp: new Date('2026-03-30T09:00:00.000Z'),
            metadata: { research: { trustSummary: 'Used higher-trust sources.' } },
          },
          conversationState: {
            researchModeActive: false,
            lastStudyTopic: 'Fractions',
            awaitingPracticeQuestionInvitationResponse: false,
            awaitingPracticeQuestionAnswer: false,
            validationAttemptCount: 0,
            sensitiveContentDetected: false,
            videoSuggested: false,
          },
        }),
      })
    );
  });

  it('routes research and video helpers through relative documented bridge urls', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            mode: 'web_research',
            intent: 'topic_research',
            queryUsed: 'fractions',
            result: {
              summary: 'Fractions show equal parts of a whole.',
              sources: [],
            },
            notices: [],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            summary: 'Best beginner-friendly matches.',
            recommendations: [],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            videoId: 'abc123',
            title: 'Fractions explained',
            transcriptAvailable: true,
            concepts: ['fractions'],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('research-token');

    const { default: api } = await import('../lib/api');
    await api.research.run({
      query: 'fractions',
      sessionId: 'session-1',
      topic: 'Fractions',
      forceWebSearch: true,
    });
    await api.research.recommendVideos({
      query: 'fractions',
      topic: 'Fractions',
      intent: 'beginner_friendly',
      sessionId: 'session-1',
      limit: 3,
    });
    await api.research.getVideoContext('abc123', {
      sessionId: 'session-1',
      topic: 'Fractions',
      title: 'Fractions explained',
      whyRecommended: 'It explains the idea step by step.',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/copilot/research',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer research-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/copilot/video-recommend',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer research-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/copilot/video/abc123/context?sessionId=session-1&topic=Fractions&title=Fractions+explained&whyRecommended=It+explains+the+idea+step+by+step.',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer research-token',
        }),
      })
    );
  });

  it('routes media recap and asset endpoints through the typed relative bridge urls', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            asset: { id: 'asset-video-1', assetKind: 'video_recap', title: 'Fractions video recap', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
            recapText: 'Fractions compare part to whole.',
            keyPoints: ['Numerator over denominator'],
            quickChecks: ['What is 1/2?'],
            saveReadyNote: 'Use equal denominators before comparing.',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            asset: { id: 'asset-audio-1', assetKind: 'audio_recap', title: 'Fractions audio recap', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
            recapText: 'Quick recap',
            audioUrl: null,
            audioDurationSec: null,
            fallbackToText: true,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            asset: { id: 'asset-image-1', assetKind: 'generated_image', title: 'Fractions diagram', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
            fallbackMode: 'svg_fallback',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            assets: [
              { id: 'asset-1', assetKind: 'audio_recap', title: 'Audio recap', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            asset: { id: 'asset-1', assetKind: 'audio_recap', title: 'Audio recap', userId: 'student-1', revisionItemId: 'rev-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            stream: [
              {
                asset: { id: 'asset-stream-1', assetKind: 'video_recap', title: 'Fractions stream', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
                rankScore: 82,
                reason: 'Supports weak-topic recovery for fractions.',
                nextMove: 'Watch then answer one quick check.',
                quickCheck: 'What is a numerator?',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            collections: [
              {
                id: 'col-fractions',
                title: 'Fractions media',
                itemCount: 1,
                items: [
                  { id: 'asset-stream-1', assetKind: 'video_recap', title: 'Fractions stream', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            asset: { id: 'asset-stream-1', assetKind: 'video_recap', title: 'Fractions stream', userId: 'student-1', createdAt: '2026-04-06T08:00:00.000Z', updatedAt: '2026-04-06T08:00:00.000Z' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('media-token');

    const { default: api } = await import('../lib/api');
    await api.media.generateVideoRecap({
      videoId: 'vid-1',
      title: 'Fractions basics',
      topic: 'Fractions',
      sessionId: 'session-1',
    });
    await api.media.generateAudioRecap({
      recapText: 'Fractions quick recap',
      title: 'Fractions',
      sessionId: 'session-1',
    });
    await api.media.generateImage({
      prompt: 'Create a labeled fractions pie chart',
      title: 'Fractions chart',
      subject: 'Math',
    });
    await api.media.listAssets({ assetKind: 'audio_recap', sessionId: 'session-1', onlyHelpful: true, sortBy: 'recommended', limit: 12 });
    await api.media.linkAssetToRevision('asset-1', 'rev-1');
    await api.media.listStream({
      activeTopic: 'Fractions',
      weakTopics: ['fractions'],
      examMode: true,
      focusMode: true,
      preferredKind: 'video',
      sortBy: 'recommended',
      limit: 8,
    });
    await api.media.listCollections({ topic: 'Fractions', limit: 6, sortBy: 'recommended' });
    await api.media.recordInteraction('asset-stream-1', { action: 'helpful', revisionItemId: 'rev-1' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/copilot/media/video-recap',
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
      '/api/copilot/media/audio-recap',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/copilot/media/generate-image',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/copilot/media/assets?assetKind=audio_recap&sessionId=session-1&onlyHelpful=true&sortBy=recommended&limit=12',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      '/api/copilot/media/assets/asset-1/link-revision',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ revisionItemId: 'rev-1' }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      '/api/copilot/media/stream?activeTopic=Fractions&weakTopics=fractions&examMode=true&focusMode=true&preferredKind=video&sortBy=recommended&limit=8',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      '/api/copilot/media/collections?topic=Fractions&limit=6&sortBy=recommended',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      '/api/copilot/media/assets/asset-stream-1/interaction',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer media-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'helpful', revisionItemId: 'rev-1' }),
      })
    );
  });

  it('records learning-effect events and requests admin quality summaries through typed endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ event: { id: 'evt-1', userId: 'student-1', eventType: 'used_practice_path' } }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ periodLabel: 'Last 14 days', totalEvents: 3, effortSignals: {}, learningSignals: {}, tutorEffectivenessSignals: {}, productIntegritySignals: {}, voiceSignals: {}, researchVideoSignals: {}, multilingualSignals: {}, revisionVitality: { vitality: 'mixed', notes: [] }, notes: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ passivityRisk: 'low', revisionVitality: 'mixed', tutoringDiscipline: 'strong', multilingualConsistency: 'strong', trustAndHonesty: 'strong', notes: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ periodLabel: 'Last 14 days', strengths: [], weaknesses: [], emergingRisks: [], promisingSignals: [], interventionInsights: [], revisionInsights: [], multilingualInsights: [], voiceInsights: [], researchVideoInsights: [], recommendedNextFixes: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('quality-token');

    const { default: api } = await import('../lib/api');
    await api.quality.recordLearningEffectEvent({
      eventType: 'used_practice_path',
      sessionId: 'session-1',
      topic: 'Fractions',
    });
    await api.quality.getEffectivenessSummary({ days: 14, studentId: 'student-2' });
    await api.quality.getConstitutionHealth({ days: 14, studentId: 'student-2' });
    await api.quality.getFounderTruth({ days: 14, studentId: 'student-2' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/copilot/learning-effect-event',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer quality-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/copilot/effectiveness-summary?days=14&studentId=student-2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer quality-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/copilot/constitution-health?days=14&studentId=student-2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer quality-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/copilot/founder-truth?days=14&studentId=student-2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer quality-token',
        }),
      })
    );
  });

  it('routes voice transcription through the voice proxy with typed headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'hello there' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('voice-token');

    const { default: api } = await import('../lib/api');
    const form = new FormData();
    form.append('audio', new Blob(['voice-data'], { type: 'audio/webm' }), 'sample.webm');

    await api.voice.transcribe(form, { sessionUsageId: 'voice-session-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/voice/stt',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer voice-token',
          'X-Voice-Session-Id': 'voice-session-1',
        }),
        body: form,
      })
    );
  });

  it('routes assessment session lifecycle calls through typed assessment endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: { id: 'assess-1', workspaceMode: 'exam', modeType: 'quick_drill' },
            currentQuestion: null,
            questions: [],
            policy: { strictness: 'light_support', reviewMode: 'immediate', preSubmitHelpAllowed: true, hintsPerQuestion: 1 },
            progress: { currentQuestionNumber: 1, totalQuestions: 3, answeredCount: 0, skippedCount: 0, flaggedCount: 0, remainingCount: 3, progressPercent: 0 },
            timer: { durationSec: null, remainingSec: null, percentRemaining: null, urgency: 'normal', isPaused: false },
            review: { pendingCount: 3, flaggedCount: 0, canReviewNow: true },
            resultsReady: false,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            snapshot: {
              session: { id: 'assess-1', workspaceMode: 'exam', modeType: 'quick_drill' },
              currentQuestion: null,
              questions: [],
              policy: { strictness: 'light_support', reviewMode: 'immediate', preSubmitHelpAllowed: true, hintsPerQuestion: 1 },
              progress: { currentQuestionNumber: 1, totalQuestions: 3, answeredCount: 1, skippedCount: 0, flaggedCount: 0, remainingCount: 2, progressPercent: 0.33 },
              timer: { durationSec: null, remainingSec: null, percentRemaining: null, urgency: 'normal', isPaused: false },
              review: { pendingCount: 2, flaggedCount: 0, canReviewNow: true },
              resultsReady: false,
            },
            attempt: { id: 'attempt-1', sessionId: 'assess-1', questionId: 'q1', attemptIndex: 1, isCorrect: true, isPartial: false, score: 1, submittedAt: '2026-04-08T10:00:00.000Z' },
            feedback: { status: 'correct', headline: 'Good control.', explanation: 'Correct.', remember: 'Keep structure.', nextActionLabel: 'Next question' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ sessionId: 'assess-1', results: null }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { getMockAuthToken } = await import('../lib/mock-auth');
    vi.mocked(getMockAuthToken).mockResolvedValue('assessment-token');

    const { default: api } = await import('../lib/api');
    await api.startAssessmentSession({ workspaceMode: 'exam', modeType: 'quick_drill' });
    await api.submitAssessmentAnswer('assess-1', { questionId: 'q1', selectedOptionId: 'B' });
    await api.fetchAssessmentResults('assess-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/copilot/assessment/sessions/start',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer assessment-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/copilot/assessment/sessions/assess-1/answer',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer assessment-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/copilot/assessment/sessions/assess-1/results',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer assessment-token',
        }),
      })
    );
  });

  it('documents live UI surfaces against the endpoint registry', async () => {
    const {
      FRONTEND_API_ENDPOINT_CATALOG,
      FRONTEND_UI_ENDPOINT_MAP,
      FRONTEND_COMPONENT_ENDPOINT_MAP,
    } = await import('../lib/api');

    expect(
      FRONTEND_UI_ENDPOINT_MAP.study_workspace_bootstrap.endpoints.map((endpoint) => endpoint.id)
    ).toEqual(
      expect.arrayContaining([
        'sessions.preload',
        'preferences.get',
        'memory.student',
      ])
    );

    expect(
      FRONTEND_UI_ENDPOINT_MAP.revision_panel.endpoints.map((endpoint) => endpoint.id)
    ).toEqual(
      expect.arrayContaining([
        'revision.overview',
        'revision.updateItem',
        'revision.action',
        'revision.groupingSuggestions',
        'revision.applyGroupingSuggestion',
      ])
    );

    expect(
      FRONTEND_API_ENDPOINT_CATALOG.every((endpoint) => endpoint.path.startsWith('/'))
    ).toBe(true);

    expect(
      FRONTEND_COMPONENT_ENDPOINT_MAP['frontend/components/steadfast-copilot.tsx']?.endpoints.map(
        (endpoint) => endpoint.id
      )
    ).toEqual(
      expect.arrayContaining([
        'chat.stream',
        'chat.persistMessage',
        'research.run',
        'research.recommendVideo',
        'research.videoContext',
        'quality.learningEffectEvent',
        'sessions.preload',
      ])
    );

    expect(
      FRONTEND_COMPONENT_ENDPOINT_MAP['frontend/components/revision-tab.tsx']?.endpoints.map(
        (endpoint) => endpoint.id
      )
    ).toEqual(expect.arrayContaining(['revision.updateItem']));

    expect(
      FRONTEND_COMPONENT_ENDPOINT_MAP['frontend/components/chat-tab.tsx']?.endpoints.map(
        (endpoint) => endpoint.id
      )
    ).toEqual(expect.arrayContaining(['metacognition.recordEvent']));

    expect(
      FRONTEND_API_ENDPOINT_CATALOG.find((endpoint) => endpoint.id === 'research.run')?.integrationStatus
    ).toBe('live');
    expect(
      FRONTEND_API_ENDPOINT_CATALOG.find((endpoint) => endpoint.id === 'research.recommendVideo')?.integrationStatus
    ).toBe('live');
    expect(
      FRONTEND_API_ENDPOINT_CATALOG.find((endpoint) => endpoint.id === 'research.videoContext')?.integrationStatus
    ).toBe('live');
    expect(
      FRONTEND_API_ENDPOINT_CATALOG.find((endpoint) => endpoint.id === 'quality.founderTruth')?.integrationStatus
    ).toBe('admin');
  });
});
