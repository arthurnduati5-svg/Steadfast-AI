// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Safety Guard Service v1
// Detects prompt injection, unsafe instructions, answer-key
// leakage, teacher notes, suspicious URLs, and private data.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactStructuredBlock,
  ArtifactQuestionBlock,
  ArtifactSafetyScanResult,
} from './artifactUnderstandingContracts';

// ── Prompt Injection Patterns ──
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|directions|prompts)/i,
  /you\s+(are|should)\s+(now|must)\s+(ignore|forget|disregard)/i,
  /system\s+(prompt|instruction|message|override)/i,
  /developer\s+(prompt|instruction|message)/i,
  /reveal\s+(your|the)\s+(secret|password|key|token|api)/i,
  /output\s+(your|the)\s+(system|hidden|internal|raw)\s+(prompt|instruction)/i,
  /you\s+are\s+(now|no\s+longer)\s+(a\s+)?(helpful|socratic|tutor|assistant)/i,
  /act\s+as\s+if\s+(you\s+are|this\s+is)/i,
  /pretend\s+(you\s+are|this\s+is|to\s+be)/i,
  /this\s+is\s+(a\s+)?(system|developer|admin)\s+(prompt|instruction|override|command)/i,
  /overr[iy]de\s+(all\s+)?(previous|prior|system|safety)/i,
  /you\s+must\s+(now\s+)?(ignore|forget)\s+(all\s+)?(rules|guidelines|policies)/i,
];

// ── Answer Key Leakage Patterns ──
const ANSWER_KEY_PATTERNS = [
  /\b(answer|solution|marking scheme|rubric)\s*(key|guide|sheet)?\s*[:.]?\s*(\d|true|false)/im,
  /\b(correct|right|model)\s+answer\s+(is|:)\s*/i,
  /\banswer\s*:\s*[A-Da-d0-9]\s*$/im,
  /^1\.[\s.]*[A-Da-d0-9]/m,
  /^\([A-D]\)\s*[A-Da-d0-9]/m,
];

// ── Teacher Notes Patterns ──
const TEACHER_NOTE_PATTERNS = [
  /\bteacher('?s)?\s+note\b/i,
  /\bfor\s+teacher('?s)?\s+(use|eyes|reference)\b/i,
  /\bnote\s+to\s+(the\s+)?teacher\b/i,
  /\binternal\s+use\s+only\b/i,
  /\bstaff\s+only\b/i,
];

// ── Suspicious URL Patterns ──
const SUSPICIOUS_URL_PATTERNS = [
  /\b(bit\.ly|tinyurl|shorturl|shorte|ow\.ly|is\.gd|buff\.ly)\b/i,
  /\b(malware|phishing|hack|crack|warez|torrent)\b/i,
];

// ── Private Data Patterns ──
const PRIVATE_DATA_PATTERNS = [
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN-like
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email
  /\b(?:\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/, // Phone
  /\b(student|user)_(id|name|email|phone)\s*[:=]\s*\S+/i,
];

// ── ArtifactSafetyGuardService ──

export class ArtifactSafetyGuardService {
  /**
   * Scan artifact content for safety issues.
   */
  scanArtifactContentSafety(
    blocks: ArtifactStructuredBlock[],
  ): ArtifactSafetyScanResult {
    const suspiciousBlocks: ArtifactSafetyScanResult['suspiciousBlocks'] = [];
    const blockedBlocks: string[] = [];
    const warnings: string[] = [];

    let hasPromptInjection = false;
    let hasAnswerKeyLeakage = false;
    let hasTeacherNotes = false;
    let hasSuspiciousInstructions = false;
    let hasUnsafeUrls = false;
    let hasPrivateData = false;

    for (const block of blocks) {
      const blockFlags: string[] = [];
      const text = block.text;

      // Check for prompt injection
      for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(text)) {
          hasPromptInjection = true;
          hasSuspiciousInstructions = true;
          blockFlags.push('prompt_injection');
          suspiciousBlocks.push({
            blockId: block.id,
            reason: `Prompt injection pattern detected: ${pattern}`,
            severity: 'high',
          });
          break;
        }
      }

      // Check for answer key leakage
      for (const pattern of ANSWER_KEY_PATTERNS) {
        if (pattern.test(text)) {
          hasAnswerKeyLeakage = true;
          blockFlags.push('answer_key_leakage');
          if (!suspiciousBlocks.some((s) => s.blockId === block.id)) {
            suspiciousBlocks.push({
              blockId: block.id,
              reason: 'Answer key content detected',
              severity: 'medium',
            });
          }
          break;
        }
      }

      // Check for teacher notes
      for (const pattern of TEACHER_NOTE_PATTERNS) {
        if (pattern.test(text)) {
          hasTeacherNotes = true;
          blockFlags.push('teacher_note');
          break;
        }
      }

      // Check for suspicious URLs
      for (const pattern of SUSPICIOUS_URL_PATTERNS) {
        if (pattern.test(text)) {
          hasUnsafeUrls = true;
          blockFlags.push('unsafe_url');
          suspiciousBlocks.push({
            blockId: block.id,
            reason: 'Suspicious URL pattern detected',
            severity: 'medium',
          });
          break;
        }
      }

      // Check for private data
      for (const pattern of PRIVATE_DATA_PATTERNS) {
        if (pattern.test(text)) {
          hasPrivateData = true;
          blockFlags.push('private_data');
          suspiciousBlocks.push({
            blockId: block.id,
            reason: 'Possible private data detected',
            severity: 'high',
          });
          break;
        }
      }

      // Block high-severity blocks
      const highSeverityFlags = blockFlags.filter(
        (f) => f === 'prompt_injection' || f === 'private_data',
      );
      if (highSeverityFlags.length > 0) {
        blockedBlocks.push(block.id);
      }
    }

    if (hasPromptInjection) {
      warnings.push('Prompt injection patterns detected in artifact content. Content treated as data, not instructions.');
    }
    if (hasAnswerKeyLeakage) {
      warnings.push('Answer key patterns detected. Learner-safe views will hide this content.');
    }
    if (hasTeacherNotes) {
      warnings.push('Teacher-only notes detected. These will be hidden from learner views.');
    }
    if (hasUnsafeUrls) {
      warnings.push('Suspicious URL patterns detected.');
    }
    if (hasPrivateData) {
      warnings.push('Possible private data detected. This content should not be stored in learner-visible memory.');
    }

    return {
      safe: !hasPromptInjection && !hasPrivateData,
      hasPromptInjection,
      hasAnswerKeyLeakage,
      hasTeacherNotes,
      hasSuspiciousInstructions,
      hasUnsafeUrls,
      hasPrivateData,
      blockedBlocks,
      suspiciousBlocks,
      warnings,
    };
  }

  /**
   * Sanitize a block for tutor use.
   */
  sanitizeArtifactBlockForTutor(block: ArtifactStructuredBlock): ArtifactStructuredBlock {
    const safety = this.scanArtifactContentSafety([block]);

    let visibility = block.visibility;
    if (safety.blockedBlocks.includes(block.id)) {
      visibility = 'blocked';
    } else if (safety.suspiciousBlocks.some((s) => s.blockId === block.id)) {
      visibility = 'tutor_internal';
    }

    return {
      ...block,
      visibility,
      safetyFlags: [...block.safetyFlags, ...safety.warnings.map((w) => 'safety:' + w.slice(0, 60))],
    };
  }

  /**
   * Sanitize a question for learner view.
   */
  sanitizeArtifactQuestionForLearner(question: ArtifactQuestionBlock): ArtifactQuestionBlock {
    return {
      ...question,
      safeQuestionText: question.learnerCanSeeAnswer ? question.safeQuestionText : '[Question content hidden]',
      choices: question.learnerCanSeeAnswer ? question.choices : [],
    };
  }
}

export const artifactSafetyGuardService = new ArtifactSafetyGuardService();
