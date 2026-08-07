import type { NextFunction, Request, Response } from 'express';
import type {
  AssignProjectGradeInput,
  CreateGradeAppealInput,
  CreateGradeCommentInput,
  FinalizeCourseGradesInput,
  GradeReportQuery,
  GradebookBulkActionInput,
  GradebookListQuery,
  IngestGradebookSourceInput,
  LockCourseGradesInput,
  PublishCourseGradesInput,
  ResolveGradeAppealInput,
  SemesterGradeQuery,
  SyncCourseGradebookInput,
  UnlockCourseGradesInput,
  UpsertWeightSchemeInput,
  UpsertAcademicPolicyInput,
  ModerationActionInput,
  CompareSnapshotsQuery,
  ComputeStandingInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import { gradebookEnterpriseService } from '../../services/gradebook/gradebook-enterprise.service.js';
import { gradebookPoliciesService } from '../../services/gradebook/gradebook-policies.service.js';
import { gradebookService, type ActorContext } from '../../services/gradebook/gradebook.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await gradebookService.listEntries(
      req.query as unknown as GradebookListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const result = await gradebookService.getCourseEntries(
      req.params.courseId as string,
      actorFrom(req),
      studentId,
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseSummaries(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const items = await gradebookService.getCourseSummaries(
      req.params.courseId as string,
      actorFrom(req),
      studentId,
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getWeightScheme(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.getWeightScheme(req.params.courseId as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function upsertWeightScheme(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.upsertWeightScheme(
      req.body as UpsertWeightSchemeInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function ingestSource(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.ingestSource(
      req.body as IngestGradebookSourceInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function syncCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.syncCourse(
      req.body as SyncCourseGradebookInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function assignProjectGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.assignProjectGrade(
      req.body as AssignProjectGradeInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function finalizeCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.finalizeCourse(
      req.body as FinalizeCourseGradesInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.query.courseId as string | undefined;
    const data = await gradebookEnterpriseService.enhancedInstitutionDashboard(
      courseId,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.query.courseId as string | undefined;
    const data = await gradebookService.facultyDashboard(courseId, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.studentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listPendingProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookService.listPendingProjects(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.publishGrades(
      req.body as PublishCourseGradesInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function lockGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.lockGrades(
      req.body as LockCourseGradesInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function unlockGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.unlockGrades(
      req.body as UnlockCourseGradesInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAction(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.bulkAction(
      req.body as GradebookBulkActionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createAppeal(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.createAppeal(
      req.body as CreateGradeAppealInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function resolveAppeal(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.resolveAppeal(
      req.body as ResolveGradeAppealInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAppeals(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookEnterpriseService.listAppeals(actorFrom(req), {
      courseId: req.query.courseId as string | undefined,
      studentId: req.query.studentId as string | undefined,
      status: req.query.status as string | undefined,
    });
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.addComment(
      req.body as CreateGradeCommentInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookEnterpriseService.listComments(actorFrom(req), {
      courseId: req.query.courseId as string | undefined,
      studentId: req.query.studentId as string | undefined,
      courseGradeId: req.query.courseGradeId as string | undefined,
    });
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookEnterpriseService.listHistory(
      req.params.courseGradeId as string,
      actorFrom(req),
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseMatrix(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.getCourseMatrix(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getSemesterGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookEnterpriseService.getSemesterGrades(
      req.query as unknown as SemesterGradeQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function recomputeSemesterGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.recomputeSemesterGrades(
      req.body as SemesterGradeQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCgpa(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookEnterpriseService.recomputeCgpa(
      req.params.studentId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function generateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await gradebookEnterpriseService.generateReport(
      req.query as unknown as GradeReportQuery,
      actorFrom(req),
    );
    if ('csv' in result) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="gradebook-export.csv"');
      res.send(result.csv);
      return;
    }
    sendSuccess(res, result, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAcademicPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.getAcademicPolicy(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function upsertAcademicPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.upsertAcademicPolicy(
      req.body as UpsertAcademicPolicyInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitModeration(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.submitForReview(
      req.body as ModerationActionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function approveModeration(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.approveDepartment(
      req.body as ModerationActionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishModeration(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.publishWithSnapshots(
      req.body as ModerationActionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listModerationTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookPoliciesService.listModerationTimeline(
      req.params.courseId as string,
      actorFrom(req),
      req.query.studentId as string | undefined,
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listSnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookPoliciesService.listSnapshots(
      {
        courseId: req.query.courseId as string,
        studentId: req.query.studentId as string | undefined,
      },
      actorFrom(req),
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function compareSnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.compareSnapshots(
      req.query as unknown as CompareSnapshotsQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function computeStanding(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookPoliciesService.computeStanding(
      req.body as ComputeStandingInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listStanding(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookPoliciesService.listStanding(
      actorFrom(req),
      req.query.studentId as string | undefined,
      req.query.semesterId as string | undefined,
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
