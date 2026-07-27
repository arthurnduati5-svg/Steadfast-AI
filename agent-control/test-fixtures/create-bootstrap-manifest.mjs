import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..', '..');
const fixtures = resolve(root, 'agent-control', 'test-fixtures');
const promptContent = readFileSync(resolve(fixtures, 'bootstrap-prompt.md'), 'utf-8');
const promptHash = crypto.createHash('sha256').update(promptContent).digest('hex');
const head = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8' }).trim();
const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf-8' }).trim();

const manifest = {
  schemaVersion: 1,
  controlPlaneVersion: '1.0.0',
  taskId: 'STEADFAST-AGENT-CONTROL-PLANE-BOOTSTRAP',
  title: 'Install Steadfast Agent Execution Control Plane',
  taskType: 'governance',
  riskProfile: 'HIGH',
  originalPromptPath: resolve(fixtures, 'bootstrap-prompt.md').replace(/\\/g, '/'),
  originalPromptHash: promptHash,
  repositoryRoot: root.replace(/\\/g, '/'),
  startingBranch: branch,
  startingHead: head,
  createdAt: new Date().toISOString(),
  ownerAcceptanceCriteria: [
    'All required repository components exist',
    'All 22 bootstrap acceptance conditions met',
    'Self-tests pass (16 rejection tests)',
    'Sample task demonstrates lifecycle through state machine',
    'Post-commit verification passes from committed content',
  ],
  taskOwnedPaths: [
    'AGENTS.md', 'opencode.json', '.opencode/',
    'agent-control/', 'scripts/bootstrap-task.mjs',
    'scripts/task-governor.mjs', 'scripts/workspace-guard.mjs',
    'scripts/test-inventory-guard.mjs', 'scripts/evidence-validator.mjs',
    'scripts/visual-evidence-validator.mjs', 'scripts/browser-process-guard.mjs',
    'scripts/commit-guard.mjs', 'scripts/post-commit-verifier.mjs',
    'scripts/finalize-task.mjs', 'scripts/agent-control-lib/',
    'tasks/README.md',
  ],
  allowedSharedDependencyPaths: ['node_modules/'],
  forbiddenPaths: ['backend/', 'frontend/', 'AI/'],
  taskCommands: [
    'scripts/bootstrap-task.mjs', 'scripts/task-governor.mjs',
    'scripts/workspace-guard.mjs', 'scripts/test-inventory-guard.mjs',
    'scripts/evidence-validator.mjs', 'scripts/visual-evidence-validator.mjs',
    'scripts/browser-process-guard.mjs', 'scripts/commit-guard.mjs',
    'scripts/post-commit-verifier.mjs', 'scripts/finalize-task.mjs',
  ],
  requiredTestCommands: ['node agent-control/tests/run-self-tests.mjs'],
  requiredTestSuites: ['self-tests'],
  requiredTestFilePatterns: ['agent-control/tests/*.mjs', 'agent-control/test-fixtures/*.mjs'],
  testConfigurationFiles: [],
  runtimeAcceptance: false,
  visualAcceptance: false,
  requiredThemes: [],
  requiredSurfaces: [],
  requiredViewports: [],
  requiredInteractionStates: [],
  requiredEvidenceKinds: ['command-output', 'build-output'],
  expectedCommitMessage: 'feat(governance): install Steadfast execution control plane',
  acceptedSentinel: 'STEADFAST_AGENT_CONTROL_PLANE_READY',
  postCommitCommands: ['node agent-control/tests/run-self-tests.mjs'],
  deploymentRequired: false,
  integrationAuthorized: false,
  baselinePolicy: {},
  warningPolicy: {},
  generatedOutputPolicy: {},
  browserPolicy: { required: false },
  backlogPolicy: {},
};

writeFileSync(resolve(fixtures, 'bootstrap-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
console.log('Bootstrap manifest created');
console.log('Task ID:', manifest.taskId);
console.log('Prompt hash:', promptHash);
console.log('HEAD:', head);
