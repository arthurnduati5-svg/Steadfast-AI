// DIAG probe: verify computeMediaStreamScore runtime behavior at this SHA.
// Read-only. Run: npx tsx tools/engineering/diag-media-verify.ts
import { computeMediaStreamScore, computeStudyStreamScore } from '../../src/media-stream/scoring';

const asset: any = {
  topic: 'algebra',
  kind: 'video',
  subject: 'maths',
  durationSec: 600,
  sourceTrust: 'verified',
  updatedAt: new Date().toISOString(),
};
const ctx: any = {
  activeTopic: 'algebra',
  weakTopics: ['fractions'],
  streamMode: 'study',
  schoolLevel: 'secondary',
  language: 'en',
  learningNeed: 'practice',
  examMode: false,
  focusMode: false,
  preferredKind: 'video',
};
for (const [name, fn] of [
  ['computeMediaStreamScore', computeMediaStreamScore],
  ['computeStudyStreamScore', computeStudyStreamScore],
] as const) {
  try {
    const r = (fn as any)(asset, ctx);
    console.log(name + ' OK score=' + r);
  } catch (e: any) {
    console.log(name + ' THROW ' + (e && e.constructor && e.constructor.name) + ': ' + (e && e.message));
  }
}
