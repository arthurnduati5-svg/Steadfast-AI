import type { VerifiedSource } from './sourceVerificationContracts';
import { FAKE_URL_PATTERNS, PLACEHOLDER_SOURCE_TITLES } from './sourceVerificationContracts';

export interface FakeSourceRejection {
  rejected: boolean;
  reason?: string;
  rejectionCode?:
    | 'placeholder_url'
    | 'invented_domain'
    | 'missing_url_labeled_verified'
    | 'source_title_no_object'
    | 'citation_id_does_not_exist'
    | 'claim_cites_unsupporting_source'
    | 'stale_presented_as_fresh'
    | 'video_metadata_as_transcript_evidence'
    | 'artifact_filename_as_content_evidence'
    | 'generated_fallback_source';
}

export class NoFakeSourceGuardService {
  rejectFakeUrl(url: string): FakeSourceRejection {
    const isFake = FAKE_URL_PATTERNS.some(p => p.test(url));
    if (isFake) {
      return { rejected: true, reason: `Fake URL pattern matched: ${url}`, rejectionCode: 'placeholder_url' };
    }

    try {
      const parsed = new URL(url);
      const inventedDomain = /^[a-z]+\.(xyz|click|work|download|review|blog|site|top)$/i.test(parsed.hostname);
      if (inventedDomain) {
        return { rejected: true, reason: `Potentially invented domain: ${parsed.hostname}`, rejectionCode: 'invented_domain' };
      }
    } catch {
      return { rejected: true, reason: `Invalid URL format: ${url}`, rejectionCode: 'placeholder_url' };
    }

    return { rejected: false };
  }

  rejectPlaceholderTitle(title: string): FakeSourceRejection {
    const isPlaceholder = PLACEHOLDER_SOURCE_TITLES.some(
      t => title.toLowerCase().trim() === t.toLowerCase()
    );
    if (isPlaceholder) {
      return { rejected: true, reason: `Placeholder source title: "${title}"`, rejectionCode: 'source_title_no_object' };
    }
    return { rejected: false };
  }

  rejectVerifiedWithoutUrl(source: { title: string; url?: string; verificationStatus: string }): FakeSourceRejection {
    if (source.verificationStatus === 'verified' && !source.url) {
      return { rejected: true, reason: `Verified source "${source.title}" has no URL`, rejectionCode: 'missing_url_labeled_verified' };
    }
    return { rejected: false };
  }

  rejectStalePresentedAsFresh(freshnessStatus: string, claimedFresh: boolean): FakeSourceRejection {
    if ((freshnessStatus === 'stale' || freshnessStatus === 'possibly_stale') && claimedFresh) {
      return { rejected: true, reason: `Stale source presented as fresh`, rejectionCode: 'stale_presented_as_fresh' };
    }
    return { rejected: false };
  }

  rejectVideoMetadataAsTranscriptEvidence(source: VerifiedSource, isTranscriptClaim: boolean): FakeSourceRejection {
    if (source.sourceType === 'video' && isTranscriptClaim && !source.safeSummary) {
      return { rejected: true, reason: `Video metadata used as transcript evidence for "${source.title}"`, rejectionCode: 'video_metadata_as_transcript_evidence' };
    }
    return { rejected: false };
  }

  rejectArtifactFilenameAsContentEvidence(source: VerifiedSource, contentEvidence: string): FakeSourceRejection {
    if (source.sourceType === 'artifact' && source.title === contentEvidence) {
      return { rejected: true, reason: `Artifact filename "${source.title}" used as content evidence`, rejectionCode: 'artifact_filename_as_content_evidence' };
    }
    return { rejected: false };
  }

  rejectGeneratedFallbackSource(source: { title: string; url?: string; verificationStatus: string }): FakeSourceRejection {
    if (source.verificationStatus === 'unverified' && !source.url && source.title.toLowerCase().includes('source')) {
      return { rejected: true, reason: `Generated fallback source detected: "${source.title}"`, rejectionCode: 'generated_fallback_source' };
    }
    return { rejected: false };
  }

  rejectAll(source: VerifiedSource, context?: {
    claimedFresh?: boolean;
    isTranscriptClaim?: boolean;
    contentEvidence?: string;
  }): FakeSourceRejection {
    if (source.url) {
      const urlCheck = this.rejectFakeUrl(source.url);
      if (urlCheck.rejected) return urlCheck;
    }

    const titleCheck = this.rejectPlaceholderTitle(source.title);
    if (titleCheck.rejected) return titleCheck;

    const verifiedNoUrl = this.rejectVerifiedWithoutUrl(source);
    if (verifiedNoUrl.rejected) return verifiedNoUrl;

    if (context?.claimedFresh) {
      const staleFresh = this.rejectStalePresentedAsFresh(source.freshnessStatus, context.claimedFresh);
      if (staleFresh.rejected) return staleFresh;
    }

    if (context?.isTranscriptClaim) {
      const videoMeta = this.rejectVideoMetadataAsTranscriptEvidence(source, context.isTranscriptClaim);
      if (videoMeta.rejected) return videoMeta;
    }

    if (context?.contentEvidence) {
      const artifactFilename = this.rejectArtifactFilenameAsContentEvidence(source, context.contentEvidence);
      if (artifactFilename.rejected) return artifactFilename;
    }

    const generatedFallback = this.rejectGeneratedFallbackSource(source);
    if (generatedFallback.rejected) return generatedFallback;

    return { rejected: false };
  }
}

export const noFakeSourceGuardService = new NoFakeSourceGuardService();
