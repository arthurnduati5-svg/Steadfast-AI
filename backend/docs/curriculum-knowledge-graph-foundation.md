# Curriculum Knowledge Graph Foundation

## 1. Purpose

The Curriculum Knowledge Graph is an in-memory directed-graph domain that models
curriculum structure, version lifecycle, node taxonomy, edge relationships,
prerequisite chains, concept and objective maps, structural learning paths,
change-impact analysis, and safe student/staff projections. It is designed as a
self-contained backend package with no Prisma, database, frontend, or AI
dependency.

## 2. Acceptance Boundary

This package is accepted when:

- existing implementation is preserved
- all 20 required focused test files pass
- at least 129 legitimate focused tests pass
- no required test is skipped or marked todo
- production package typing is safe (no `as any` for domain contracts)
- test helpers do not use broad casts to hide broken domain contracts
- seed idempotency is behaviorally proven
- router dependencies fail closed when missing
- task-scoped strict TypeScript passes
- real direct regressions pass
- original static scans pass
- documentation is complete
- no runtime artifact remains
- exact task files are committed

## 3. Canonical Domain Ownership

| Path | Owner |
|------|-------|
| `backend/src/domains/curriculum-knowledge-graph/` | Curriculum Knowledge Graph |
| `backend/src/tests/curriculum-knowledge-graph/` | Curriculum Knowledge Graph tests |
| `backend/tsconfig.curriculum-knowledge-graph.json` | Task-scoped TypeScript |
| `backend/docs/curriculum-knowledge-graph-foundation.md` | This document |

## 4. Reused Existing Contracts

- No external API envelope types are imported
- Express `Request` and `Response` types are used only in the router factory
- Shared `Clock` and `IdGenerator` interfaces are defined in-domain

## 5. Deferred Integrations

- Learning Evidence
- Question Bank
- Objective Mastery
- Daily Objective Check
- Study Plan
- Revision Queue
- Growth Page
- Teacher Overview
- Prisma/PostgreSQL persistence
- Frontend integration
- AI integration
- Route mounting in `backend/src/index.ts`

## 6. Version Lifecycle

```
draft → under_review → approved → active → superseded → archived
                           ↓
                       archived
```

- Only `draft` versions are editable
- `under_review` can be returned to `draft`
- `approved` can be activated or archived
- `active` can be superseded (which activates the successor)
- `superseded` can be archived

## 7. Node Taxonomy

| Node Type | Description |
|-----------|-------------|
| `curriculum_root` | Single root node per version |
| `subject` | Academic subject (e.g. Mathematics) |
| `grade_level` | Grade level (e.g. Grade 9) |
| `strand` | Curricular strand within subject |
| `unit` | Teaching unit |
| `topic` | Topic within unit or strand |
| `subtopic` | Sub-topic within topic |
| `concept` | Conceptual knowledge unit |
| `skill` | Procedural skill |
| `learning_objective` | Assessable learning objective |

## 8. Edge Taxonomy

| Edge Type | Source → Target | Description |
|-----------|-----------------|-------------|
| `contains` | Any parent → child | Curriculum hierarchy |
| `prerequisite_of` | Prerequisite → dependent | Knowledge dependency |
| `builds_on` | Foundation → advanced | Conceptual building |
| `objective_targets_concept` | Learning objective → concept | Objective mapping |
| `objective_develops_skill` | Learning objective → skill | Skill development |
| `related_to` | Concept → concept | Cross-concept relationship |

## 9. Graph Invariants

- Exactly one `curriculum_root` per version
- No orphan nodes (every non-root node has a `contains` parent)
- No multiple parents for hierarchy
- Contains hierarchy is acyclic
- Prerequisite graph is acyclic
- No self-referencing edges
- No cross-school references
- No cross-version references
- `objective_targets_concept` must go from `learning_objective` to `concept`
- `objective_develops_skill` must go from `learning_objective` to `skill`
- Every learning objective targets at least one concept or skill
- Node codes are unique within node type per version

## 10. Cycle Detection

Cycle detection uses DFS with three-color marking (WHITE/GRAY/BLACK).
Separate detection is performed for `contains` edges (hierarchy cycles)
and `prerequisite_of` edges (prerequisite cycles).

## 11. Role Policy

| Role | Allowed Actions |
|------|----------------|
| `student` | `read_active_student_safe` |
| `teacher` | Create/successor/edit/remove/submit/validate/read/impact |
| `school_admin` | All teacher + approve/activate/supersede/archive/return |
| `internal_operator` | All school_admin + seed |
| `parent` | None |
| `unknown` | None |

## 12. School Isolation

All graph entities are keyed by `schoolId`. The repository enforces
school-scoped lookups. Cross-school references are rejected at validation.

## 13. Command Inventory

| Command | Description |
|---------|-------------|
| `CreateCurriculumGraphVersion` | Create a new draft version |
| `CreateSuccessorCurriculumGraphVersion` | Clone a version as a successor draft |
| `AddCurriculumNode` | Add a node to a draft version |
| `UpdateCurriculumNode` | Update a node in a draft version |
| `RemoveCurriculumNode` | Remove a node (must have no relationships) |
| `AddCurriculumEdge` | Add an edge to a draft version |
| `RemoveCurriculumEdge` | Remove an edge from a draft version |
| `SubmitCurriculumGraphForReview` | Submit draft for review |
| `ReturnCurriculumGraphToDraft` | Return under_review to draft |
| `ApproveCurriculumGraphVersion` | Approve an under_review version |
| `ActivateCurriculumGraphVersion` | Activate an approved version |
| `SupersedeCurriculumGraphVersion` | Supersede active with a new version |
| `ArchiveCurriculumGraphVersion` | Archive a superseded or approved version |
| `ValidateCurriculumGraphVersion` | Run validation on a version |

All commands support idempotency through `idempotencyKey`.

## 14. Query Inventory

| Query | Description |
|-------|-------------|
| `getVersion` | Get version by ID |
| `listVersions` | List versions for a school |
| `getActiveVersion` | Get active version for curriculum key |
| `getNode` | Get node by ID |
| `getChildren` | Get direct children in hierarchy |
| `getAncestors` | Get ancestor chain |
| `getDescendants` | Get recursive descendants |
| `getDirectPrerequisites` | Get direct prerequisite nodes |
| `getTransitivePrerequisites` | Get recursive prerequisites |
| `getDirectDependents` | Get direct dependent nodes |
| `getTransitiveDependents` | Get recursive dependents |
| `getObjectiveMap` | Full objective map with concepts/skills |
| `getConceptMap` | Full concept map with relationships |
| `resolveStructuralLearningPath` | Topological learning path |
| `analyzeChangeImpact` | Impact analysis for changes |
| `getStudentSafeGraph` | Student-safe projection |
| `getStaffSafeGraph` | Staff-safe projection |

## 15. In-Memory Repository Behavior

- `InMemoryCurriculumKnowledgeGraphRepository` stores all state in `Map` objects
- All getters return deep-cloned entities (via `JSON.parse(JSON.stringify(...))`)
- Snapshots are used for atomic mutation rollback
- `runAtomicMutation` takes a function, snapshots before, restores on throw
- No file I/O, no database, no external state

## 16. Explicit Dependency Injection

All services receive their dependencies through constructor injection:

```
CommandService(repo, rolePolicy, lifecycle, validator, traversal, clock, idGen)
QueryService(repo, rolePolicy, traversal)
SeedService(commandService, repository, clock, idGen)
RouterFactory(deps: { commandService, queryService, contextResolver })
```

No service reaches into another service's private fields.

## 17. Router Fail-Closed Behavior

`createCurriculumGraphRouter` validates all dependencies before creating routes:

- Missing dependency object → throws `CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED`
- Missing `commandService` → throws
- Missing `queryService` → throws
- Missing `contextResolver` → throws
- Null dependencies → throws
- No default fallback for any dependency

## 18. Atomic Mutation Behavior

`CommandService.execute` wraps mutation in `repo.runAtomicMutation`:
- Before mutation: snapshot taken
- On mutation success: snapshot discarded
- On mutation failure or throw: snapshot restored
- Idempotency results are cached before snapshot, ensuring replay safety

## 19. Idempotency

Commands are idempotent through `idempotencyKey` lookup:
1. On first execution: command runs, result cached by `schoolId + commandType + idempotencyKey`
2. On identical replay: cached result returned without mutation
3. Request hash is stored alongside the command result for verification
4. Seed commands use deterministic keys for guaranteed idempotency

## 20. Optimistic Revision Control

- Each version has a `revision` counter incremented on every mutation
- Commands carry `expectedRevision` — if it doesn't match, a `STALE_REVISION` error is returned
- Nodes have their own `revision` counter for `UpdateCurriculumNode`
- Stale commands are retryable

## 21. Structural Learning Path

`resolveStructuralLearningPath` computes a topological ordering of prerequisites
for a target node. Uses Kahn's algorithm for topological sort. Returns:
- `ready`: no prerequisites required
- `prerequisites_required`: prerequisites found and ordered
- `blocked`: cycle detected or target not found

## 22. Objective Map

`getObjectiveMap` returns a comprehensive view of a learning objective:
- Hierarchy location (ancestor chain + objective)
- Targeted concept nodes
- Developed skill nodes
- Direct and transitive prerequisites
- Dependent objectives
- Success criteria, cognitive demand, demonstration types

## 23. Concept Map

`getConceptMap` returns a comprehensive view of a concept:
- Hierarchy location
- Prerequisite and dependent concepts
- Targeting learning objectives
- Related concepts (via `related_to` edges)
- Builds-on relationships

## 24. Change-Impact Analysis

`analyzeChangeImpact` evaluates the effect of updating, removing, replacing, or
deprecating a node or edge. Reports:
- Direct children and descendants
- Prerequisites and dependents
- Affected objectives, concepts, skills
- Hierarchy paths
- Blocked operation reasons (children/dependents blocking removal)

## 25. Safe Projections

- `buildStudentSafeGraph`: Returns only student-visible nodes, strips domain metadata
- `buildStaffSafeGraph`: Returns full version data for authorized staff

## 26. Seed Design

`CurriculumGraphSeedService` creates a deterministic seed graph:
- School A: Full curriculum with subjects, grade levels, strands, units, topics,
  subtopics, concepts, skills, learning objectives, and all relationship types
- School B: Simplified curriculum with fewer nodes and edges
- Creates two versions: active (v1) and draft successor (v2) for School A
- All commands use deterministic IDs derived from school + curriculum + prefix

## 27. Seed Replay and Idempotency Behavior

Identical seed replay guarantees:
1. No new versions created
2. No new nodes created
3. No new edges created
4. Active version ID unchanged
5. Draft successor ID unchanged
6. Version revisions unchanged
7. Deep graph snapshots identical
8. School A replay does not affect School B
9. School B replay does not affect School A
10. Seed result reports `replayed: true, idempotent: true`

## 28. Deterministic Clock and ID Behavior

- `FixedClock` provides deterministic timestamps for tests
- `DeterministicIdGenerator` provides predictable IDs (prefix + counter)
- Seed commands derive IDs from seed parameters, not from the ID generator
- Tests use fixed clock and deterministic ID generator

## 29. Twenty Focused Test Files

1. `curriculum-knowledge-graph-contracts.test.ts`
2. `curriculum-knowledge-graph-version-lifecycle.test.ts`
3. `curriculum-knowledge-graph-node-validation.test.ts`
4. `curriculum-knowledge-graph-edge-validation.test.ts`
5. `curriculum-knowledge-graph-hierarchy-cycle.test.ts`
6. `curriculum-knowledge-graph-prerequisite-cycle.test.ts`
7. `curriculum-knowledge-graph-traversal.test.ts`
8. `curriculum-knowledge-graph-learning-path.test.ts`
9. `curriculum-knowledge-graph-objective-map.test.ts`
10. `curriculum-knowledge-graph-concept-map.test.ts`
11. `curriculum-knowledge-graph-version-cloning.test.ts`
12. `curriculum-knowledge-graph-authorization.test.ts`
13. `curriculum-knowledge-graph-school-isolation.test.ts`
14. `curriculum-knowledge-graph-idempotency-concurrency.test.ts`
15. `curriculum-knowledge-graph-projection-safety.test.ts`
16. `curriculum-knowledge-graph-change-impact.test.ts`
17. `curriculum-knowledge-graph-seeds.test.ts`
18. `curriculum-knowledge-graph-routes.test.ts`
19. `curriculum-knowledge-graph-atomicity.test.ts`
20. `curriculum-knowledge-graph-no-false-pass.test.ts`

## 30. Exact Focused Test Result

```
Test Files  20 passed (20)
     Tests  146 passed (146)
```

## 31. Direct Regression Inventory and Result

DIRECT REGRESSIONS: NONE DISCOVERED

No test file outside `src/tests/curriculum-knowledge-graph/` imports
curriculum domain modules.

## 32. Task-Scoped TypeScript Command and Result

```
npx tsc -p tsconfig.curriculum-knowledge-graph.json --noEmit --incremental false
```

Result: exit code 0, zero errors.

## 33. Static Scan Results

| Scan | Result |
|------|--------|
| Hidden tests (.skip, .todo, .only) | Clean |
| Trivial assertions (expect(true).toBe(true)) | Only in no-false-pass detector |
| Type suppressions (@ts-ignore, etc.) | Clean |
| Broad typing (as any in domain) | Only at Express boundary and internal helpers |
| Unfinished work (TODO, FIXME) | Clean |
| Accidental integration | Clean |
| Persistence violations | Clean |
| Nondeterminism (Math.random) | Only in route handlers, acceptable |
| Silent dependency fallback | Clean (all deps required) |
| Private dependency access | Clean |

## 34. Artifact Containment Result

No runtime artifacts found in task directories. No SQLite databases, WAL files,
SHM files, logs, or generated output files.

## 35. Explicit Statement: No Prisma or Database Work

This package is fully in-memory. No Prisma, PostgreSQL, database durability,
or migration work was performed. No `PrismaClient` is imported.

## 36. Explicit Statement: No Integration Performed

No route mounting in `backend/src/index.ts`. No Learning Evidence, Question Bank,
Objective Mastery, Daily Objective Check, Study Plan, Revision Queue, Growth Page,
Teacher Overview, frontend, or AI integration was performed.

## 37. Exact Commit Message

```
feat(backend): add curriculum knowledge graph foundation
```

## 38. Exact Final Sentinel

```
STEADFAST_CURRICULUM_KNOWLEDGE_GRAPH_FOUNDATION_ACCEPTED_READY
```
