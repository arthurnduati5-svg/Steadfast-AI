import { describe, it, expect } from 'vitest';
import {
  CurriculumSource, ContentApprovalStatus, CurriculumGovernanceVerdict,
} from '../contracts/task022CurriculumGovernanceContracts';

describe('Continuity: Task 022 Contracts', () => {
  it('CurriculumSource type is importable', () => {
    const src: CurriculumSource = 'ministry_approved';
    expect(src).toBe('ministry_approved');
  });

  it('ContentApprovalStatus type is importable', () => {
    const status: ContentApprovalStatus = 'approved';
    expect(status).toBe('approved');
  });

  it('CurriculumGovernanceVerdict type is importable', () => {
    const verdict: CurriculumGovernanceVerdict = 'approved';
    expect(verdict).toBe('approved');
  });
});
