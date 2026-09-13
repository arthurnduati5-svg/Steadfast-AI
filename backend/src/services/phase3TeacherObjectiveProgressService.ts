import type {
  Phase3TeacherObjectiveProgressView,
  Phase3TeacherObjectiveProgressRow,
} from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';

export class Phase3TeacherObjectiveProgressService {
  getTeacherObjectiveProgressView(schoolId: string, teacherId: string): Phase3TeacherObjectiveProgressView {
    const rows = phase3ObjectiveRepository.listTeacherObjectiveProgress(schoolId, teacherId);
    return {
      schoolId,
      teacherId,
      rows,
      totalObjectives: rows.length,
      generatedAt: new Date().toISOString(),
    };
  }

  getClassObjectiveProgress(schoolId: string, classId: string): Phase3TeacherObjectiveProgressView {
    const objectives = phase3ObjectiveRepository.listObjectivesByClass(schoolId, classId);
    const teacherId = objectives.find(o => o.teacherId)?.teacherId || '';
    const rows: Phase3TeacherObjectiveProgressRow[] = objectives.map(obj => ({
      objectiveId: obj.objectiveId,
      classId,
      subjectId: obj.subjectId,
      topicId: obj.topicId,
      skillId: obj.skillId,
      objectiveTitle: obj.title,
      successCriteriaCount: obj.successCriteria.length,
      studentsNotStartedCount: 0,
      studentsEarlySignalCount: 0,
      studentsStillLearningCount: 0,
      studentsGettingBetterCount: 0,
      studentsAlmostThereCount: 0,
      studentsConfidentCount: 0,
      studentsNeedingRescueCount: 0,
      studentsNeedingTeacherSupportCount: 0,
      studentsSourceRequiredCount: 0,
      safeCommonPatternSummary: `Objective "${obj.title}" is assigned to class ${classId}.`,
      recommendedTeacherAction: 'monitor class progress and provide support as needed',
      safeEvidenceRefs: [],
      updatedAt: new Date().toISOString(),
    }));
    return {
      schoolId,
      classId,
      teacherId,
      rows,
      totalObjectives: objectives.length,
      generatedAt: new Date().toISOString(),
    };
  }

  getLearnersNeedingObjectiveSupport(schoolId: string, teacherId: string): string[] {
    const objectives = phase3ObjectiveRepository.listObjectivesByTeacher(schoolId, teacherId);
    const rows = phase3ObjectiveRepository.listTeacherObjectiveProgress(schoolId, teacherId);
    const struggling: string[] = [];
    for (const row of rows) {
      const totalStruggling = row.studentsNeedingRescueCount
        + row.studentsNeedingTeacherSupportCount
        + row.studentsSourceRequiredCount;
      if (totalStruggling > 0) {
        struggling.push(row.objectiveId);
      }
    }
    return objectives
      .filter(obj => struggling.includes(obj.objectiveId))
      .map(obj => `Objective "${obj.title}" has learners needing support — review class-level data for specific learner IDs.`);
  }

  getObjectiveNotGraspedSummary(
    schoolId: string, teacherId: string,
  ): { objectiveId: string; title: string; strugglingCount: number }[] {
    const rows = phase3ObjectiveRepository.listTeacherObjectiveProgress(schoolId, teacherId);
    return rows
      .map(row => ({
        objectiveId: row.objectiveId,
        title: row.objectiveTitle,
        strugglingCount:
          row.studentsNeedingRescueCount +
          row.studentsNeedingTeacherSupportCount +
          row.studentsSourceRequiredCount,
      }))
      .filter(item => item.strugglingCount > 0);
  }

  getTeacherNextObjectiveAction(
    schoolId: string, teacherId: string, objectiveId: string,
  ): { action: string; reason: string } {
    const rows = phase3ObjectiveRepository.listTeacherObjectiveProgress(schoolId, teacherId);
    const row = rows.find(r => r.objectiveId === objectiveId);
    if (!row) {
      return { action: 'review objective setup', reason: 'Objective not found or no progress data available.' };
    }
    const strugglingCount = row.studentsNeedingRescueCount + row.studentsNeedingTeacherSupportCount;
    const notStartedCount = row.studentsNotStartedCount;
    const totalStudents =
      row.studentsNotStartedCount +
      row.studentsEarlySignalCount +
      row.studentsStillLearningCount +
      row.studentsGettingBetterCount +
      row.studentsAlmostThereCount +
      row.studentsConfidentCount +
      row.studentsNeedingRescueCount +
      row.studentsNeedingTeacherSupportCount +
      row.studentsSourceRequiredCount;
    if (strugglingCount > 0) {
      if (strugglingCount >= Math.ceil(totalStudents / 2)) {
        return {
          action: 'reteach objective',
          reason: `${strugglingCount} of ${totalStudents} students are struggling — reteach with a different approach.`,
        };
      }
      return {
        action: 'create small group support',
        reason: `${strugglingCount} students need support. Use small group intervention or peer mentoring.`,
      };
    }
    if (notStartedCount > 0) {
      return {
        action: 'assign short recall',
        reason: `${notStartedCount} students have not started. Assign a recall check to surface current understanding.`,
      };
    }
    if (totalStudents > 0 && row.studentsConfidentCount < totalStudents) {
      return {
        action: 'run teach-back check',
        reason: 'Most students have started. Run a teach-back check to verify depth of understanding.',
      };
    }
    return {
      action: 'review prerequisite',
      reason: 'All students show progress. Check prerequisite objectives before moving forward.',
    };
  }
}

export const phase3TeacherObjectiveProgressService = new Phase3TeacherObjectiveProgressService();
