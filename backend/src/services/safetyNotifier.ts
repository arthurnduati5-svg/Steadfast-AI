import { logger } from '../utils/logger';

export interface CounselorNotificationPayload {
  alertId: string;
  studentId: string;
  sessionId?: string | null;
  messageId?: string | null;
  category: string;
  severity: string;
  confidence: number;
  excerptRedacted: string;
  createdAt: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function notifyCounselor(payload: CounselorNotificationPayload): Promise<boolean> {
  const webhookUrl = String(process.env.COUNSELOR_ALERT_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
    logger.warn({ alertId: payload.alertId }, '[SafetyNotify] COUNSELOR_ALERT_WEBHOOK_URL is not configured.');
    return false;
  }

  try {
    const response = await withTimeout(
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'safety_alert',
          ...payload,
        }),
      }),
      5000
    );

    if (!response.ok) {
      logger.error(
        { alertId: payload.alertId, status: response.status },
        '[SafetyNotify] Counselor webhook responded with non-OK status.'
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ alertId: payload.alertId, error: String(error) }, '[SafetyNotify] Counselor webhook failed.');
    return false;
  }
}

