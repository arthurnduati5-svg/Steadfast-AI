import type {
  CurriculumContextPacket,
  CurriculumResolveInput,
  CurriculumSubjectContext,
  CurriculumTopicContext,
  CurriculumTrack,
} from './curriculumRuntimeContracts';
import type { CurriculumTrack as SchoolCurriculumTrack } from './schoolAuthBridgeContracts';

export interface CurriculumAdapter {
  track: CurriculumTrack;

  canHandle(input: CurriculumResolveInput): boolean;

  resolveSubject(input: CurriculumResolveInput): CurriculumSubjectContext | null;

  resolveTopic(input: CurriculumResolveInput): CurriculumTopicContext | null;

  buildContext(input: CurriculumResolveInput): CurriculumContextPacket;
}

export interface CurriculumAdapterRegistry {
  register(adapter: CurriculumAdapter): void;
  getAdapter(track: CurriculumTrack): CurriculumAdapter | null;
  listAdapters(): CurriculumAdapter[];
  resolveBestAdapter(input: CurriculumResolveInput): CurriculumAdapter | null;
}
