export type SexualityPolicyBlockReason =
  | 'below_year6'
  | 'outside_allowed_scope'
  | 'sperm_requires_high_school'
  | 'grade_unknown';

export type SexualityPolicyDecision = {
  blocked: boolean;
  reason?: SexualityPolicyBlockReason;
  parsedYear: number | null;
  highSchool: boolean;
  detectedTopic: boolean;
};

const SEXUALITY_TOPIC_SIGNAL_REGEX =
  /\b(reproduction|reproductive|menstruat\w*|period\b|sperm(?:\s*cell)?|pregnan\w*|fertiliz\w*|conception\w*|sex|sexual|sexuality|intercourse|condom|contracept\w*|porn|masturbat\w*|gay|lesbian|bisexual|transgender|lgbt|dating|romance|boyfriend|girlfriend|kiss|nude|penis|vagina|erection|orgasm|sodomy)\b/i;

const ALLOWED_REPRODUCTION_REGEX =
  /\b(reproduction|reproductive|pregnan\w*|fertiliz\w*|conception\w*|sexual reproduction)\b/i;
const ALLOWED_MENSTRUATION_REGEX = /\b(menstruat\w*|period\b|menstrual cycle)\b/i;
const ALLOWED_SPERM_REGEX = /\b(sperm(?:\s*cell)?|spermatozoa)\b/i;

const DISALLOWED_EXPLICIT_REGEX =
  /\b(intercourse|condom|contracept\w*|porn|masturbat\w*|gay|lesbian|bisexual|transgender|lgbt|dating|romance|boyfriend|girlfriend|kiss|nude|penis|vagina|erection|orgasm|sodomy|hookup|oral sex|anal sex)\b/i;
const GENERIC_SEX_WORD_REGEX = /\b(sex|sexual|sexuality)\b/i;
const SEXUAL_REPRODUCTION_PHRASE_REGEX = /\bsexual reproduction\b/i;

function parseGradeYear(gradeLevel?: string | null): number | null {
  const value = String(gradeLevel || '').toLowerCase().trim();
  if (!value) return null;

  const formMatch = value.match(/\bform\s*([1-4])\b/);
  if (formMatch) {
    const formNum = Number(formMatch[1]);
    return 8 + formNum; // Form 1..4 => Grade 9..12
  }

  const gradeMatch = value.match(/\b(?:grade|class|year)\s*(\d{1,2})\b/);
  if (gradeMatch) {
    const parsed = Number(gradeMatch[1]);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (/\blower\s*secondary\b/.test(value)) return 7;
  if (/\bupper\s*secondary\b/.test(value)) return 10;
  if (/\bhigh\s*school\b/.test(value)) return 9;
  if (/\bsecondary\b/.test(value)) return 9;
  if (/\bprimary\b/.test(value)) return 5;
  if (/\bkindergarten|kinder|nursery|pre[-\s]?primary|pp1|pp2\b/.test(value)) return 1;

  return null;
}

function inferHighSchool(gradeLevel: string | null | undefined, parsedYear: number | null): boolean {
  if (parsedYear !== null) return parsedYear >= 9;
  const value = String(gradeLevel || '').toLowerCase();
  return /\b(high\s*school|upper\s*secondary|form\s*[1-4]|grade\s*(?:9|10|11|12)|class\s*(?:9|10|11|12))\b/.test(value);
}

export function evaluateSexualityScopePolicy(
  userText: string,
  gradeLevel?: string | null
): SexualityPolicyDecision {
  const text = String(userText || '').toLowerCase();
  const detectedTopic = SEXUALITY_TOPIC_SIGNAL_REGEX.test(text);
  const parsedYear = parseGradeYear(gradeLevel);
  const highSchool = inferHighSchool(gradeLevel, parsedYear);

  if (!detectedTopic) {
    return { blocked: false, parsedYear, highSchool, detectedTopic: false };
  }

  if (parsedYear !== null && parsedYear < 6) {
    return { blocked: true, reason: 'below_year6', parsedYear, highSchool, detectedTopic: true };
  }

  if (parsedYear === null && !highSchool) {
    return { blocked: true, reason: 'grade_unknown', parsedYear, highSchool, detectedTopic: true };
  }

  const hasAllowedReproduction = ALLOWED_REPRODUCTION_REGEX.test(text);
  const hasAllowedMenstruation = ALLOWED_MENSTRUATION_REGEX.test(text);
  const hasAllowedSperm = ALLOWED_SPERM_REGEX.test(text);

  const hasExplicitDisallowed = DISALLOWED_EXPLICIT_REGEX.test(text);
  const hasGenericSexWord = GENERIC_SEX_WORD_REGEX.test(text);
  const hasSexualReproductionPhrase = SEXUAL_REPRODUCTION_PHRASE_REGEX.test(text);
  const hasDisallowedGenericSex = hasGenericSexWord && !hasSexualReproductionPhrase;

  if (hasAllowedSperm && !highSchool) {
    return { blocked: true, reason: 'sperm_requires_high_school', parsedYear, highSchool, detectedTopic: true };
  }

  if (hasExplicitDisallowed || hasDisallowedGenericSex) {
    return { blocked: true, reason: 'outside_allowed_scope', parsedYear, highSchool, detectedTopic: true };
  }

  if (hasAllowedReproduction || hasAllowedMenstruation || (hasAllowedSperm && highSchool)) {
    return { blocked: false, parsedYear, highSchool, detectedTopic: true };
  }

  return { blocked: true, reason: 'outside_allowed_scope', parsedYear, highSchool, detectedTopic: true };
}
