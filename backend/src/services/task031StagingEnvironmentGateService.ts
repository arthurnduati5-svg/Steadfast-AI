import type { Task031StagingEnvironmentGateResult } from '../contracts/task031StagingSmokeContracts';

export async function checkTask031StagingEnvironmentGate(): Promise<Task031StagingEnvironmentGateResult> {
  const blockingIssues: string[] = [];

  const stagingSmoke = process.env.TASK031_STAGING_SMOKE === '1';
  const noLiveStudents = process.env.TASK031_NO_LIVE_STUDENTS === '1';
  const syntheticIdentity = process.env.TASK031_SYNTHETIC_SCHOOL_IDENTITY === '1';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const liveRolloutEnabled = process.env.LIVE_ROLLOUT_ENABLED === 'true';
  const allowLiveStudents = process.env.TASK031_ALLOW_LIVE_STUDENTS === 'true';
  const rawDatabaseUrl = process.env.DATABASE_URL || '';
  const rawRedisUrl = process.env.REDIS_URL || '';

  let nodeEnvClassification: string;
  if (nodeEnv === 'test') nodeEnvClassification = 'test';
  else if (nodeEnv === 'development') nodeEnvClassification = 'development';
  else if (nodeEnv === 'staging') nodeEnvClassification = 'staging';
  else if (nodeEnv === 'production') nodeEnvClassification = 'production';
  else nodeEnvClassification = 'unknown';

  if (nodeEnv === 'production') blockingIssues.push('node_env_is_production');
  if (liveRolloutEnabled) blockingIssues.push('live_rollout_enabled');
  if (allowLiveStudents) blockingIssues.push('task031_allow_live_students_enabled');
  if (!stagingSmoke) blockingIssues.push('task031_staging_smoke_not_enabled');
  if (!noLiveStudents) blockingIssues.push('task031_no_live_students_not_enabled');
  if (!syntheticIdentity) blockingIssues.push('task031_synthetic_school_identity_not_enabled');

  let databaseUrlClassification: string;
  if (!rawDatabaseUrl) {
    databaseUrlClassification = 'not_set';
  } else if (
    rawDatabaseUrl.includes('localhost') || rawDatabaseUrl.includes('127.0.0.1') ||
    rawDatabaseUrl.includes('test') || rawDatabaseUrl.includes('sqlite')
  ) {
    databaseUrlClassification = 'test_or_local';
  } else if (rawDatabaseUrl.includes('staging') || rawDatabaseUrl.includes('stage') || rawDatabaseUrl.includes('dev')) {
    databaseUrlClassification = 'staging';
  } else if (rawDatabaseUrl.includes('production') || rawDatabaseUrl.includes('prod')) {
    databaseUrlClassification = 'production_like';
    blockingIssues.push('production_like_database_url');
  } else {
    databaseUrlClassification = 'unknown';
  }

  let redisUrlClassification: string;
  if (!rawRedisUrl) {
    redisUrlClassification = 'not_set';
  } else if (
    rawRedisUrl.includes('localhost') || rawRedisUrl.includes('127.0.0.1') || rawRedisUrl.includes('test')
  ) {
    redisUrlClassification = 'test_or_local';
  } else if (rawRedisUrl.includes('staging') || rawRedisUrl.includes('stage') || rawRedisUrl.includes('dev')) {
    redisUrlClassification = 'staging';
  } else if (rawRedisUrl.includes('production') || rawRedisUrl.includes('prod')) {
    redisUrlClassification = 'production_like';
    blockingIssues.push('production_like_redis_url');
  } else {
    redisUrlClassification = 'unknown';
  }

  const productionLikeBlocked =
    nodeEnv === 'production' || liveRolloutEnabled || allowLiveStudents ||
    databaseUrlClassification === 'production_like' || redisUrlClassification === 'production_like';
  const ok = blockingIssues.length === 0;

  return {
    ok, stagingSmokeEnabled: stagingSmoke, noLiveStudentsEnabled: noLiveStudents,
    syntheticSchoolIdentityEnabled: syntheticIdentity,
    nodeEnvClassification, databaseUrlClassification, redisUrlClassification,
    rawDatabaseUrlExposed: false, rawRedisUrlExposed: false,
    productionLikeBlocked, blockingIssues,
  };
}
