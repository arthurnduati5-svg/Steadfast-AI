export type ApiScopeDecision = {
  allowed: boolean;
  reason:
    | 'allowed'
    | 'missing_auth'
    | 'missing_scope'
    | 'cross_student_forbidden'
    | 'cross_school_forbidden'
    | 'role_forbidden'
    | 'safeguarding_role_required'
    | 'legacy_route_blocked';
  actorId?: string;
  studentId?: string;
  schoolId?: string;
  role?: string;
};

export type ApiScopeCheckInput = {
  actorId: string;
  actorSchoolId: string;
  actorRole: string;
  targetStudentId?: string;
  targetSchoolId?: string;
  requiredRole?: string;
};
