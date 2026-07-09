import { describe, it, expect } from 'vitest';
import {
  TASK032_FORBIDDEN_OUTPUT_FIELDS,
  TASK032_FORBIDDEN_OUTPUT_PATTERNS,
  Task032CanarySafeView,
  Task032CanaryEvidenceEvent,
  Task032CanaryMonitoringSnapshotPlaceholder,
  Task032CanaryDiagnosticsResult
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - No Private Data Leak Contract', () => {
  it('should define forbidden output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toBeDefined();
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS.length).toBeGreaterThan(0);
  });

  it('should forbid studentName in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('studentName');
  });

  it('should forbid studentEmail in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('studentEmail');
  });

  it('should forbid studentPhone in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('studentPhone');
  });

  it('should forbid rawChat in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
  });

  it('should forbid rawStudentWork in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('rawStudentWork');
  });

  it('should forbid safeguardingRawNotes in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('safeguardingRawNotes');
  });

  it('should forbid privateDeenText in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('privateDeenText');
  });

  it('should forbid answerKey in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
  });

  it('should forbid providerPrompt in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('providerPrompt');
  });

  it('should forbid providerResponse in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('providerResponse');
  });

  it('should forbid hiddenReasoning in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
  });

  it('should forbid rawTeacherData in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('rawTeacherData');
  });

  it('should forbid rawParentData in output fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('rawParentData');
  });

  it('should have forbidden output patterns defined', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_PATTERNS.length).toBeGreaterThan(0);
  });

  it('should forbid raw student chat pattern', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_PATTERNS).toContain('raw student chat');
  });

  it('should forbid AI prompt pattern', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_PATTERNS).toContain('AI prompt');
  });
});
