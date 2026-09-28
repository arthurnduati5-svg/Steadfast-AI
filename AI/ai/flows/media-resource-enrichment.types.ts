import { z } from 'zod';

/**
 * Media resource semantic enrichment — provider-neutral contracts.
 *
 * OWNERSHIP LAW: this capability produces PROPOSALS ONLY.
 * It never approves curriculum mappings, rights, safety, Deen authority,
 * learner diagnosis, mastery or recommendation eligibility.
 * It analyzes a RESOURCE, never a learner.
 */

export const MEDIA_SEMANTIC_PROPOSAL_VERSION = 'media-semantic-proposal.v1';

// ---------------------------------------------------------------------------
// Frozen enums (closed sets — no invention permitted)
// ---------------------------------------------------------------------------

export const CREATIVE_FAMILIES = [
  'DID_YOU_KNOW',
  'HOW_THINGS_WORK',
  'PRACTICAL_APPLICATION',
  'MAKE_BUILD_CREATE',
  'EXPERIMENT',
  'SKILL_CRAFT',
  'NATURE_WORLD',
  'TECHNOLOGY_ENGINEERING',
  'ART_DESIGN',
  'CAREER_WINDOW',
  'ADJACENT_DOMAIN',
  'BROADENING_DOMAIN',
  'STUDY_CONNECTION',
  'OTHER',
] as const;

export type CreativeFamily = (typeof CREATIVE_FAMILIES)[number];

export const PEDAGOGICAL_ROLES = [
  'CONCEPT_EXPLAINER',
  'VISUAL_INTUITION',
  'WORKED_EXAMPLE',
  'REVISION_RECAP',
  'PRACTICAL_DEMONSTRATION',
  'APPLICATION',
  'PREREQUISITE_SUPPORT',
  'MISCONCEPTION_REFRAME',
  'EXTENSION',
  'SYNTHESIS',
  'DISCOVERY',
  'OTHER',
] as const;

export type PedagogicalRole = (typeof PEDAGOGICAL_ROLES)[number];

export const DIFFICULTY_LEVELS = [
  'FOUNDATIONAL',
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'UNKNOWN',
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const EDUCATIONAL_LEVEL_EVIDENCE_BASES = [
  'metadata',
  'authorized_transcript',
  'mixed',
  'insufficient',
] as const;

export type EducationalLevelEvidenceBasis =
  (typeof EDUCATIONAL_LEVEL_EVIDENCE_BASES)[number];

export const ANALYSIS_BASES = [
  'METADATA_ONLY',
  'METADATA_AND_AUTHORIZED_TRANSCRIPT',
] as const;

export type AnalysisBasis = (typeof ANALYSIS_BASES)[number];

// ---------------------------------------------------------------------------
// Input bounds (deterministic, enforced before any model invocation)
// ---------------------------------------------------------------------------

export const INPUT_BOUNDS = {
  resourceRefMax: 200,
  titleMax: 240,
  descriptionMax: 4000,
  languageMax: 40,
  resourceTypeMax: 80,
  creatorNameMax: 200,
  providerTypeMax: 80,
  transcriptTextMax: 30000,
  taxonomyNodesPerCategoryMax: 50,
  taxonomyIdMax: 160,
  taxonomyLabelMax: 240,
  taxonomyDescriptionMax: 600,
} as const;

export const OUTPUT_BOUNDS = {
  subjects: 5,
  topics: 8,
  concepts: 12,
  skills: 10,
  prerequisites: 8,
  learningPurposes: 8,
  misconceptionTargets: 8,
  creativeFamilies: 6,
  curiosityTags: 10,
  practicalApplications: 10,
  adjacentDomains: 8,
  broadeningDomains: 8,
  pedagogicalRoles: 6,
  keyPoints: 8,
  warnings: 8,
  summaryMax: 700,
  candidateLabelMax: 180,
  warningMax: 300,
  educationalLevelLabelsMax: 8,
} as const;

// ---------------------------------------------------------------------------
// Input contract (resource-scoped; NO learner-state fields permitted)
// ---------------------------------------------------------------------------

export const TaxonomyNodeSchema = z.object({
  id: z.string().min(1).max(INPUT_BOUNDS.taxonomyIdMax),
  label: z.string().min(1).max(INPUT_BOUNDS.taxonomyLabelMax),
  description: z.string().max(INPUT_BOUNDS.taxonomyDescriptionMax).nullable().optional(),
});

export type TaxonomyNode = z.infer<typeof TaxonomyNodeSchema>;

export const TranscriptInputSchema = z.object({
  text: z.string().min(1).max(INPUT_BOUNDS.transcriptTextMax),
  aiProcessingAuthorized: z.boolean(),
});

export const TaxonomyContextSchema = z
  .object({
    subjects: z.array(TaxonomyNodeSchema).max(INPUT_BOUNDS.taxonomyNodesPerCategoryMax).default([]),
    topics: z.array(TaxonomyNodeSchema).max(INPUT_BOUNDS.taxonomyNodesPerCategoryMax).default([]),
    concepts: z.array(TaxonomyNodeSchema).max(INPUT_BOUNDS.taxonomyNodesPerCategoryMax).default([]),
    skills: z.array(TaxonomyNodeSchema).max(INPUT_BOUNDS.taxonomyNodesPerCategoryMax).default([]),
    objectives: z.array(TaxonomyNodeSchema).max(INPUT_BOUNDS.taxonomyNodesPerCategoryMax).default([]),
  })
  .nullable()
  .optional();

export const MediaResourceEnrichmentInputSchema = z.object({
  resourceRef: z.string().min(1).max(INPUT_BOUNDS.resourceRefMax),
  title: z.string().min(1).max(INPUT_BOUNDS.titleMax),
  description: z.string().max(INPUT_BOUNDS.descriptionMax).nullable().optional(),
  language: z.string().max(INPUT_BOUNDS.languageMax).nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  resourceType: z.string().max(INPUT_BOUNDS.resourceTypeMax).nullable().optional(),
  creatorName: z.string().max(INPUT_BOUNDS.creatorNameMax).nullable().optional(),
  providerType: z.string().max(INPUT_BOUNDS.providerTypeMax).nullable().optional(),
  transcript: TranscriptInputSchema.nullable().optional(),
  taxonomyContext: TaxonomyContextSchema,
});

export type MediaResourceEnrichmentInput = z.infer<typeof MediaResourceEnrichmentInputSchema>;

// ---------------------------------------------------------------------------
// Output contract (proposal semantics)
// ---------------------------------------------------------------------------

export const SemanticCandidateSchema = z.object({
  label: z.string().min(1).max(OUTPUT_BOUNDS.candidateLabelMax),
  taxonomyId: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export const CreativeFamilyProposalSchema = z.object({
  family: z.enum(CREATIVE_FAMILIES),
  confidence: z.number().min(0).max(1),
});

export const DifficultyProposalSchema = z.object({
  level: z.enum(DIFFICULTY_LEVELS),
  confidence: z.number().min(0).max(1),
});

export const EducationalLevelProposalSchema = z.object({
  labels: z.array(z.string().min(1).max(OUTPUT_BOUNDS.candidateLabelMax)).max(OUTPUT_BOUNDS.educationalLevelLabelsMax),
  confidence: z.number().min(0).max(1),
  evidenceBasis: z.enum(EDUCATIONAL_LEVEL_EVIDENCE_BASES),
});

export const MediaSemanticProposalSchema = z.object({
  proposalVersion: z.literal(MEDIA_SEMANTIC_PROPOSAL_VERSION),
  resourceRef: z.string().min(1).max(INPUT_BOUNDS.resourceRefMax),
  analysisBasis: z.enum(ANALYSIS_BASES),
  transcriptUsed: z.boolean(),
  academic: z.object({
    subjects: z.array(SemanticCandidateSchema),
    topics: z.array(SemanticCandidateSchema),
    concepts: z.array(SemanticCandidateSchema),
    skills: z.array(SemanticCandidateSchema),
    prerequisites: z.array(SemanticCandidateSchema),
    learningPurposes: z.array(SemanticCandidateSchema),
    misconceptionTargets: z.array(SemanticCandidateSchema),
    difficulty: DifficultyProposalSchema,
    educationalLevel: EducationalLevelProposalSchema,
  }),
  creative: z.object({
    families: z.array(CreativeFamilyProposalSchema),
    curiosityTags: z.array(SemanticCandidateSchema),
    practicalApplications: z.array(SemanticCandidateSchema),
    adjacentDomains: z.array(SemanticCandidateSchema),
    broadeningDomains: z.array(SemanticCandidateSchema),
  }),
  content: z.object({
    summary: z.string().max(OUTPUT_BOUNDS.summaryMax),
    keyPoints: z.array(z.string().min(1).max(OUTPUT_BOUNDS.candidateLabelMax)).max(OUTPUT_BOUNDS.keyPoints),
    pedagogicalRoles: z.array(SemanticCandidateSchema),
  }),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string().min(1).max(OUTPUT_BOUNDS.warningMax)).max(OUTPUT_BOUNDS.warnings),
  provenance: z.object({
    engine: z.string(),
    model: z.string().nullable(),
    generatedAt: z.string(),
  }),
});

export type SemanticCandidate = z.infer<typeof SemanticCandidateSchema>;
export type CreativeFamilyProposal = z.infer<typeof CreativeFamilyProposalSchema>;
export type DifficultyProposal = z.infer<typeof DifficultyProposalSchema>;
export type EducationalLevelProposal = z.infer<typeof EducationalLevelProposalSchema>;
export type MediaSemanticProposal = z.infer<typeof MediaSemanticProposalSchema>;

// ---------------------------------------------------------------------------
// Raw model output contract (permissive on purpose; deterministic
// normalization in the application layer enforces the real contract)
// ---------------------------------------------------------------------------

export const RawSemanticCandidateSchema = z
  .object({
    label: z.unknown().optional(),
    taxonomyId: z.unknown().optional(),
    confidence: z.unknown().optional(),
  })
  .passthrough();

export const RawSemanticProposalSchema = z
  .object({
    academic: z.record(z.unknown()).optional(),
    creative: z.record(z.unknown()).optional(),
    content: z.record(z.unknown()).optional(),
    confidence: z.unknown().optional(),
    warnings: z.unknown().optional(),
  })
  .passthrough();

export type RawSemanticProposal = z.infer<typeof RawSemanticProposalSchema>;
