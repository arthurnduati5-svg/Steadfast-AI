export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';

export type SafetyCategory =
  | 'self_harm'
  | 'sexual_abuse'
  | 'violence'
  | 'abuse'
  | 'inappropriate_content'
  | 'other';

export interface SafetyRiskAssessment {
  flagged: boolean;
  category: SafetyCategory | null;
  severity: SafetySeverity | null;
  confidence: number;
  riskScore: number;
  excerptRedacted: string;
  reasons: string[];
  needsCounselorReport: boolean;
}

type Rule = {
  id: string;
  category: SafetyCategory;
  severity: SafetySeverity;
  score: number;
  pattern: RegExp;
};

const RULES: Rule[] = [
  {
    id: 'self-harm-critical',
    category: 'self_harm',
    severity: 'critical',
    score: 96,
    pattern:
      /\b(kill myself|end my life|i want to die|i will die|suicide tonight|i am going to kill myself|hurt myself now)\b/i,
  },
  {
    id: 'self-harm-high',
    category: 'self_harm',
    severity: 'high',
    score: 86,
    pattern: /\b(suicide|self harm|self-harm|cut myself|harm myself|i feel like dying)\b/i,
  },
  {
    id: 'self-harm-critical-ar-sw',
    category: 'self_harm',
    severity: 'critical',
    score: 95,
    pattern:
      /(سأقتل نفسي|سوف أقتل نفسي|اريد ان اموت|أريد أن أموت|انهي حياتي|أنهي حياتي|انتحر الليلة|nataka kujiua|nitajiua|kujiua leo|kujiua usiku wa leo|nitamaliza maisha yangu)/i,
  },
  {
    id: 'self-harm-high-ar-sw',
    category: 'self_harm',
    severity: 'high',
    score: 84,
    pattern:
      /(انتحار|ايذاء نفسي|إيذاء نفسي|اؤذي نفسي|أؤذي نفسي|اريد الموت|أريد الموت|kujiua|kujidhuru|najidhuru|nataka kufa|nahisi nataka kufa)/i,
  },
  {
    id: 'self-harm-emotional-distress-medium',
    category: 'self_harm',
    severity: 'medium',
    score: 70,
    pattern:
      /\b(i am|i'm|im|i feel|feeling)\s+(so\s+)?(scared|alone|worthless|depressed)\b/i,
  },
  {
    id: 'self-harm-distress-keywords-low',
    category: 'self_harm',
    severity: 'low',
    score: 52,
    pattern: /\b(scared|alone|worthless|depressed)\b/i,
  },
  {
    id: 'sexual-abuse-critical',
    category: 'sexual_abuse',
    severity: 'critical',
    score: 95,
    pattern:
      /\b(raped me|i was raped|he raped me|she raped me|sexual assault|molested me|touched me sexually)\b/i,
  },
  {
    id: 'sexual-abuse-high',
    category: 'sexual_abuse',
    severity: 'high',
    score: 84,
    pattern: /\b(rape|molest|abused me sexually|forced me sexually)\b/i,
  },
  {
    id: 'sexual-abuse-critical-ar-sw',
    category: 'sexual_abuse',
    severity: 'critical',
    score: 94,
    pattern:
      /(تم اغتصابي|اغتصبني|اعتدى علي جنسيا|اعتدى عليّ جنسيا|تحرش بي جنسيا|nilibakwa|alinibaka|alinishambulia kingono|alinigusa kingono)/i,
  },
  {
    id: 'sexual-abuse-high-ar-sw',
    category: 'sexual_abuse',
    severity: 'high',
    score: 83,
    pattern: /(اغتصاب|تحرش|تحرش جنسي|اعتداء جنسي|ubakaji|unyanyasaji wa kingono)/i,
  },
  {
    id: 'violence-high',
    category: 'violence',
    severity: 'high',
    score: 82,
    pattern: /\b(i was beaten|abused at home|someone is hurting me|threatened to kill me)\b/i,
  },
  {
    id: 'violence-risk-keywords-medium',
    category: 'violence',
    severity: 'medium',
    score: 68,
    pattern: /\b(kill me|beat me|they will kill me|they will beat me|want to kill me|want to beat me)\b/i,
  },
  {
    id: 'violence-high-ar-sw',
    category: 'violence',
    severity: 'high',
    score: 82,
    pattern:
      /(سيقتلني|هددني بالقتل|يضربني في البيت|يتعرض لي بالعنف|wananitishia kuniua|watanipiga|ananipiga nyumbani|ninaumizwa nyumbani)/i,
  },
  {
    id: 'violence-medium-ar-sw',
    category: 'violence',
    severity: 'medium',
    score: 68,
    pattern: /(اقتلني|اضربني|kill me|beat me|wanataka kuniua|wanataka kunipiga)/i,
  },
  {
    id: 'violence-keywords-low',
    category: 'violence',
    severity: 'low',
    score: 54,
    pattern: /\b(kill|beat)\b/i,
  },
  {
    id: 'runaway-risk-medium',
    category: 'abuse',
    severity: 'medium',
    score: 67,
    pattern: /\b(runaway|run away|i want to run away|i will run away|running away from home)\b/i,
  },
  {
    id: 'runaway-risk-medium-ar-sw',
    category: 'abuse',
    severity: 'medium',
    score: 67,
    pattern:
      /(سأهرب من المنزل|أريد الهروب من البيت|اريد الهروب من البيت|هارب من البيت|nitatoroka nyumbani|nataka kutoroka nyumbani|nimetoroka nyumbani)/i,
  },
  {
    id: 'abuse-medium',
    category: 'abuse',
    severity: 'medium',
    score: 66,
    pattern: /\b(harassed|bullied badly|unsafe at home|abused)\b/i,
  },
  {
    id: 'inappropriate-medium',
    category: 'inappropriate_content',
    severity: 'medium',
    score: 62,
    pattern: /\b(porn|nudes|explicit sex|sexual content)\b/i,
  },
];

const SEVERITY_RANK: Record<SafetySeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const ACADEMIC_CONTEXT_PATTERN =
  /\b(define|definition|meaning|explain|example|assignment|homework|class|lesson|teacher|curriculum|history|essay|project|research|vocabulary|synonym|fafanua|maana|darasa|somo|mwalimu|kazi ya nyumbani|utafiti)\b|(?:عرّف|عرف|معنى|اشرح|مثال|واجب|واجب منزلي|صف|درس|معلم|منهج|بحث|مفردات)/i;
const BENIGN_VIOLENCE_WORD_USAGE_PATTERN =
  /\b(beat (the )?(game|level|record|traffic)|heartbeat|killer feature|kill the process|piga (mchezo|leveli|rekodi)|mapigo ya moyo)\b|(?:اهزم المستوى|نبض القلب|اقتل العملية)/i;
const SELF_REFERENTIAL_PATTERN = /\b(i|i'm|im|me|myself|mimi|mwenyewe)\b|(?:أنا|نفسي)/i;
const SELF_HARM_INTENT_CUE_PATTERN =
  /\b(i want to|i will|i am going to|i'm going to|im going to|i feel like|thinking of|i plan to|nataka|nita|nahisi nataka|ninafikiria)\b|(?:أريد أن|سوف|سأ|أفكر في|اخطط أن|أخطط أن|اشعر أنني أريد)/i;
const VICTIM_CONTEXT_PATTERN =
  /\b(raped me|beat me|kill me|hurting me|abused me|molested me|threatened me|unsafe at home|not safe at home|my father|my mother|my guardian|my uncle|my aunt|alinibaka|ananipiga|wananitishia|siko salama nyumbani|baba yangu|mama yangu|mlezi wangu)\b|(?:اغتصبني|يضربني|يؤذيني|هددني|لست آمنًا في البيت|لست آمنة في البيت|ابي|أبي|امي|أمي|ولي أمري)/i;
const HELP_SEEKING_PATTERN =
  /\b(help me|i need help|please help|i am not safe|i'm not safe|im not safe|nisaidie|nahitaji msaada|tafadhali nisaidie|siko salama)\b|(?:ساعدني|أحتاج مساعدة|احتاج مساعدة|من فضلك ساعدني|لست آمنا|لست آمنة|أنا غير آمن|انا غير آمنة)/i;
const IMMEDIACY_PATTERN = /\b(now|right now|tonight|today|immediately|soon|sasa|usiku wa leo|leo|haraka)\b|(?:الآن|الان|الليلة|اليوم|فورا|فورًا|حالًا|قريبا)/i;
const PLAN_OR_MEANS_PATTERN =
  /\b(plan|method|pills?|knife|rope|bridge|poison|overdose|blade|hang|hanging|mpango|njia|vidonge|kisu|kamba|sumu)\b|(?:خطة|طريقة|حبوب|سكين|حبل|جسر|سم|جرعة زائدة|شنق|شفرة)/i;
const SELF_HARM_REFERENCE_PATTERN =
  /\b(suicide|self harm|self-harm|kill myself|end my life|harm myself|cut myself|i want to die|i feel like dying|kujiua|kujidhuru|nataka kufa)\b|(?:انتحار|إيذاء نفسي|ايذاء نفسي|أقتل نفسي|اقتل نفسي|أنهي حياتي|انهي حياتي|أريد الموت|اريد الموت)/i;
const RUNAWAY_INTENT_PATTERN =
  /\b(i want to run away|i will run away|running away from home|run away from home|nataka kutoroka nyumbani|nitatoroka nyumbani|nimetoroka nyumbani)\b|(?:أريد الهروب من البيت|اريد الهروب من البيت|سأهرب من المنزل|هارب من البيت)/i;
const DISTRESS_WORD_PATTERN = /\b(scared|alone|worthless|depressed|naogopa|peke yangu|sina thamani|nimefadhaika)\b|(?:خائف|خايفة|وحيد|وحيدة|عديم القيمة|مكتئب|مكتئبة)/gi;
const NEGATED_INTENT_PATTERN =
  /\b(i do not want to|i don't want to|not going to|i would never|not planning to|sitaki|sita|sina mpango wa)\b|(?:لا أريد أن|لا اريد ان|لن|لست أنوي|لست انوي)/i;
const VIOLENCE_KEYWORD_PATTERN = /(\bkill\b|\bbeat\b|\bkilled\b|\bbeaten\b|اقتل|يقتل|اضرب|يضرب|ua|piga|nipige|niue)/i;

function redactExcerpt(text: string): string {
  const trimmed = String(text || '').trim().slice(0, 320);
  if (!trimmed) return '';
  return trimmed
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(\+?\d[\d\s-]{6,}\d)\b/g, '[phone]')
    .replace(/\s+/g, ' ')
    .trim();
}

function confidenceFromScore(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  const raw = score / 100;
  return Math.max(0.5, Math.min(0.99, Number(raw.toFixed(2))));
}

function countMatches(text: string, pattern: RegExp): number {
  const source = String(text || '');
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  const matches = source.match(re);
  return matches ? matches.length : 0;
}

function maxSeverity(a: SafetySeverity, b: SafetySeverity): SafetySeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function severityFromScore(score: number): SafetySeverity {
  if (score >= 93) return 'critical';
  if (score >= 80) return 'high';
  if (score >= 64) return 'medium';
  return 'low';
}

function emptyAssessment(text: string): SafetyRiskAssessment {
  return {
    flagged: false,
    category: null,
    severity: null,
    confidence: 0,
    riskScore: 0,
    excerptRedacted: redactExcerpt(text),
    reasons: [],
    needsCounselorReport: false,
  };
}

export function detectSafetyRisk(inputText: string): SafetyRiskAssessment {
  const text = String(inputText || '').trim();
  if (!text) {
    return emptyAssessment('');
  }

  const hits = RULES.filter((rule) => rule.pattern.test(text));
  if (hits.length === 0) {
    return emptyAssessment(text);
  }

  const hasSelfReference = SELF_REFERENTIAL_PATTERN.test(text);
  const hasSelfHarmIntentCue = SELF_HARM_INTENT_CUE_PATTERN.test(text);
  const hasVictimContext = VICTIM_CONTEXT_PATTERN.test(text);
  const hasHelpSeeking = HELP_SEEKING_PATTERN.test(text);
  const hasImmediacy = IMMEDIACY_PATTERN.test(text);
  const hasPlanOrMeans = PLAN_OR_MEANS_PATTERN.test(text);
  const hasSelfHarmReference = SELF_HARM_REFERENCE_PATTERN.test(text);
  const hasRunawayIntent = RUNAWAY_INTENT_PATTERN.test(text);
  const distressCount = countMatches(text, DISTRESS_WORD_PATTERN);
  const isAcademicContext = ACADEMIC_CONTEXT_PATTERN.test(text);
  const hasBenignViolenceUsage = BENIGN_VIOLENCE_WORD_USAGE_PATTERN.test(text);
  const hasNegatedIntent = NEGATED_INTENT_PATTERN.test(text);
  const hasImmediacyDangerContext =
    hasImmediacy &&
    (hasSelfHarmReference || hasVictimContext || hasRunawayIntent || hasHelpSeeking || hasPlanOrMeans) &&
    !(
      isAcademicContext &&
      !hasSelfHarmIntentCue &&
      !hasVictimContext &&
      !hasHelpSeeking &&
      !hasPlanOrMeans &&
      !hasRunawayIntent
    );

  const hasStrongContext =
    hasVictimContext ||
    hasHelpSeeking ||
    hasImmediacyDangerContext ||
    hasPlanOrMeans ||
    hasSelfHarmIntentCue ||
    hasRunawayIntent ||
    (hasSelfReference && distressCount >= 2);

  let top = hits[0];
  for (const hit of hits) {
    const topRank = SEVERITY_RANK[top.severity];
    const nextRank = SEVERITY_RANK[hit.severity];
    if (nextRank > topRank || (nextRank === topRank && hit.score > top.score)) {
      top = hit;
    }
  }

  const lowOnlyHits = hits.every((hit) => hit.severity === 'low');
  if (lowOnlyHits && !hasStrongContext && (isAcademicContext || hasBenignViolenceUsage)) {
    return emptyAssessment(text);
  }

  if (isAcademicContext && !hasStrongContext) {
    const allKeywordOnly = hits.every((hit) =>
      [
        'self-harm-high',
        'self-harm-high-ar-sw',
        'self-harm-distress-keywords-low',
        'sexual-abuse-high',
        'sexual-abuse-high-ar-sw',
        'violence-keywords-low',
        'violence-medium-ar-sw',
      ].includes(hit.id)
    );
    if (allKeywordOnly) {
      return emptyAssessment(text);
    }
  }

  let effectiveCategory = top.category;
  let effectiveSeverity = top.severity;
  const reasons = hits.map((hit) => hit.id);

  if (hasSelfHarmReference && hasSelfHarmIntentCue && (hasImmediacyDangerContext || hasPlanOrMeans)) {
    effectiveCategory = 'self_harm';
    effectiveSeverity = maxSeverity(effectiveSeverity, 'critical');
    reasons.push('context:self-harm-immediate-plan');
  } else if (
    hasSelfHarmReference &&
    (hasSelfHarmIntentCue || (hasSelfReference && distressCount >= 2))
  ) {
    effectiveCategory = 'self_harm';
    effectiveSeverity = maxSeverity(effectiveSeverity, 'high');
    reasons.push('context:self-harm-first-person');
  }

  if (distressCount >= 2 && hasSelfReference) {
    effectiveCategory = effectiveCategory === 'other' ? 'self_harm' : effectiveCategory;
    effectiveSeverity = maxSeverity(effectiveSeverity, 'medium');
    reasons.push('context:distress-cluster');
  }

  if (hasRunawayIntent && (hasSelfReference || hasVictimContext)) {
    effectiveCategory = 'abuse';
    effectiveSeverity = maxSeverity(effectiveSeverity, 'medium');
    reasons.push('context:runaway-intent');
  }

  if (VIOLENCE_KEYWORD_PATTERN.test(text) && (hasVictimContext || hasHelpSeeking)) {
    effectiveCategory = 'violence';
    effectiveSeverity = maxSeverity(effectiveSeverity, hasImmediacyDangerContext ? 'high' : 'medium');
    reasons.push('context:targeted-violence');
  }

  let riskScore = Math.max(top.score, Math.min(99, top.score + Math.max(0, hits.length - 1) * 3));
  if (hasImmediacyDangerContext) riskScore += 8;
  if (hasPlanOrMeans) riskScore += 8;
  if (hasHelpSeeking) riskScore += 6;
  if (distressCount >= 2) riskScore += 5;
  if (hasNegatedIntent && !hasImmediacy && !hasPlanOrMeans) riskScore -= 12;
  if (isAcademicContext && !hasStrongContext) riskScore -= 18;
  riskScore = Math.max(1, Math.min(99, riskScore));

  effectiveSeverity = maxSeverity(effectiveSeverity, severityFromScore(riskScore));
  if (effectiveSeverity === 'critical') riskScore = Math.max(riskScore, 93);
  else if (effectiveSeverity === 'high') riskScore = Math.max(riskScore, 80);
  else if (effectiveSeverity === 'medium') riskScore = Math.max(riskScore, 64);

  const confidence = confidenceFromScore(riskScore);
  const needsCounselorReport = effectiveSeverity === 'high' || effectiveSeverity === 'critical';

  return {
    flagged: true,
    category: effectiveCategory,
    severity: effectiveSeverity,
    confidence,
    riskScore,
    excerptRedacted: redactExcerpt(text),
    reasons,
    needsCounselorReport,
  };
}
