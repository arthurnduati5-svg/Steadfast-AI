import { getActiveSessionState, getSessionStateForLearner } from './studentLearningSessionStateRepository';
import { updateSessionState } from './studentLearningSessionStateRepository';
import type { LearningSessionStateRecord, SessionResumeDecision } from './studentLearningSessionContracts';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function resumeLearnerSession(
  schoolId: string,
  tutorLearnerId: string,
  studentId?: string,
  sessionId?: string,
): Promise<SessionResumeDecision> {
  let session: LearningSessionStateRecord | null = null;

  if (sessionId) {
    session = await getSessionStateForLearner(schoolId, tutorLearnerId, sessionId);
  }

  if (!session) {
    session = await getActiveSessionState(schoolId, tutorLearnerId);
  }

  if (!session) {
    return {
      canResume: false,
      degradeToHydration: true,
    };
  }

  if (session.status === 'completed' || session.status === 'expired') {
    const now = Date.now();
    const updatedAt = session.updatedAt instanceof Date ? session.updatedAt.getTime() : new Date(session.updatedAt).getTime();
    const ageMs = now - updatedAt;

    if (ageMs > SESSION_EXPIRY_MS || session.status === 'expired') {
      return {
        canResume: false,
        carryOverSummary: session.safeProgressSummary || undefined,
        degradeToHydration: true,
      };
    }

    return {
      canResume: false,
      carryOverSummary: session.safeProgressSummary || undefined,
      degradeToHydration: true,
    };
  }

  if (session.status === 'safeguarding_paused') {
    return {
      canResume: false,
      sessionState: session,
      degradeToHydration: true,
    };
  }

  // Check if session is too old
  const now = Date.now();
  const lastActive = session.updatedAt instanceof Date ? session.updatedAt.getTime() : new Date(session.updatedAt).getTime();
  const ageMs = now - lastActive;

  if (ageMs > SESSION_EXPIRY_MS) {
    return {
      canResume: false,
      carryOverSummary: session.safeProgressSummary || undefined,
      degradeToHydration: true,
    };
  }

  // Resume paused session
  if (session.status === 'paused') {
    const resumed = await updateSessionState(session.id, {
      status: 'active',
      currentMode: 'context_hydration',
      previousMode: session.currentMode,
      reasonCodes: ['session_resumed', ...session.reasonCodes.filter(r => r !== 'session_resumed')],
    });

    return {
      canResume: true,
      sessionState: resumed,
      degradeToHydration: true,
    };
  }

  // Session is active
  return {
    canResume: true,
    sessionState: session,
    degradeToHydration: session.currentMode === 'session_paused' || session.currentMode === 'idle',
  };
}
