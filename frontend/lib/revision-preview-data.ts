import type {
  RevisionCollection,
  RevisionCollectionDetailResponse,
  RevisionGroupingSuggestion,
  RevisionItem,
  RevisionOverview,
} from '@/lib/types';

const PREVIEW_PREFIX = 'preview-';

const now = '2026-04-03T10:20:00.000Z';

const previewCollections: RevisionCollection[] = [
  {
    id: 'preview-col-algebra',
    title: 'Algebra rescue pack',
    subject: 'math',
    topic: 'Linear equations',
    description: 'Key steps, sign checks, and worked examples for algebra practice.',
    kind: 'bundle',
    itemCount: 3,
    createdAt: '2026-03-21T08:10:00.000Z',
    updatedAt: now,
  },
  {
    id: 'preview-col-biology',
    title: 'Biology concept review',
    subject: 'biology',
    topic: 'Cell transport',
    description: 'Summaries, misconception fixes, and a video recap for diffusion and osmosis.',
    kind: 'standard',
    itemCount: 3,
    createdAt: '2026-03-18T10:00:00.000Z',
    updatedAt: '2026-04-02T13:40:00.000Z',
  },
  {
    id: 'preview-col-chemistry',
    title: 'Chemistry quick checks',
    subject: 'chemistry',
    topic: 'Acids and bases',
    description: 'Indicator patterns, neutralisation checks, and an audio recap for recall.',
    kind: 'bundle',
    itemCount: 2,
    createdAt: '2026-03-25T11:20:00.000Z',
    updatedAt: '2026-04-01T15:15:00.000Z',
  },
  {
    id: 'preview-col-geography',
    title: 'Geography graph kit',
    subject: 'geography',
    topic: 'Climate graphs',
    description: 'Visual checkpoints for reading rainfall and temperature data safely.',
    kind: 'bundle',
    itemCount: 2,
    createdAt: '2026-03-26T09:15:00.000Z',
    updatedAt: '2026-04-02T09:05:00.000Z',
  },
  {
    id: 'preview-col-english',
    title: 'English exam language bank',
    subject: 'english',
    topic: 'Poetry analysis',
    description: 'Cheat sheets and writing reminders for figurative language answers.',
    kind: 'standard',
    itemCount: 2,
    createdAt: '2026-03-27T08:45:00.000Z',
    updatedAt: '2026-04-01T10:45:00.000Z',
  },
  {
    id: 'preview-col-ui-refinement',
    title: 'Revision UI refinement lab',
    subject: 'study_skills',
    topic: 'Revision UI behaviour',
    description: 'One consolidated notebook with behaviour checks and polish actions for the Revision page.',
    kind: 'bundle',
    itemCount: 4,
    createdAt: '2026-04-05T08:00:00.000Z',
    updatedAt: '2026-04-05T08:30:00.000Z',
  },
];

const previewItems: RevisionItem[] = [
  {
    id: 'preview-item-eq-balance',
    collectionId: 'preview-col-algebra',
    collectionTitle: 'Algebra rescue pack',
    sessionId: 'preview-session-algebra',
    title: 'Keep both sides balanced',
    summary: 'Use the same operation on both sides of the equation.',
    content: 'For 3x + 5 = 20, subtract 5 from both sides first.',
    contentType: 'worked_step',
    saveType: 'worked_step',
    mediaType: 'text',
    subject: 'math',
    topic: 'Linear equations',
    tags: ['equations', 'balance'],
    studentNote: 'Check the first move before simplifying.',
    isPinned: true,
    mastery: 'almost_there',
    needsPractice: true,
    saveMode: 'key_idea',
    practiceCount: 3,
    reviewStatus: 'review_due',
    reviewCount: 2,
    successCount: 1,
    struggleCount: 1,
    recentOutcome: 'partial',
    confidenceTrend: 'up',
    createdAt: '2026-03-23T09:10:00.000Z',
    updatedAt: now,
  },
  {
    id: 'preview-item-sign-check',
    collectionId: 'preview-col-algebra',
    collectionTitle: 'Algebra rescue pack',
    sessionId: 'preview-session-algebra',
    title: 'Watch negative signs after moving terms',
    summary: 'A sign slip can change the whole answer, even when the method is right.',
    content:
      'If you move -7 to the other side, it becomes +7. Pause for one second and say the sign out loud before writing the next line.',
    contentType: 'correction',
    saveType: 'mistake_to_fix',
    mediaType: 'text',
    subject: 'math',
    topic: 'Linear equations',
    tags: ['signs', 'mistakes'],
    isPinned: false,
    mastery: 'still_learning',
    needsPractice: true,
    isMistakeBased: true,
    saveMode: 'practice_later',
    practiceCount: 4,
    reviewStatus: 'needs_attention',
    reviewCount: 4,
    successCount: 1,
    struggleCount: 3,
    recentOutcome: 'struggled',
    confidenceTrend: 'down',
    createdAt: '2026-03-24T11:00:00.000Z',
    updatedAt: '2026-04-02T15:10:00.000Z',
  },
  {
    id: 'preview-item-formula-check',
    collectionId: 'preview-col-algebra',
    collectionTitle: 'Algebra rescue pack',
    sessionId: 'preview-session-algebra',
    title: 'Choose the inverse operation first',
    summary: 'Undo addition or subtraction before dividing or multiplying when solving one-step equations.',
    content:
      'For x + 8 = 19, subtract 8 first. For 4x = 20, divide by 4 first. Ask: what is keeping x from being alone?',
    contentType: 'practice_tip',
    saveType: 'practice_item',
    mediaType: 'text',
    subject: 'math',
    topic: 'One-step equations',
    tags: ['inverse operations'],
    mastery: 'confident',
    needsPractice: false,
    saveMode: 'practice_later',
    practiceCount: 2,
    reviewStatus: 'strong',
    reviewCount: 2,
    successCount: 2,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'steady',
    createdAt: '2026-03-22T07:40:00.000Z',
    updatedAt: '2026-03-31T14:20:00.000Z',
  },
  {
    id: 'preview-item-osmosis-core',
    collectionId: 'preview-col-biology',
    collectionTitle: 'Biology concept review',
    sessionId: 'preview-session-biology',
    title: 'Osmosis means water moves through a partially permeable membrane',
    summary: 'Water moves from a region with more free water to a region with less free water.',
    content:
      'Think of osmosis as water trying to spread out. It moves through the membrane until the concentration difference becomes smaller.',
    contentType: 'summary',
    saveType: 'short_note',
    mediaType: 'text',
    subject: 'biology',
    topic: 'Osmosis',
    tags: ['osmosis', 'membranes'],
    isPinned: true,
    mastery: 'almost_there',
    needsPractice: false,
    saveMode: 'key_idea',
    practiceCount: 2,
    reviewStatus: 'review_due',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    createdAt: '2026-03-19T10:00:00.000Z',
    updatedAt: '2026-04-01T09:30:00.000Z',
  },
  {
    id: 'preview-item-diffusion-mixup',
    collectionId: 'preview-col-biology',
    collectionTitle: 'Biology concept review',
    sessionId: 'preview-session-biology',
    title: 'Do not mix up diffusion and osmosis',
    summary: 'Diffusion can involve many particles. Osmosis is specifically about water.',
    content:
      'If the question is about water moving across a membrane, think osmosis. If it is about particles spreading from high to low concentration more generally, think diffusion.',
    contentType: 'misconception',
    saveType: 'mistake_to_fix',
    mediaType: 'text',
    subject: 'biology',
    topic: 'Cell transport',
    tags: ['diffusion', 'osmosis'],
    mastery: 'still_learning',
    needsPractice: true,
    isMistakeBased: true,
    saveMode: 'practice_later',
    practiceCount: 3,
    reviewStatus: 'needs_attention',
    reviewCount: 3,
    successCount: 1,
    struggleCount: 2,
    recentOutcome: 'partial',
    confidenceTrend: 'steady',
    createdAt: '2026-03-20T14:20:00.000Z',
    updatedAt: '2026-04-01T16:45:00.000Z',
  },
  {
    id: 'preview-item-photosynthesis-video',
    collectionId: 'preview-col-biology',
    collectionTitle: 'Biology concept review',
    sessionId: 'preview-session-video',
    title: 'Photosynthesis video recap',
    summary: 'Short recap from a narrated explainer connecting light energy, chlorophyll, and glucose.',
    content:
      'Watch for the three anchor ideas: chlorophyll absorbs light, carbon dioxide and water are inputs, and glucose stores the energy made by the plant.',
    contentType: 'video',
    saveType: 'research_note',
    mediaType: 'video',
    subject: 'biology',
    topic: 'Photosynthesis',
    tags: ['video recap', 'chlorophyll'],
    videoId: 'preview-video-photosynthesis',
    videoTitle: 'Photosynthesis in 4 minutes',
    transcriptSnippet: 'Chlorophyll traps light energy so the plant can make glucose.',
    mastery: 'getting_better',
    needsPractice: false,
    saveMode: 'key_idea',
    practiceCount: 1,
    reviewStatus: 'improving',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    createdAt: '2026-03-30T08:05:00.000Z',
    updatedAt: '2026-04-02T08:30:00.000Z',
  },
  {
    id: 'preview-item-indicator-sheet',
    collectionId: 'preview-col-chemistry',
    collectionTitle: 'Chemistry quick checks',
    sessionId: 'preview-session-chemistry',
    title: 'Indicator colour map cheat sheet',
    summary: 'Litmus, methyl orange, and universal indicator each tell a slightly different story.',
    content:
      'Red litmus turns blue in alkalis. Blue litmus turns red in acids. Universal indicator gives a range, so check the colour scale instead of guessing.',
    contentType: 'document',
    saveType: 'short_note',
    mediaType: 'mixed',
    subject: 'chemistry',
    topic: 'Acids and bases',
    tags: ['indicators', 'colour changes'],
    artifactLabels: ['Indicator colour map.pdf'],
    mastery: 'getting_better',
    needsPractice: true,
    saveMode: 'key_idea',
    practiceCount: 2,
    reviewStatus: 'review_due',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 1,
    recentOutcome: 'partial',
    confidenceTrend: 'steady',
    createdAt: '2026-03-29T13:20:00.000Z',
    updatedAt: '2026-04-01T17:20:00.000Z',
  },
  {
    id: 'preview-item-neutralisation-audio',
    collectionId: 'preview-col-chemistry',
    collectionTitle: 'Chemistry quick checks',
    sessionId: 'preview-session-audio',
    title: 'Neutralisation audio recap',
    summary: 'A short spoken recap explaining why acid plus alkali makes salt and water.',
    content:
      'Use the sentence: acid plus alkali gives salt and water. Then attach the correct salt by checking the acid and the metal or ammonium ion involved.',
    contentType: 'audio',
    saveType: 'short_note',
    mediaType: 'audio',
    subject: 'chemistry',
    topic: 'Neutralisation',
    tags: ['audio recap', 'salts'],
    audioUrl: 'https://cdn.example.com/previews/neutralisation-audio.mp3',
    transcriptSnippet: 'Acid plus alkali gives salt and water.',
    mastery: 'almost_there',
    needsPractice: false,
    saveMode: 'practice_later',
    practiceCount: 1,
    reviewStatus: 'new',
    reviewCount: 0,
    successCount: 0,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    createdAt: '2026-03-31T07:50:00.000Z',
    updatedAt: '2026-04-02T07:50:00.000Z',
  },
  {
    id: 'preview-item-climate-graph-image',
    collectionId: 'preview-col-geography',
    collectionTitle: 'Geography graph kit',
    sessionId: 'preview-session-geography',
    title: 'Climate graph annotation snapshot',
    summary: 'Read bars for rainfall and the line for temperature before writing any conclusion.',
    content:
      'A safe order is: check axes, find wettest month, find driest month, then compare the highest and lowest temperature points on the line graph.',
    contentType: 'image',
    saveType: 'short_note',
    mediaType: 'image',
    subject: 'geography',
    topic: 'Climate graphs',
    tags: ['graph reading', 'visual note'],
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" rx="18" fill="%23f4efe2"/><rect x="26" y="56" width="18" height="48" fill="%23c98d3a"/><rect x="58" y="42" width="18" height="62" fill="%23c98d3a"/><rect x="90" y="70" width="18" height="34" fill="%23c98d3a"/><path d="M24 40 C68 28, 124 68, 216 34" stroke="%2337638c" stroke-width="5" fill="none"/><circle cx="68" cy="32" r="4" fill="%2337638c"/><circle cx="124" cy="62" r="4" fill="%2337638c"/><circle cx="216" cy="34" r="4" fill="%2337638c"/></svg>',
    mastery: 'getting_better',
    needsPractice: true,
    saveMode: 'key_idea',
    practiceCount: 2,
    reviewStatus: 'review_due',
    reviewCount: 2,
    successCount: 1,
    struggleCount: 1,
    recentOutcome: 'partial',
    confidenceTrend: 'up',
    createdAt: '2026-03-30T12:10:00.000Z',
    updatedAt: '2026-04-02T12:45:00.000Z',
  },
  {
    id: 'preview-item-population-density-trap',
    collectionId: 'preview-col-geography',
    collectionTitle: 'Geography graph kit',
    sessionId: 'preview-session-geography',
    title: 'Population density trap to avoid',
    summary: 'Density is people per unit area, not just the biggest population number.',
    content:
      'A city can have fewer people than another place and still have a higher population density if those people are concentrated in a smaller area.',
    contentType: 'exam_trap',
    saveType: 'mistake_to_fix',
    mediaType: 'text',
    subject: 'geography',
    topic: 'Population',
    tags: ['exam trap', 'density'],
    mastery: 'still_learning',
    needsPractice: true,
    isMistakeBased: true,
    saveMode: 'practice_later',
    practiceCount: 3,
    reviewStatus: 'needs_attention',
    reviewCount: 2,
    successCount: 0,
    struggleCount: 2,
    recentOutcome: 'struggled',
    confidenceTrend: 'down',
    createdAt: '2026-03-31T09:40:00.000Z',
    updatedAt: '2026-04-01T18:10:00.000Z',
  },
  {
    id: 'preview-item-figurative-language-sheet',
    collectionId: 'preview-col-english',
    collectionTitle: 'English exam language bank',
    sessionId: 'preview-session-english',
    title: 'Figurative language quick sheet',
    summary: 'Metaphor compares directly. Personification gives human qualities to non-human things.',
    content:
      'When you explain a metaphor, say what is being compared and what effect it creates. When you explain personification, point to the human action or feeling given to the object.',
    contentType: 'document',
    saveType: 'short_note',
    mediaType: 'mixed',
    subject: 'english',
    topic: 'Poetry analysis',
    tags: ['metaphor', 'personification'],
    artifactLabels: ['Poetry language bank.docx'],
    mastery: 'almost_there',
    needsPractice: false,
    saveMode: 'key_idea',
    practiceCount: 2,
    reviewStatus: 'improving',
    reviewCount: 2,
    successCount: 2,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    createdAt: '2026-03-30T10:25:00.000Z',
    updatedAt: '2026-04-01T10:25:00.000Z',
  },
  {
    id: 'preview-item-quote-embedding',
    collectionId: 'preview-col-english',
    collectionTitle: 'English exam language bank',
    sessionId: 'preview-session-english',
    title: 'Embed the quote into your sentence',
    summary: 'A short embedded quote usually sounds stronger than dropping a full line without introduction.',
    content:
      'Instead of writing the quote alone, build it into your sentence. Example: The poet presents hope as something that "rises quietly" even in hard moments.',
    contentType: 'worked_step',
    saveType: 'worked_step',
    mediaType: 'text',
    subject: 'english',
    topic: 'Literary analysis',
    tags: ['evidence', 'quotes'],
    mastery: 'getting_better',
    needsPractice: true,
    saveMode: 'practice_later',
    practiceCount: 2,
    reviewStatus: 'review_due',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 1,
    recentOutcome: 'partial',
    confidenceTrend: 'steady',
    createdAt: '2026-03-29T16:35:00.000Z',
    updatedAt: '2026-04-01T12:05:00.000Z',
  },
  {
    id: 'preview-item-study-reminder',
    sessionId: 'preview-session-study-skills',
    title: 'Say the tricky step in your own words',
    summary: 'A short teach-back helps you notice what you really understand.',
    content:
      'After solving one question, explain the step that mattered most in one sentence. This makes revision stronger and shows what still feels unclear.',
    contentType: 'summary',
    saveType: 'short_note',
    mediaType: 'text',
    subject: 'english',
    topic: 'Revision habits',
    tags: ['metacognition', 'revision'],
    studentNote: 'Use after practice questions.',
    isPinned: false,
    mastery: 'getting_better',
    needsPractice: false,
    saveMode: 'key_idea',
    practiceCount: 1,
    reviewStatus: 'new',
    reviewCount: 0,
    successCount: 0,
    struggleCount: 0,
    confidenceTrend: 'up',
    createdAt: '2026-03-25T12:00:00.000Z',
    updatedAt: '2026-03-31T08:10:00.000Z',
  },
  {
    id: 'preview-item-exam-pacing-checklist',
    sessionId: 'preview-session-study-skills',
    title: 'Exam pacing checklist',
    summary: 'Split the paper into short checkpoints so the final questions are not rushed.',
    content:
      'Mark a time checkpoint after each section. If you are behind, move on and return later instead of staying too long on one hard question.',
    contentType: 'document',
    saveType: 'practice_item',
    mediaType: 'mixed',
    subject: 'english',
    topic: 'Exam technique',
    tags: ['pacing', 'exam strategy'],
    artifactLabels: ['Exam pacing checklist.pdf'],
    isPinned: true,
    mastery: 'almost_there',
    needsPractice: true,
    saveMode: 'practice_later',
    practiceCount: 2,
    reviewStatus: 'review_due',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 1,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    createdAt: '2026-03-30T15:10:00.000Z',
    updatedAt: '2026-04-02T06:45:00.000Z',
  },
  {
    id: 'preview-item-ui-refinement-playbook',
    collectionId: 'preview-col-ui-refinement',
    collectionTitle: 'Revision UI refinement lab',
    sessionId: 'preview-session-study-skills',
    title: 'Revision UI behavior and refinement playbook',
    summary: 'One document that groups behaviour notes and polish actions for the Revision page.',
    content:
      'UI behavior notes\n- Keep one shared grid for cards, notebook sections, and action bars.\n- Keep icon and text rows vertically centered in buttons and list actions.\n- Keep hover, focus, loading, and disabled states consistent across controls.\n- Prevent layout shifts when notes are edited, filtered, or moved.\n\nRefinement actions\n- Use a consistent spacing scale and remove random margins.\n- Tighten type hierarchy so headers, body text, and helper text are clearly distinct.\n- Verify contrast and keyboard focus visibility for all interactive elements.\n- Run a final mobile pass for wrapping, sticky offsets, and touch target comfort.',
    contentType: 'document',
    saveType: 'research_note',
    mediaType: 'mixed',
    subject: 'study_skills',
    topic: 'Revision UI behaviour',
    tags: ['ui refinement', 'layout', 'alignment', 'consistency'],
    artifactLabels: ['Revision UI refinement notes.md'],
    studentNote: 'Use this as one combined checklist before shipping UI updates.',
    isPinned: true,
    mastery: 'getting_better',
    needsPractice: true,
    saveMode: 'key_idea',
    practiceCount: 1,
    reviewStatus: 'review_due',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    metadata: {
      quickNotes: [
        {
          id: 'preview-ui-qn-1',
          text: 'Scan all card edges for near-miss alignment before changing colors or effects.',
          createdAt: '2026-04-05T08:11:00.000Z',
        },
        {
          id: 'preview-ui-qn-2',
          text: 'Keep primary action placement stable between list and detail contexts.',
          createdAt: '2026-04-05T08:13:00.000Z',
        },
        {
          id: 'preview-ui-qn-3',
          text: 'Capture before and after screenshots for each refinement pass.',
          createdAt: '2026-04-05T08:15:00.000Z',
        },
      ],
    },
    createdAt: '2026-04-05T08:05:00.000Z',
    updatedAt: '2026-04-05T08:30:00.000Z',
  },
  {
    id: 'preview-item-ui-status-badges',
    collectionId: 'preview-col-ui-refinement',
    collectionTitle: 'Revision UI refinement lab',
    sessionId: 'preview-session-study-skills',
    title: 'Status badges should stay predictable',
    summary: 'Keep sync, notebook-file count, and mastery badges readable without overlap.',
    content:
      'Badge checklist\n- Keep the notebook file count visible on every note card in a notebook.\n- Keep sync status in one stable slot so it does not jump between cards.\n- Keep badge spacing stable across desktop and mobile breakpoints.\n- Keep badge text concise so long notebook names do not push actions off the rail.',
    contentType: 'note',
    saveType: 'short_note',
    mediaType: 'text',
    subject: 'study_skills',
    topic: 'Revision UI behaviour',
    tags: ['status badges', 'count visibility', 'predictable layout'],
    studentNote: 'Use this when testing card-header stability.',
    mastery: 'almost_there',
    needsPractice: true,
    saveMode: 'key_idea',
    practiceCount: 2,
    reviewStatus: 'review_due',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 0,
    recentOutcome: 'completed',
    confidenceTrend: 'up',
    createdAt: '2026-04-05T08:16:00.000Z',
    updatedAt: '2026-04-05T08:44:00.000Z',
  },
  {
    id: 'preview-item-ui-card-density',
    collectionId: 'preview-col-ui-refinement',
    collectionTitle: 'Revision UI refinement lab',
    sessionId: 'preview-session-study-skills',
    title: 'Card density and spacing stress test',
    summary: 'Verify that many pills and long summaries do not collapse card rhythm.',
    content:
      'Stress scenario\n- Use long notebook names plus multiple metadata pills.\n- Confirm the title remains readable in two lines max.\n- Confirm action controls stay discoverable and keyboard focus remains clear.\n- Confirm no text clipping appears when cards are filtered rapidly.',
    contentType: 'summary',
    saveType: 'practice_item',
    mediaType: 'text',
    subject: 'study_skills',
    topic: 'Revision UI behaviour',
    tags: ['spacing', 'density', 'accessibility'],
    studentNote: 'Replay this after every typography or spacing tweak.',
    mastery: 'getting_better',
    needsPractice: true,
    saveMode: 'practice_later',
    practiceCount: 1,
    reviewStatus: 'improving',
    reviewCount: 1,
    successCount: 1,
    struggleCount: 0,
    recentOutcome: 'partial',
    confidenceTrend: 'steady',
    createdAt: '2026-04-05T08:22:00.000Z',
    updatedAt: '2026-04-05T08:46:00.000Z',
  },
  {
    id: 'preview-item-ui-mobile-wrap-check',
    collectionId: 'preview-col-ui-refinement',
    collectionTitle: 'Revision UI refinement lab',
    sessionId: 'preview-session-study-skills',
    title: 'Mobile wrapping and touch target checks',
    summary: 'Use this checklist before release to avoid cramped actions on small screens.',
    content:
      'Mobile pass\n- Verify card pills wrap without covering the action menu.\n- Verify title and summary text remain readable at narrow widths.\n- Verify tap targets for Open and options remain comfortable.\n- Verify no horizontal overflow when a notebook has many notes/files.',
    contentType: 'document',
    saveType: 'research_note',
    mediaType: 'mixed',
    subject: 'study_skills',
    topic: 'Revision UI behaviour',
    tags: ['mobile', 'touch targets', 'wrapping'],
    artifactLabels: ['Revision UI mobile wrap checklist.md'],
    studentNote: 'Run this checklist whenever card metadata changes.',
    mastery: 'getting_better',
    needsPractice: false,
    saveMode: 'key_idea',
    practiceCount: 1,
    reviewStatus: 'new',
    reviewCount: 0,
    successCount: 0,
    struggleCount: 0,
    confidenceTrend: 'up',
    createdAt: '2026-04-05T08:28:00.000Z',
    updatedAt: '2026-04-05T08:48:00.000Z',
  },
];

const collectionItemsById: Record<string, RevisionItem[]> = {
  'preview-col-algebra': previewItems.filter((item) => item.collectionId === 'preview-col-algebra'),
  'preview-col-biology': previewItems.filter((item) => item.collectionId === 'preview-col-biology'),
  'preview-col-chemistry': previewItems.filter((item) => item.collectionId === 'preview-col-chemistry'),
  'preview-col-geography': previewItems.filter((item) => item.collectionId === 'preview-col-geography'),
  'preview-col-english': previewItems.filter((item) => item.collectionId === 'preview-col-english'),
  'preview-col-ui-refinement': previewItems.filter((item) => item.collectionId === 'preview-col-ui-refinement'),
};

const previewItemsById = Object.fromEntries(previewItems.map((item) => [item.id, item])) as Record<string, RevisionItem>;

const previewGroupingSuggestions: RevisionGroupingSuggestion[] = [
  {
    suggestionId: 'preview-suggestion-sign-slips',
    title: 'Bundle equation sign slips together',
    subject: 'math',
    topic: 'Linear equations',
    itemIds: ['preview-item-sign-check', 'preview-item-eq-balance', 'preview-item-formula-check'],
    reason: 'These notes all support the same recovery pattern: move one term carefully, then recheck the sign.',
    suggestedKind: 'topic',
  },
  {
    suggestionId: 'preview-suggestion-media-recaps',
    title: 'Create a fast media recap pack',
    subject: 'biology',
    topic: 'Mixed media revision',
    itemIds: ['preview-item-photosynthesis-video', 'preview-item-neutralisation-audio', 'preview-item-climate-graph-image'],
    reason: 'You have video, audio, and image-based revision notes that could become one mixed recap bundle.',
    suggestedKind: 'media_bundle',
  },
  {
    suggestionId: 'preview-suggestion-exam-traps',
    title: 'Pull exam traps into one revision bundle',
    subject: 'geography',
    topic: 'Exam technique',
    itemIds: ['preview-item-population-density-trap', 'preview-item-exam-pacing-checklist', 'preview-item-quote-embedding'],
    reason: 'These items are all about avoiding common mistakes under pressure and writing cleaner exam answers.',
    suggestedKind: 'exam_bundle',
  },
];

function matchesQuery(value: string | null | undefined, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return String(value || '').toLowerCase().includes(normalizedQuery);
}

function itemMatches(item: RevisionItem, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return [
    item.title,
    item.summary,
    item.content,
    item.subject,
    item.topic,
    item.collectionTitle,
    item.videoTitle,
    item.transcriptSnippet,
    ...(item.tags || []),
  ].some((value) => matchesQuery(String(value || ''), normalizedQuery));
}

function collectionMatches(collection: RevisionCollection, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return [
    collection.title,
    collection.subject,
    collection.topic,
    collection.description,
  ].some((value) => matchesQuery(String(value || ''), normalizedQuery));
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string | null }>(left: T, right: T) {
  return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
}

function withCollectionPreview(collection: RevisionCollection, items: RevisionItem[]): RevisionCollection {
  return {
    ...collection,
    itemCount: items.length,
    previewItems: items.slice(0, 2),
    latestItemAt: items[0]?.updatedAt || collection.updatedAt,
  };
}

export function isPreviewRevisionEntityId(id?: string | null) {
  return Boolean(id && id.startsWith(PREVIEW_PREFIX));
}

export function getRevisionPreviewOverview(search = ''): RevisionOverview {
  const normalizedQuery = search.trim().toLowerCase();
  const filteredCollectionIds = previewCollections
    .filter((collection) => {
      const collectionItems = collectionItemsById[collection.id] || [];
      return (
        collectionMatches(collection, normalizedQuery) ||
        collectionItems.some((item) => itemMatches(item, normalizedQuery))
      );
    })
    .map((collection) => collection.id);

  const filteredCollections = previewCollections
    .filter((collection) => filteredCollectionIds.includes(collection.id))
    .map((collection) =>
      withCollectionPreview(
        collection,
        (collectionItemsById[collection.id] || [])
          .filter((item) => itemMatches(item, normalizedQuery))
          .sort(sortByUpdatedAtDesc)
      )
    )
    .sort(sortByUpdatedAtDesc);

  const filteredUngroupedItems = previewItems
    .filter((item) => !item.collectionId && itemMatches(item, normalizedQuery))
    .sort(sortByUpdatedAtDesc);
  const filteredCollectionItems = previewItems
    .filter((item) => item.collectionId && filteredCollectionIds.includes(item.collectionId) && itemMatches(item, normalizedQuery))
    .sort(sortByUpdatedAtDesc);
  const visibleItems = [...filteredCollectionItems, ...filteredUngroupedItems].sort(sortByUpdatedAtDesc);

  return {
    collections: filteredCollections,
    recentItems: visibleItems.slice(0, 8),
    ungroupedItems: filteredUngroupedItems,
    pinnedItems: visibleItems.filter((item) => item.isPinned).slice(0, 5),
    mistakeItems: visibleItems.filter((item) => item.isMistakeBased).slice(0, 5),
    needsPracticeItems: visibleItems.filter((item) => item.needsPractice).slice(0, 6),
    queuePreview: {
      dueNow: visibleItems.filter((item) => item.reviewStatus === 'review_due').slice(0, 4),
      needsAttention: visibleItems.filter((item) => item.reviewStatus === 'needs_attention').slice(0, 4),
      continuePractising: visibleItems.filter((item) => item.needsPractice).slice(0, 4),
      newItems: visibleItems.filter((item) => item.reviewStatus === 'new').slice(0, 4),
      recentlyImproved: visibleItems.filter((item) => item.recentOutcome === 'completed').slice(0, 4),
    },
    totalItems: visibleItems.length,
    totalCollections: filteredCollections.length,
    ungroupedCount: filteredUngroupedItems.length,
    totalDueCount: visibleItems.filter((item) => item.reviewStatus === 'review_due').length,
    totalNeedsAttentionCount: visibleItems.filter((item) => item.reviewStatus === 'needs_attention').length,
    totalNewCount: visibleItems.filter((item) => item.reviewStatus === 'new').length,
  };
}

export function getRevisionPreviewCollectionDetail(
  collectionId: string,
  search = ''
): RevisionCollectionDetailResponse | null {
  const collection = previewCollections.find((entry) => entry.id === collectionId);
  if (!collection) return null;

  const normalizedQuery = search.trim().toLowerCase();
  const items = (collectionItemsById[collectionId] || [])
    .filter((item) => itemMatches(item, normalizedQuery))
    .sort(sortByUpdatedAtDesc);

  return {
    collection: withCollectionPreview(collection, items),
    items,
  };
}

export function getRevisionPreviewGroupingSuggestions(search = ''): RevisionGroupingSuggestion[] {
  const normalizedQuery = search.trim().toLowerCase();
  if (!normalizedQuery) return previewGroupingSuggestions;

  return previewGroupingSuggestions.filter((suggestion) => {
    const relatedItems = suggestion.itemIds
      .map((itemId) => previewItemsById[itemId])
      .filter(Boolean)
      .flatMap((item) => [item.title, item.summary, item.topic || '', item.subject || '']);

    return [
      suggestion.title,
      suggestion.subject || '',
      suggestion.topic || '',
      suggestion.reason,
      ...relatedItems,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
