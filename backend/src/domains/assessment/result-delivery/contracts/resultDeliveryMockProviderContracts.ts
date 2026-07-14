import type { ResultDeliveryMockProviderStatus, ResultDeliveryMockSimulationMode } from './resultDeliveryContracts';

export interface ResultDeliveryMockProvider {
  resultDeliveryMockProviderId: string;
  schoolId: string;
  providerName: string;
  providerStatus: ResultDeliveryMockProviderStatus;
  supportedChannelsJson: Record<string, unknown> | null;
  simulationMode: ResultDeliveryMockSimulationMode;
  safeProviderSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  voidedAt: string | null;
}

export interface CreateMockProviderInput {
  providerName: string;
  supportedChannelsJson?: Record<string, unknown> | null;
  simulationMode: ResultDeliveryMockSimulationMode;
  safeProviderSummary: string;
}
