import type {
  ExternalSchoolIdentityPayload,
  RosterSyncInput,
  RosterSyncDryRunResult,
  SchoolSystemProviderName,
  SchoolSystemProviderMode,
} from '../contracts/schoolSystemBridgeContracts';
import { getDefaultSchoolProviderMode } from '../contracts/schoolSystemBridgeContracts';

export interface LiveSchoolConnectorConfigSchema {
  providerName: SchoolSystemProviderName;
  baseUrl: string;
  timeoutMs: number;
  retryLimit: number;
}

export const FUTURE_SCHOOL_CONNECTOR_ENV_VARS: Record<string, string> = {
  SCHOOL_CONNECTOR_MODE: 'Set to "live_enabled" when all gates pass (future activation task)',
  SCHOOL_CONNECTOR_PROVIDER: 'The school system provider name (e.g. "future_school_sis")',
  SCHOOL_CONNECTOR_BASE_URL: 'Base URL for the school system API',
  SCHOOL_CONNECTOR_TIMEOUT_MS: 'Timeout in milliseconds for school connector calls',
  SCHOOL_CONNECTOR_RETRY_LIMIT: 'Number of retry attempts on failure',
  SCHOOL_CONNECTOR_WEBHOOK_SECRET_NAME: 'Name of the secret storing the webhook verification secret',
  SCHOOL_CONNECTOR_CLIENT_ID_NAME: 'Name of the secret storing the OAuth client ID',
  SCHOOL_CONNECTOR_CLIENT_SECRET_NAME: 'Name of the secret storing the OAuth client secret',
};

export class DisabledLiveSchoolSystemAdapter {
  public readonly name: SchoolSystemProviderName = 'future_school_sis';
  public readonly mode: SchoolSystemProviderMode = 'disabled_live';

  fetchVerifiedIdentity(_externalUserId: string, _schoolId: string): ExternalSchoolIdentityPayload {
    const empty: ExternalSchoolIdentityPayload = {
      externalUserId: '',
      schoolId: '',
      role: 'unknown',
    };
    return empty;
  }

  fetchRoster(_schoolId: string, _schoolYear?: string): RosterSyncInput {
    return {
      schoolId: '',
      students: [],
      teachers: [],
      classes: [],
      subjects: [],
      enrollments: [],
      teacherAssignments: [],
    };
  }

  getRequiredFutureConfig(): LiveSchoolConnectorConfigSchema {
    return {
      providerName: this.name,
      baseUrl: '',
      timeoutMs: 30000,
      retryLimit: 3,
    };
  }

  getFutureEnvVarNames(): string[] {
    return Object.keys(FUTURE_SCHOOL_CONNECTOR_ENV_VARS);
  }
}

export const disabledLiveSchoolSystemAdapter = new DisabledLiveSchoolSystemAdapter();
