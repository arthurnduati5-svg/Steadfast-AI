import type {
  Phase3ParentLearnerLink,
  Phase3ParentVisibilityLevel,
  Phase3ParentVisibilityDecision,
  Phase3ParentSafeProgressSummary,
  Phase3ParentNotificationPreference,
  Phase3ParentNotificationDecision,
  Phase3ParentNotificationCard,
  Phase3ParentNotificationStatus,
  Phase3ParentSupportAuditEvent,
  Phase3ParentLinkStatus,
  Phase3ParentSummaryType,
  Phase3ParentNotificationType,
  Phase3ParentSupportAction,
  Phase3ParentSupportSourceType,
  Phase3ParentSupportSignalType,
  Phase3ParentSupportPriority,
  Phase3ParentSupportAuditEventType,
  Phase3ParentRole,
  Phase3ParentSupportSafeEvidenceRef,
} from '../contracts/phase3ParentSupportContracts';

let linkIdCounter = 0;
let decisionIdCounter = 0;
let summaryIdCounter = 0;
let preferenceIdCounter = 0;
let notifDecisionIdCounter = 0;
let cardIdCounter = 0;
let eventIdCounter = 0;
let evtRefIdCounter = 0;

function generateId(prefix: string): string {
  const c =
    prefix === 'pl' ? ++linkIdCounter :
    prefix === 'pd' ? ++decisionIdCounter :
    prefix === 'ps' ? ++summaryIdCounter :
    prefix === 'pr' ? ++preferenceIdCounter :
    prefix === 'nd' ? ++notifDecisionIdCounter :
    prefix === 'nc' ? ++cardIdCounter :
    prefix === 'ev' ? ++eventIdCounter :
    ++evtRefIdCounter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function key(schoolId: string, id: string): string {
  return `${schoolId}:${id}`;
}

const parentLearnerLinkStore = new Map<string, Phase3ParentLearnerLink>();
const visibilityDecisionStore = new Map<string, Phase3ParentVisibilityDecision>();
const safeProgressSummaryStore = new Map<string, Phase3ParentSafeProgressSummary>();
const notificationPreferenceStore = new Map<string, Phase3ParentNotificationPreference>();
const notificationDecisionStore = new Map<string, Phase3ParentNotificationDecision>();
const notificationCardStore = new Map<string, Phase3ParentNotificationCard>();
const auditEventStore: Phase3ParentSupportAuditEvent[] = [];

const linksByParent = new Map<string, Set<string>>();
const linksByLearner = new Map<string, Set<string>>();
const summariesByLearner = new Map<string, Set<string>>();
const summariesByParent = new Map<string, Set<string>>();
const notifDecisionsByLearner = new Map<string, Set<string>>();
const notifDecisionsByParent = new Map<string, Set<string>>();
const notifCardsByLearner = new Map<string, Set<string>>();
const notifCardsByParent = new Map<string, Set<string>>();
const summariesBySchool = new Map<string, Set<string>>();
const notifCardsBySchool = new Map<string, Set<string>>();

function addToSet(map: Map<string, Set<string>>, key: string, value: string): void {
  let s = map.get(key);
  if (!s) {
    s = new Set();
    map.set(key, s);
  }
  s.add(value);
}

export function upsertParentLearnerLink(link: Phase3ParentLearnerLink): Phase3ParentLearnerLink {
  parentLearnerLinkStore.set(key(link.schoolId, link.linkId), link);
  addToSet(linksByParent, key(link.schoolId, link.parentId), link.linkId);
  addToSet(linksByLearner, key(link.schoolId, link.studentId), link.linkId);
  return link;
}

export function getParentLearnerLink(schoolId: string, linkId: string): Phase3ParentLearnerLink | undefined {
  return parentLearnerLinkStore.get(key(schoolId, linkId));
}

export function listLearnerLinksForParent(schoolId: string, parentId: string): Phase3ParentLearnerLink[] {
  const ids = linksByParent.get(key(schoolId, parentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => parentLearnerLinkStore.get(key(schoolId, id)))
    .filter((l): l is Phase3ParentLearnerLink => l !== undefined);
}

export function listParentLinksForLearner(schoolId: string, studentId: string): Phase3ParentLearnerLink[] {
  const ids = linksByLearner.get(key(schoolId, studentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => parentLearnerLinkStore.get(key(schoolId, id)))
    .filter((l): l is Phase3ParentLearnerLink => l !== undefined);
}

export function revokeParentLearnerLink(schoolId: string, linkId: string): Phase3ParentLearnerLink | undefined {
  const link = parentLearnerLinkStore.get(key(schoolId, linkId));
  if (!link) return undefined;
  link.linkStatus = 'revoked';
  link.updatedAt = nowISO();
  link.revokedAt = nowISO();
  link.safeReasonCodes = [...(link.safeReasonCodes || []), 'link_revoked'];
  parentLearnerLinkStore.set(key(schoolId, linkId), link);
  return link;
}

export function recordParentVisibilityDecision(
  decision: Phase3ParentVisibilityDecision
): Phase3ParentVisibilityDecision {
  visibilityDecisionStore.set(key(decision.schoolId, decision.decisionId), decision);
  return decision;
}

export function getParentVisibilityDecision(
  schoolId: string, decisionId: string
): Phase3ParentVisibilityDecision | undefined {
  return visibilityDecisionStore.get(key(schoolId, decisionId));
}

export function listVisibilityDecisionsForParent(
  schoolId: string, parentId: string
): Phase3ParentVisibilityDecision[] {
  return Array.from(visibilityDecisionStore.values())
    .filter((d) => d.schoolId === schoolId && d.parentId === parentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertParentSafeProgressSummary(
  summary: Phase3ParentSafeProgressSummary
): Phase3ParentSafeProgressSummary {
  safeProgressSummaryStore.set(key(summary.schoolId, summary.summaryId), summary);
  addToSet(summariesByLearner, key(summary.schoolId, summary.studentId), summary.summaryId);
  addToSet(summariesByParent, key(summary.schoolId, summary.parentId), summary.summaryId);
  addToSet(summariesBySchool, summary.schoolId, summary.summaryId);
  return summary;
}

export function getParentSafeProgressSummary(
  schoolId: string, summaryId: string
): Phase3ParentSafeProgressSummary | undefined {
  return safeProgressSummaryStore.get(key(schoolId, summaryId));
}

export function listParentSafeProgressSummariesForLearner(
  schoolId: string, studentId: string
): Phase3ParentSafeProgressSummary[] {
  const ids = summariesByLearner.get(key(schoolId, studentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => safeProgressSummaryStore.get(key(schoolId, id)))
    .filter((s): s is Phase3ParentSafeProgressSummary => s !== undefined)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function listParentSafeProgressSummariesForParent(
  schoolId: string, parentId: string
): Phase3ParentSafeProgressSummary[] {
  const ids = summariesByParent.get(key(schoolId, parentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => safeProgressSummaryStore.get(key(schoolId, id)))
    .filter((s): s is Phase3ParentSafeProgressSummary => s !== undefined)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function upsertParentNotificationPreference(
  pref: Phase3ParentNotificationPreference
): Phase3ParentNotificationPreference {
  notificationPreferenceStore.set(key(pref.schoolId, pref.preferenceId), pref);
  return pref;
}

export function getParentNotificationPreference(
  schoolId: string, preferenceId: string
): Phase3ParentNotificationPreference | undefined {
  return notificationPreferenceStore.get(key(schoolId, preferenceId));
}

export function listParentNotificationPreferences(
  schoolId: string, parentId: string
): Phase3ParentNotificationPreference[] {
  return Array.from(notificationPreferenceStore.values())
    .filter((p) => p.schoolId === schoolId && p.parentId === parentId);
}

export function upsertParentNotificationDecision(
  decision: Phase3ParentNotificationDecision
): Phase3ParentNotificationDecision {
  notificationDecisionStore.set(key(decision.schoolId, decision.decisionId), decision);
  addToSet(notifDecisionsByLearner, key(decision.schoolId, decision.studentId), decision.decisionId);
  addToSet(notifDecisionsByParent, key(decision.schoolId, decision.parentId), decision.decisionId);
  return decision;
}

export function getParentNotificationDecision(
  schoolId: string, decisionId: string
): Phase3ParentNotificationDecision | undefined {
  return notificationDecisionStore.get(key(schoolId, decisionId));
}

export function listParentNotificationDecisionsForLearner(
  schoolId: string, studentId: string
): Phase3ParentNotificationDecision[] {
  const ids = notifDecisionsByLearner.get(key(schoolId, studentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => notificationDecisionStore.get(key(schoolId, id)))
    .filter((d): d is Phase3ParentNotificationDecision => d !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listParentNotificationDecisionsForParent(
  schoolId: string, parentId: string
): Phase3ParentNotificationDecision[] {
  const ids = notifDecisionsByParent.get(key(schoolId, parentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => notificationDecisionStore.get(key(schoolId, id)))
    .filter((d): d is Phase3ParentNotificationDecision => d !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertParentNotificationCard(
  card: Phase3ParentNotificationCard
): Phase3ParentNotificationCard {
  notificationCardStore.set(key(card.schoolId, card.cardId), card);
  addToSet(notifCardsByLearner, key(card.schoolId, card.studentId), card.cardId);
  addToSet(notifCardsByParent, key(card.schoolId, card.parentId), card.cardId);
  addToSet(notifCardsBySchool, card.schoolId, card.cardId);
  return card;
}

export function getParentNotificationCard(
  schoolId: string, cardId: string
): Phase3ParentNotificationCard | undefined {
  return notificationCardStore.get(key(schoolId, cardId));
}

export function listParentNotificationCardsForLearner(
  schoolId: string, studentId: string
): Phase3ParentNotificationCard[] {
  const ids = notifCardsByLearner.get(key(schoolId, studentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => notificationCardStore.get(key(schoolId, id)))
    .filter((c): c is Phase3ParentNotificationCard => c !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listParentNotificationCardsForParent(
  schoolId: string, parentId: string
): Phase3ParentNotificationCard[] {
  const ids = notifCardsByParent.get(key(schoolId, parentId));
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => notificationCardStore.get(key(schoolId, id)))
    .filter((c): c is Phase3ParentNotificationCard => c !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateParentNotificationCardStatus(
  schoolId: string, cardId: string, status: Phase3ParentNotificationStatus
): Phase3ParentNotificationCard | undefined {
  const card = notificationCardStore.get(key(schoolId, cardId));
  if (!card) return undefined;
  card.notificationStatus = status;
  card.updatedAt = nowISO();
  if (status === 'completed') {
    card.completedAt = nowISO();
  }
  notificationCardStore.set(key(schoolId, cardId), card);
  return card;
}

export function recordParentSupportAuditEvent(
  event: Phase3ParentSupportAuditEvent
): Phase3ParentSupportAuditEvent {
  auditEventStore.push(event);
  return event;
}

export function listParentSupportAuditEvents(
  schoolId: string, limit = 50
): Phase3ParentSupportAuditEvent[] {
  return auditEventStore
    .filter((e) => e.schoolId === schoolId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function listAllParentSupportSummariesForSchool(
  schoolId: string
): Phase3ParentSafeProgressSummary[] {
  const ids = summariesBySchool.get(schoolId);
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => safeProgressSummaryStore.get(key(schoolId, id)))
    .filter((s): s is Phase3ParentSafeProgressSummary => s !== undefined);
}

export function listAllParentNotificationCardsForSchool(
  schoolId: string
): Phase3ParentNotificationCard[] {
  const ids = notifCardsBySchool.get(schoolId);
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => notificationCardStore.get(key(schoolId, id)))
    .filter((c): c is Phase3ParentNotificationCard => c !== undefined);
}

export function resetPhase3ParentSupportRepositoryForTests(): void {
  parentLearnerLinkStore.clear();
  visibilityDecisionStore.clear();
  safeProgressSummaryStore.clear();
  notificationPreferenceStore.clear();
  notificationDecisionStore.clear();
  notificationCardStore.clear();
  auditEventStore.length = 0;
  linksByParent.clear();
  linksByLearner.clear();
  summariesByLearner.clear();
  summariesByParent.clear();
  notifDecisionsByLearner.clear();
  notifDecisionsByParent.clear();
  notifCardsByLearner.clear();
  notifCardsByParent.clear();
  summariesBySchool.clear();
  notifCardsBySchool.clear();
  linkIdCounter = 0;
  decisionIdCounter = 0;
  summaryIdCounter = 0;
  preferenceIdCounter = 0;
  notifDecisionIdCounter = 0;
  cardIdCounter = 0;
  eventIdCounter = 0;
  evtRefIdCounter = 0;
}
