import type { NotificationType } from '@learnova/constants';
import { isFeatureEnabled, FEATURE_FLAGS } from '@learnova/feature-flags';
import type {
  CreateCourseAnnouncementInput,
  NotificationListQuery,
} from '@learnova/validation';
import { Types } from 'mongoose';
import { UserModel } from '../../models/user.model.js';
import { StudentModel } from '../../models/student.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { AssignmentModel } from '../../models/assignment.model.js';
import { ProjectModel } from '../../models/project.model.js';
import { ExamModel } from '../../models/exam.model.js';
import { CourseModel } from '../../models/course.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { InstitutionSettingsModel } from '../../models/institution-settings.model.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors/index.js';
import { enqueueEmail } from '../../queues/producer.js';
import { getSocketServer } from '../../socket/server-ref.js';
import { facultyCanAccessCourse } from '../access/faculty-scope.js';
import {
  notificationRepository,
  pageMeta,
  toDto,
} from '../../repositories/notification/notification.repository.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

export type NotifyInput = {
  institutionId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  dedupeKey?: string | null;
};

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function notificationsEnabled(): boolean {
  return isFeatureEnabled(FEATURE_FLAGS.ENABLE_NOTIFICATIONS);
}

async function emailEnabledForInstitution(institutionId: string): Promise<boolean> {
  const settings = await InstitutionSettingsModel.findOne({ institutionId: oid(institutionId) })
    .select('notificationSettings')
    .lean()
    .exec();
  const raw = settings?.notificationSettings as Record<string, unknown> | undefined;
  if (raw?.['emailEnabled'] === false) return false;
  return true;
}

function pushRealtime(userId: string, notification: Record<string, unknown>) {
  const io = getSocketServer();
  if (!io) return;
  io.of('/notifications').to(`user:${userId}`).emit('notification.new', notification);
}

export class NotificationService {
  async notify(input: NotifyInput): Promise<Record<string, unknown> | null> {
    if (!notificationsEnabled()) return null;

    const doc = await notificationRepository.create({
      institutionId: oid(input.institutionId),
      userId: oid(input.userId),
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
      dedupeKey: input.dedupeKey ?? null,
    });
    if (!doc) return null;

    const dto = toDto(doc);
    pushRealtime(input.userId, dto);

    if (await emailEnabledForInstitution(input.institutionId)) {
      const user = await UserModel.findById(input.userId).select('email').lean().exec();
      if (user?.email) {
        await enqueueEmail({
          to: user.email,
          subject: input.title,
          text: input.body,
          html: `<p>${input.body.replace(/\n/g, '<br/>')}</p>`,
        });
        doc.emailSent = true;
        await doc.save();
      }
    }

    return dto;
  }

  async notifyMany(inputs: NotifyInput[]): Promise<number> {
    let count = 0;
    for (const input of inputs) {
      const created = await this.notify(input);
      if (created) count += 1;
    }
    return count;
  }

  async userIdsFromEmails(emails: string[], institutionId: string): Promise<Map<string, string>> {
    const normalized = [...new Set(emails.map((e) => e.toLowerCase()))];
    if (normalized.length === 0) return new Map();
    const users = await UserModel.find({
      email: { $in: normalized },
      institutionId: oid(institutionId),
      isActive: true,
    })
      .select('_id email')
      .lean()
      .exec();
    return new Map(users.map((u) => [u.email.toLowerCase(), String(u._id)]));
  }

  async enrolledStudentUserIds(courseId: string, institutionId: string): Promise<string[]> {
    const enrollments = await EnrollmentModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      status: { $in: ['active', 'approved'] },
      deletedAt: null,
    })
      .select('studentId')
      .lean()
      .exec();
    const studentIds = enrollments.map((e) => e.studentId).filter(Boolean);
    if (studentIds.length === 0) return [];

    const students = await StudentModel.find({ _id: { $in: studentIds }, deletedAt: null })
      .select('email')
      .lean()
      .exec();
    const emailMap = await this.userIdsFromEmails(
      students.map((s) => s.email as string),
      institutionId,
    );
    return [...emailMap.values()];
  }

  async list(query: NotificationListQuery, actor: ActorContext) {
    const result = await notificationRepository.list(actor.userId, query);
    return {
      items: result.items.map(toDto),
      unreadCount: result.unreadCount,
      meta: pageMeta(result.total, query.page, query.limit),
    };
  }

  async unreadCount(actor: ActorContext) {
    const count = await notificationRepository.unreadCount(actor.userId);
    return { unreadCount: count };
  }

  async markRead(notificationId: string, actor: ActorContext) {
    const doc = await notificationRepository.markRead(actor.userId, notificationId);
    if (!doc) throw new NotFoundError('Notification not found');
    return toDto(doc);
  }

  async markAllRead(actor: ActorContext) {
    const count = await notificationRepository.markAllRead(actor.userId);
    return { marked: count };
  }

  async deleteNotification(notificationId: string, actor: ActorContext) {
    const doc = await notificationRepository.softDelete(actor.userId, notificationId);
    if (!doc) throw new NotFoundError('Notification not found');
    return { deleted: true };
  }

  async createCourseAnnouncement(input: CreateCourseAnnouncementInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'faculty' || actor.role === 'teaching_assistant') {
      const allowed = await facultyCanAccessCourse(institutionId, actor.email, input.courseId);
      if (!allowed) throw new ForbiddenError('Course access denied');
    } else if (!['institution_admin', 'super_admin'].includes(actor.role)) {
      throw new ForbiddenError('Not allowed to post course announcements');
    }

    const course = await CourseModel.findOne({
      _id: oid(input.courseId),
      institutionId: oid(institutionId),
      deletedAt: null,
    })
      .select('title')
      .lean()
      .exec();
    if (!course) throw new NotFoundError('Course not found');

    const announcement = await notificationRepository.createAnnouncement({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      title: input.title,
      body: input.body,
      createdBy: oid(actor.userId),
    });

    const userIds = await this.enrolledStudentUserIds(input.courseId, institutionId);
    await this.notifyMany(
      userIds.map((userId) => ({
        institutionId,
        userId,
        type: 'course_announcement' as NotificationType,
        title: input.title,
        body: input.body,
        data: {
          courseId: input.courseId,
          courseTitle: course.title,
          announcementId: String(announcement._id),
        },
        dedupeKey: `course_announcement:${String(announcement._id)}:${userId}`,
      })),
    );

    return toDto(announcement);
  }

  async sendDueReminders(institutionId?: string): Promise<number> {
    if (!notificationsEnabled()) return 0;
    const now = new Date();
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const assignmentFilter = {
      deletedAt: null,
      status: { $in: ['published', 'closed'] },
      dueDate: { $gte: now, $lte: horizon },
      ...(institutionId ? { institutionId: oid(institutionId) } : {}),
    };
    const projectFilter = {
      deletedAt: null,
      status: { $in: ['published', 'open'] },
      dueDate: { $gte: now, $lte: horizon },
      ...(institutionId ? { institutionId: oid(institutionId) } : {}),
    };

    const [assignments, projects] = await Promise.all([
      AssignmentModel.find(assignmentFilter).select('institutionId courseId title dueDate').lean().exec(),
      ProjectModel.find(projectFilter).select('institutionId courseId title dueDate').lean().exec(),
    ]);

    let sent = 0;
    for (const assignment of assignments) {
      const instId = String(assignment.institutionId);
      const courseId = String(assignment.courseId);
      const userIds = await this.enrolledStudentUserIds(courseId, instId);
      const due = assignment.dueDate
        ? new Date(assignment.dueDate).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'soon';
      sent += await this.notifyMany(
        userIds.map((userId) => ({
          institutionId: instId,
          userId,
          type: 'assignment_due' as NotificationType,
          title: `Assignment due: ${assignment.title as string}`,
          body: `Your assignment "${assignment.title as string}" is due ${due}.`,
          data: { courseId, assignmentId: String(assignment._id) },
          dedupeKey: `assignment_due:${String(assignment._id)}:${userId}`,
        })),
      );
    }

    for (const project of projects) {
      const instId = String(project.institutionId);
      const courseId = String(project.courseId);
      const userIds = await this.enrolledStudentUserIds(courseId, instId);
      const due = project.dueDate
        ? new Date(project.dueDate).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'soon';
      sent += await this.notifyMany(
        userIds.map((userId) => ({
          institutionId: instId,
          userId,
          type: 'project_deadline' as NotificationType,
          title: `Project deadline: ${project.title as string}`,
          body: `Your project "${project.title as string}" is due ${due}.`,
          data: { courseId, projectId: String(project._id) },
          dedupeKey: `project_deadline:${String(project._id)}:${userId}`,
        })),
      );
    }

    return sent;
  }

  async onExamScheduled(payload: { examId: string; institutionId?: string }) {
    if (!payload.institutionId) return;
    const exam = await ExamModel.findById(payload.examId)
      .select('title courseId institutionId schedule')
      .lean()
      .exec();
    if (!exam) return;
    const institutionId = String(exam.institutionId);
    const courseId = String(exam.courseId);
    const userIds = await this.enrolledStudentUserIds(courseId, institutionId);
    const startsAt = (exam.schedule as { startsAt?: Date } | undefined)?.startsAt;
    const when = startsAt
      ? new Date(startsAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'soon';
    await this.notifyMany(
      userIds.map((userId) => ({
        institutionId,
        userId,
        type: 'exam_scheduled' as NotificationType,
        title: `Exam scheduled: ${exam.title as string}`,
        body: `Your exam "${exam.title as string}" is scheduled for ${when}.`,
        data: { examId: payload.examId, courseId },
        dedupeKey: `exam_scheduled:${payload.examId}:${userId}`,
      })),
    );
  }

  async onGradePublished(payload: { courseId: string; institutionId: string }) {
    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(payload.institutionId),
      courseId: oid(payload.courseId),
      published: true,
    })
      .select('studentId')
      .lean()
      .exec();

    const students = await StudentModel.find({
      _id: { $in: summaries.map((s) => s.studentId) },
      deletedAt: null,
    })
      .select('email')
      .lean()
      .exec();
    const emailMap = await this.userIdsFromEmails(
      students.map((s) => s.email as string),
      payload.institutionId,
    );

    const course = await CourseModel.findById(payload.courseId).select('title').lean().exec();
    const courseTitle = (course?.title as string) ?? 'your course';

    await this.notifyMany(
      [...emailMap.values()].map((userId) => ({
        institutionId: payload.institutionId,
        userId,
        type: 'grade_published' as NotificationType,
        title: `Grades published: ${courseTitle}`,
        body: `Official grades for ${courseTitle} have been published. View them in your gradebook.`,
        data: { courseId: payload.courseId },
        dedupeKey: `grade_published:${payload.courseId}:${userId}`,
      })),
    );
  }

  async onCertificateIssued(payload: { certificateId: string; userId: string }) {
    const student = await StudentModel.findById(payload.userId)
      .select('email institutionId')
      .lean()
      .exec();
    if (!student) return;
    const institutionId = String(student.institutionId);
    const emailMap = await this.userIdsFromEmails([student.email as string], institutionId);
    const notifyUserId = emailMap.get((student.email as string).toLowerCase());
    if (!notifyUserId) return;

    await this.notify({
      institutionId,
      userId: notifyUserId,
      type: 'certificate_issued',
      title: 'Certificate issued',
      body: 'Your certificate has been issued. Download it from the Certificates page.',
      data: { certificateId: payload.certificateId, studentId: payload.userId },
      dedupeKey: `certificate_issued:${payload.certificateId}:${notifyUserId}`,
    });
  }
}

export const notificationService = new NotificationService();
