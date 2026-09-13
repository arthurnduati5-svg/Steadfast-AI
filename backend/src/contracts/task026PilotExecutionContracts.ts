export type PilotExecutionStatus = 'not_started' | 'active' | 'paused' | 'rolled_back' | 'completed' | 'cancelled' | 'blocked'

export type PilotExecutionEventType = 'created' | 'activated' | 'paused' | 'resumed' | 'rolled_back' | 'completed' | 'cancelled' | 'blocked'

export interface Task026PilotExecutionContext {
  schoolId: string
  pilotRunId: string
  actorRole: string
}

export const TASK026_PILOT_EXECUTION_STATUSES: PilotExecutionStatus[] = [
  'not_started', 'active', 'paused', 'rolled_back', 'completed', 'cancelled', 'blocked',
]

export const TASK026_PILOT_EVENT_TYPES: PilotExecutionEventType[] = [
  'created', 'activated', 'paused', 'resumed', 'rolled_back', 'completed', 'cancelled', 'blocked',
]
