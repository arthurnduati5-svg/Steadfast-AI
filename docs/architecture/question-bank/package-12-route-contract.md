# Package 12: Route Contract

## Base Path

```
/api/question-bank/result-delivery
```

## Middleware

- `schoolAuthMiddleware`
- `requireVerifiedSchoolContext`

## Route Table

### Jobs

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /jobs | Create delivery job from Package 11 intent | Yes |
| GET | /jobs/:resultDeliveryJobId | Get delivery job by ID | No |
| GET | /jobs | List jobs for school or student | No |
| POST | /jobs/:resultDeliveryJobId/validate | Validate a draft job | Yes |
| POST | /jobs/:resultDeliveryJobId/queue-mock | Queue job for mock dispatch | Yes |
| POST | /jobs/:resultDeliveryJobId/block | Block a job | Yes |
| POST | /jobs/:resultDeliveryJobId/cancel | Cancel a job | Yes |
| POST | /jobs/:resultDeliveryJobId/void | Void a job | Yes |

### Recipients

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /jobs/:resultDeliveryJobId/recipients | Resolve recipient for job | Yes |
| GET | /recipients/:resultDeliveryRecipientId | Get recipient by ID | No |
| GET | /jobs/:resultDeliveryJobId/recipients | List recipients for job | No |
| POST | /recipients/:resultDeliveryRecipientId/verify | Verify recipient boundary | Yes |
| POST | /recipients/:resultDeliveryRecipientId/block | Block recipient | Yes |
| POST | /recipients/:resultDeliveryRecipientId/void | Void recipient | Yes |

### Envelopes

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /jobs/:resultDeliveryJobId/envelopes | Create channel envelope | Yes |
| GET | /envelopes/:resultDeliveryChannelEnvelopeId | Get envelope by ID | No |
| GET | /jobs/:resultDeliveryJobId/envelopes | List envelopes for job | No |
| POST | /envelopes/:resultDeliveryChannelEnvelopeId/seal | Seal envelope after safety checks | Yes |
| POST | /envelopes/:resultDeliveryChannelEnvelopeId/block | Block envelope | Yes |
| POST | /envelopes/:resultDeliveryChannelEnvelopeId/void | Void envelope | Yes |

### Suppressions

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /jobs/:resultDeliveryJobId/suppressions | Create suppression | Yes |
| GET | /suppressions/:resultDeliverySuppressionId | Get suppression by ID | No |
| GET | /jobs/:resultDeliveryJobId/suppressions | List suppressions for job | No |
| POST | /suppressions/:resultDeliverySuppressionId/clear | Clear suppression | Yes |
| POST | /suppressions/:resultDeliverySuppressionId/void | Void suppression | Yes |

### Mock Attempts

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /jobs/:resultDeliveryJobId/mock-attempts | Create mock attempt | Yes |
| GET | /mock-attempts/:resultDeliveryAttemptId | Get attempt by ID | No |
| GET | /jobs/:resultDeliveryJobId/mock-attempts | List attempts for job | No |
| POST | /mock-attempts/:resultDeliveryAttemptId/dispatch | Dispatch mock attempt | Yes |
| POST | /mock-attempts/:resultDeliveryAttemptId/complete | Complete mock attempt | Yes |
| POST | /mock-attempts/:resultDeliveryAttemptId/fail | Fail mock attempt | Yes |
| POST | /mock-attempts/:resultDeliveryAttemptId/cancel | Cancel mock attempt | Yes |
| POST | /mock-attempts/:resultDeliveryAttemptId/void | Void mock attempt | Yes |

### Receipts

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /mock-attempts/:resultDeliveryAttemptId/receipts | Record dry-run receipt | Yes |
| GET | /receipts/:resultDeliveryReceiptId | Get receipt by ID | No |
| GET | /jobs/:resultDeliveryJobId/receipts | List receipts for job | No |
| POST | /receipts/:resultDeliveryReceiptId/void | Void receipt | Yes |

### Retry Plans

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| POST | /mock-attempts/:resultDeliveryAttemptId/retry-plans | Create retry plan for failed attempt | Yes |
| GET | /retry-plans/:resultDeliveryRetryPlanId | Get retry plan by ID | No |
| GET | /jobs/:resultDeliveryJobId/retry-plans | List retry plans for job | No |
| POST | /retry-plans/:resultDeliveryRetryPlanId/cancel | Cancel retry plan | Yes |
| POST | /retry-plans/:resultDeliveryRetryPlanId/void | Void retry plan | Yes |

### Projection Safety

| Method | Path | Purpose | Idempotent |
|--------|------|---------|------------|
| GET | /jobs/:resultDeliveryJobId/projection/teacher | Teacher-safe delivery projection | No |
| GET | /jobs/:resultDeliveryJobId/projection/admin | Admin delivery projection | No |
| GET | /jobs/:resultDeliveryJobId/projection/student-safe | Student-safe delivery preview | No |
| GET | /jobs/:resultDeliveryJobId/projection/parent-boundary | Parent-boundary delivery preview | No |

## Safe Response Envelope

```typescript
{
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: { ... };
  nextAllowedActions?: string[];
  data?: unknown;
}
```

## Forbidden Leakage Rules

Envelopes must not include: answer keys, raw rubrics, raw student answers, teacher-only notes, hidden reasoning, unreleased grades, provider secrets, portal payloads, notification payloads, PDF binaries, or raw mastery deltas.

## Live-Send Block

Any request attempting a `*_live` channel returns:
```
{
  ok: false,
  reasonCode: 'LIVE_DELIVERY_BLOCKED',
  safeMessage: 'Live delivery is blocked in Package 12'
}
```

## Deferred Behavior

- Real notification sending
- Real portal publication
- Real PDF export
- External school system sync
- Background job scheduling for retries
- Frontend integration
