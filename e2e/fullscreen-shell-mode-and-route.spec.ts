import { expect, test, type Page, type Route } from '@playwright/test';

type ModeCombo = {
  focus: boolean;
  exam: boolean;
  research: boolean;
};

const BASE_STATE = {
  researchModeActive: false,
  awaitingPracticeQuestionInvitationResponse: false,
  awaitingPracticeQuestionAnswer: false,
  validationAttemptCount: 0,
  sensitiveContentDetected: false,
  videoSuggested: false,
  lastSearchTopic: [],
  usedExamples: [],
};

function buildMockRevisionOverview(nowIso: string) {
  const coreItem = {
    id: 'rev-cell-transport',
    title: 'Cell transport corrections',
    summary: 'Membrane movement recap with common mistake checks.',
    content: 'Focus on osmosis direction and concentration gradients.',
    subject: 'Biology',
    topic: 'Cell transport',
    subtopic: 'Osmosis',
    createdAt: nowIso,
    updatedAt: nowIso,
    reviewStatus: 'needs_attention',
    recentOutcome: 'struggled',
    mastery: 'getting_better',
    isMistakeBased: true,
  };
  const improvedItem = {
    id: 'rev-photosynthesis',
    title: 'Photosynthesis quick recap',
    summary: 'Inputs, outputs, and limiting factors.',
    content: 'Recall chlorophyll role and limiting factors.',
    subject: 'Biology',
    topic: 'Photosynthesis',
    subtopic: 'Chloroplasts',
    createdAt: nowIso,
    updatedAt: nowIso,
    reviewStatus: 'practising',
    recentOutcome: 'completed',
    mastery: 'almost_there',
    isMistakeBased: false,
  };

  return {
    totalItems: 2,
    totalCollections: 1,
    totalNeedsAttentionCount: 1,
    totalDueCount: 1,
    recentItems: [coreItem, improvedItem],
    ungroupedItems: [coreItem],
    pinnedItems: [],
    mistakeItems: [coreItem],
    needsPracticeItems: [coreItem],
    collections: [
      {
        id: 'collection-bio',
        title: 'Biology foundations',
        subject: 'Biology',
        topic: 'Cell transport',
        itemCount: 2,
        previewItems: [coreItem, improvedItem],
      },
    ],
    queuePreview: {
      dueNow: [coreItem],
      needsAttention: [coreItem],
      continuePractising: [improvedItem],
      newItems: [],
      recentlyImproved: [improvedItem],
    },
  };
}

function buildMockMediaAssets(nowIso: string) {
  const internalAsset = {
    id: 'asset-internal-1',
    userId: 'e2e-student',
    assetKind: 'video_recap',
    title: 'Cell transport visual recap',
    summary: 'Quick visual recap for osmosis and diffusion.',
    subject: 'Biology',
    topic: 'Cell transport',
    sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    sourceTrust: 'internal',
    keyPoints: ['Diffusion', 'Osmosis'],
    quickChecks: ['What direction does water move in osmosis?'],
    metadata: {
      streamRankScore: 132,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const externalAsset = {
    id: 'asset-external-1',
    userId: 'e2e-student',
    assetKind: 'video_note',
    title: 'Cell transport in 60 seconds',
    summary: 'Trusted visual intuition from a short external explainer.',
    subject: 'Biology',
    topic: 'Cell transport',
    sourceUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    videoId: '9bZkp7q19f0',
    sourceTrust: 'high',
    keyPoints: ['Hypertonic vs hypotonic'],
    quickChecks: ['Name one mistake to avoid in osmosis questions.'],
    metadata: {
      streamRankScore: 141,
      externalRole: 'youtube_shorts',
      externalSourceType: 'youtube_educational',
      transcriptAvailable: true,
      transcriptScored: true,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return { internalAsset, externalAsset };
}

function buildMockGrowthPayloads(nowIso: string, revisionOverview: ReturnType<typeof buildMockRevisionOverview>) {
  const coreItem = revisionOverview.recentItems[0];
  const improvedItem = revisionOverview.recentItems[1] || coreItem;
  const studyPlan = {
    id: 'study-plan-cell-transport',
    userId: 'e2e-student',
    title: 'Stabilize cell transport',
    summary: 'Recover osmosis, diffusion, and concentration-gradient reasoning.',
    subject: 'Biology',
    topic: 'Cell transport',
    scope: 'weekly',
    metadata: {
      lifecycle: 'active',
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const studyGoal = {
    id: 'study-goal-cell-transport-1',
    studyPlanId: studyPlan.id,
    userId: 'e2e-student',
    title: 'Explain osmosis without mixing up concentration gradients',
    status: 'in_progress',
    dueAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    overview: {
      generatedAt: nowIso,
      recommendedNextMove: {
        id: 'growth-rec-due-now',
        userId: 'e2e-student',
        type: 'due_revision',
        priorityScore: 92,
        sourceType: 'revision_queue',
        title: 'Clear due-now queue first',
        reason: 'Cell transport still shows a recent struggle signal and is ready for a short recovery loop.',
        primaryAction: {
          actionType: 'review_recap',
          label: 'Review recap',
          destination: 'growth',
          targetId: 'feed-due-now',
          topic: coreItem.topic,
          subject: coreItem.subject,
          context: { source: 'e2e_growth_mock' },
        },
        secondaryAction: null,
        linkedTopic: coreItem.topic,
        linkedRevisionId: coreItem.id,
        linkedMediaId: null,
        expiresAt: null,
        createdAt: nowIso,
      },
      dueNowQueue: [
        {
          id: 'growth-rec-due-now',
          userId: 'e2e-student',
          type: 'due_revision',
          priorityScore: 92,
          sourceType: 'revision_queue',
          title: 'Review Cell transport corrections',
          reason: 'The last revision attempt struggled, so a recap and one transfer check will help lock it in.',
          primaryAction: {
            actionType: 'review_recap',
            label: 'Review recap',
            destination: 'growth',
            targetId: coreItem.id,
            topic: coreItem.topic,
            subject: coreItem.subject,
            context: { source: 'e2e_growth_mock' },
          },
          secondaryAction: null,
          linkedTopic: coreItem.topic,
          linkedRevisionId: coreItem.id,
          linkedMediaId: null,
          expiresAt: null,
          createdAt: nowIso,
        },
      ],
      recentlyImproved: [
        {
          id: 'growth-improved-photosynthesis',
          title: improvedItem.title,
          summary: 'Recent retrieval was completed cleanly and is holding steady.',
          topic: improvedItem.topic,
          subject: improvedItem.subject,
          evidence: ['completed recap', 'almost_there mastery'],
          createdAt: nowIso,
        },
      ],
      weakPatternSpotlight: [
        {
          id: 'growth-mistake-cell-transport',
          userId: 'e2e-student',
          subject: 'Biology',
          patternKey: 'osmosis-direction',
          title: 'Osmosis direction mix-up',
          description: 'Water movement direction is occasionally reversed under pressure.',
          examples: ['Confused hypotonic and hypertonic movement'],
          recurrenceScore: 74,
          status: 'active',
          commonContext: 'Biology -> Cell transport',
          fixReminder: 'Pause and compare concentration before predicting water movement.',
          linkedTopics: ['Cell transport'],
          linkedRevisionIds: [coreItem.id],
          lastSeenAt: nowIso,
          lastImprovedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
      supportPatterns: [
        {
          id: 'growth-support-1',
          title: 'Worked-example first',
          reason: 'Short worked steps are improving recall before independent answers.',
          confidence: 0.68,
          evidence: ['revision note reuse', 'faster recap completion'],
        },
      ],
      metrics: {
        dueNowCount: 1,
        weakTopicCount: 1,
        activeMistakePatternCount: 1,
        improvingCount: 1,
        plansInProgressCount: 1,
        masteryCoveragePercent: 58,
      },
    },
    weakTopics: {
      generatedAt: nowIso,
      items: [
        {
          id: 'growth-weak-cell-transport',
          userId: 'e2e-student',
          subject: 'Biology',
          topic: 'Cell transport',
          subtopic: 'Osmosis',
          weaknessScore: 72,
          microMasteryLabel: 'getting_better',
          status: 'active',
          weaknessReasonSummary: 'Recent signals show the idea is improving but still fragile under test pressure.',
          triggers: ['recent struggle', 'mistake journal pattern'],
          lastStruggledAt: nowIso,
          lastReviewedAt: nowIso,
          nextReviewAt: nowIso,
          linkedRevisionIds: [coreItem.id],
          linkedMediaIds: [],
          linkedMistakePatternIds: ['growth-mistake-cell-transport'],
          recommendedAction: 'Run recap -> simpler example -> one short quiz.',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
      groups: {
        needsRescueNow: ['growth-weak-cell-transport'],
        stillUnstable: [],
        improvingSlowly: [],
        recentlyStabilized: [],
      },
    },
    mistakeJournal: {
      generatedAt: nowIso,
      patterns: [
        {
          id: 'growth-mistake-cell-transport',
          userId: 'e2e-student',
          subject: 'Biology',
          patternKey: 'osmosis-direction',
          title: 'Osmosis direction mix-up',
          description: 'Water movement direction is occasionally reversed under pressure.',
          examples: ['Confused hypotonic and hypertonic movement'],
          recurrenceScore: 74,
          status: 'active',
          commonContext: 'Biology -> Cell transport',
          fixReminder: 'Pause and compare concentration before predicting water movement.',
          linkedTopics: ['Cell transport'],
          linkedRevisionIds: [coreItem.id],
          lastSeenAt: nowIso,
          lastImprovedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
      groups: {
        active: ['growth-mistake-cell-transport'],
        improving: [],
        resolvedRecently: [],
      },
    },
    studyPlansSnapshot: {
      generatedAt: nowIso,
      plans: [
        {
          id: studyPlan.id,
          userId: 'e2e-student',
          title: studyPlan.title,
          goal: studyPlan.summary,
          subject: studyPlan.subject,
          targetTopics: ['Cell transport'],
          status: 'active',
          milestoneIndex: 0,
          milestones: [
            {
              id: studyGoal.id,
              title: studyGoal.title,
              status: studyGoal.status,
              dueAt: studyGoal.dueAt,
            },
          ],
          nextAction: 'Review one recap and one transfer question.',
          progressSummary: 'Progress: 0/1 milestones',
          createdAt: nowIso,
          updatedAt: nowIso,
          linkedPlan: studyPlan,
        },
      ],
      recommendations: [],
    },
    masteryTrends: {
      generatedAt: nowIso,
      overall: {
        status: 'recovering',
        summary: 'Biology confidence is improving, but cell transport still needs one more clean retrieval cycle.',
        confidence: 0.64,
      },
      subjectTrends: [
        {
          subject: 'Biology',
          status: 'recovering',
          masteryScore: 58,
          evidenceCount: 6,
          topicCount: 2,
          summary: 'Cell transport is recovering while photosynthesis remains more stable.',
          delta: 8,
        },
      ],
      topicTrends: [
        {
          topic: 'Cell transport',
          subject: 'Biology',
          subtopic: 'Osmosis',
          status: 'recovering',
          microMasteryLabel: 'getting_better',
          confidenceScore: 58,
          evidenceScore: 61,
          summary: 'Better recall, but still vulnerable to direction-based mistakes.',
          lastSeenAt: nowIso,
        },
      ],
      masterySignals: [
        {
          id: 'growth-signal-cell-transport',
          userId: 'e2e-student',
          subject: 'Biology',
          topic: 'Cell transport',
          subtopic: 'Osmosis',
          signalType: 'retrieval_recovery',
          confidenceScore: 58,
          evidenceScore: 61,
          sourceType: 'e2e_growth_mock',
          outcome: 'improved',
          createdAt: nowIso,
        },
      ],
    },
    dailyFeed: {
      dateKey: nowIso.slice(0, 10),
      items: [
        {
          id: 'growth-feed-due-now',
          type: 'due_now_recap',
          title: 'Review Cell transport corrections',
          subject: 'Biology',
          topic: 'Cell transport',
          reasonToday: 'This topic is due now and still benefits from one grounded recap.',
          estimatedMinutes: 6,
          nextActionLabel: 'Review recap',
          evidenceMode: 'short_reasoning',
          targetRevisionItemId: coreItem.id,
          status: 'pending',
        },
        {
          id: 'growth-feed-quiz',
          type: 'weak_topic_review',
          title: 'Quick osmosis transfer check',
          subject: 'Biology',
          topic: 'Cell transport',
          reasonToday: 'A short transfer question will confirm the correction is sticking.',
          estimatedMinutes: 5,
          nextActionLabel: 'Quiz me',
          evidenceMode: 'step_ordering',
          targetRevisionItemId: coreItem.id,
          status: 'pending',
        },
      ],
      completedCount: 0,
      totalCount: 2,
      progressPercent: 0,
      integritySignals: {
        rapidGuessSignals: 0,
        lowEvidenceSignals: 0,
        averageResponseSec: 42,
        recommendation: 'Use one reason sentence after every answer to strengthen the evidence trail.',
      },
    },
    actionFunnel: {
      periodLabel: 'Last 21 days',
      totalOpened: 10,
      totalSubmitted: 8,
      totalCompleted: 6,
      openToSubmitRate: 0.8,
      submitToCompleteRate: 0.75,
      modules: [
        {
          actionType: 'review_recap',
          opened: 4,
          submitted: 3,
          completed: 3,
          openToSubmitRate: 0.75,
          submitToCompleteRate: 1,
          averageEvidenceScore: 0.69,
          estimatedMasteryLiftRate: 0.16,
        },
        {
          actionType: 'work_on_this',
          opened: 3,
          submitted: 3,
          completed: 2,
          openToSubmitRate: 1,
          submitToCompleteRate: 0.67,
          averageEvidenceScore: 0.63,
          estimatedMasteryLiftRate: 0.12,
        },
      ],
      topImprovingModules: [
        {
          actionType: 'review_recap',
          opened: 4,
          submitted: 3,
          completed: 3,
          openToSubmitRate: 0.75,
          submitToCompleteRate: 1,
          averageEvidenceScore: 0.69,
          estimatedMasteryLiftRate: 0.16,
        },
      ],
    },
    studyPlans: {
      plans: [studyPlan],
    },
    studyGoals: {
      goals: [studyGoal],
    },
  };
}

function buildSseBody(finalText: string) {
  return [
    `data: ${JSON.stringify({ type: 'token', content: finalText.slice(0, 8) })}`,
    '',
    `data: ${JSON.stringify({
      type: 'done',
      metadata: {
        finalText,
        state: BASE_STATE,
        tutorState: {},
        suggestedTitle: 'E2E session',
      },
    })}`,
    '',
  ].join('\n');
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function wireCopilotApiMocks(page: Page, capturedChatPayloads: Array<Record<string, unknown>>) {
  const nowIso = new Date().toISOString();
  const revisionOverview = buildMockRevisionOverview(nowIso);
  const { internalAsset, externalAsset } = buildMockMediaAssets(nowIso);
  const growthPayloads = buildMockGrowthPayloads(nowIso, revisionOverview);
  await page.route('**/api/copilot/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method().toUpperCase();

    if (pathname.endsWith('/api/copilot/chat') && method === 'POST') {
      const rawPayload = request.postData() || '{}';
      const parsed = JSON.parse(rawPayload) as Record<string, unknown>;
      capturedChatPayloads.push(parsed);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: buildSseBody('E2E response ready.'),
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/preload') && method === 'GET') {
      await fulfillJson(route, {
        ready: true,
        studentId: 'e2e-student',
        lastSession: null,
        revisionOverview: null,
        history: [],
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/new-session') && method === 'POST') {
      await fulfillJson(route, {
        sessionId: `sess-e2e-${Date.now()}`,
        createdAt: nowIso,
        updatedAt: nowIso,
        conversationState: BASE_STATE,
        tutorState: {},
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/history') && method === 'GET') {
      await fulfillJson(route, {
        sessions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/revision') && method === 'GET') {
      await fulfillJson(route, revisionOverview);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/overview') && method === 'GET') {
      await fulfillJson(route, growthPayloads.overview);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/weak-topics') && method === 'GET') {
      await fulfillJson(route, growthPayloads.weakTopics);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/mistake-journal') && method === 'GET') {
      await fulfillJson(route, growthPayloads.mistakeJournal);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/study-plans') && method === 'GET') {
      await fulfillJson(route, growthPayloads.studyPlansSnapshot);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/mastery-trends') && method === 'GET') {
      await fulfillJson(route, growthPayloads.masteryTrends);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/daily-feed') && method === 'GET') {
      await fulfillJson(route, growthPayloads.dailyFeed);
      return;
    }

    if (pathname.endsWith('/api/copilot/growth/action-funnel') && method === 'GET') {
      await fulfillJson(route, growthPayloads.actionFunnel);
      return;
    }

    if (pathname.endsWith('/api/copilot/study-plans') && method === 'GET') {
      await fulfillJson(route, growthPayloads.studyPlans);
      return;
    }

    if (pathname.endsWith('/api/copilot/study-goals') && method === 'GET') {
      await fulfillJson(route, growthPayloads.studyGoals);
      return;
    }

    if (pathname.endsWith('/api/copilot/media/assets') && method === 'GET') {
      await fulfillJson(route, { assets: [internalAsset, externalAsset] });
      return;
    }

    if (pathname.endsWith('/api/copilot/media/stream') && method === 'GET') {
      await fulfillJson(route, {
        stream: [
          {
            asset: externalAsset,
            rankScore: 141,
            reason: 'Trusted short-form explainer for visual intuition.',
            nextMove: 'Watch and then run one quick recall check.',
            quickCheck: 'What is the key correction for osmosis?',
          },
          {
            asset: internalAsset,
            rankScore: 132,
            reason: 'Supports weak-topic recovery for Cell transport.',
            nextMove: 'Use this to prep one quiz attempt.',
            quickCheck: 'State diffusion in one line.',
          },
        ],
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/media/collections') && method === 'GET') {
      await fulfillJson(route, {
        collections: [
          {
            id: 'media-collection-cell',
            title: 'Cell transport media',
            subject: 'Biology',
            topic: 'Cell transport',
            description: 'Compact media set for weak-topic recovery.',
            itemCount: 2,
            items: [externalAsset, internalAsset],
            nextAssetId: externalAsset.id,
            progressLabel: '1/2 reviewed',
          },
        ],
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/preferences') && method === 'GET') {
      await fulfillJson(route, {
        preferredLanguage: 'english',
        interests: [],
        copilotThemePreference: 'system',
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/memory/student') && method === 'GET') {
      await fulfillJson(route, {
        progress: [],
        mistakes: [],
      });
      return;
    }

    if (pathname.endsWith('/api/copilot/latency/turn') && method === 'POST') {
      const parsed = JSON.parse(request.postData() || '{}') as Record<string, unknown>;
      await fulfillJson(route, {
        stored: true,
        turnId: String(parsed.turnId || `lat-${Date.now()}`),
      });
      return;
    }

    // Safe fallback for unrelated copilot routes in these focused E2E specs.
    await fulfillJson(route, {});
  });
}

async function openFullscreenWorkspace(page: Page) {
  await page.goto('/');
  await page.getByTestId('copilot-open-button').click();
  await expect(page.getByTestId('copilot-enter-fullscreen').first()).toBeVisible();
  await page.getByTestId('copilot-enter-fullscreen').first().click();
  await expect(page.locator('[data-copilot-destination]')).toHaveAttribute(
    'data-copilot-destination',
    'new_session'
  );
}

async function openWidgetWorkspace(page: Page) {
  await page.goto('/');
  await page.getByTestId('copilot-open-button').click();
  const shell = page.locator('[data-copilot-widget-shell][data-copilot-destination]').first();
  await expect(shell).toHaveAttribute('data-copilot-destination', 'new_session');
  return shell;
}

async function choosePlusAction(page: Page, actionId: string) {
  await page.getByTestId('composer-plus-button').click();
  await expect(page.getByTestId(`plus-action-${actionId}`)).toBeVisible();
  await page.getByTestId(`plus-action-${actionId}`).click();
}

async function openWidgetWorkspaceSheet(page: Page) {
  await expect(page.getByTestId('widget-workspace-sheet-trigger')).toBeVisible();
  await page.getByTestId('widget-workspace-sheet-trigger').click();
}

async function openMobileNavMenu(page: Page) {
  const trigger = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
  await trigger.click();
  await expect(page.locator('[data-testid="fs-nav-media"]:visible').first()).toBeVisible();
}

async function ensureMode(page: Page, mode: 'focus' | 'exam' | 'research', enabled: boolean) {
  const chipByMode: Record<typeof mode, string> = {
    focus: 'mode-chip-focus',
    exam: 'mode-chip-exam',
    research: 'mode-chip-research',
  };
  const chipClearByMode: Record<typeof mode, string> = {
    focus: 'mode-chip-focus-clear',
    exam: 'mode-chip-exam-clear',
    research: 'mode-chip-research-clear',
  };
  const actionByMode: Record<typeof mode, string> = {
    focus: 'focus_mode',
    exam: 'exam_mode',
    research: 'web_research',
  };

  const chip = page.getByTestId(chipByMode[mode]);
  const currentlyEnabled = await chip.isVisible().catch(() => false);
  if (currentlyEnabled === enabled) return;
  if (enabled) {
    await choosePlusAction(page, actionByMode[mode]);
    await expect(chip).toBeVisible();
  } else {
    await chip.hover();
    await page.getByTestId(chipClearByMode[mode]).click();
    await expect(chip).toHaveCount(0);
  }
}

function expectedStudyMode(combo: ModeCombo) {
  if (combo.focus) return combo.exam ? 'exam' : 'focus';
  if (combo.exam) return 'exam';
  return 'standard';
}

test.describe('Fullscreen shell browser E2E', () => {
  test('mode combinations emit correct payload permutations to /api/copilot/chat', async ({ page }) => {
    const capturedChatPayloads: Array<Record<string, unknown>> = [];
    await wireCopilotApiMocks(page, capturedChatPayloads);
    await openFullscreenWorkspace(page);

    const combos: ModeCombo[] = [
      { focus: false, exam: false, research: false },
      { focus: true, exam: false, research: false },
      { focus: false, exam: true, research: false },
      { focus: true, exam: true, research: false },
      { focus: false, exam: false, research: true },
      { focus: true, exam: false, research: true },
      { focus: false, exam: true, research: true },
      { focus: true, exam: true, research: true },
    ];

    const input = page.locator('textarea.chat-textarea').first();
    const send = page.getByTestId('composer-send-button');

    for (let index = 0; index < combos.length; index += 1) {
      const combo = combos[index];
      await ensureMode(page, 'focus', combo.focus);
      await ensureMode(page, 'exam', combo.exam);
      await ensureMode(page, 'research', combo.research);

      await input.fill(`E2E combo ${index + 1}`);
      await send.click();
      await expect.poll(() => capturedChatPayloads.length).toBe(index + 1);

      const payload = capturedChatPayloads[index] || {};
      const workspaceContext = (payload.workspaceContext as Record<string, unknown>) || {};
      const modeFlags = (workspaceContext.modeFlags as Record<string, unknown>) || {};

      expect(modeFlags.focus).toBe(combo.focus);
      expect(modeFlags.exam).toBe(combo.exam);
      expect(modeFlags.research).toBe(combo.research);
      expect(workspaceContext.studyMode).toBe(expectedStudyMode(combo));
      expect(workspaceContext.activeDestination).toBe('new_session');
      expect(payload.forceWebSearch).toBe(combo.research);
      expect(payload.focusMode).toBe(combo.focus);
      expect(payload.examMode).toBe(combo.exam);
    }
  });

  test('route transitions across Media/Revision/Growth keep selected destination without unintended redirects', async ({
    page,
  }) => {
    const capturedChatPayloads: Array<Record<string, unknown>> = [];
    await wireCopilotApiMocks(page, capturedChatPayloads);
    await openFullscreenWorkspace(page);

    const shell = page.locator('[data-copilot-destination]');
    const transitions: Array<'media' | 'revision' | 'growth'> = ['media', 'revision', 'growth'];

    for (const destination of transitions) {
      await page.getByTestId(`fs-nav-${destination}`).click();
      await expect(shell).toHaveAttribute('data-copilot-destination', destination);
      await page.waitForTimeout(700);
      await expect(shell).toHaveAttribute('data-copilot-destination', destination);
    }

    // Navigation-only transitions should not trigger chat calls.
    expect(capturedChatPayloads).toHaveLength(0);
  });

  test('creative stream and growth tabs stay compact without horizontal overflow', async ({ page }) => {
    const capturedChatPayloads: Array<Record<string, unknown>> = [];
    await wireCopilotApiMocks(page, capturedChatPayloads);
    await openFullscreenWorkspace(page);

    const shell = page.locator('[data-copilot-destination]');

    await page.getByTestId('fs-nav-media').click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'media');
    await page.getByRole('button', { name: /^Creative$/i }).first().click();
    await page.waitForTimeout(500);

    const creativeOverflow = await page.evaluate(() => {
      const container = document.querySelector('[data-copilot-destination="media"] .copilot-workspace-container') as HTMLElement | null;
      if (!container) return true;
      return container.scrollWidth > container.clientWidth + 2;
    });
    expect(creativeOverflow).toBeFalsy();

    const creativeActionCount = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find((node) =>
        /Build intuition and convert it into action/i.test(node.textContent || '')
      );
      if (!heading) return 0;
      const panel = heading.closest('section');
      return panel ? panel.querySelectorAll('button').length : 0;
    });
    expect(creativeActionCount).toBeLessThanOrEqual(6);

    await page.getByTestId('fs-nav-growth').click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'growth');
    await page.waitForTimeout(500);

    const growthOverflow = await page.evaluate(() => {
      const container = document.querySelector('[data-copilot-destination="growth"] .copilot-workspace-container') as HTMLElement | null;
      if (!container) return true;
      return container.scrollWidth > container.clientWidth + 2;
    });
    expect(growthOverflow).toBeFalsy();

    const growthHeroActionCount = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find((node) =>
        /Clear due-now queue first|Recover /i.test(node.textContent || '')
      );
      if (!heading) return 0;
      const panel = heading.closest('section');
      return panel ? panel.querySelectorAll('button').length : 0;
    });
    expect(growthHeroActionCount).toBeLessThanOrEqual(3);

    expect(capturedChatPayloads).toHaveLength(0);
  });

  test('creative stream and growth tabs stay compact on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const capturedChatPayloads: Array<Record<string, unknown>> = [];
    await wireCopilotApiMocks(page, capturedChatPayloads);
    await openFullscreenWorkspace(page);

    const shell = page.locator('[data-copilot-destination]');

    await openMobileNavMenu(page);
    await page.locator('[data-testid="fs-nav-media"]:visible').first().click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'media');
    await page.getByRole('button', { name: /^Creative$/i }).first().click();
    await page.waitForTimeout(500);

    const mediaOverflow = await page.evaluate(() => {
      const container = document.querySelector('[data-copilot-destination="media"] .copilot-workspace-container') as HTMLElement | null;
      if (!container) return true;
      return container.scrollWidth > container.clientWidth + 2;
    });
    expect(mediaOverflow).toBeFalsy();

    await openMobileNavMenu(page);
    await page.locator('[data-testid="fs-nav-growth"]:visible').first().click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'growth');
    await page.waitForTimeout(500);

    const growthOverflow = await page.evaluate(() => {
      const container = document.querySelector('[data-copilot-destination="growth"] .copilot-workspace-container') as HTMLElement | null;
      if (!container) return true;
      return container.scrollWidth > container.clientWidth + 2;
    });
    expect(growthOverflow).toBeFalsy();
    expect(capturedChatPayloads).toHaveLength(0);
  });

  test('widget shell stays usable on a narrow viewport and sends widget surface context', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const capturedChatPayloads: Array<Record<string, unknown>> = [];
    await wireCopilotApiMocks(page, capturedChatPayloads);
    const shell = await openWidgetWorkspace(page);

    const surfaceProfile = (await shell.getAttribute('data-copilot-surface-profile')) || '';
    expect(['compact', 'cozy']).toContain(surfaceProfile);

    await page.getByTestId('widget-nav-revision').click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'revision');

    await page.getByTestId('widget-nav-media').first().click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'media');

    await openWidgetWorkspaceSheet(page);
    await page.getByTestId('widget-nav-growth').last().click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'growth');
    await page.waitForTimeout(350);

    await page.getByTestId('widget-nav-new_session').first().click({ force: true });
    await expect(shell).toHaveAttribute('data-copilot-destination', 'new_session');

    await choosePlusAction(page, 'focus_mode');
    await expect(page.getByTestId('mode-chip-focus')).toBeVisible();

    await choosePlusAction(page, 'recent_files');
    await expect(page.getByRole('heading', { name: 'Recent files' }).last()).toBeVisible();
    await page.keyboard.press('Escape');

    const input = page.locator('textarea.chat-textarea').first();
    await input.fill('Widget payload check');
    await page.getByTestId('composer-send-button').click();

    await expect.poll(() => capturedChatPayloads.length).toBe(1);

    const payload = capturedChatPayloads[0] || {};
    const workspaceContext = (payload.workspaceContext as Record<string, unknown>) || {};
    expect(workspaceContext.surfaceKind).toBe('widget');
    expect(workspaceContext.surfaceProfile).toBe(surfaceProfile);
    expect(workspaceContext.navigationStyle).toBe('progressive_compact');
    expect(workspaceContext.activeDestination).toBe('new_session');
  });

  test('widget shell promotes the expanded rail layout on wide viewports', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    const capturedChatPayloads: Array<Record<string, unknown>> = [];
    await wireCopilotApiMocks(page, capturedChatPayloads);
    const shell = await openWidgetWorkspace(page);

    await expect(shell).toHaveAttribute('data-copilot-surface-profile', 'expanded');

    await page.getByTestId('widget-nav-growth').click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'growth');

    await page.getByTestId('widget-nav-media').click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'media');

    await page.getByTestId('widget-nav-new_session').click();
    await expect(shell).toHaveAttribute('data-copilot-destination', 'new_session');
    await expect(page.locator('textarea.chat-textarea').first()).toBeVisible();
    expect(capturedChatPayloads).toHaveLength(0);
  });
});
