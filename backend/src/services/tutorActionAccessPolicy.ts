export type TutorActionRole = 'student' | 'teacher' | 'admin' | 'system';

export interface TutorActionAccessRequest {
  requesterSchoolId: string;
  requesterStudentId?: string;
  requesterRole: TutorActionRole;
  targetSchoolId: string;
  targetStudentId: string;
  targetTutorLearnerId?: string;
}

export interface TutorActionAccessResult {
  allowed: boolean;
  reasonCodes: string[];
}

export function checkTutorActionAccess(req: TutorActionAccessRequest): TutorActionAccessResult {
  if (req.requesterSchoolId !== req.targetSchoolId) {
    return { allowed: false, reasonCodes: ['cross_school_access_denied'] };
  }

  switch (req.requesterRole) {
    case 'student':
      if (req.requesterStudentId !== req.targetStudentId) {
        return { allowed: false, reasonCodes: ['cross_student_access_denied'] };
      }
      return { allowed: true, reasonCodes: ['own_student_access'] };

    case 'teacher':
      return { allowed: true, reasonCodes: ['teacher_assigned_access'] };

    case 'admin':
      return { allowed: true, reasonCodes: ['admin_diagnostics_access'] };

    case 'system':
      return { allowed: true, reasonCodes: ['system_access'] };

    default:
      return { allowed: false, reasonCodes: ['unknown_role'] };
  }
}
