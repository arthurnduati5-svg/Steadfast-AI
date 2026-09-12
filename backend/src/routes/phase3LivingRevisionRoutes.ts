import { Router, Request, Response } from 'express';
import * as revisionNodeService from '../services/phase3RevisionNodeService';
import * as revisionEdgeService from '../services/phase3RevisionEdgeService';
import * as revisionNoteGraphService from '../services/phase3RevisionNoteGraphService';
import * as revisionDueResolverService from '../services/phase3RevisionDueResolverService';
import * as revisionLearnerResponseService from '../services/phase3RevisionLearnerResponseService';
import * as revisionTeacherOverviewService from '../services/phase3RevisionTeacherOverviewService';
import * as revisionAuditService from '../services/phase3RevisionAuditService';
import {
  validateRevisionContext,
  validateRevisionNodeCreateInput,
  validateRevisionGraphQuery,
  validateRevisionTeacherQuery,
  rejectForbiddenRevisionPayloadFields,
} from '../lib/phase3LivingRevisionValidation';

// R8-G.3A-D1C: canonical production runtime is durable (PostgreSQL) only.
// This mounted route uses ONLY async durable service functions backed by
// the canonical durable singleton. The legacy synchronous Map-backed store
// remains as explicit test compatibility and MUST NOT be imported here.

const router = Router();

function getSchoolContext(req: any): { schoolId: string; studentId?: string; teacherId?: string; role?: string } {
  return {
    schoolId: req.school?.id || req.schoolId || '',
    studentId: req.user?.id || req.studentId || '',
    teacherId: req.teacher?.id || req.teacherId || '',
    role: req.user?.role || req.role || 'student',
  };
}

// ─── Learner Routes ───────────────────────────────────────────

router.get('/learner', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const nodes = await revisionNodeService.listLearnerRevisionNodesDurable(ctx.schoolId, ctx.studentId || '');
    const dueItems = await revisionDueResolverService.deriveDueRevisionItemsDurable(ctx.schoolId, ctx.studentId || '');
    const view = revisionLearnerResponseService.buildLearnerRevisionView(
      ctx.schoolId,
      ctx.studentId || '',
      nodes,
      dueItems,
    );

    await revisionAuditService.recordRevisionAuditEventDurable({
      schoolId: ctx.schoolId,
      actorId: ctx.studentId || 'unknown',
      actorRole: ctx.role || 'student',
      studentId: ctx.studentId,
      eventType: 'learner_revision_viewed',
      safeReasonCodes: ['learner_viewed_revision'],
    });

    res.json(view);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load learner revision view.' });
  }
});

router.get('/learner/graph', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const query = {
      schoolId: ctx.schoolId,
      studentId: ctx.studentId || '',
    };
    const queryErr = validateRevisionGraphQuery(query);
    if (queryErr) {
      res.status(400).json({ error: queryErr.message });
      return;
    }

    const graph = await revisionNoteGraphService.getDurableLearnerRevisionNoteGraph(
      ctx.schoolId,
      query.studentId,
      req.query.includeArchived === 'true',
      req.query.topicId as string | undefined,
      req.query.objectiveId as string | undefined,
    );

    const view = revisionLearnerResponseService.buildLearnerRevisionGraphView(graph);

    await revisionAuditService.recordRevisionAuditEventDurable({
      schoolId: ctx.schoolId,
      actorId: ctx.studentId || 'unknown',
      actorRole: ctx.role || 'student',
      studentId: ctx.studentId,
      eventType: 'revision_graph_viewed',
      safeReasonCodes: ['learner_viewed_graph'],
    });

    res.json(view);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load revision graph.' });
  }
});

router.get('/learner/nodes', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const nodes = await revisionNodeService.listLearnerRevisionNodesDurable(ctx.schoolId, ctx.studentId || '');
    res.json({ nodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list revision nodes.' });
  }
});

router.post('/learner/nodes', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const input = {
      ...req.body,
      schoolId: ctx.schoolId,
      studentId: ctx.studentId,
    };

    const validationErr = validateRevisionNodeCreateInput(input);
    if (validationErr) {
      res.status(400).json({ error: validationErr.message });
      return;
    }

    const node = await revisionNodeService.createRevisionNodeDurable(input);

    await revisionAuditService.recordRevisionAuditEventDurable({
      schoolId: ctx.schoolId,
      actorId: ctx.studentId || 'unknown',
      actorRole: ctx.role || 'student',
      studentId: ctx.studentId,
      nodeId: node.nodeId,
      eventType: 'revision_node_created',
      safeReasonCodes: input.safeReasonCodes || [],
    });

    res.status(201).json({ node });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create revision node.' });
  }
});

router.get('/learner/nodes/:nodeId', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const node = await revisionNodeService.getRevisionNodeDurable(req.params.nodeId, ctx.schoolId);
    if (!node) {
      res.status(404).json({ error: 'Revision node not found.' });
      return;
    }

    if (node.schoolId !== ctx.schoolId) {
      res.status(403).json({ error: 'Cross-school access denied.' });
      return;
    }
    if (node.studentId && node.studentId !== ctx.studentId) {
      res.status(403).json({ error: 'Cross-learner access denied.' });
      return;
    }

    await revisionAuditService.recordRevisionAuditEventDurable({
      schoolId: ctx.schoolId,
      actorId: ctx.studentId || 'unknown',
      actorRole: ctx.role || 'student',
      studentId: ctx.studentId,
      nodeId: node.nodeId,
      eventType: 'revision_node_viewed',
    });

    res.json({ node });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get revision node.' });
  }
});

router.post('/learner/nodes/:nodeId/pin', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const node = await revisionNodeService.getRevisionNodeDurable(req.params.nodeId, ctx.schoolId);
    if (!node) {
      res.status(404).json({ error: 'Revision node not found.' });
      return;
    }
    if (node.schoolId !== ctx.schoolId) {
      res.status(403).json({ error: 'Cross-school access denied.' });
      return;
    }
    if (node.studentId && node.studentId !== ctx.studentId) {
      res.status(403).json({ error: 'Cross-learner access denied.' });
      return;
    }

    const updated = await revisionNodeService.pinRevisionNodeDurable(req.params.nodeId, ctx.schoolId);

    if (updated) {
      await revisionAuditService.recordRevisionAuditEventDurable({
        schoolId: ctx.schoolId,
        actorId: ctx.studentId || 'unknown',
        actorRole: ctx.role || 'student',
        studentId: ctx.studentId,
        nodeId: updated.nodeId,
        eventType: 'revision_node_pinned',
      });
    }

    res.json({ node: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to pin revision node.' });
  }
});

router.post('/learner/nodes/:nodeId/complete', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const node = await revisionNodeService.getRevisionNodeDurable(req.params.nodeId, ctx.schoolId);
    if (!node) {
      res.status(404).json({ error: 'Revision node not found.' });
      return;
    }
    if (node.schoolId !== ctx.schoolId) {
      res.status(403).json({ error: 'Cross-school access denied.' });
      return;
    }
    if (node.studentId && node.studentId !== ctx.studentId) {
      res.status(403).json({ error: 'Cross-learner access denied.' });
      return;
    }

    const updated = await revisionNodeService.completeRevisionNodeDurable(req.params.nodeId, ctx.schoolId);

    if (updated) {
      await revisionAuditService.recordRevisionAuditEventDurable({
        schoolId: ctx.schoolId,
        actorId: ctx.studentId || 'unknown',
        actorRole: ctx.role || 'student',
        studentId: ctx.studentId,
        nodeId: updated.nodeId,
        eventType: 'revision_node_completed',
      });
    }

    res.json({ node: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to complete revision node.' });
  }
});

router.post('/learner/nodes/:nodeId/snooze', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const node = await revisionNodeService.getRevisionNodeDurable(req.params.nodeId, ctx.schoolId);
    if (!node) {
      res.status(404).json({ error: 'Revision node not found.' });
      return;
    }
    if (node.schoolId !== ctx.schoolId) {
      res.status(403).json({ error: 'Cross-school access denied.' });
      return;
    }
    if (node.studentId && node.studentId !== ctx.studentId) {
      res.status(403).json({ error: 'Cross-learner access denied.' });
      return;
    }

    const updated = await revisionNodeService.snoozeRevisionNodeDurable(req.params.nodeId, ctx.schoolId);

    if (updated) {
      await revisionAuditService.recordRevisionAuditEventDurable({
        schoolId: ctx.schoolId,
        actorId: ctx.studentId || 'unknown',
        actorRole: ctx.role || 'student',
        studentId: ctx.studentId,
        nodeId: updated.nodeId,
        eventType: 'revision_node_snoozed',
      });
    }

    res.json({ node: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to snooze revision node.' });
  }
});

router.post('/learner/nodes/:nodeId/archive', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const node = await revisionNodeService.getRevisionNodeDurable(req.params.nodeId, ctx.schoolId);
    if (!node) {
      res.status(404).json({ error: 'Revision node not found.' });
      return;
    }
    if (node.schoolId !== ctx.schoolId) {
      res.status(403).json({ error: 'Cross-school access denied.' });
      return;
    }
    if (node.studentId && node.studentId !== ctx.studentId) {
      res.status(403).json({ error: 'Cross-learner access denied.' });
      return;
    }

    const updated = await revisionNodeService.archiveRevisionNodeDurable(req.params.nodeId, ctx.schoolId);

    if (updated) {
      await revisionAuditService.recordRevisionAuditEventDurable({
        schoolId: ctx.schoolId,
        actorId: ctx.studentId || 'unknown',
        actorRole: ctx.role || 'student',
        studentId: ctx.studentId,
        nodeId: updated.nodeId,
        eventType: 'revision_node_archived',
      });
    }

    res.json({ node: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to archive revision node.' });
  }
});

router.get('/learner/nodes/:nodeId/connections', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const node = await revisionNodeService.getRevisionNodeDurable(req.params.nodeId, ctx.schoolId);
    if (!node) {
      res.status(404).json({ error: 'Revision node not found.' });
      return;
    }
    if (node.schoolId !== ctx.schoolId) {
      res.status(403).json({ error: 'Cross-school access denied.' });
      return;
    }
    if (node.studentId && node.studentId !== ctx.studentId) {
      res.status(403).json({ error: 'Cross-learner access denied.' });
      return;
    }

    const connections = await revisionEdgeService.listNodeConnectionsDurable(req.params.nodeId, ctx.schoolId);
    res.json({ connections });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list connections.' });
  }
});

router.get('/learner/due', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const dueItems = await revisionDueResolverService.deriveDueRevisionItemsDurable(ctx.schoolId, ctx.studentId || '');
    res.json({ dueItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get due items.' });
  }
});

router.post('/learner/due/:dueItemId/complete', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const completed = await revisionDueResolverService.markRevisionDueItemCompletedDurable(req.params.dueItemId, ctx.schoolId);
    if (!completed) {
      res.status(404).json({ error: 'Revision due item not found.' });
      return;
    }

    await revisionAuditService.recordRevisionAuditEventDurable({
      schoolId: ctx.schoolId,
      actorId: ctx.studentId || 'unknown',
      actorRole: ctx.role || 'student',
      studentId: ctx.studentId,
      nodeId: completed.nodeId,
      eventType: 'revision_due_item_completed',
    });

    res.json({ dueItem: completed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to complete due item.' });
  }
});

router.get('/learner/actions', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const nodes = await revisionNodeService.listLearnerRevisionNodesDurable(ctx.schoolId, ctx.studentId || '');
    const actions = nodes.map((n) => ({
      nodeId: n.nodeId,
      safeTitle: n.safeTitle,
      recommendedActions: revisionLearnerResponseService.buildLearnerRevisionActionView(n),
    }));

    res.json({ actions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get revision actions.' });
  }
});

router.get('/learner/suggestions', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    const graph = await revisionNoteGraphService.getDurableLearnerRevisionNoteGraph(ctx.schoolId, ctx.studentId || '');
    const view = revisionLearnerResponseService.buildLearnerRevisionGraphView(graph);

    res.json({ suggestions: view.connectionSuggestions, dueItems: view.dueItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get suggestions.' });
  }
});

// ─── Teacher Routes ───────────────────────────────────────────

router.get('/teacher/overview', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required for revision overview.' });
      return;
    }

    const overview = await revisionTeacherOverviewService.getTeacherRevisionOverviewDurable(
      ctx.schoolId,
      ctx.teacherId || '',
      req.query.classId as string | undefined,
      req.query.subjectId as string | undefined,
    );

    await revisionAuditService.recordRevisionAuditEventDurable({
      schoolId: ctx.schoolId,
      actorId: ctx.teacherId || ctx.studentId || 'unknown',
      actorRole: ctx.role || 'unknown',
      teacherId: ctx.teacherId,
      classId: req.query.classId as string | undefined,
      eventType: 'revision_teacher_overview_viewed',
    });

    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get teacher overview.' });
  }
});

router.get('/teacher/learners/:studentId', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required.' });
      return;
    }

    const summary = await revisionTeacherOverviewService.getLearnerRevisionTeacherSummaryDurable(
      ctx.schoolId,
      ctx.teacherId || '',
      req.params.studentId,
    );

    if (!summary) {
      res.status(404).json({ error: 'Learner revision summary not found.' });
      return;
    }

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get learner summary.' });
  }
});

router.get('/teacher/due', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required.' });
      return;
    }

    const queue = await revisionTeacherOverviewService.getRevisionDueSupportQueueDurable(ctx.schoolId, ctx.teacherId || '');
    res.json({ dueItems: queue });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get due queue.' });
  }
});

router.get('/teacher/source-required', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required.' });
      return;
    }

    const queue = await revisionTeacherOverviewService.getRevisionSourceRequiredQueueDurable(ctx.schoolId, ctx.teacherId || '');
    res.json({ nodes: queue });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get source-required queue.' });
  }
});

router.get('/teacher/support-needed', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required.' });
      return;
    }

    const queue = await revisionTeacherOverviewService.getTeacherSupportRevisionQueueDurable(ctx.schoolId, ctx.teacherId || '');
    res.json({ nodes: queue });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get support needed queue.' });
  }
});

router.get('/teacher/mistake-repair', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required.' });
      return;
    }

    const nodes = await revisionTeacherOverviewService.getRevisionMistakeRepairSummaryDurable(ctx.schoolId, ctx.teacherId || '');
    res.json({ nodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get mistake repair summary.' });
  }
});

router.get('/teacher/topics/:topicId', async (req: Request, res: Response) => {
  try {
    const ctx = getSchoolContext(req);
    const ctxErr = validateRevisionContext(ctx);
    if (ctxErr) {
      res.status(400).json({ error: ctxErr.message });
      return;
    }

    if (ctx.role !== 'teacher' && ctx.role !== 'admin' && ctx.role !== 'internal') {
      res.status(403).json({ error: 'Teacher role required.' });
      return;
    }

    const overview = await revisionTeacherOverviewService.getTeacherRevisionOverviewDurable(
      ctx.schoolId,
      ctx.teacherId || '',
    );

    const topicRow = overview.topicRows.find((t) => t.topicId === req.params.topicId);
    if (!topicRow) {
      res.status(404).json({ error: 'Topic revision summary not found.' });
      return;
    }

    res.json(topicRow);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get topic summary.' });
  }
});

export default router;
