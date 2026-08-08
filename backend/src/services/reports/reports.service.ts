import { toCsv } from '@learnova/utils';
import type { ReportsExportQuery, ReportsQuery } from '@learnova/validation';
import { StudentModel } from '../../models/student.model.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { reportsRepository } from '../../repositories/reports/reports.repository.js';
import { facultyCanAccessCourse } from '../access/faculty-scope.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

const INSTITUTION_ROLES = new Set(['institution_admin', 'super_admin']);
const FACULTY_ROLES = new Set(['faculty', 'institution_admin', 'super_admin', 'teaching_assistant']);

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

async function resolveStudentId(actor: ActorContext, institutionId: string): Promise<string> {
  if (actor.role === 'student') {
    const student = await StudentModel.findOne({
      institutionId,
      email: actor.email.toLowerCase(),
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    if (!student) throw new NotFoundError('Student record not found');
    return String(student._id);
  }
  throw new ForbiddenError('Student context required');
}

function reportToRows(scope: ReportsExportQuery['scope'], payload: Record<string, unknown>): Record<string, unknown>[] {
  if (scope === 'institution') {
    const overview = payload.overview as Record<string, unknown>;
    const departments = (payload.departments as Array<Record<string, unknown>>) ?? [];
    const semesters = (payload.semesters as Array<Record<string, unknown>>) ?? [];
    return [
      { section: 'overview', metric: 'totalStudents', value: overview['totalStudents'] },
      { section: 'overview', metric: 'totalFaculty', value: overview['totalFaculty'] },
      { section: 'overview', metric: 'activeCourses', value: overview['activeCourses'] },
      { section: 'overview', metric: 'courseCompletionRate', value: overview['courseCompletionRate'] },
      { section: 'overview', metric: 'examPassPercentage', value: overview['examPassPercentage'] },
      ...departments.map((d) => ({
        section: 'department',
        label: d['label'],
        studentCount: d['studentCount'],
        completedEnrollments: d['completedEnrollments'],
        averageProgress: d['averageProgress'],
      })),
      ...semesters.map((s) => ({
        section: 'semester',
        label: s['label'],
        studentCount: s['studentCount'],
        averageGpa: s['averageGpa'],
        earnedCredits: s['earnedCredits'],
      })),
    ];
  }

  if (scope === 'faculty') {
    const performance = (payload.studentPerformance as Array<Record<string, unknown>>) ?? [];
    return [
      { section: 'summary', metric: 'courseId', value: payload['courseId'] },
      { section: 'summary', metric: 'assignmentCompletionRate', value: payload['assignmentCompletionRate'] },
      { section: 'summary', metric: 'examPassRate', value: payload['examPassRate'] },
      ...performance.map((row) => ({
        section: 'student',
        studentId: row['studentId'],
        percentage: row['percentage'],
        letterGrade: row['letterGrade'],
        result: row['result'],
      })),
    ];
  }

  const grades = (payload.grades as Array<Record<string, unknown>>) ?? [];
  const learning = payload.learningProgress as Record<string, unknown>;
  return [
    { section: 'progress', metric: 'completedCourses', value: learning['completedCourses'] },
    { section: 'progress', metric: 'hoursLearned', value: learning['hoursLearned'] },
    ...grades.map((g) => ({
      section: 'grade',
      courseTitle: g['courseTitle'],
      percentage: g['percentage'],
      letterGrade: g['letterGrade'],
      result: g['result'],
    })),
  ];
}

function renderReportHtml(title: string, rows: Record<string, unknown>[]): string {
  const body = rows
    .map(
      (row) =>
        `<tr>${Object.values(row)
          .map((v) => `<td>${String(v ?? '')}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  const headers = rows[0] ? Object.keys(rows[0]).map((h) => `<th>${h}</th>`).join('') : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f5}</style></head>
<body><h1>${title}</h1><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

export class ReportsService {
  async institutionReport(query: ReportsQuery, actor: ActorContext) {
    if (!INSTITUTION_ROLES.has(actor.role)) {
      throw new ForbiddenError('Institution admin access required');
    }
    const institutionId = requireTenant(actor);
    const [overview, departments, semesters] = await Promise.all([
      reportsRepository.institutionOverview(institutionId),
      reportsRepository.departmentReports(institutionId),
      reportsRepository.semesterReports(institutionId, query.semesterId),
    ]);

    const filteredDepartments = query.departmentId
      ? departments.filter((d) => d.departmentId === query.departmentId)
      : departments;

    return { overview, departments: filteredDepartments, semesters };
  }

  async facultyReport(query: ReportsQuery, actor: ActorContext) {
    if (!FACULTY_ROLES.has(actor.role)) {
      throw new ForbiddenError('Faculty access required');
    }
    const institutionId = requireTenant(actor);
    if (!query.courseId) throw new ValidationError('courseId is required');

    if (actor.role === 'faculty' || actor.role === 'teaching_assistant') {
      const allowed = await facultyCanAccessCourse(institutionId, actor.email, query.courseId);
      if (!allowed) throw new ForbiddenError('Course access denied');
    }

    return reportsRepository.facultyCourseReport(institutionId, query.courseId);
  }

  async studentReport(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await resolveStudentId(actor, institutionId);
    return reportsRepository.studentReport(institutionId, studentId);
  }

  async exportReport(query: ReportsExportQuery, actor: ActorContext) {
    let payload: Record<string, unknown>;
    if (query.scope === 'institution') {
      payload = (await this.institutionReport(query, actor)) as Record<string, unknown>;
    } else if (query.scope === 'faculty') {
      payload = (await this.facultyReport(query, actor)) as Record<string, unknown>;
    } else {
      payload = (await this.studentReport(actor)) as Record<string, unknown>;
    }

    const rows = reportToRows(query.scope, payload);
    const stamp = new Date().toISOString().slice(0, 10);
    const basename = `learnova-${query.scope}-report-${stamp}`;

    if (query.format === 'pdf') {
      return {
        contentType: 'text/html; charset=utf-8',
        filename: `${basename}.html`,
        body: renderReportHtml(`Learnova ${query.scope} report`, rows),
      };
    }

    const csv = toCsv(rows);
    if (query.format === 'excel') {
      return {
        contentType: 'application/vnd.ms-excel',
        filename: `${basename}.xls`,
        body: csv,
      };
    }

    return {
      contentType: 'text/csv; charset=utf-8',
      filename: `${basename}.csv`,
      body: csv,
    };
  }
}

export const reportsService = new ReportsService();
