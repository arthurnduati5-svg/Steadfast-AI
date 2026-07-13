import {
  Task040FreezeDecision,
  calculateTask040FreezeDecision,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { loadTask036Proof } from './task040Task036ProofLoaderService';
import { buildFreezeManifest } from './task040FreezeManifestService';
import { getNoDriftCheck } from './task040NoDriftCheckService';
import { getRegressionCheck } from './task040RegressionCheckService';
import { getSafetyScanResults } from './task040SafetyScanService';

export function computeFreezeDecision(
  focusedTestsPassed: boolean,
  focusedTestFileCount: number,
  focusedAssertionCount: number,
  verificationScriptPassed: boolean,
): Task040FreezeDecision {
  const manifest = buildFreezeManifest();
  const task036Proof = loadTask036Proof();
  const noDriftResult = getNoDriftCheck();
  const regressionResult = getRegressionCheck();
  const safetyResults = getSafetyScanResults();

  const decision = calculateTask040FreezeDecision(
    manifest,
    task036Proof,
    noDriftResult,
    regressionResult,
    safetyResults,
    focusedTestsPassed,
    focusedTestFileCount,
    focusedAssertionCount,
    verificationScriptPassed,
  );

  task040Repository.saveFreezeDecision(decision);
  return decision;
}

export function getFreezeDecision(): Task040FreezeDecision | null {
  return task040Repository.getFreezeDecision();
}
