import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findAvailableBackendPort,
  loadDevEnv,
  writeBackendDiscoveryFile,
} from './dev-backend-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const { env: devEnv, dotenvPath } = loadDevEnv(repoRoot);
const preferredPort = Number(devEnv.PORT || 8080);
const backendPort = await findAvailableBackendPort(preferredPort);
const backendDiscovery = writeBackendDiscoveryFile(repoRoot, backendPort);

if (backendPort !== preferredPort) {
  console.warn(`[dev-backend] Port ${preferredPort} is in use. Using ${backendPort} instead.`);
}

const child = spawn('npx tsx backend/src/index.ts', {
  cwd: repoRoot,
  shell: true,
  stdio: 'inherit',
  env: {
    ...devEnv,
    DOTENV_CONFIG_PATH: dotenvPath,
    PORT: String(backendPort),
    BACKEND_INTERNAL_URL: backendDiscovery.url,
    NEXT_PUBLIC_BACKEND_URL: backendDiscovery.url,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
