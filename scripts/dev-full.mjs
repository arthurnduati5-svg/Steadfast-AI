import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findAvailableBackendPort,
  loadDevEnv,
  writeBackendDiscoveryFile,
} from './dev-backend-runtime.mjs';

const children = [];
let shuttingDown = false;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const { env: devEnv } = loadDevEnv(repoRoot);
const preferredBackendPort = Number(devEnv.PORT || 8080);
const backendPort = await findAvailableBackendPort(preferredBackendPort);
const backendDiscovery = writeBackendDiscoveryFile(repoRoot, backendPort);
const childEnv = {
  ...devEnv,
  PORT: String(backendPort),
  BACKEND_INTERNAL_URL: backendDiscovery.url,
  NEXT_PUBLIC_BACKEND_URL: backendDiscovery.url,
};

if (backendPort !== preferredBackendPort) {
  console.warn(`[dev-full] Port ${preferredBackendPort} is in use. Using backend port ${backendPort}.`);
}

function start(name, command, env = childEnv) {
  const child = spawn(command, {
    shell: true,
    stdio: 'inherit',
    env,
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      shuttingDown = true;
      for (const proc of children) {
        if (proc !== child && !proc.killed) {
          proc.kill('SIGINT');
        }
      }

      const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
      process.exitCode = typeof code === 'number' ? code : 1;
      console.error(`[dev-full] ${name} exited with ${reason}.`);
    }
  });

  children.push(child);
  return child;
}

start('backend', 'node scripts/dev-backend.mjs');
start('frontend', 'npx next dev frontend --turbopack -p 9000');

const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
