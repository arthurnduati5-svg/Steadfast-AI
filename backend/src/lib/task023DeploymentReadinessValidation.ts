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

export function isAdminInternalRole(role: string): boolean {
  return role === 'admin' || role === 'internal'
}

export function isLearnerParentPeerRole(role: string): boolean {
  return role === 'learner' || role === 'parent' || role === 'peer'
}

const FORBIDDEN_REPORT_FIELDS = ['rawAnswer', 'rawChat', 'answerKey', 'providerPrompt']

export function rejectForbiddenTask023ReportFields(report: Record<string, unknown>): string[] {
  return FORBIDDEN_REPORT_FIELDS.filter((field) => field in report)
}
