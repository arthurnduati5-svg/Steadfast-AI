# Task 040 Boundaries (Out of Scope)

## Absolute Prohibitions
The following are strictly out of scope for Task 040. Any code containing these patterns will be flagged during safety scans:

| Code | Category | Example |
|------|----------|---------|
| `rawLearnerData` | Privacy | Raw chat, raw answer |
| `rawSafeguardingNote` | Privacy | Unfiltered safeguarding |
| `privateDeenText` | Privacy | Private religious content |
| `hiddenReasoning` | Privacy | Model reasoning leak |
| `providerPayload` | Privacy | LLM provider payloads |
| `parentContact` | Privacy | Parent phone/email |
| `answerKey` | Privacy | Answer keys, marking schemes |

## Operation Prohibitions
| Activity | Reason |
|----------|--------|
| Prisma migrations | Would modify schema |
| Production mutations | Would touch real data |
| Live AI calls | Would incur cost/data risk |
| Live connector writes | Would modify external systems |
| Real notifications | Would contact real users |
| Frontend UI changes | Out of task scope |
| AI runtime changes | Out of task scope |
| Production deployments | Would affect live system |

## Boundary Enforcement
- `SafetyScanService` scans all source files for forbidden patterns
- `task040-privacy-scan.cjs` runs independently as a second check
- Test files contain explicit "should not" assertions
- No Prisma client calls in any freeze service
