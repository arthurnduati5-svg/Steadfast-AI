export function validateTask023DeploymentReadinessContext(ctx: Record<string, unknown>): boolean {
  return !!(ctx.actorId && ctx.actorRole)
}

export function validateTask023EnvironmentType(env: string): boolean {
  return env !== ''
}

export function validateTask023EnvironmentGateResult(r: Record<string, unknown> | null): boolean {
  if (!r) return false
  return 'passed' in r && 'requirements' in r
}

export function validateTask023ReleaseSmokeResult(r: Record<string, unknown>): boolean {
  if (!r) return false
  return 'passed' in r && 'testsRun' in r
}

export function validateTask023RollbackReadinessResult(r: Record<string, unknown>): boolean {
  if (!r) return false
  return 'passed' in r && 'planExists' in r
}
