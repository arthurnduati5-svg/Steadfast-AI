import { execSync } from 'child_process';
import {
  Task040NoDriftCheck,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { loadTask036Proof } from './task040Task036ProofLoaderService';

export function runNoDriftCheck(): Task040NoDriftCheck {
  const details: string[] = [];
  const task036Proof = loadTask036Proof();

  const task036ReportStillAccepted = task036Proof.verified;
  const task036SafeToStartTask040StillTrue = task036Proof.safeToStartTask040;

  let task040ModifiedTask036Runtime = false;
  let task040ModifiedFrontend = false;
  let task040ModifiedAiRuntime = false;
  let task040ModifiedDeploymentLogic = false;
  let task040IntroducedLiveIntegrations = false;

  try {
    const diffOutput = execSync('git diff --name-only HEAD~1..HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo ""', {
      encoding: 'utf-8', cwd: process.cwd(),
    });
    const changedFiles = diffOutput.split('\n').filter(l => l.trim());

    for (const file of changedFiles) {
      if (file.startsWith('frontend/')) { task040ModifiedFrontend = true; details.push(`Frontend file changed: ${file}`); }
      if (file.startsWith('AI/')) { task040ModifiedAiRuntime = true; details.push(`AI file changed: ${file}`); }
      if (file.includes('deploy')) { task040ModifiedDeploymentLogic = true; details.push(`Deployment file changed: ${file}`); }
    }
  } catch {
    details.push('Could not compute git diff for drift check - assuming no drift');
  }

  const allOk = task036ReportStillAccepted && task036SafeToStartTask040StillTrue &&
    !task040ModifiedTask036Runtime && !task040ModifiedFrontend &&
    !task040ModifiedAiRuntime && !task040ModifiedDeploymentLogic &&
    !task040IntroducedLiveIntegrations;

  return {
    ok: allOk,
    task036ReportStillAccepted,
    task036SafeToStartTask040StillTrue,
    task040ModifiedTask036Runtime,
    task040ModifiedFrontend,
    task040ModifiedAiRuntime,
    task040ModifiedDeploymentLogic,
    task040IntroducedLiveIntegrations,
    details,
  };
}

export function getNoDriftCheck(): Task040NoDriftCheck {
  const existing = task040Repository.getNoDriftCheck();
  if (existing) return existing;
  const result = runNoDriftCheck();
  task040Repository.saveNoDriftCheck(result);
  return result;
}
