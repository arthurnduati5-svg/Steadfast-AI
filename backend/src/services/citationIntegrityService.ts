import type {
  VerifiedSource,
  SourceBackedClaim,
  CitationIntegrityResult,
} from './sourceVerificationContracts';
import { FAKE_URL_PATTERNS, PLACEHOLDER_SOURCE_TITLES } from './sourceVerificationContracts';

export class CitationIntegrityService {
  verifyCitations(
    claims: SourceBackedClaim[],
    sources: VerifiedSource[],
  ): CitationIntegrityResult {
    const result: CitationIntegrityResult = {
      verified: true,
      claims: [],
      warnings: [],
      unsupportedClaimsDowngraded: 0,
      supportedClaimsKept: 0,
      missingSourceFallbackApplied: false,
      staleSourcesWarned: false,
      noFabricatedUrls: true,
    };

    for (const claim of claims) {
      const processedClaim: SourceBackedClaim = {
        ...claim,
        supportedBySourceIds: [],
        supportStatus: 'not_checked',
      };

      if (!claim.requiresCitation) {
        processedClaim.supportStatus = 'not_checked';
        result.claims.push(processedClaim);
        continue;
      }

      const supportingSources = sources.filter(s =>
        claim.supportedBySourceIds.includes(s.id)
      );

      if (supportingSources.length === 0) {
        processedClaim.supportedBySourceIds = [];
        processedClaim.supportStatus = 'unsupported';
        result.unsupportedClaimsDowngraded++;
        result.warnings.push(`Claim "${claim.claim}" has no supporting verified sources`);
        result.claims.push(processedClaim);
        continue;
      }

      const verifiedSupporting = supportingSources.filter(
        s => s.verificationStatus === 'verified'
      );

      if (verifiedSupporting.length === 0) {
        processedClaim.supportedBySourceIds = [];
        processedClaim.supportStatus = 'unsupported';
        result.unsupportedClaimsDowngraded++;
        result.warnings.push(`Claim "${claim.claim}" only has unverified or rejected sources`);
        result.claims.push(processedClaim);
        continue;
      }

      for (const src of verifiedSupporting) {
        if (src.freshnessStatus === 'stale') {
          result.staleSourcesWarned = true;
          result.warnings.push(`Source "${src.title}" is stale — claim "${claim.claim}" may need current verification`);
        }
      }

      processedClaim.supportedBySourceIds = verifiedSupporting.map(s => s.id);
      processedClaim.supportStatus = 'supported';
      result.supportedClaimsKept++;
      result.claims.push(processedClaim);
    }

    if (sources.length === 0 && claims.some(c => c.requiresCitation)) {
      result.missingSourceFallbackApplied = true;
      result.warnings.push('No sources available — required citations cannot be verified');
    }

    result.verified = result.unsupportedClaimsDowngraded === 0;
    return result;
  }

  verifySource(source: VerifiedSource): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (source.url) {
      const isFake = FAKE_URL_PATTERNS.some(p => p.test(source.url || ''));
      if (isFake) {
        warnings.push(`Fake URL rejected: ${source.url}`);
        return { valid: false, warnings };
      }

      if (!source.domain && source.url) {
        try {
          const parsed = new URL(source.url);
          source.domain = parsed.hostname;
        } catch {
          warnings.push(`Invalid URL: ${source.url}`);
          return { valid: false, warnings };
        }
      }
    }

    if (!source.title || source.title.trim().length === 0) {
      warnings.push('Source has no title');
      return { valid: false, warnings };
    }

    const isPlaceholder = PLACEHOLDER_SOURCE_TITLES.some(
      t => source.title.toLowerCase().trim() === t.toLowerCase()
    );
    if (isPlaceholder) {
      warnings.push(`Placeholder source title rejected: "${source.title}"`);
      return { valid: false, warnings };
    }

    if (source.verificationStatus === 'verified' && !source.url) {
      warnings.push('Verified source must have a URL');
      return { valid: false, warnings };
    }

    if (source.rawContentIncluded !== false) {
      warnings.push('Raw content must not be included in source metadata');
      return { valid: false, warnings };
    }

    return { valid: true, warnings };
  }

  buildUnavailableResponse(): { message: string; sourceFallbackApplied: boolean } {
    return {
      message: 'I do not have a verified source for that information right now.',
      sourceFallbackApplied: true,
    };
  }
}

export const citationIntegrityService = new CitationIntegrityService();
