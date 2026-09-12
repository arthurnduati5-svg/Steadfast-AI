// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Analytics Repository v1
// Stores and retrieves normalized video learning analytics events.
// Reuses existing TutorState for storage. All reads are scoped.
// Never returns raw transcripts, raw chat logs, or private memory.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningAnalyticsEvent,
  StudentAnalyticsScope,
} from './videoLearningAnalyticsContracts';
import { getTutorStateForLearner, upsertTutorStateForLearner } from './tutorStateService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Constants ──

const MAX_STORED_EVENTS = 200;
const MAX_RETURN_EVENTS = 100;
const EVENT_TTL_DAYS = 90;

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function isWithinTimeWindow(
  eventTime: string,
  from?: string | null,
  to?: string | null,
): boolean {
  if (!from && !to) return true;
  const time = new Date(eventTime).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}

// ── Internal store key ──

interface AnalyticsStore {
  events: VideoLearningAnalyticsEvent[];
  updatedAt: string;
}

function getEmptyStore(): AnalyticsStore {
  return { events: [], updatedAt: nowISO() };
}

// ── Public API ──

/**
 * Record a normalized video learning analytics event.
 * Stores in-memory for v1. Bounded to MAX_STORED_EVENTS.
 */
export async function recordVideoLearningAnalyticsEvent(
  identity: ResolvedTutorIdentity,
  event: VideoLearningAnalyticsEvent,
): Promise<VideoLearningAnalyticsEvent> {
  const tutorState = await getTutorStateForLearner(identity);
  const store: AnalyticsStore = (tutorState as any).videoAnalyticsEvents || getEmptyStore();

  // Add event
  store.events.push(event);

  // Prune to max size
  if (store.events.length > MAX_STORED_EVENTS) {
    store.events = store.events.slice(store.events.length - MAX_STORED_EVENTS);
  }

  store.updatedAt = nowISO();

  // Persist
  const updated = {
    ...tutorState,
    videoAnalyticsEvents: store,
  } as any;
  updated.updatedAt = nowISO();
  updated.stateVersion = (tutorState.stateVersion || 0) + 1;
  await upsertTutorStateForLearner(identity, updated);

  return event;
}

/**
 * List video learning analytics events for a student scope.
 * Requires studentId and schoolId. Returns bounded results.
 */
export async function listStudentVideoLearningEvents(
  scope: StudentAnalyticsScope,
  identity: ResolvedTutorIdentity,
): Promise<VideoLearningAnalyticsEvent[]> {
  if (!scope.studentId || !scope.schoolId) {
    return [];
  }

  const tutorState = await getTutorStateForLearner(identity);
  const store: AnalyticsStore = (tutorState as any).videoAnalyticsEvents || getEmptyStore();

  let events = store.events;

  // Filter by scope
  if (scope.subject) {
    events = events.filter((e) => e.subject === scope.subject);
  }
  if (scope.topic) {
    events = events.filter((e) => e.topic === scope.topic);
  }
  if (scope.skillId) {
    events = events.filter((e) => e.skillId === scope.skillId);
  }
  if (scope.from || scope.to) {
    events = events.filter((e) => isWithinTimeWindow(e.eventTime, scope.from, scope.to));
  }

  // Sort by eventTime descending
  events.sort((a, b) => b.eventTime.localeCompare(a.eventTime));

  // Bound results
  return events.slice(0, MAX_RETURN_EVENTS);
}

/**
 * List all analytics events for a class/teacher scope.
 * Requires schoolId. Returns bounded results per student.
 */
export async function listClassVideoLearningEvents(
  scope: { schoolId: string; studentIds?: string[]; subject?: string | null; topic?: string | null; from?: string | null; to?: string | null },
  identities: ResolvedTutorIdentity[],
): Promise<VideoLearningAnalyticsEvent[]> {
  if (!scope.schoolId) return [];

  if (!identities || identities.length === 0) return [];

  const allEvents: VideoLearningAnalyticsEvent[] = [];

  for (const identity of identities) {
    if (scope.studentIds && !scope.studentIds.includes(identity.studentId)) continue;

    const tutorState = await getTutorStateForLearner(identity);
    const store: AnalyticsStore = (tutorState as any).videoAnalyticsEvents || getEmptyStore();
    let events = store.events;

    if (scope.subject) events = events.filter((e) => e.subject === scope.subject);
    if (scope.topic) events = events.filter((e) => e.topic === scope.topic);
    if (scope.from || scope.to) events = events.filter((e) => isWithinTimeWindow(e.eventTime, scope.from, scope.to));

    allEvents.push(...events);
  }

  allEvents.sort((a, b) => b.eventTime.localeCompare(a.eventTime));
  return allEvents.slice(0, MAX_RETURN_EVENTS * 5);
}
