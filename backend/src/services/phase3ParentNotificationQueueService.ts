import {
  type Phase3ParentNotificationCard,
  type Phase3ParentNotificationDecision,
  type Phase3ParentNotificationStatus,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';

let cardIdCounter = 0;

function generateCardId(): string {
  const c = ++cardIdCounter;
  return `nc_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function createParentNotificationCard(
  decision: Phase3ParentNotificationDecision,
): Phase3ParentNotificationCard {
  const card: Phase3ParentNotificationCard = {
    cardId: generateCardId(),
    decisionId: decision.decisionId,
    schoolId: decision.schoolId,
    studentId: decision.studentId,
    parentId: decision.parentId,
    notificationType: decision.notificationType,
    notificationStatus: decision.notificationStatus === 'queued' ? 'queued' : decision.notificationStatus,
    priority: decision.priority,
    safeTitle: decision.safeTitle,
    safeSummary: decision.safeSummary,
    supportAction: decision.supportAction,
    safeEvidenceRefs: decision.safeEvidenceRefs,
    safeReasonCodes: decision.safeReasonCodes,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  repo.upsertParentNotificationCard(card);
  return card;
}

export function listParentNotificationCards(
  schoolId: string,
  parentId: string,
): Phase3ParentNotificationCard[] {
  return repo.listParentNotificationCardsForParent(schoolId, parentId);
}

export function getParentNotificationCard(
  schoolId: string,
  cardId: string,
): Phase3ParentNotificationCard | undefined {
  return repo.getParentNotificationCard(schoolId, cardId);
}

export function markParentNotificationCardCompleted(
  schoolId: string,
  cardId: string,
): Phase3ParentNotificationCard | undefined {
  return repo.updateParentNotificationCardStatus(schoolId, cardId, 'completed');
}

export function markParentNotificationCardBlocked(
  schoolId: string,
  cardId: string,
): Phase3ParentNotificationCard | undefined {
  return repo.updateParentNotificationCardStatus(schoolId, cardId, 'blocked_by_visibility');
}

export function buildNotificationCardFromDecision(
  decision: Phase3ParentNotificationDecision,
): Phase3ParentNotificationCard {
  return {
    cardId: generateCardId(),
    decisionId: decision.decisionId,
    schoolId: decision.schoolId,
    studentId: decision.studentId,
    parentId: decision.parentId,
    notificationType: decision.notificationType,
    notificationStatus: decision.notificationStatus === 'queued' ? 'queued' : decision.notificationStatus,
    priority: decision.priority,
    safeTitle: decision.safeTitle,
    safeSummary: decision.safeSummary,
    supportAction: decision.supportAction,
    safeEvidenceRefs: decision.safeEvidenceRefs,
    safeReasonCodes: decision.safeReasonCodes,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

export function dedupeParentNotificationCards(
  cards: Phase3ParentNotificationCard[],
): Phase3ParentNotificationCard[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = `${c.notificationType}:${c.studentId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function rankParentNotificationCards(
  cards: Phase3ParentNotificationCard[],
): Phase3ParentNotificationCard[] {
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    blocked: 4,
  };
  return [...cards].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 99;
    const pb = priorityOrder[b.priority] ?? 99;
    return pa - pb;
  });
}
