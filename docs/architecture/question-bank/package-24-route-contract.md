# Package 24 Route Contract

## Base Path
/api/question-bank/recovery-execution-readiness-board

## Auth Middleware
- schoolAuthMiddleware
- requireVerifiedSchoolContext

## Required Header
- x-idempotency-key (for all POST/PUT operations)

## Route Groups

### /board-snapshots
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create board snapshot |
| GET | / | List snapshots by school |
| GET | /by-student/:studentRef | List by student |
| GET | /by-plan/:planId | List by plan |
| GET | /by-status/:status | List by status |
| GET | /:id | Get by id |
| POST | /:id/ready | Mark ready |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/stale | Mark stale |
| POST | /:id/suppress | Suppress |
| POST | /:id/block | Block |
| POST | /:id/void | Void |
| POST | /:id/refresh | Refresh |

### /board-lanes
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create lane |
| GET | / | List by snapshot |
| GET | /by-key/:laneKey | List by lane key |
| GET | /by-status/:status | List by status |
| GET | /:id | Get by id |
| POST | /:id/ready | Mark ready |
| POST | /:id/stale | Mark stale |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /board-cards
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create card |
| GET | / | List by snapshot |
| GET | /by-student/:studentRef | List by student |
| GET | /by-plan/:planId | List by plan |
| GET | /by-key/:laneKey | List by lane key |
| GET | /by-status/:status | List by status |
| GET | /by-priority/:priority | List by priority |
| GET | /:id | Get by id |
| POST | /:id/ready | Mark ready |
| POST | /:id/needs-teacher-review | Mark needs teacher review |
| POST | /:id/needs-admin-review | Mark needs admin review |
| POST | /:id/risk-flagged | Mark risk flagged |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /filter-presets
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create filter preset |
| GET | / | List by school |
| GET | /by-actor/:actorId | List by actor |
| GET | /by-role/:role | List by role |
| GET | /:id | Get by id |
| PUT | /:id | Update |
| POST | /:id/suppress | Suppress |
| POST | /:id/void | Void |

### /risk-signals
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create risk signal |
| GET | / | List by snapshot |
| GET | /by-student/:studentRef | List by student |
| GET | /by-plan/:planId | List by plan |
| GET | /by-level/:riskLevel | List by risk level |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/suppress | Suppress |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /board-blockers
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create blocker |
| GET | / | List by snapshot |
| GET | /by-student/:studentRef | List by student |
| GET | /by-plan/:planId | List by plan |
| GET | /by-status/:status | List by status |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/resolve | Resolve |
| POST | /:id/suppress | Suppress |
| POST | /:id/void | Void |

### /governance-notes
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create governance note |
| GET | / | List by snapshot |
| GET | /by-plan/:planId | List by plan |
| GET | /by-actor/:actorId | List by actor |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/suppress | Suppress |
| POST | /:id/void | Void |

### /role-projections
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create role projection |
| GET | / | List by snapshot |
| GET | /by-role/:role | List by role |
| GET | /by-actor/:actorId | List by actor |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/suppress | Suppress |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /teacher-queues
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create teacher queue |
| GET | / | List by school |
| GET | /by-teacher/:teacherRef | List by teacher |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/refresh | Refresh |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /admin-queues
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create admin queue |
| GET | / | List by school |
| GET | /by-admin/:adminRef | List by admin |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/refresh | Refresh |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /student-safe-status-drafts
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create student safe draft |
| GET | /by-plan/:planId | List by plan |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/suppress | Suppress |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /parent-safe-status-drafts
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create parent safe draft |
| GET | /by-plan/:planId | List by plan |
| GET | /:id | Get by id |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/suppress | Suppress |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

### /refresh-jobs
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create refresh job |
| GET | / | List by school |
| GET | /by-snapshot/:snapshotId | List by snapshot |
| GET | /by-status/:status | List by status |
| GET | /:id | Get by id |
| POST | /:id/running | Mark running |
| POST | /:id/completed | Mark completed |
| POST | /:id/failed | Mark failed |
| POST | /:id/void | Void |

### /board-summaries
| Method | Path | Description |
|--------|------|-------------|
| POST | / | Create board summary |
| GET | / | List by school |
| GET | /by-student/:studentRef | List by student |
| GET | /by-plan/:planId | List by plan |
| GET | /:id | Get by id |
| POST | /:id/refresh | Refresh |
| POST | /:id/stale | Mark stale |
| POST | /:id/review-ready | Mark review ready |
| POST | /:id/block | Block |
| POST | /:id/void | Void |

## Forbidden Behavior
- No AI calls
- No notification sending
- No score/mutation
- No portal publishing
- No live execution
- No live authorization
- No live closure
- No external sync
- No PDF/HTML generation

## Safe Envelope Format
```json
{
  "success": true,
  "status": "created",
  "data": { ... },
  "correlationId": "uuid"
}
```
