import { describe, it, expect } from 'vitest';
import {
  resolveTask040ActorRole,
  isTask040AllowedActorRole,
  isTask040DeniedActorRole,
} from '../contracts/task040BackendFreezeContracts';

describe('Task 040 - Role Security', () => {
  it('resolveTask040ActorRole returns unknown for invalid role', () => {
    expect(resolveTask040ActorRole('nonexistent_role_xyz')).toBe('unknown');
  });

  it('resolveTask040ActorRole is case insensitive', () => {
    expect(resolveTask040ActorRole('ADMIN')).toBe('admin');
    expect(resolveTask040ActorRole('Student')).toBe('student');
    expect(resolveTask040ActorRole('Teacher')).toBe('teacher');
  });

  it('isTask040AllowedActorRole returns true for admin', () => {
    expect(isTask040AllowedActorRole('admin')).toBe(true);
  });

  it('isTask040AllowedActorRole returns false for denied roles', () => {
    expect(isTask040AllowedActorRole('student')).toBe(false);
    expect(isTask040AllowedActorRole('teacher')).toBe(false);
    expect(isTask040AllowedActorRole('parent')).toBe(false);
  });

  it('isTask040DeniedActorRole returns true for denied roles', () => {
    expect(isTask040DeniedActorRole('student')).toBe(true);
    expect(isTask040DeniedActorRole('teacher')).toBe(true);
    expect(isTask040DeniedActorRole('parent')).toBe(true);
  });

  it('isTask040DeniedActorRole returns false for allowed roles', () => {
    expect(isTask040DeniedActorRole('admin')).toBe(false);
    expect(isTask040DeniedActorRole('internal_operator')).toBe(false);
  });
});
