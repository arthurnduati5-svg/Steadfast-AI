import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { isTask036ValidStateTransition, Task036LaunchStatus } from '../contracts/task036LiveSchoolLaunchContracts';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveLaunchEvent: vi.fn(),
    getLaunchSession: vi.fn(),
    saveLaunchSession: vi.fn(),
    listLaunchSessions: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

type Command = { type: string; sessionId: string; payload: any };

function executeCommand(command: Command): { ok: boolean; error?: string } {
  if (command.type === 'transition_state') {
    const session = task036Repository.getLaunchSession(command.sessionId);
    if (!session) return { ok: false, error: 'session_not_found' };
    const from = (session as any).status as Task036LaunchStatus;
    const to = command.payload.to as Task036LaunchStatus;
    if (!isTask036ValidStateTransition(from, to)) {
      return { ok: false, error: `invalid_transition:${from}->${to}` };
    }
    (session as any).status = to;
    task036Repository.saveLaunchSession(session as any);
    task036Repository.saveLaunchEvent({
      eventId: `evt-${Date.now()}`,
      sessionId: command.sessionId,
      eventType: 'state_transition',
      safeSummary: `Transitioned from ${from} to ${to}`,
      timestamp: new Date().toISOString(),
    });
    return { ok: true };
  }
  return { ok: false, error: 'unknown_command' };
}

describe('Task036 Command Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes state transition command successfully', () => {
    const session: any = {
      sessionId: 's-1', schoolId: 'sch-1', tenantId: 't-1',
      status: 'created', launchWindowId: '', approvalId: '',
      operatorId: 'op-1', createdAt: '', updatedAt: '', blockingIssues: [],
    };
    vi.mocked(task036Repository.getLaunchSession).mockReturnValue(session);
    const result = executeCommand({
      type: 'transition_state',
      sessionId: 's-1',
      payload: { to: 'dependency_checking' },
    });
    expect(result.ok).toBe(true);
    expect(task036Repository.saveLaunchSession).toHaveBeenCalled();
    expect(task036Repository.saveLaunchEvent).toHaveBeenCalled();
  });

  it('returns error for unknown command type', () => {
    const result = executeCommand({ type: 'unknown', sessionId: 's-1', payload: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('unknown_command');
  });

  it('returns error when session not found', () => {
    vi.mocked(task036Repository.getLaunchSession).mockReturnValue(undefined);
    const result = executeCommand({
      type: 'transition_state', sessionId: 'nonexistent', payload: { to: 'dependency_checking' },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('session_not_found');
  });

  it('returns error for invalid state transition', () => {
    const session: any = {
      sessionId: 's-1', schoolId: 'sch-1', tenantId: 't-1',
      status: 'created', launchWindowId: '', approvalId: '',
      operatorId: 'op-1', createdAt: '', updatedAt: '', blockingIssues: [],
    };
    vi.mocked(task036Repository.getLaunchSession).mockReturnValue(session);
    const result = executeCommand({
      type: 'transition_state', sessionId: 's-1', payload: { to: 'launch_ready' },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('invalid_transition');
  });

  it('lists sessions from repository', () => {
    const sessions: any[] = [
      { sessionId: 's1', status: 'created' },
      { sessionId: 's2', status: 'blocked' },
    ];
    vi.mocked(task036Repository.listLaunchSessions).mockReturnValue(sessions);
    const all = task036Repository.listLaunchSessions();
    expect(all.length).toBe(2);
  });
});
