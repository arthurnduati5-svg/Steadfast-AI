#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { getRepositoryRoot, getRuntimeDir, ensureDir, writeJSON, readJSON } from './agent-control-lib/repository.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function cmdLaunch(taskId, browserPath) {
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(resolve(runtimeDir, 'evidence', 'browser'));

  const profileDir = resolve(getRepositoryRoot(), '..', '.steadfast-browser-profiles', taskId);
  execSync(`mkdir "${profileDir}" 2>nul`, { encoding: 'utf-8' });

  const debugPort = 9222 + (parseInt(taskId.replace(/[^0-9]/g, '').slice(0, 4)) || 1) % 1000;
  const userDataDir = resolve(profileDir, 'profile');

  const browserExe = browserPath || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const args_list = [
    `--user-data-dir="${userDataDir}"`,
    `--remote-debugging-port=${debugPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-extensions',
    '--disable-background-networking',
    '--about:blank',
  ];

  try {
    const child = spawn(browserExe, args_list, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();

    const record = {
      taskId,
      browserExe,
      debugPort,
      profileDir,
      userDataDir,
      pid: child.pid,
      launchedAt: new Date().toISOString(),
      runtimeSessionId: `${taskId}-browser-${Date.now()}`,
    };

    writeJSON(resolve(runtimeDir, 'evidence', 'browser', 'browser-process-record.json'), record);
    console.log(`Browser launched: PID ${child.pid}, port ${debugPort}, profile ${profileDir}`);
    console.log(`Session ID: ${record.runtimeSessionId}`);
  } catch (err) {
    console.error(`Failed to launch browser: ${err.message}`);
    process.exit(1);
  }
}

function cmdTerminate(taskId) {
  const runtimeDir = getRuntimeDir(taskId);
  const recordPath = resolve(runtimeDir, 'evidence', 'browser', 'browser-process-record.json');

  if (!existsSync(recordPath)) {
    console.log('No browser process record found.');
    process.exit(0);
  }

  const record = readJSON(recordPath);
  if (!record || !record.pid) {
    console.log('No browser PID recorded.');
    process.exit(0);
  }

  try {
    execSync(`taskkill /PID ${record.pid} /F 2>nul`, { encoding: 'utf-8', timeout: 5000 });
    console.log(`Browser process ${record.pid} terminated.`);
  } catch {
    console.log(`Browser process ${record.pid} already terminated.`);
  }

  if (record.profileDir && existsSync(record.profileDir)) {
    try {
      execSync(`rmdir /S /Q "${record.profileDir}" 2>nul`, { encoding: 'utf-8', timeout: 10000 });
      console.log(`Browser profile removed: ${record.profileDir}`);
    } catch (err) {
      console.warn(`Could not remove profile: ${err.message}`);
    }
  }

  writeJSON(resolve(runtimeDir, 'evidence', 'browser', 'browser-cleanup-record.json'), {
    taskId,
    pid: record.pid,
    terminatedAt: new Date().toISOString(),
    profileRemoved: true,
  });
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  node scripts/browser-process-guard.mjs launch --task <task-id> [--browser <path>]');
    console.log('  node scripts/browser-process-guard.mjs terminate --task <task-id>');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'launch': {
        const taskId = requireTaskId(args);
        const browserIdx = args.indexOf('--browser');
        cmdLaunch(taskId, browserIdx >= 0 ? args[browserIdx + 1] : null);
        break;
      }
      case 'terminate': {
        cmdTerminate(requireTaskId(args));
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

main();
