import {
  type Phase3ParentNotificationPreference,
  type Phase3ParentNotificationType,
  PHASE3_PARENT_NOTIFICATION_TYPES,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';

let preferenceIdCounter = 0;

function generatePreferenceId(): string {
  const c = ++preferenceIdCounter;
  return `pr_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

const DEFAULT_ENABLED_NOTIFICATION_TYPES: Phase3ParentNotificationType[] = [
  'weekly_progress_summary',
  'positive_growth_update',
  'teacher_requested_support',
];

export function upsertParentNotificationPreference(
  schoolId: string,
  parentId: string,
  studentId: string,
  overrides?: {
    enabledNotificationTypes?: Phase3ParentNotificationType[];
    quietHoursStart?: string;
    quietHoursEnd?: string;
    frequencyPreference?: string;
    languagePreference?: string;
  },
): Phase3ParentNotificationPreference {
  const existingPrefs = repo.listParentNotificationPreferences(schoolId, parentId);
  const existing = existingPrefs.find((p) => p.studentId === studentId);

  const pref: Phase3ParentNotificationPreference = {
    preferenceId: existing?.preferenceId ?? generatePreferenceId(),
    parentId,
    studentId,
    schoolId,
    enabledNotificationTypes: overrides?.enabledNotificationTypes ?? existing?.enabledNotificationTypes ?? DEFAULT_ENABLED_NOTIFICATION_TYPES,
    quietHoursStart: overrides?.quietHoursStart ?? existing?.quietHoursStart,
    quietHoursEnd: overrides?.quietHoursEnd ?? existing?.quietHoursEnd,
    frequencyPreference: overrides?.frequencyPreference ?? existing?.frequencyPreference ?? 'weekly',
    languagePreference: overrides?.languagePreference ?? existing?.languagePreference,
    createdAt: existing?.createdAt ?? nowISO(),
    updatedAt: nowISO(),
  };

  repo.upsertParentNotificationPreference(pref);
  return pref;
}

export function getParentNotificationPreference(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentNotificationPreference | undefined {
  const prefs = repo.listParentNotificationPreferences(schoolId, parentId);
  return prefs.find((p) => p.studentId === studentId);
}

export function resolveDefaultParentNotificationPreference(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentNotificationPreference {
  const existing = getParentNotificationPreference(schoolId, parentId, studentId);
  if (existing) return existing;

  return upsertParentNotificationPreference(schoolId, parentId, studentId, {
    enabledNotificationTypes: [...DEFAULT_ENABLED_NOTIFICATION_TYPES],
    frequencyPreference: 'weekly',
  });
}

export function canParentReceiveNotificationType(
  pref: Phase3ParentNotificationPreference,
  notificationType: Phase3ParentNotificationType,
): boolean {
  return pref.enabledNotificationTypes.includes(notificationType);
}

export function isNotificationQuietHoursBlocked(
  pref: Phase3ParentNotificationPreference,
  _currentTime?: string,
): boolean {
  if (!pref.quietHoursStart || !pref.quietHoursEnd) return false;
  const now = _currentTime ? new Date(_currentTime) : new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = pref.quietHoursStart.split(':').map(Number);
  const [endH, endM] = pref.quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function filterNotificationsByPreference(
  preferences: Phase3ParentNotificationPreference[],
  notifications: { notificationType: Phase3ParentNotificationType }[],
): { allowed: typeof notifications; blocked: typeof notifications } {
  const allowed: typeof notifications = [];
  const blocked: typeof notifications = [];

  const enabledTypes = new Set<Phase3ParentNotificationType>();
  for (const pref of preferences) {
    for (const t of pref.enabledNotificationTypes) {
      enabledTypes.add(t);
    }
  }

  for (const notif of notifications) {
    if (enabledTypes.has(notif.notificationType)) {
      allowed.push(notif);
    } else {
      blocked.push(notif);
    }
  }

  return { allowed, blocked };
}
