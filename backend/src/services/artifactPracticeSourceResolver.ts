// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Practice Source Resolver v1
// Resolves safe, bounded practice sources from structured
// artifact context. Uses extracted questions, diagrams,
// theorem/formula blocks, worked examples, and sections.
// Never includes raw full artifact text or raw OCR text.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactPracticeSource,
  ArtifactPracticeSourceKind,
  ArtifactPracticeSourceResolverOutput,
} from './artifactAwarePracticeContracts';

import { artifactService } from './artifactService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { LearningArtifact } from './artifactContracts';
import { isAnswerKeyAccessAllowed } from './artifactService';

// ── Helpers ──

function truncate(str: string, max: number): string {
  return String(str || '').length > max ? String(str || '').slice(0, max - 3) + '...' : String(str || '');
}

function bounded(str: string, max: number): string {
  return String(str || '').slice(0, max);
}

/**
 * Resolve artifact practice sources for a given identity and optional artifact IDs.
 */
export async function resolveArtifactPracticeSources(
  identity: ResolvedTutorIdentity,
  artifactIds: string[],
  primaryArtifactId?: string | null,
): Promise<ArtifactPracticeSourceResolverOutput> {
  const warnings: string[] = [];
  const sources: ArtifactPracticeSource[] = [];

  const sectionSummaries: string[] = [];
  const diagramSummaries: string[] = [];
  const theoremSummaries: string[] = [];
  const workedExampleSummaries: string[] = [];
  const extractedQuestionSummaries: string[] = [];
  const allSkillIds: string[] = [];
  const foundSourceKinds: Set<ArtifactPracticeSourceKind> = new Set();
  let resolvedTopic: string | null = null;

  // Resolve artifacts
  const resolvedIds: string[] = [];
  let resolvedPrimary: string | null = primaryArtifactId || null;

  for (const aid of artifactIds.slice(0, 5)) {
    try {
      const full = await artifactService.getFullArtifact(identity, aid);
      if (!full) {
        warnings.push(`Artifact ${aid} not found or inaccessible.`);
        continue;
      }

      resolvedIds.push(aid);
      if (!resolvedPrimary) resolvedPrimary = aid;

      const artifact = full.artifact;
      if (!resolvedTopic) {
        resolvedTopic = truncate(artifact.title || '', 160);
      }

      // STUDENT-SAFE: skip any restricted block unless the caller is teacher-authorized.
      const includeRestricted = isAnswerKeyAccessAllowed(artifact, identity);
      // Process blocks into sources (restricted blocks already excluded unless teacher)
      for (const block of full.blocks) {
        if (!includeRestricted && (block as any).visibility === 'teacher_only') continue;
        const kind = block.kind;

        if (kind === 'section' || kind === 'paragraph' || kind === 'transcript' || kind === 'transcript_segment' || kind === 'table') {
          const summary = truncate(block.summary || block.text || '', 240);
          if (summary) {
            sectionSummaries.push(summary);
            foundSourceKinds.add('section');
          }
          if (block.educationalTags?.skillIds) {
            allSkillIds.push(...block.educationalTags.skillIds);
          }
        }

        if (kind === 'theorem') {
          const summary = truncate(block.summary || block.text || '', 240);
          if (summary) {
            theoremSummaries.push(summary);
            foundSourceKinds.add('theorem_block');

            sources.push({
              sourceKind: 'theorem_block',
              artifactId: aid,
              sourceId: block.blockId,
              title: truncate(block.sectionTitle || 'Theorem', 120),
              pageNumber: block.pageNumber || null,
              topic: block.educationalTags?.topic || null,
              skillIds: (block.educationalTags?.skillIds || []).slice(0, 10),
              promptSeed: truncate(block.text || '', 300),
              expectedAnswerSummary: truncate(block.summary || 'Theorem understanding', 240),
              rubricPoints: [
                'States the theorem correctly',
                'Identifies the conditions under which the theorem applies',
                'Recognizes when the theorem can be applied',
              ],
              safeSummary: summary,
              warnings: [],
            });
          }
        }

        if (kind === 'formula') {
          const summary = truncate(block.summary || block.text || '', 240);
          if (summary) {
            foundSourceKinds.add('formula_block');
            sources.push({
              sourceKind: 'formula_block',
              artifactId: aid,
              sourceId: block.blockId,
              title: truncate(block.sectionTitle || 'Formula', 120),
              pageNumber: block.pageNumber || null,
              topic: block.educationalTags?.topic || null,
              skillIds: (block.educationalTags?.skillIds || []).slice(0, 10),
              promptSeed: truncate(block.text || '', 300),
              expectedAnswerSummary: truncate(block.summary || 'Formula application', 240),
              rubricPoints: [
                'Selects the correct formula',
                'Applies the formula correctly',
                'Uses correct units and notation',
              ],
              safeSummary: summary,
              warnings: [],
            });
          }
        }

        if (kind === 'diagram') {
          const summary = truncate(block.summary || 'Diagram present', 240);
          diagramSummaries.push(summary);
          foundSourceKinds.add('diagram');
        }
      }

      // Process extracted questions
      for (const q of full.questions.slice(0, 10)) {
        const summary = truncate(q.questionText, 240);
        extractedQuestionSummaries.push(summary);
        foundSourceKinds.add('extracted_question');

        const canAccessAnswerKey = isAnswerKeyAccessAllowed(artifact, identity);

        sources.push({
          sourceKind: 'extracted_question',
          artifactId: aid,
          sourceId: q.questionId,
          title: truncate(`Question: ${q.questionText.slice(0, 60)}`, 120),
          pageNumber: q.provenance?.pageNumber || null,
          topic: q.topic || null,
          skillIds: [],
          promptSeed: truncate(q.questionText, 500),
          expectedAnswerSummary: canAccessAnswerKey
            ? truncate(q.expectedAnswer || 'Answer from artifact', 240)
            : 'Expected answer from artifact',
          rubricPoints: [
            'Addresses the question directly',
            'Demonstrates understanding of the concept',
            'Uses relevant evidence or reasoning',
          ],
          safeSummary: summary,
          warnings: canAccessAnswerKey ? [] : ['Answer key not visible to learner.'],
        });
      }

      // Process worked examples
      for (const we of full.workedExamples.slice(0, 5)) {
        const steps = Array.isArray(we.steps) ? we.steps.join('; ') : '';
        const summary = truncate(steps || we.problemText || '', 240);
        workedExampleSummaries.push(summary);
        foundSourceKinds.add('worked_example');

        sources.push({
          sourceKind: 'worked_example',
          artifactId: aid,
          sourceId: we.exampleId,
          title: truncate('Worked example', 120),
          pageNumber: we.provenance?.pageNumber || null,
          topic: null,
          skillIds: [],
          promptSeed: truncate(we.problemText || '', 300),
          expectedAnswerSummary: truncate(we.finalAnswer || 'Step-by-step solution', 240),
          rubricPoints: [
            'Follows the correct solution steps',
            'Explains each step rather than copying',
            'Can generalize the approach to similar problems',
          ],
          safeSummary: summary,
          warnings: [],
        });
      }

      // Process answer keys for safe summary (not exposed to learner)
      const canAccessKey = isAnswerKeyAccessAllowed(artifact, identity);
      for (const ak of full.answerKeys) {
        foundSourceKinds.add('answer_key_summary');
        // Answer key used only as safe expected answer summaries — not shown to learner
        for (const ans of ak.answers.slice(0, 10)) {
          sources.push({
            sourceKind: 'answer_key_summary',
            artifactId: aid,
            sourceId: ak.answerKeyId,
            title: truncate('Answer reference', 120),
            pageNumber: ak.provenance?.pageNumber || null,
            topic: null,
            skillIds: [],
            promptSeed: null,
            expectedAnswerSummary: canAccessKey
              ? truncate(ans.answer, 240)
              : 'Answer key not exposed to learner',
            rubricPoints: ['Matches expected answer'],
            safeSummary: truncate(`Answer reference for ${ans.questionRef || 'question'}`, 240),
            warnings: canAccessKey ? [] : ['Answer key hidden from learner.'],
          });
        }
      }
    } catch (err) {
      warnings.push(`Failed to resolve artifact ${aid}: ${String(err)}`);
    }
  }

  if (resolvedIds.length === 0) {
    warnings.push('No active artifact found. Please upload or select a learning artifact first.');
    return {
      artifactIds: [],
      primaryArtifactId: null,
      sources: [],
      safeContextSummary: {
        topic: null,
        skillIds: [],
        sourceKinds: [],
        sectionSummaries: [],
        diagramSummaries: [],
        theoremSummaries: [],
        workedExampleSummaries: [],
        extractedQuestionSummaries: [],
        warnings,
      },
      warnings,
    };
  }

  return {
    artifactIds: resolvedIds,
    primaryArtifactId: resolvedPrimary,
    sources,
    safeContextSummary: {
      topic: resolvedTopic,
      skillIds: [...new Set(allSkillIds)].slice(0, 20),
      sourceKinds: [...foundSourceKinds] as ArtifactPracticeSourceKind[],
      sectionSummaries: sectionSummaries.slice(0, 5),
      diagramSummaries: diagramSummaries.slice(0, 5),
      theoremSummaries: theoremSummaries.slice(0, 5),
      workedExampleSummaries: workedExampleSummaries.slice(0, 5),
      extractedQuestionSummaries: extractedQuestionSummaries.slice(0, 10),
      warnings: [],
    },
    warnings,
  };
}
