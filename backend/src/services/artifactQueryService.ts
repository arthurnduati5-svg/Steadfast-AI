// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Query Service v1
// Deterministic block retrieval from structured artifact data.
// No AI calls — pure matching logic.
// ─────────────────────────────────────────────────────────────

import type {
  LearningArtifact,
  ArtifactBlock,
  ArtifactQueryRequest,
  ArtifactQueryResponse,
  ExtractedQuestion,
  AnswerKeyBlock,
  WorkedExampleBlock,
  DiagramBlock,
} from './artifactContracts';
import { artifactService } from './artifactService';
import { isAnswerKeyAccessAllowed } from './artifactService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { kernelSourceTrustService } from './sourceTrustService';
import type { SourceCandidate } from './sourceTrustContracts';
import { cacheScopePolicyService } from './cacheScopePolicyService';
import type { CacheKeyParts } from './cacheScopeContracts';

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lexicalOverlap(queryTokens: Set<string>, textTokens: Set<string>): number {
  if (queryTokens.size === 0 || textTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of queryTokens) {
    if (textTokens.has(token)) overlap++;
  }
  return overlap / Math.min(queryTokens.size, textTokens.size);
}

export class ArtifactQueryService {
  /**
   * Query an artifact for relevant blocks.
   * Access-controlled, answer-key-safe, with source trust and cache policy.
   */
  async queryArtifact(
    identity: ResolvedTutorIdentity,
    artifactId: string,
    request: ArtifactQueryRequest,
  ): Promise<ArtifactQueryResponse> {
    const warnings: string[] = [];
    const query = request.query.trim();
    const mode = request.mode || 'general';
    const maxBlocks = Math.max(1, Math.min(20, request.maxBlocks || 8));
    const includeAnswerKeys = request.includeAnswerKeys === true;

    // 1. Load full artifact with blocks
    const full = await artifactService.getFullArtifact(identity, artifactId);
    if (!full) {
      throw new ArtifactNotFoundError(artifactId);
    }

    const { artifact, blocks, questions, answerKeys, workedExamples, diagrams } = full;

    if (blocks.length === 0) {
      warnings.push('Artifact has no parsed blocks.');
    }

    // 2. Determine if answer keys can be included
    const canIncludeAnswerKeys = includeAnswerKeys && isAnswerKeyAccessAllowed(artifact, identity);

    // 3. Match blocks based on mode + lexical overlap
    const matchedBlocks: ArtifactBlock[] = [];
    const matchedQuestions: ExtractedQuestion[] = [];
    const matchedAnswerKeys: AnswerKeyBlock[] = [];
    const queryTokens = new Set(normalizeForComparison(query).split(' ').filter((t) => t.length > 2));

    // Priority scoring
    const scored = new Map<string, { block: ArtifactBlock; score: number }>();
    const questionBlockIds = new Set(questions.map((q) => q.blockId));
    const answerKeyBlockIds = new Set(answerKeys.map((ak) => ak.blockId));
    const workedExampleBlockIds = new Set(workedExamples.map((we) => we.blockId));

    for (const block of blocks) {
      let score = 0;

      // Mode-specific boosts
      if (mode === 'help_with_question' && request.questionRef) {
        // Prioritize question matching the questionRef
        if (block.kind === 'question') {
          const question = questions.find((q) => q.blockId === block.blockId);
          if (question && request.questionRef) {
            const refNorm = normalizeForComparison(request.questionRef);
            const questionNorm = normalizeForComparison(question.questionText);
            if (questionNorm.includes(refNorm) || refNorm.includes(questionNorm)) {
              score += 100;
            }
            // Check for number match
            const refNum = request.questionRef.replace(/[^0-9]/g, '');
            if (refNum && questionNorm.includes(refNum)) {
              score += 80;
            }
          }
        }
        // Boost worked examples and answer keys near matched questions
        if (block.kind === 'worked_example') {
          score += 40;
        }
        if (block.kind === 'answer_key') {
          score += canIncludeAnswerKeys ? 30 : 0;
        }
      }

      if (mode === 'explain_section' && block.sectionTitle) {
        const sectionNorm = normalizeForComparison(block.sectionTitle);
        const queryNorm = normalizeForComparison(query);
        if (sectionNorm.includes(queryNorm) || queryNorm.includes(sectionNorm)) {
          score += 60;
        }
      }

      if (mode === 'summarize' && (block.kind === 'title' || block.kind === 'section' || block.kind === 'paragraph')) {
        score += 30;
      }

      if (mode === 'find_examples' && block.kind === 'worked_example') {
        score += 50;
      }

      if (mode === 'quiz_from_artifact' && block.kind === 'question') {
        score += 40;
      }

      // Lexical overlap boost (for general mode and as fallback)
      if (queryTokens.size > 0) {
        const blockTokens = new Set(normalizeForComparison(block.text || '').split(' ').filter((t) => t.length > 2));
        const overlap = lexicalOverlap(queryTokens, blockTokens);
        score += Math.round(overlap * 30);
      }

      scored.set(block.blockId, { block, score });
    }

    // 4. Sort by score descending, then by order
    const sorted = [...scored.entries()]
      .sort((a, b) => {
        const scoreDiff = b[1].score - a[1].score;
        if (scoreDiff !== 0) return scoreDiff;
        return a[1].block.order - b[1].block.order;
      })
      .slice(0, maxBlocks);

    for (const [blockId, { block }] of sorted) {
      matchedBlocks.push(block);

      // Include matching questions
      if (questionBlockIds.has(blockId)) {
        const question = questions.find((q) => q.blockId === blockId);
        if (question) matchedQuestions.push(question);
      }

      // Include matching answer keys if allowed
      if (canIncludeAnswerKeys && answerKeyBlockIds.has(blockId)) {
        const ak = answerKeys.find((ak) => ak.blockId === blockId);
        if (ak) matchedAnswerKeys.push(ak);
      }
    }

    // If no blocks matched, add a warning
    if (matchedBlocks.length === 0) {
      warnings.push('no_relevant_blocks_found');
    }

    // 5. Source trust integration for artifact-derived sources
    const sourceCandidates: SourceCandidate[] = matchedBlocks.map((block) => ({
      title: `${artifact.title} — ${block.kind} block`,
      kind: 'artifact' as const,
      artifactId: artifact.artifactId,
      artifactBlockId: block.blockId,
      contentFingerprint: block.provenance?.confidence ? computeFingerprint(block.text || '') : undefined,
      displayAllowed: true,
    }));

    const sourceTrustDecision = kernelSourceTrustService.resolve({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      sessionId: null,
      artifactSources: sourceCandidates,
    });

    if (sourceTrustDecision.warnings.length > 0) {
      warnings.push(...sourceTrustDecision.warnings);
    }

    // 6. Cache policy integration
    const cacheKeyParts: CacheKeyParts = {
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      artifactIds: [artifact.artifactId],
      artifactFingerprint: artifact.contentFingerprint,
      requestShapeHash: computeFingerprint(query + mode),
    };

    const cacheDecision = cacheScopePolicyService.decide({
      dataClass: 'artifact_context',
      keyParts: cacheKeyParts,
    });

    if (cacheDecision.warnings.length > 0) {
      warnings.push(...cacheDecision.warnings);
    }

    // 7. Build response
    return {
      ok: true,
      artifact,
      query,
      matchedBlocks,
      matchedQuestions,
      matchedAnswerKeys,
      sourceTrust: {
        status: sourceTrustDecision.status,
        sourceCount: sourceTrustDecision.sourceCount,
        unsupportedCount: sourceTrustDecision.unsupportedCount,
      },
      cachePolicy: {
        cacheAllowed: cacheDecision.cacheAllowed,
        scope: cacheDecision.scope,
        reason: cacheDecision.reason,
      },
      warnings,
    };
  }
}

// Simple hash for fingerprints
function computeFingerprint(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export class ArtifactNotFoundError extends Error {
  public statusCode = 404;

  constructor(artifactId: string) {
    super(`Artifact not found: ${artifactId}`);
    this.name = 'ArtifactNotFoundError';
  }
}

// Singleton
export const artifactQueryService = new ArtifactQueryService();
