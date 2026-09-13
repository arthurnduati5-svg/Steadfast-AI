import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import type { CurriculumAdapter, CurriculumAdapterRegistry } from './curriculumAdapterContracts';
import type { CurriculumResolveInput } from './curriculumRuntimeContracts';

/**
 * Future adapter names reserved for later implementation.
 * These adapters do not exist yet.
 * Only Cambridge and Madrasa/Deen are active now.
 */
export const FUTURE_ADAPTER_NAMES = [
  'KenyanCBCAdapter_future',
  'InternalSchoolCurriculumAdapter_future',
  'HomeschoolCurriculumAdapter_future',
  'CustomCurriculumAdapter_future',
] as const;

export class FutureCurriculumAdapterRegistry implements CurriculumAdapterRegistry {
  private adapters: Map<string, CurriculumAdapter> = new Map();

  register(adapter: CurriculumAdapter): void {
    this.adapters.set(adapter.track, adapter);
  }

  getAdapter(track: CurriculumTrack): CurriculumAdapter | null {
    return this.adapters.get(track) || null;
  }

  listAdapters(): CurriculumAdapter[] {
    return Array.from(this.adapters.values());
  }

  resolveBestAdapter(input: CurriculumResolveInput): CurriculumAdapter | null {
    const { curriculumTrackHint } = input;

    if (curriculumTrackHint && curriculumTrackHint !== 'unknown' && curriculumTrackHint !== 'mixed_academic_deen' && curriculumTrackHint !== 'general_enrichment') {
      const adapter = this.adapters.get(curriculumTrackHint);
      if (adapter) return adapter;
    }

    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(input)) {
        return adapter;
      }
    }

    return null;
  }

  getFutureAdapterNames(): readonly string[] {
    return FUTURE_ADAPTER_NAMES;
  }

  isFutureAdapter(name: string): boolean {
    return FUTURE_ADAPTER_NAMES.includes(name as typeof FUTURE_ADAPTER_NAMES[number]);
  }
}
