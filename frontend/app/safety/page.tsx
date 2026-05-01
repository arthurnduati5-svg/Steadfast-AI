'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import type { SafetyAlert, SafetyChatMessage } from '@/lib/types';

export default function SafetyPage() {
  const [viewerRole, setViewerRole] = useState<string>('');
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [contextMessages, setContextMessages] = useState<SafetyChatMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [sessionIdInput, setSessionIdInput] = useState('');
  const [sessionMessages, setSessionMessages] = useState<SafetyChatMessage[]>([]);
  const [sessionMeta, setSessionMeta] = useState<{ id: string; studentId: string; topic?: string | null } | null>(null);

  const refreshAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.safety.listAlerts({
        limit: 100,
        status: statusFilter || undefined,
      });
      setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
      setViewerRole(String(data?.viewerRole || ''));
    } catch (e: any) {
      setError(String(e?.message || 'Failed to load safety alerts.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const openAlert = useCallback(async (alertId: string) => {
    setError('');
    try {
      const data = await api.safety.getAlert(alertId);
      setSelectedAlert(data?.alert || null);
      setContextMessages(Array.isArray(data?.contextMessages) ? data.contextMessages : []);
    } catch (e: any) {
      setError(String(e?.message || 'Failed to load alert details.'));
    }
  }, []);

  const updateAlertStatus = useCallback(
    async (status: 'open' | 'reviewing' | 'resolved' | 'dismissed') => {
      if (!selectedAlert) return;
      setError('');
      try {
        await api.safety.updateAlertStatus(selectedAlert.id, { status });
        await openAlert(selectedAlert.id);
        await refreshAlerts();
      } catch (e: any) {
        setError(String(e?.message || 'Failed to update alert status.'));
      }
    },
    [openAlert, refreshAlerts, selectedAlert]
  );

  const loadSession = useCallback(async () => {
    if (!sessionIdInput.trim()) return;
    setError('');
    try {
      const data = await api.safety.getChats({
        sessionId: sessionIdInput.trim(),
        limit: 400,
      });
      setSessionMeta(data?.session || null);
      setSessionMessages(Array.isArray(data?.messages) ? data.messages : []);
      setViewerRole(String(data?.viewerRole || viewerRole));
    } catch (e: any) {
      setError(String(e?.message || 'Failed to load session messages.'));
    }
  }, [sessionIdInput, viewerRole]);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  const sortedAlerts = useMemo(() => {
    const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...alerts].sort((a, b) => {
      const bySeverity = (rank[b.severity] || 0) - (rank[a.severity] || 0);
      if (bySeverity !== 0) return bySeverity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [alerts]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 text-sm">
      <h1 className="text-2xl font-semibold">Safety Operations</h1>
      <p className="mt-1 text-muted-foreground">
        Role: <span className="font-medium">{viewerRole || 'unknown'}</span>
      </p>
      {error && <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      <section className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center gap-3">
            <label htmlFor="status-filter" className="font-medium">
              Filter
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <button onClick={refreshAlerts} className="rounded border px-3 py-1 font-medium" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="max-h-[520px] overflow-auto rounded border">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => openAlert(alert.id)}
                    className="cursor-pointer border-t hover:bg-muted/50"
                  >
                    <td className="px-3 py-2 font-semibold uppercase">{alert.severity}</td>
                    <td className="px-3 py-2">{alert.category}</td>
                    <td className="px-3 py-2">{alert.studentId}</td>
                    <td className="px-3 py-2">{alert.status}</td>
                    <td className="px-3 py-2">{new Date(alert.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {sortedAlerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      No alerts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <h2 className="text-base font-semibold">Alert Detail</h2>
          {!selectedAlert && <p className="mt-3 text-muted-foreground">Select an alert to view context.</p>}
          {selectedAlert && (
            <>
              <div className="mt-3 space-y-1">
                <p><strong>ID:</strong> {selectedAlert.id}</p>
                <p><strong>Student:</strong> {selectedAlert.studentId}</p>
                <p><strong>Severity:</strong> {selectedAlert.severity}</p>
                <p><strong>Category:</strong> {selectedAlert.category}</p>
                <p><strong>Confidence:</strong> {selectedAlert.confidence}</p>
                <p><strong>Excerpt:</strong> {selectedAlert.excerptRedacted}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="rounded border px-2 py-1" onClick={() => updateAlertStatus('reviewing')}>
                  Mark Reviewing
                </button>
                <button className="rounded border px-2 py-1" onClick={() => updateAlertStatus('resolved')}>
                  Mark Resolved
                </button>
                <button className="rounded border px-2 py-1" onClick={() => updateAlertStatus('dismissed')}>
                  Dismiss
                </button>
              </div>
              <div className="mt-4 max-h-[280px] overflow-auto rounded border p-2">
                {contextMessages.map((msg) => (
                  <div key={msg.id} className="mb-2 rounded border p-2">
                    <div className="mb-1 text-xs text-muted-foreground">
                      #{msg.messageNumber} · {msg.role} · {new Date(msg.timestamp).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {contextMessages.length === 0 && (
                  <p className="text-muted-foreground">No context messages returned.</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border bg-background p-4">
        <h2 className="text-base font-semibold">Admin Chat Viewer</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={sessionIdInput}
            onChange={(event) => setSessionIdInput(event.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Paste session ID"
          />
          <button onClick={loadSession} className="rounded border px-3 py-2 font-medium">
            Load Session
          </button>
        </div>
        {sessionMeta && (
          <p className="mt-2 text-muted-foreground">
            Session: {sessionMeta.id} | Student: {sessionMeta.studentId} | Topic: {sessionMeta.topic || 'N/A'}
          </p>
        )}
        <div className="mt-3 max-h-[340px] overflow-auto rounded border p-2">
          {sessionMessages.map((msg) => (
            <div key={msg.id} className="mb-2 rounded border p-2">
              <div className="mb-1 text-xs text-muted-foreground">
                #{msg.messageNumber} · {msg.role} · {new Date(msg.timestamp).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          {sessionMessages.length === 0 && (
            <p className="text-muted-foreground">No session loaded.</p>
          )}
        </div>
      </section>
    </main>
  );
}
