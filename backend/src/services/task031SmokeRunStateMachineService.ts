export interface Task031SmokeRunInput {
  runId?: string;
  stageResults?: Record<string, boolean>;
}

export interface Task031SmokeRun {
  runId: string;
  status: string;
  stageResults: Record<string, boolean>;
  blockingIssues: string[];
  createdAt: string;
  updatedAt: string;
}

const VALID_STATES = [
  'created',
  'dependency_checking',
  'dependency_passed',
  'environment_checking',
  'environment_passed',
  'smoke_running',
  'observability_checking',
  'latency_budget_checking',
  'readiness_deciding',
  'report_generated',
  'accepted_ready',
  'blocked',
] as const;

type SmokeRunState = (typeof VALID_STATES)[number];

const VALID_TRANSITIONS: Record<SmokeRunState, SmokeRunState[]> = {
  created: ['dependency_checking', 'blocked'],
  dependency_checking: ['dependency_passed', 'blocked'],
  dependency_passed: ['environment_checking', 'blocked'],
  environment_checking: ['environment_passed', 'blocked'],
  environment_passed: ['smoke_running', 'blocked'],
  smoke_running: ['observability_checking', 'blocked'],
  observability_checking: ['latency_budget_checking', 'blocked'],
  latency_budget_checking: ['readiness_deciding', 'blocked'],
  readiness_deciding: ['report_generated', 'blocked'],
  report_generated: ['accepted_ready', 'blocked'],
  accepted_ready: [],
  blocked: [],
};

const runs = new Map<string, Task031SmokeRun>();

function generateId(): string {
  return `smoke_run_${Date.now()}_${Math.random().toString(36).substring(2, 10)}_task031_safe`;
}

export function createTask031SmokeRun(input: Task031SmokeRunInput): Task031SmokeRun {
  const run: Task031SmokeRun = {
    runId: input.runId || generateId(),
    status: 'created',
    stageResults: input.stageResults || {},
    blockingIssues: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  runs.set(run.runId, run);
  return { ...run };
}

export function getTask031SmokeRun(runId: string): Task031SmokeRun | null {
  const run = runs.get(runId);
  return run ? { ...run } : null;
}

export function advanceTask031SmokeRun(runId: string, nextStatus: string): Task031SmokeRun {
  const run = runs.get(runId);
  if (!run) {
    return {
      runId,
      status: 'blocked',
      stageResults: {},
      blockingIssues: ['run_not_found'],
      createdAt: '',
      updatedAt: new Date().toISOString(),
    };
  }

  const allowed = VALID_TRANSITIONS[run.status as SmokeRunState] || [];
  if (!allowed.includes(nextStatus as SmokeRunState)) {
    run.blockingIssues = [...run.blockingIssues, `invalid_transition_from_${run.status}_to_${nextStatus}`];
    run.status = 'blocked';
    run.updatedAt = new Date().toISOString();
    return { ...run };
  }

  run.status = nextStatus as SmokeRunState;
  run.updatedAt = new Date().toISOString();
  return { ...run };
}

export function blockTask031SmokeRun(runId: string, blockers: string[]): Task031SmokeRun {
  const run = runs.get(runId);
  if (!run) {
    return {
      runId,
      status: 'blocked',
      stageResults: {},
      blockingIssues: ['run_not_found', ...blockers],
      createdAt: '',
      updatedAt: new Date().toISOString(),
    };
  }

  run.status = 'blocked';
  run.blockingIssues = [...new Set([...run.blockingIssues, ...blockers])];
  run.updatedAt = new Date().toISOString();
  return { ...run };
}

export function completeTask031SmokeRun(runId: string): Task031SmokeRun {
  const run = runs.get(runId);
  if (!run) {
    return {
      runId,
      status: 'blocked',
      stageResults: {},
      blockingIssues: ['run_not_found'],
      createdAt: '',
      updatedAt: new Date().toISOString(),
    };
  }

  const allowed = VALID_TRANSITIONS[run.status as SmokeRunState] || [];
  if (!allowed.includes('accepted_ready')) {
    run.blockingIssues = [...run.blockingIssues, 'cannot_complete_from_current_state'];
    run.status = 'blocked';
    run.updatedAt = new Date().toISOString();
    return { ...run };
  }

  run.status = 'accepted_ready';
  run.updatedAt = new Date().toISOString();
  return { ...run };
}
