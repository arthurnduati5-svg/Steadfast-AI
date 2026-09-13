// ─────────────────────────────────────────────────────────────
// Steadfast AI — Academic Integrity Guard Service v1
// Identifies shortcut-seeking, copy-paste solution requests,
// direct answer requests, and repeated integrity signals.
// Redirects into Socratic help without shaming the student.
// Never blocks legitimate learning help.
// ─────────────────────────────────────────────────────────────

import type {
  AcademicIntegritySignal,
  SocraticRiskLevel,
  SocraticSupportMode,
} from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Detection Thresholds
// ═══════════════════════════════════════════════════════════════

const REPEATED_SHORTCUT_THRESHOLD = 3;

// ═══════════════════════════════════════════════════════════════
// Detection Patterns
// ═══════════════════════════════════════════════════════════════

const SHORTCUT_PATTERNS = [
  /\b(just give|give me|tell me|show me).*(answer|solution|how to do it)\b/i,
  /\b(can you).*(do this|solve this|answer this)\s*(for me|please)?\s*$/i,
  /\b(i don't|i do not|i am stuck).*(just|simply)\s*(tell|give|show)\b/i,
];

const COPY_PASTE_PATTERNS = [
  /\b(\/\/|\"\"\"|```|''')\s*.*(answer|solution)\b/i,
  /\b(copy|paste|copy-paste).*(answer|solution)\b/i,
  /\b(write the|give the|provide the).*(code|essay|paragraph|report)\s*(for|about)\b/i,
];

const DIRECT_ANSWER_PATTERNS = [
  /\b(just give(?: me)?(?: the)? answer|final answer|answer only|tell me the answer)\b/i,
  /\b(what is the answer|what is the solution|solve for me)\b/i,
  /\b(tell me|give me).*(answers?).*(exam|quiz|test|midterm|final)\b/i,
  /\b(just tell|just give|just say)\s*(the answer|me)\b/i,
];

const EXAM_CHEATING_PATTERNS = [
  /\b(tell me|give me).*(answers?|solutions?).*(exam|quiz|test|midterm|final)\b/i,
  /\b(exam|quiz|test|midterm|final).*(answers?|solutions?|cheat|help me pass)\b/i,
];

const LEGITIMATE_HELP_PATTERNS = [
  /\b(explain|understand|how does|how do|what does|can you explain|teach me|help me understand)\b/i,
  /\b(how would I|can you show|what is the first step|where do I start)\b/i,
  /\b(I tried|I attempted|I think|I got|my answer was)\b/i,
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function isLegitimateHelp(message: string): boolean {
  return LEGITIMATE_HELP_PATTERNS.some((p) => p.test(message));
}

function detectSignalType(message: string): AcademicIntegritySignal | null {
  if (EXAM_CHEATING_PATTERNS.some((p) => p.test(message))) {
    return 'exam_or_quiz_cheating_signal';
  }
  if (DIRECT_ANSWER_PATTERNS.some((p) => p.test(message))) {
    return 'direct_final_answer_request';
  }
  if (COPY_PASTE_PATTERNS.some((p) => p.test(message))) {
    return 'copy_paste_solution_request';
  }
  if (SHORTCUT_PATTERNS.some((p) => p.test(message))) {
    return 'possible_homework_answer_request';
  }
  return null;
}

function buildStudentFacingRedirect(signal: AcademicIntegritySignal, repeatCount: number): string {
  if (repeatCount >= REPEATED_SHORTCUT_THRESHOLD) {
    return (
      'I notice you are looking for a quick answer. True learning comes from working through the problem yourself. ' +
      'Let me help you with a question instead: what is the first step you would take to solve this?'
    );
  }

  switch (signal) {
    case 'direct_final_answer_request':
      return 'I will not give the final answer directly, but I can guide you through the method. What do you understand about this problem so far?';
    case 'copy_paste_solution_request':
      return 'I cannot provide a ready-to-submit answer, but I can help you understand the concepts so you can write your own answer. What specific part is confusing?';
    case 'possible_homework_answer_request':
      return 'Let me help you learn how to solve this yourself. What is the first thing you would check or try?';
    case 'exam_or_quiz_cheating_signal':
      return 'I can help you review concepts for your test. What topic would you like to practice?';
    default:
      return 'Let me help you work through this step by step. What do you already know about this topic?';
  }
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Classify the academic integrity signal for a student message.
 * Never treats confusion or legitimate learning help as cheating.
 */
export function classifyAcademicIntegritySignal(input: {
  message: string;
  recentIntegritySignals?: AcademicIntegritySignal[];
  activityType?: string | null;
  artifactType?: string | null;
}): {
  signal: AcademicIntegritySignal;
  riskLevel: SocraticRiskLevel;
  allowedResponseMode: SocraticSupportMode;
  studentFacingRedirect: string;
  memorySignalAllowed: boolean;
  teacherInsightAllowed: boolean;
} {
  const message = String(input.message || '').trim();
  const recentSignals = input.recentIntegritySignals || [];
  const activityType = String(input.activityType || '').toLowerCase();

  // Default: no integrity risk
  if (!message) {
    return {
      signal: 'none',
      riskLevel: 'none',
      allowedResponseMode: 'question_first',
      studentFacingRedirect: '',
      memorySignalAllowed: true,
      teacherInsightAllowed: false,
    };
  }

  if (/\b(exam|quiz|test|assessment|midterm|final)\b/.test(activityType) && EXAM_CHEATING_PATTERNS.some((p) => p.test(message))) {
    return {
      signal: 'exam_or_quiz_cheating_signal',
      riskLevel: 'high',
      allowedResponseMode: 'concept_reteach',
      studentFacingRedirect: buildStudentFacingRedirect('exam_or_quiz_cheating_signal', 0),
      memorySignalAllowed: false,
      teacherInsightAllowed: true,
    };
  }

  // Check if this is legitimate learning help first
  if (isLegitimateHelp(message)) {
    return {
      signal: 'allowed_learning_help',
      riskLevel: 'none',
      allowedResponseMode: 'question_first',
      studentFacingRedirect: '',
      memorySignalAllowed: true,
      teacherInsightAllowed: false,
    };
  }

  // Count recent shortcut-related signals
  const shortcutSignals: AcademicIntegritySignal[] = [
    'possible_homework_answer_request',
    'direct_final_answer_request',
    'copy_paste_solution_request',
    'repeated_shortcut_seeking',
  ];

  const recentShortcutCount = recentSignals.filter((s) =>
    shortcutSignals.includes(s),
  ).length;

  // Detect signal type
  const detectedSignal = detectSignalType(message);

  // No integrity risk detected
  if (!detectedSignal) {
    return {
      signal: 'none',
      riskLevel: 'none',
      allowedResponseMode: 'question_first',
      studentFacingRedirect: '',
      memorySignalAllowed: true,
      teacherInsightAllowed: false,
    };
  }

  // Determine risk level and response based on repeat count
  const totalShortcutCount = recentShortcutCount + 1;

  if (totalShortcutCount >= REPEATED_SHORTCUT_THRESHOLD) {
    return {
      signal: 'repeated_shortcut_seeking',
      riskLevel: 'high',
      allowedResponseMode: 'reflection_prompt',
      studentFacingRedirect: buildStudentFacingRedirect(detectedSignal, totalShortcutCount),
      memorySignalAllowed: detectedSignal !== 'exam_or_quiz_cheating_signal',
      teacherInsightAllowed: true,
    };
  }

  if (detectedSignal === 'exam_or_quiz_cheating_signal') {
    return {
      signal: detectedSignal,
      riskLevel: 'high',
      allowedResponseMode: 'concept_reteach',
      studentFacingRedirect: buildStudentFacingRedirect(detectedSignal, 0),
      memorySignalAllowed: false,
      teacherInsightAllowed: true,
    };
  }

  if (detectedSignal === 'direct_final_answer_request') {
    return {
      signal: detectedSignal,
      riskLevel: 'medium',
      allowedResponseMode: 'question_first',
      studentFacingRedirect: buildStudentFacingRedirect(detectedSignal, 0),
      memorySignalAllowed: false,
      teacherInsightAllowed: false,
    };
  }

  return {
    signal: detectedSignal,
    riskLevel: 'low',
    allowedResponseMode: 'guided_steps',
    studentFacingRedirect: buildStudentFacingRedirect(detectedSignal, 0),
    memorySignalAllowed: true,
    teacherInsightAllowed: false,
  };
}

/**
 * Build a safe tutor move instruction based on the integrity signal.
 */
export function buildIntegritySafeTutorMove(signal: AcademicIntegritySignal): string {
  switch (signal) {
    case 'direct_final_answer_request':
      return 'Ask a guiding question about the first step. Do not give the answer.';
    case 'copy_paste_solution_request':
      return 'Offer a concept explanation or similar example. Do not produce copy-paste text.';
    case 'possible_homework_answer_request':
      return 'Explain the method without solving the exact problem. Offer a similar example.';
    case 'exam_or_quiz_cheating_signal':
      return 'Offer concept review or study strategy. Do not give answers.';
    case 'plagiarism_signal':
      return 'Redirect to original thinking. Ask the student to explain in their own words.';
    case 'repeated_shortcut_seeking':
      return 'Maintain firm Socratic stance. Remind the student that learning requires active effort. Ask a specific question about their current understanding.';
    case 'none':
    case 'allowed_learning_help':
      return '';
    default:
      return 'Use Socratic guidance. Ask a question before giving information.';
  }
}
