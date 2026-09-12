-- R8-G.2 micro-repair: enforce school-scoped idempotency ownership at the
-- database level. Adds UNIQUE(schoolId, idempotencyKey) so one school-scoped
-- idempotency key maps to exactly one mutation ownership claim, even when
-- concurrent callers use different operations. The historical triple unique
-- constraint on (schoolId, operation, idempotencyKey) is intentionally kept.
CREATE UNIQUE INDEX "r8g2_roa_idem_school_key_uq"
ON "RecoveryOutcomeActionIdempotencyRecord" ("schoolId", "idempotencyKey");
