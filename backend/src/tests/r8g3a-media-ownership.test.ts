import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A Media — separated ownership proof (static).
// MediaAsset: durable canonical owner is mediaAssetService (Prisma).
// VideoLearningSession: durable learning state carried on the TutorState
// row + LearningEvent mirror (no dedicated Video* table, no MediaAsset
// creation on the video routes). VideoLearningAnalytics: derived
// aggregation. Video routes must not own MediaAsset creation.
const SRC = path.resolve(__dirname, '..');

describe('R8-G.3A media ownership separation', () => {
  it('mediaAssetService owns durable MediaAsset writes', () => {
    const svc = fs.readFileSync(path.join(SRC, 'services/mediaAssetService.ts'), 'utf-8');
    expect(svc).toContain('MediaAsset');
    expect(svc).toMatch(/\$executeRawUnsafe|\$queryRawUnsafe|mediaAsset\.(create|findUnique|upsert)/);
  });

  it('video learning routes do not own MediaAsset creation', () => {
    const sessions = fs.readFileSync(path.join(SRC, 'routes/videoLearningSessions.ts'), 'utf-8');
    const analytics = fs.readFileSync(path.join(SRC, 'routes/videoLearningAnalytics.ts'), 'utf-8');
    expect(sessions).not.toContain('mediaAssetService');
    expect(analytics).not.toContain('mediaAssetService');
  });

  it('video session state rides the durable TutorState path', () => {
    const stateSvc = fs.readFileSync(
      path.join(SRC, 'services/videoLearningSessionStateService.ts'),
      'utf-8',
    );
    expect(stateSvc).toContain('tutorStateService');
  });
});
