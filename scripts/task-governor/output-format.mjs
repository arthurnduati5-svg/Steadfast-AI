export function formatStatus(taskId, state, manifest, gates, todos) {
  const lines = [];
  lines.push(`TASK_ID: ${taskId}`);
  lines.push(`TITLE: ${manifest.title || ''}`);
  lines.push(`CURRENT_STATE: ${state.currentState}`);
  lines.push(`CURRENT_TODO: ${state.currentTodoId || 'none'}`);

  if (state.lastSuccessfulGateId) {
    lines.push(`LAST_SUCCESSFUL_GATE: ${state.lastSuccessfulGateId}`);
  }
  if (state.lastFailedGateId) {
    lines.push(`LAST_FAILED_GATE: ${state.lastFailedGateId}`);
    lines.push(`FAILED_EXIT_CODE: ${state.failedExitCode}`);
  }
  lines.push(`REPAIR_ATTEMPTS: ${state.repairAttempts || 0}`);
  lines.push(`CURRENT_HEAD: ${state.currentHead || ''}`);

  if (state.implementationCommitHash) {
    lines.push(`IMPLEMENTATION_COMMIT: ${state.implementationCommitHash}`);
  }
  if (state.accountabilityCommitHash) {
    lines.push(`ACCOUNTABILITY_COMMIT: ${state.accountabilityCommitHash}`);
  }

  lines.push(`NEXT_REQUIRED_ACTION: ${getNextAction(state, manifest)}`);
  lines.push(`NEXT_ALLOWED_COMMAND: ${getNextCommand(state)}`);

  return lines.join('\n');
}

function getNextAction(state, manifest) {
  switch (state.currentState) {
    case 'PREFLIGHT':
      return 'Run bootstrap to capture baseline and start the task';
    case 'IMPLEMENTING':
      return 'Complete implementation work, then run verify-todo for pending todos';
    case 'ERROR_REPAIR':
      return `Repair failed gate "${state.lastFailedGateId}" (exit code ${state.failedExitCode}), then run resume`;
    case 'TODO_VERIFICATION':
      return 'Run verify-todo for each configured todo';
    case 'PRE_COMMIT_VERIFICATION':
      return 'Run required gates, then stage files and run prepare-commit';
    case 'STAGING':
      return 'Review staged files and run record-implementation-commit';
    case 'IMPLEMENTATION_COMMITTED':
      return 'Run verify-post-commit to validate the committed code';
    case 'POST_COMMIT_VERIFICATION':
      return 'Run record-accountability-commit with accountability document changes';
    case 'ACCOUNTABILITY_COMMITTED':
      return 'Review final state and run finalize';
    case 'FINAL_REPOSITORY_PROOF':
      return 'Run finalize to produce acceptance receipt';
    case 'ACCEPTED_READY':
      return 'Task is accepted. No further action needed.';
    case 'BLOCKED':
      return 'Task is blocked. Resolve external blocker and resume.';
    default:
      return 'Unknown state. Run resume for guidance.';
  }
}

function getNextCommand(state) {
  switch (state.currentState) {
    case 'PREFLIGHT': return 'bootstrap <task-id>';
    case 'IMPLEMENTING': return 'verify-todo <task-id> <todo-id> | run-gate <task-id> <gate-id>';
    case 'ERROR_REPAIR': return 'resume <task-id>';
    case 'TODO_VERIFICATION': return 'verify-todo <task-id> <todo-id>';
    case 'PRE_COMMIT_VERIFICATION': return 'run-gate <task-id> <gate-id> | prepare-commit <task-id>';
    case 'STAGING': return 'record-implementation-commit <task-id>';
    case 'IMPLEMENTATION_COMMITTED': return 'verify-post-commit <task-id>';
    case 'POST_COMMIT_VERIFICATION': return 'record-accountability-commit <task-id>';
    case 'ACCOUNTABILITY_COMMITTED': return 'finalize <task-id>';
    case 'FINAL_REPOSITORY_PROOF': return 'finalize <task-id>';
    case 'ACCEPTED_READY': return '(no commands available — terminal)';
    case 'BLOCKED': return '(task blocked — no commands available)';
    default: return 'status <task-id>';
  }
}

export function formatStatusJson(taskId, state, manifest) {
  return JSON.stringify({
    taskId,
    title: manifest.title,
    currentState: state.currentState,
    currentTodoId: state.currentTodoId,
    lastSuccessfulGateId: state.lastSuccessfulGateId,
    lastFailedGateId: state.lastFailedGateId,
    failedExitCode: state.failedExitCode,
    repairAttempts: state.repairAttempts,
    currentHead: state.currentHead,
    implementationCommitHash: state.implementationCommitHash,
    accountabilityCommitHash: state.accountabilityCommitHash,
    nextAction: getNextAction(state, manifest),
    nextCommand: getNextCommand(state),
  }, null, 2);
}

export function formatExplain(state, manifest, gates, todos) {
  const lines = [];
  lines.push(`=== Task: ${manifest.title} ===`);
  lines.push(`Task ID: ${manifest.taskId}`);
  lines.push(`Description: ${manifest.description}`);
  lines.push('');
  lines.push(`State: ${state.currentState}`);
  lines.push('');

  if (manifest.todos) {
    lines.push('Todos:');
    for (const todo of manifest.todos) {
      const completed = state.todoCompletion[todo.id] ? '✓' : '○';
      lines.push(`  ${completed} ${todo.id}: ${todo.title}`);
    }
    lines.push('');
  }

  if (manifest.gates) {
    lines.push('Gates:');
    for (const gate of manifest.gates) {
      const completed = state.gateCompletion[gate.id] ? '✓' : '○';
      const failed = state.lastFailedGateId === gate.id ? ' (FAILED)' : '';
      lines.push(`  ${completed} ${gate.id}: ${gate.title}${failed}`);
    }
    lines.push('');
  }

  lines.push(`Next required action: ${getNextAction(state, manifest)}`);
  lines.push(`Next allowed command: ${getNextCommand(state)}`);

  return lines.join('\n');
}
