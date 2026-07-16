# Question Bank Capability Completeness Matrix

| Capability | Status | A | B | C | D | E | F | G | H | I | J | K | L | Key Gap |
|-----------|--------|---|---|---|---|---|---|---|---|---|---|---|---|---------|
| Enforcement foundation | COMPLETE | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | Concurrency stub |
| Question truth lifecycle | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | Curriculum validity stub |
| Ingestion and intake | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | No bulk import |
| Parsing and extraction | DEFERRED_FILE_PROC | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No OCR/PDF parser |
| Curriculum classification | PARTIAL | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | No real curriculum DB |
| Duplicate governance | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Blueprinting | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Exam paper assembly | PLACEHOLDER | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | Never persists |
| Delivery and attempt | PARTIAL | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | No WebSocket |
| Marking and challenge | PARTIAL | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | All services in-memory |
| Marking invocation | PARTIAL | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | All services in-memory |
| Result finalization | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Mastery bridge | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Result release | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Result delivery | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | Mock dispatch |
| Report card assembly | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Report card export | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | Mock export |
| Report card access | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | No portal |
| Follow-up intelligence | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Recovery planning | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Recovery progress | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Recovery outcome | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Recovery action | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Recovery simulation | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Recovery closure | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Auth preview | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Readiness board | STRUCTURAL_ONLY | 2 | 2 | 2 | 2 | 1 | 0 | 0 | 2 | 1 | 0 | 2 | 1 | No HTTP wiring |
| Recovery triage | COMPLETE | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Adjudication | STRUCTURAL_ONLY | 2 | 2 | 2 | 2 | 1 | 0 | 0 | 2 | 1 | 0 | 2 | 1 | No HTTP wiring |
| Question quality analytics | MISSING | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Not built |
| Psychometric foundation | MISSING | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Not built |
| Adaptive evolution | MISSING | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Not built |
| Question generation | DEFERRED_AI | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | AI not connected |
| Teacher recommendations | MISSING | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Not built |
| Cross-domain providers | DEFERRED_INTEGRATION | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | Not connected |
| E2E scenarios | PARTIAL | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | No full E2E with Prisma |

**Status Counts:** COMPLETE=17, PARTIAL=3, STRUCTURAL_ONLY=2, PLACEHOLDER=1, MISSING=3, DEFERRED_AI=1, DEFERRED_INTEGRATION=1, DEFERRED_FILE_PROCESSING=1
