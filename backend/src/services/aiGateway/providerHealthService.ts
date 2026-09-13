import type { ModelProviderAdapter, ProviderStatus } from './modelProviderContracts';
import { MockModelAdapter } from './providers/mockModelAdapter';
import { LocalModelAdapter } from './providers/localModelAdapter';
import { CloudModelAdapter } from './providers/cloudModelAdapter';

export interface ProviderHealthEntry {
  providerId: string;
  status: ProviderStatus;
  reason?: string;
}

export interface ProviderHealthInput {
  providerId?: string;
}

export class ProviderHealthService {
  private adapters: Map<string, ModelProviderAdapter> = new Map();

  constructor() {
    this.registerAdapter(new MockModelAdapter());
    this.registerAdapter(new LocalModelAdapter());
    this.registerAdapter(new CloudModelAdapter());
  }

  registerAdapter(adapter: ModelProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  async getProviderHealth(input?: ProviderHealthInput): Promise<ProviderHealthEntry[]> {
    const results: ProviderHealthEntry[] = [];

    if (input?.providerId) {
      const adapter = this.adapters.get(input.providerId);
      if (!adapter) {
        results.push({ providerId: input.providerId, status: 'unavailable', reason: 'Unknown provider' });
        return results;
      }
      const status = await adapter.getStatus();
      results.push({
        providerId: adapter.providerId,
        status,
        reason: status === 'available' ? undefined : `Provider status: ${status}`,
      });
      return results;
    }

    for (const adapter of this.adapters.values()) {
      try {
        const status = await adapter.getStatus();
        results.push({
          providerId: adapter.providerId,
          status,
          reason: status === 'available' ? undefined : `Provider status: ${status}`,
        });
      } catch {
        results.push({ providerId: adapter.providerId, status: 'unavailable', reason: 'Health check failed' });
      }
    }

    return results;
  }

  getAdapter(providerId: string): ModelProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  getAllAdapters(): ModelProviderAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const defaultProviderHealthService = new ProviderHealthService();
