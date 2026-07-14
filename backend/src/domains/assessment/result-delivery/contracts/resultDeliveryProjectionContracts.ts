export interface ResultDeliveryTeacherProjection {
  resultDeliveryJobId: string;
  studentRef: string;
  audienceType: string;
  deliveryChannel: string;
  jobStatus: string;
  safeJobSummary: string;
  allowedFields: string[];
  blockedFields: string[];
  summarySafe: boolean;
  answerKeySafe: boolean;
  rubricSafe: boolean;
  rawAnswerSafe: boolean;
  teacherOnlySafe: boolean;
  hiddenReasoningSafe: boolean;
  unreleasedGradeSafe: boolean;
  providerPayloadSafe: boolean;
  assessmentDataPresent: boolean;
}

export interface ResultDeliveryAdminProjection {
  resultDeliveryJobId: string;
  studentRef: string;
  audienceType: string;
  deliveryChannel: string;
  jobStatus: string;
  safeJobSummary: string;
  allowedFields: string[];
  blockedFields: string[];
  envelopeCount: number;
  attemptCount: number;
  receiptCount: number;
  mockMode: string;
  assessmentDataPresent: boolean;
}

export interface ResultDeliveryStudentSafeProjection {
  resultDeliveryJobId: string;
  studentRef: string;
  safeSubject: string;
  safePreview: string;
  jobStatus: string;
  safeJobSummary: string;
  hasApprovedSummary: boolean;
  hasApprovedSnapshot: boolean;
}

export interface ResultDeliveryParentBoundaryProjection {
  resultDeliveryJobId: string;
  studentRef: string;
  safeSubject: string;
  safePreview: string;
  jobStatus: string;
  safeJobSummary: string;
  hasApprovedSummary: boolean;
  boundaryEnforced: boolean;
  teacherOnlyFieldsRemoved: boolean;
}
