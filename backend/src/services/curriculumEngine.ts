import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import type {
  CurriculumContextPacket,
  CurriculumResolveInput,
  CurriculumSubjectContext,
} from './curriculumRuntimeContracts';
import type { SubjectModuleGroup, SubjectModuleProfile, SubjectModuleStatus } from './subjectModuleContracts';
import { resolveCurriculumContext } from './curriculumContextService';
import { FutureCurriculumAdapterRegistry } from './futureCurriculumAdapterRegistry';
import { CambridgeCurriculumAdapter } from './cambridgeCurriculumAdapter';
import { MadrasaDeenCurriculumAdapter } from './madrasaDeenCurriculumAdapter';
import { cambridgeSubjectSeeds } from './curriculumSeeds/cambridgeSubjectSeeds';
import { madrasaDeenSubjectSeeds } from './curriculumSeeds/madrasaDeenSubjectSeeds';
import { listSubjectModules as listRegistryModules } from './subjectModuleRegistry';

export class CurriculumEngine {
  private registry: FutureCurriculumAdapterRegistry;

  constructor() {
    this.registry = new FutureCurriculumAdapterRegistry();
    this.registry.register(new CambridgeCurriculumAdapter());
    this.registry.register(new MadrasaDeenCurriculumAdapter());
  }

  resolve(input: CurriculumResolveInput): CurriculumContextPacket {
    return resolveCurriculumContext(input, this.registry);
  }

  resolveForTutorTurn(input: CurriculumResolveInput): CurriculumContextPacket {
    return this.resolve(input);
  }

  listSupportedTracks(): CurriculumTrack[] {
    return ['cambridge_academic', 'madrasa_deen', 'mixed_academic_deen', 'general_enrichment', 'unknown'];
  }

  listSupportedSubjects(input?: {
    curriculumTrack?: CurriculumTrack;
  }): CurriculumSubjectContext[] {
    const allSeeds = [...cambridgeSubjectSeeds, ...madrasaDeenSubjectSeeds];

    const filtered = input?.curriculumTrack
      ? allSeeds.filter(s => s.curriculumTrack === input.curriculumTrack)
      : allSeeds;

    return filtered.map(s => ({
      subjectId: s.subjectId,
      name: s.name,
      normalizedName: s.name.toLowerCase().trim(),
      curriculumTrack: s.curriculumTrack,
      category: s.category,
      aliases: [...s.aliases],
    }));
  }

  listSubjectModules(input?: {
    group?: SubjectModuleGroup;
    status?: SubjectModuleStatus;
  }): SubjectModuleProfile[] {
    return listRegistryModules(input);
  }

  getRegistry(): FutureCurriculumAdapterRegistry {
    return this.registry;
  }
}
