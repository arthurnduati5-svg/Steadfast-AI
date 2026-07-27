import { expect } from 'vitest';
import type {
  CurriculumGraphCommandResult,
  CurriculumGraphFailureResult,
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphEdge,
} from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

export function requireSuccess<T extends CurriculumGraphCommandResult>(
  result: CurriculumGraphCommandResult | CurriculumGraphFailureResult,
): T {
  if (!result || typeof result !== 'object' || !('success' in result) || !result.success) {
    const f = result as CurriculumGraphFailureResult;
    throw new Error(`Expected success but received ${f.error?.code ?? 'unknown'}`);
  }
  return result as unknown as T;
}

export function expectVersionCreated(
  result: CurriculumGraphCommandResult | CurriculumGraphFailureResult,
): { version: CurriculumGraphVersion } {
  expect(result.success).toBe(true);
  return requireSuccess(result) as unknown as { version: CurriculumGraphVersion };
}

export function expectNodeMutation(
  result: CurriculumGraphCommandResult | CurriculumGraphFailureResult,
): { node: CurriculumGraphNode; versionRevision: number } {
  expect(result.success).toBe(true);
  return requireSuccess(result) as unknown as { node: CurriculumGraphNode; versionRevision: number };
}

export function expectEdgeMutation(
  result: CurriculumGraphCommandResult | CurriculumGraphFailureResult,
): { edge: CurriculumGraphEdge; versionRevision: number } {
  expect(result.success).toBe(true);
  return requireSuccess(result) as unknown as { edge: CurriculumGraphEdge; versionRevision: number };
}

export function expectLifecycleTransition(
  result: CurriculumGraphCommandResult | CurriculumGraphFailureResult,
): { version: CurriculumGraphVersion } {
  expect(result.success).toBe(true);
  return requireSuccess(result) as unknown as { version: CurriculumGraphVersion };
}

export function expectActivation(
  result: CurriculumGraphCommandResult | CurriculumGraphFailureResult,
): { activatedVersion: CurriculumGraphVersion } {
  expect(result.success).toBe(true);
  return requireSuccess(result) as unknown as { activatedVersion: CurriculumGraphVersion };
}
