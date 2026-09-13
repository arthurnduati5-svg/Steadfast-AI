export type QuizModeRole = 'student' | 'teacher' | 'admin' | 'system';

export interface QuizModeAccessRequest {
  requesterSchoolId: string;
  requesterStudentId?: string;
  requesterRole: QuizModeRole;
  targetSchoolId: string;
  targetStudentId: string;
  targetTutorLearnerId?: string;
}

export interface QuizModeAccessResult {
  allowed: boolean;
  reasonCodes: string[];
}

export function checkQuizModeAccess(req: QuizModeAccessRequest): QuizModeAccessResult {
  if (!req.requesterSchoolId) {
    return { allowed: false, reasonCodes: ['missing_school_context'] };
  }
  if (!req.requesterStudentId && req.requesterRole === 'student') {
    return { allowed: false, reasonCodes: ['missing_learner_context'] };
  }
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
