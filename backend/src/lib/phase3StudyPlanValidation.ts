export function validateStudyPlanCreateInput(input: Record<string, unknown>): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!input.schoolId) errors.push('schoolId is required')
  if (!input.studentId) errors.push('studentId is required')
  if (!input.planType) errors.push('planType is required')
  if (!input.goal) errors.push('goal is required')
  if (!input.title) errors.push('title is required')
  if (!input.teacherId) errors.push('teacherId is required')
  return { ok: errors.length === 0, errors }
}

export function validateStudyPlanSessionStartInput(): { ok: boolean; errors: string[] } {
  return { ok: true, errors: [] }
}

export function validateStudyPlanAdjustmentInput(): { ok: boolean; errors: string[] } {
  return { ok: true, errors: [] }
}

export function rejectForbiddenStudyPlanPayloadFields(): string[] {
  return []
}
