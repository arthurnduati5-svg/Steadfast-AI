import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import dotenv from 'dotenv';

export function loadDevEnv(repoRoot) {
  const rootEnvPath = path.join(repoRoot, '.env');
  const backendEnvPath = path.join(repoRoot, 'backend', '.env');
  const rootEnv = fs.existsSync(rootEnvPath) ? dotenv.parse(fs.readFileSync(rootEnvPath, 'utf8')) : {};
  const backendEnv = fs.existsSync(backendEnvPath) ? dotenv.parse(fs.readFileSync(backendEnvPath, 'utf8')) : {};

  return {
    env: {
      ...rootEnv,
      ...backendEnv,
      ...process.env,
    },
    dotenvPath: fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath,
  };
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

export async function findAvailableBackendPort(preferredPort, maxAttempts = 40) {
  const start = Number.isFinite(preferredPort) && preferredPort > 0 ? Math.trunc(preferredPort) : 8080;
  for (let offset = 0; offset <= maxAttempts; offset += 1) {
    const port = start + offset;
    if (await canListen(port)) return port;
  }
  throw new Error(`No available backend port found from ${start} through ${start + maxAttempts}.`);
}

export function writeBackendDiscoveryFile(repoRoot, port) {
  const url = `http://127.0.0.1:${port}`;
  const discoveryDir = path.join(repoRoot, 'frontend', '.next-dev');
  const discoveryPath = path.join(discoveryDir, 'backend-url.json');
  fs.mkdirSync(discoveryDir, { recursive: true });
  fs.writeFileSync(
    discoveryPath,
    JSON.stringify(
      {
        url,
        port,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  return { url, discoveryPath };
}
