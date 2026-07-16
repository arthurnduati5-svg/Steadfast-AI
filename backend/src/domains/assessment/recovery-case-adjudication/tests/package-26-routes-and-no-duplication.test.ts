import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const routeFilePath = path.resolve(__dirname, '../../../../routes/recoveryCaseAdjudication.ts');
const indexPath = path.resolve(__dirname, '../../../../index.ts');

describe('Package 26 - Routes and No Duplication', () => {
  let routeContent: string;
  let indexContent: string;

  beforeAll(() => {
    routeContent = fs.readFileSync(routeFilePath, 'utf-8');
    indexContent = fs.readFileSync(indexPath, 'utf-8');
  });

  describe('Route file contains required route groups', () => {
    it('contains /adjudication-readiness routes', () => {
      expect(routeContent).toContain("'/adjudication-readiness'");
      expect(routeContent).toContain("'/adjudication-readiness/:id'");
      expect(routeContent).toContain("'/adjudication-readiness/by-student/:studentRef'");
      expect(routeContent).toContain("'/adjudication-readiness/by-plan/:planId'");
      expect(routeContent).toContain("'/adjudication-readiness/by-queue-item/:queueItemId'");
      expect(routeContent).toContain("'/adjudication-readiness/by-status/:status'");
      expect(routeContent).toContain("'/adjudication-readiness/:id/ready'");
      expect(routeContent).toContain("'/adjudication-readiness/:id/review-ready'");
      expect(routeContent).toContain("'/adjudication-readiness/:id/stale'");
      expect(routeContent).toContain("'/adjudication-readiness/:id/block'");
      expect(routeContent).toContain("'/adjudication-readiness/:id/suppress'");
      expect(routeContent).toContain("'/adjudication-readiness/:id/void'");
    });

    it('contains /review-sessions routes', () => {
      expect(routeContent).toContain("'/review-sessions/:id/start'");
      expect(routeContent).toContain("'/review-sessions/:id/needs-second-review'");
      expect(routeContent).toContain("'/review-sessions/:id/needs-more-evidence'");
    });

    it('contains /evidence-bundles routes', () => {
      expect(routeContent).toContain("'/evidence-bundles/:id/verify-digest'");
    });

    it('contains /review-checklists routes', () => {
      expect(routeContent).toContain("'/review-checklists/:id/evaluate'");
    });

    it('contains /conflict-declarations routes', () => {
      expect(routeContent).toContain("'/conflict-declarations/:id/evaluate'");
      expect(routeContent).toContain("'/conflict-declarations/:id/no-conflict'");
      expect(routeContent).toContain("'/conflict-declarations/:id/hard-conflict'");
      expect(routeContent).toContain("'/conflict-declarations/:id/needs-alternate-reviewer'");
    });

    it('contains /reviewer-decisions routes', () => {
      expect(routeContent).toContain("'/reviewer-decisions/:id/needs-second-review'");
      expect(routeContent).toContain("'/reviewer-decisions/:id/needs-more-evidence'");
      expect(routeContent).toContain("'/reviewer-decisions/:id/suppress'");
    });

    it('contains /priority-overrides routes', () => {
      expect(routeContent).toContain("'/priority-overrides/:id/approve-future-use'");
      expect(routeContent).toContain("'/priority-overrides/:id/reject'");
      expect(routeContent).toContain("'/priority-overrides/:id/suppress'");
    });

    it('contains /second-review-requests routes', () => {
      expect(routeContent).toContain("'/second-review-requests/:id/awaiting-reviewer'");
      expect(routeContent).toContain("'/second-review-requests/:id/review-received'");
      expect(routeContent).toContain("'/second-review-requests/:id/suppress'");
    });

    it('contains /consensus-records routes', () => {
      expect(routeContent).toContain("'/consensus-records/evaluate'");
      expect(routeContent).toContain("'/consensus-records/:id/consensus'");
      expect(routeContent).toContain("'/consensus-records/:id/partial-consensus'");
      expect(routeContent).toContain("'/consensus-records/:id/disagreement'");
      expect(routeContent).toContain("'/consensus-records/:id/needs-more-evidence'");
    });

    it('contains /disagreement-resolutions routes', () => {
      expect(routeContent).toContain("'/disagreement-resolutions/:id/approve-future-use'");
      expect(routeContent).toContain("'/disagreement-resolutions/:id/suppress'");
    });

    it('contains /queue-dispositions routes', () => {
      expect(routeContent).toContain("'/queue-dispositions/:id/approve-future-use'");
      expect(routeContent).toContain("'/queue-dispositions/:id/suppress'");
    });

    it('contains /quality-samples routes', () => {
      expect(routeContent).toContain("'/quality-samples/calculate'");
      expect(routeContent).toContain("'/quality-samples/selected'");
      expect(routeContent).toContain("'/quality-samples/by-policy/:policyVersion'");
    });

    it('contains /adjudication-summaries routes', () => {
      expect(routeContent).toContain("'/adjudication-summaries/:id/refresh'");
    });
  });

  describe('Route mounting in index.ts', () => {
    it('mounts with path /api/question-bank/recovery-case-adjudication', () => {
      expect(indexContent).toContain("'/api/question-bank/recovery-case-adjudication'");
    });

    it('uses schoolAuthMiddleware', () => {
      const line = indexContent.split('\n').find(l => l.includes('recovery-case-adjudication'));
      expect(line).toBeTruthy();
      expect(line!).toContain('schoolAuthMiddleware');
    });

    it('uses requireVerifiedSchoolContext', () => {
      const line = indexContent.split('\n').find(l => l.includes('recovery-case-adjudication'));
      expect(line!).toContain('requireVerifiedSchoolContext');
    });
  });

  describe('Forbidden routes are NOT present', () => {
    const forbidden = [
      '/assign', '/reassign', '/dispatch', '/send', '/notify', '/publish', '/execute', '/activate',
      '/authorize-live', '/close-live', '/apply-override', '/rerank', '/update-priority', '/update-queue',
      '/sync', '/calendar', '/create-homework', '/create-practice', '/mutate-score', '/mutate-mastery', '/regrade',
    ];

    for (const action of forbidden) {
      it(`does NOT contain ${action} route`, () => {
        const routesInFile = routeContent.match(/router\.(get|post|put|patch|delete)\(['"][^'"]+['"]/g) || [];
        for (const r of routesInFile) {
          expect(r).not.toContain(action);
        }
      });
    }
  });

  describe('No duplication with Package 25 routes', () => {
    it('Package 26 routes do not duplicate Package 25 triage routes', () => {
      const p25Routes = ['/triage-runs', '/triage-entries', '/allocation-drafts', '/escalation-drafts', '/review-window-drafts', '/duplicate-suppression-log', '/capacity-snapshots'];
      for (const p25 of p25Routes) {
        expect(routeContent).not.toContain(`'${p25}`);
        expect(routeContent).not.toContain(`"${p25}`);
      }
    });

    it('Package 26 route file path is distinct from Package 25', () => {
      expect(routeFilePath).toContain('recoveryCaseAdjudication');
      expect(indexContent).toContain("'./routes/recoveryCaseAdjudication'");
      expect(indexContent).toContain("'/api/question-bank/recovery-case-adjudication'");
    });
  });
});
