import { isTrustedSource } from '../../../AI/lib/research/source-trust';
import { createHash } from 'crypto';
import type { ResearchSource, SourceTrustTier } from '../lib/types';
import type { SourceCandidate, SourceTrustDecision, SourceTrustInput, VerifiedSourceRecord } from './sourceTrustContracts';

const HIGH_TRUST_DOMAINS = [
  'khanacademy.org',
  'openstax.org',
  'nasa.gov',
  'who.int',
  'cdc.gov',
  'unesco.org',
  'bbc.com',
  'bbc.co.uk',
  'reuters.com',
  'nature.com',
  'britannica.com',
  'nationalgeographic.com',
];

const MEDIUM_TRUST_DOMAINS = [
  'wikipedia.org',
  'investopedia.com',
  'healthline.com',
  'verywellmind.com',
  'geeksforgeeks.org',
];

const TRUSTED_VIDEO_CHANNEL_HINTS = [
  'khan academy',
  'ted-ed',
  'crash course',
  'free science lessons',
  'organic chemistry tutor',
  'math antics',
];

type SourceAssessment = {
  trustTier: SourceTrustTier;
  sourceType: string | null;
  relevanceReason: string;
  educationalFit: string;
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function extractDomain(url?: string | null): string | null {
  try {
    const parsed = new URL(safeString(url));
    return safeString(parsed.hostname).toLowerCase() || null;
  } catch {
    return null;
  }
}

function classifySourceType(args: { domain?: string | null; title?: string | null }): string | null {
  const domain = safeString(args.domain).toLowerCase();
  const title = safeString(args.title).toLowerCase();

  if (!domain && !title) return null;
  if (domain.endsWith('.gov') || domain.includes('.gov.')) return 'government';
  if (domain.endsWith('.edu') || domain.includes('.edu.')) return 'academic';
  if (domain.includes('wikipedia.org') || domain.includes('britannica.com')) return 'reference';
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'video';
  if (domain.includes('bbc.') || domain.includes('reuters.') || domain.includes('apnews.')) return 'news';
  if (/\b(textbook|lesson|tutorial|explainer|revision|worksheet)\b/.test(title)) return 'educational';
  return 'web';
}

function resolveTrustTier(args: { domain?: string | null; url?: string | null }): SourceTrustTier {
  const domain = safeString(args.domain).toLowerCase();
  const url = safeString(args.url).trim();
  if (!domain && !url) return 'limited';
  if (url && isTrustedSource(url)) return 'high';
  if (HIGH_TRUST_DOMAINS.some((trusted) => domain === trusted || domain.endsWith(`.${trusted}`))) return 'high';
  if (MEDIUM_TRUST_DOMAINS.some((trusted) => domain === trusted || domain.endsWith(`.${trusted}`))) return 'medium';
  if (domain.endsWith('.org') || domain.endsWith('.edu') || domain.endsWith('.gov')) return 'medium';
  return 'limited';
}

function buildAssessment(args: { title?: string | null; domain?: string | null; url?: string | null }): SourceAssessment {
  const trustTier = resolveTrustTier({ domain: args.domain, url: args.url });
  const sourceType = classifySourceType({ domain: args.domain, title: args.title });

  if (trustTier === 'high') {
    return {
      trustTier,
      sourceType,
      relevanceReason: 'This source is from a domain with strong educational or institutional reliability.',
      educationalFit: 'Good fit for source-backed study support.',
    };
  }
  if (trustTier === 'medium') {
    return {
      trustTier,
      sourceType,
      relevanceReason: 'This source is likely useful, but should be cross-checked with stronger references when possible.',
      educationalFit: 'Usable for additional context and comparisons.',
    };
  }
  return {
    trustTier,
    sourceType,
    relevanceReason: 'This source has limited trust signals, so it is treated as secondary support only.',
    educationalFit: 'Use carefully and verify key claims.',
  };
}

export function evaluateResearchSource(args: {
  title: string;
  url?: string | null;
  relevanceReason?: string | null;
  recencyReason?: string | null;
}): ResearchSource {
  const domain = extractDomain(args.url);
  const assessment = buildAssessment({
    title: args.title,
    domain,
    url: args.url,
  });

  return {
    title: safeString(args.title).trim() || 'Source',
    url: safeString(args.url).trim() || null,
    domain,
    sourceType: assessment.sourceType,
    trustTier: assessment.trustTier,
    relevanceReason: safeString(args.relevanceReason).trim() || assessment.relevanceReason,
    recencyReason: safeString(args.recencyReason).trim() || null,
    educationalFit: assessment.educationalFit,
  };
}

export function summarizeSourceTrust(sources: ResearchSource[]): string | null {
  if (!sources.length) return null;
  const high = sources.filter((source) => source.trustTier === 'high').length;
  const medium = sources.filter((source) => source.trustTier === 'medium').length;
  const limited = sources.filter((source) => source.trustTier === 'limited').length;
  if (high >= 2) {
    return 'Most sources are strong and suitable for study guidance.';
  }
  if (high >= 1 && medium >= 1) {
    return 'Sources are mostly reliable, with a mix of strong and supporting references.';
  }
  if (limited > 0 && high === 0) {
    return 'Source support is limited, so key points should be verified before relying on them fully.';
  }
  return 'Source quality is mixed; use the core points and cross-check important claims.';
}

export function inferVideoTrustTier(channelTitle?: string | null): SourceTrustTier {
  const channel = safeString(channelTitle).toLowerCase();
  if (!channel) return 'limited';
  if (TRUSTED_VIDEO_CHANNEL_HINTS.some((hint) => channel.includes(hint))) return 'high';
  if (/\b(academy|education|tutorial|lessons?|school|math|science|revision)\b/.test(channel)) return 'medium';
  return 'limited';
}

function resolveSourceTrust(input: SourceTrustInput): SourceTrustDecision {
  // schoolId MUST be verified caller context (threaded from schoolAuthMiddleware
  // via artifactQueryService / tutorContextResolver / chat pipeline identity).
  // An arbitrary caller-supplied schoolId never establishes another school's
  // source context: tenant authorization lives in caller composition, and this
  // pure service only propagates the already-verified scope for provenance.
  // Unknown or unreviewed sources stay fail-closed: trustTier 'limited' is
  // always withheld, never learner-visible, and never marked verified.
  const verifiedSchoolId = typeof input.schoolId === 'string' && input.schoolId.trim() ? input.schoolId.trim() : null;
  const candidates: SourceCandidate[] = [
    ...(input.requestedSources || []),
    ...(input.retrievalRecords || []),
    ...(input.artifactSources || []),
    ...(input.teacherSources || []),
  ];
  const verifiedSources: VerifiedSourceRecord[] = [...(input.existingVerifiedSources || [])];
  const unsupportedSources: SourceTrustDecision['unsupportedSources'] = [];

  for (const candidate of candidates) {
    const source = evaluateResearchSource({ title: candidate.title || 'Source', url: candidate.url });
    if (source.trustTier === 'limited') {
      unsupportedSources.push({
        attemptedTitle: candidate.title || null,
        attemptedUrl: candidate.url || null,
        reason: candidate.url ? 'untrusted_source' : 'missing_retrieval_record',
        blockedAt: new Date().toISOString(),
      });
      continue;
    }
    verifiedSources.push({
      sourceId: candidate.sourceId || createHash('sha256').update(`${candidate.title || ''}|${candidate.url || ''}`).digest('hex'),
      kind: candidate.kind || 'research_result',
      title: source.title,
      url: source.url,
      artifactId: candidate.artifactId || null,
      artifactBlockId: candidate.artifactBlockId || null,
      schoolId: verifiedSchoolId,
      retrievedAt: candidate.retrievedAt || null,
      verifiedAt: new Date().toISOString(),
      verificationMethod: candidate.artifactId ? 'artifact_provenance' : 'retrieval_record',
      contentFingerprint: candidate.contentFingerprint || null,
      trustStatus: source.trustTier === 'high' ? 'verified' : 'partial',
      displayAllowed: candidate.displayAllowed !== false,
      citationAllowed: true,
      notes: [],
    });
  }

  const unsupportedSourcesBlocked = unsupportedSources.length > 0;
  const status = verifiedSources.length === 0
    ? (candidates.length === 0 ? 'no_sources' : 'unsupported')
    : (unsupportedSourcesBlocked ? 'partial' : 'verified');
  const sourceFingerprint = verifiedSources.length
    ? createHash('sha256').update(verifiedSources.map((source) => source.sourceId).sort().join('|')).digest('hex')
    : null;
  return {
    status,
    verifiedSources,
    unsupportedSources,
    sourceCount: verifiedSources.length,
    unsupportedCount: unsupportedSources.length,
    unsupportedSourcesBlocked,
    citationPolicy: 'verified_only',
    sourceFingerprint,
    warnings: unsupportedSourcesBlocked ? ['Unsupported sources were withheld.'] : [],
    errors: [],
    resolvedAt: new Date().toISOString(),
  };
}

export const kernelSourceTrustService = {
  resolve: resolveSourceTrust,
  evaluateResearchSource,
  summarizeSourceTrust,
  inferVideoTrustTier,
};
