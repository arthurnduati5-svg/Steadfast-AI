export interface ResultReportCardAccessSafeEnvelope {
  data: unknown
  safe: boolean
}

export interface ResultReportCardAccessGrant {
  id: string
  schoolId: string
  grantType: string
  grantedTo: string
  expiresAt: string
}

export interface ResultReportCardAccessTokenIntent {
  id: string
  schoolId: string
  intentType: string
  status: string
}

export interface ResultReportCardAccessAcknowledgement {
  id: string
  schoolId: string
  acknowledgedAt: string
}
