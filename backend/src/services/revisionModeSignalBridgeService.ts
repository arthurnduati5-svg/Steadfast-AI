export function writeRevisionModeSignal(
  signalType: string,
  payload: Record<string, unknown>,
): { ok: boolean; signalType: string } {
  return { ok: true, signalType };
}

export async function writeRevisionSessionStarted(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function writeRevisionSessionExited(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function writeRevisionStageChanged(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
  stage: string,
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function writeRevisionHintGiven(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
  hintLevel: string,
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function writeRevisionSupportActionSelected(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
  action: string,
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function writeRevisionReflectionDetected(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function writeRevisionModeSummaryCreated(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
): Promise<{ ok: boolean }> {
  return writeRevisionModeSignal('mode_summary_created', { schoolId, studentId, modeSessionId });
}
