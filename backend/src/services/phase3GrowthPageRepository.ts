import type {
  Phase3GrowthPage,
  Phase3DueNowItem,
  Phase3WeakTopicLane,
  Phase3MistakeJournalEntry,
  Phase3WhatHelpsMeLearnBestProfile,
  Phase3GrowthPageAuditEvent,
  Phase3GrowthPageAuditEventType,
  Phase3GrowthPageAction,
  Phase3GrowthPagePriority,
  Phase3GrowthPageSourceType,
  Phase3GrowthPageSignalType,
  Phase3WeakTopicLaneStatus,
  Phase3MistakePatternType,
} from '../contracts/phase3GrowthPageContracts';

let counter = 0;
function generateId(prefix: string): string {
  const c = ++counter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function storeKey(schoolId: string, id: string): string {
  return `${schoolId}:${id}`;
}

const growthPageStore = new Map<string, Phase3GrowthPage>();
const dueNowStore = new Map<string, Phase3DueNowItem>();
const dueNowByStudent = new Map<string, Set<string>>();
const weakTopicStore = new Map<string, Phase3WeakTopicLane>();
const weakTopicByStudent = new Map<string, Set<string>>();
const mistakeStore = new Map<string, Phase3MistakeJournalEntry>();
const mistakeByStudent = new Map<string, Set<string>>();
const helpProfileStore = new Map<string, Phase3WhatHelpsMeLearnBestProfile>();
const auditStore = new Map<string, Phase3GrowthPageAuditEvent>();

export class Phase3GrowthPageRepository {
  upsertGrowthPageSnapshot(page: Phase3GrowthPage): Phase3GrowthPage {
    const key = storeKey(page.schoolId, page.studentId);
    growthPageStore.set(key, page);
    return page;
  }

  getGrowthPageSnapshot(schoolId: string, studentId: string): Phase3GrowthPage | null {
    const key = storeKey(schoolId, studentId);
    return growthPageStore.get(key) ?? null;
  }

  listGrowthPageSnapshotsForLearner(schoolId: string, studentId: string): Phase3GrowthPage[] {
    const key = storeKey(schoolId, studentId);
    const page = growthPageStore.get(key);
    return page ? [page] : [];
  }

  listGrowthPageSnapshotsForSchool(schoolId: string): Phase3GrowthPage[] {
    const results: Phase3GrowthPage[] = [];
    for (const [k, v] of growthPageStore) {
      if (k.startsWith(schoolId + ':')) results.push(v);
    }
    return results;
  }

  upsertDueNowItem(item: Phase3DueNowItem): Phase3DueNowItem {
    const key = storeKey(item.schoolId, item.dueNowItemId);
    dueNowStore.set(key, item);
    const studentSetKey = storeKey(item.schoolId, item.studentId);
    let set = dueNowByStudent.get(studentSetKey);
    if (!set) {
      set = new Set();
      dueNowByStudent.set(studentSetKey, set);
    }
    set.add(item.dueNowItemId);
    return item;
  }

  listDueNowItemsForLearner(schoolId: string, studentId: string): Phase3DueNowItem[] {
    const studentSetKey = storeKey(schoolId, studentId);
    const set = dueNowByStudent.get(studentSetKey);
    if (!set) return [];
    const results: Phase3DueNowItem[] = [];
    for (const id of set) {
      const key = storeKey(schoolId, id);
      const item = dueNowStore.get(key);
      if (item) results.push(item);
    }
    return results;
  }

  listDueNowItemsForSchool(schoolId: string): Phase3DueNowItem[] {
    const results: Phase3DueNowItem[] = [];
    for (const [k, v] of dueNowStore) {
      if (k.startsWith(schoolId + ':')) results.push(v);
    }
    return results;
  }

  markDueNowItemCompleted(schoolId: string, dueNowItemId: string): Phase3DueNowItem | null {
    const key = storeKey(schoolId, dueNowItemId);
    const item = dueNowStore.get(key);
    if (!item) return null;
    item.isCompleted = true;
    item.updatedAt = nowISO();
    dueNowStore.set(key, item);
    return item;
  }

  upsertWeakTopicLane(lane: Phase3WeakTopicLane): Phase3WeakTopicLane {
    const key = storeKey(lane.schoolId, lane.laneId);
    weakTopicStore.set(key, lane);
    const studentSetKey = storeKey(lane.schoolId, lane.studentId);
    let set = weakTopicByStudent.get(studentSetKey);
    if (!set) {
      set = new Set();
      weakTopicByStudent.set(studentSetKey, set);
    }
    set.add(lane.laneId);
    return lane;
  }

  listWeakTopicLanesForLearner(schoolId: string, studentId: string): Phase3WeakTopicLane[] {
    const studentSetKey = storeKey(schoolId, studentId);
    const set = weakTopicByStudent.get(studentSetKey);
    if (!set) return [];
    const results: Phase3WeakTopicLane[] = [];
    for (const id of set) {
      const key = storeKey(schoolId, id);
      const lane = weakTopicStore.get(key);
      if (lane) results.push(lane);
    }
    return results;
  }

  listWeakTopicLanesForSchool(schoolId: string): Phase3WeakTopicLane[] {
    const results: Phase3WeakTopicLane[] = [];
    for (const [k, v] of weakTopicStore) {
      if (k.startsWith(schoolId + ':')) results.push(v);
    }
    return results;
  }

  updateWeakTopicLaneStatus(schoolId: string, laneId: string, status: Phase3WeakTopicLaneStatus): Phase3WeakTopicLane | null {
    const key = storeKey(schoolId, laneId);
    const lane = weakTopicStore.get(key);
    if (!lane) return null;
    lane.status = status;
    lane.updatedAt = nowISO();
    weakTopicStore.set(key, lane);
    return lane;
  }

  upsertMistakeJournalEntry(entry: Phase3MistakeJournalEntry): Phase3MistakeJournalEntry {
    const key = storeKey(entry.schoolId, entry.mistakeEntryId);
    mistakeStore.set(key, entry);
    const studentSetKey = storeKey(entry.schoolId, entry.studentId);
    let set = mistakeByStudent.get(studentSetKey);
    if (!set) {
      set = new Set();
      mistakeByStudent.set(studentSetKey, set);
    }
    set.add(entry.mistakeEntryId);
    return entry;
  }

  listMistakeJournalEntriesForLearner(schoolId: string, studentId: string): Phase3MistakeJournalEntry[] {
    const studentSetKey = storeKey(schoolId, studentId);
    const set = mistakeByStudent.get(studentSetKey);
    if (!set) return [];
    const results: Phase3MistakeJournalEntry[] = [];
    for (const id of set) {
      const key = storeKey(schoolId, id);
      const entry = mistakeStore.get(key);
      if (entry) results.push(entry);
    }
    return results;
  }

  listMistakeJournalEntriesForSchool(schoolId: string): Phase3MistakeJournalEntry[] {
    const results: Phase3MistakeJournalEntry[] = [];
    for (const [k, v] of mistakeStore) {
      if (k.startsWith(schoolId + ':')) results.push(v);
    }
    return results;
  }

  upsertWhatHelpsMeLearnBestProfile(profile: Phase3WhatHelpsMeLearnBestProfile): Phase3WhatHelpsMeLearnBestProfile {
    const key = storeKey(profile.schoolId, profile.studentId);
    helpProfileStore.set(key, profile);
    return profile;
  }

  getWhatHelpsMeLearnBestProfile(schoolId: string, studentId: string): Phase3WhatHelpsMeLearnBestProfile | null {
    const key = storeKey(schoolId, studentId);
    return helpProfileStore.get(key) ?? null;
  }

  recordGrowthPageAuditEvent(event: Phase3GrowthPageAuditEvent): Phase3GrowthPageAuditEvent {
    const key = storeKey(event.schoolId, event.eventId);
    auditStore.set(key, event);
    return event;
  }

  listGrowthPageAuditEvents(schoolId: string): Phase3GrowthPageAuditEvent[] {
    const results: Phase3GrowthPageAuditEvent[] = [];
    for (const [k, v] of auditStore) {
      if (k.startsWith(schoolId + ':')) results.push(v);
    }
    return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  resetPhase3GrowthPageRepositoryForTests(): void {
    growthPageStore.clear();
    dueNowStore.clear();
    dueNowByStudent.clear();
    weakTopicStore.clear();
    weakTopicByStudent.clear();
    mistakeStore.clear();
    mistakeByStudent.clear();
    helpProfileStore.clear();
    auditStore.clear();
    counter = 0;
  }
}

export const phase3GrowthPageRepository = new Phase3GrowthPageRepository();
