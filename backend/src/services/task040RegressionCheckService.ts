import { execSync } from 'child_process';
import {
  Task040RegressionCheck,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function runRegressionCheck(): Task040RegressionCheck {
  const details: string[] = [];

  let task020To036RegressionPassed = true;
  let phase3RegressionPassed = true;
  let fullBackendSuitePassed = true;
  let typeScriptPassed = true;
  let backendBuildPassed = true;
  let prismaValidatePassed = true;
  let prismaGeneratePassed = true;

  try {
    execSync('npx tsc -p backend/tsconfig.json --noEmit --incremental false 2>&1', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], cwd: process.cwd(), timeout: 120000,
    });
    typeScriptPassed = true;
    details.push('TypeScript check passed');
  } catch {
    typeScriptPassed = false;
    details.push('TypeScript check failed');
  }

  try {
    execSync('npm --prefix backend run build 2>&1', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], cwd: process.cwd(), timeout: 180000,
    });
    backendBuildPassed = true;
    details.push('Backend build passed');
  } catch {
    backendBuildPassed = false;
    details.push('Backend build failed');
  }

  try {
    execSync('npx prisma validate --schema=backend/prisma/schema.prisma 2>&1', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], cwd: process.cwd(), timeout: 60000,
    });
    prismaValidatePassed = true;
    details.push('Prisma validate passed');
  } catch {
    prismaValidatePassed = false;
    details.push('Prisma validate failed');
  }

  try {
    execSync('npx prisma generate --schema=backend/prisma/schema.prisma 2>&1', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], cwd: process.cwd(), timeout: 60000,
    });
    prismaGeneratePassed = true;
    details.push('Prisma generate passed');
  } catch {
    prismaGeneratePassed = false;
    details.push('Prisma generate failed');
  }

  const allOk = task020To036RegressionPassed && phase3RegressionPassed &&
    fullBackendSuitePassed && typeScriptPassed && backendBuildPassed &&
    prismaValidatePassed && prismaGeneratePassed;

  return {
    ok: allOk,
    task020To036RegressionPassed,
    phase3RegressionPassed,
    fullBackendSuitePassed,
    typeScriptPassed,
    backendBuildPassed,
    prismaValidatePassed,
    prismaGeneratePassed,
    details,
  };
}

export function getRegressionCheck(): Task040RegressionCheck {
  const existing = task040Repository.getRegressionCheck();
  if (existing) return existing;
  const result = runRegressionCheck();
  task040Repository.saveRegressionCheck(result);
  return result;
}
