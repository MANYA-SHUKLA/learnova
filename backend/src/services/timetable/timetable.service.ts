import type {
  CreateTimetableInput,
  CreateTimetableSlotInput,
  TimetableListQuery,
  TimetableSlotListQuery,
  UpdateTimetableSlotInput,
} from '@learnova/validation';
import { Types } from 'mongoose';
import {
  AcademicCalendarModel,
  CourseModel,
  FacultyModel,
  InstitutionModel,
  SectionModel,
  TimetableSlotModel,
} from '../../models/index.js';
import { timetableRepository } from '../../repositories/timetable/index.js';
import { buildClassReminderEmail } from '../../mail/class-reminder-email.js';
import { notificationService } from '../notification/notification.service.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors/index.js';
import {
  dayOfWeekFromDate,
  formatDateInTimeZone,
  sortSlotsByDayAndTime,
  timesOverlap,
} from '../../utils/timetable/time.js';
import type { TimetableTodayClass } from '@learnova/types';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

async function assertNoSlotConflict(
  institutionId: string,
  sectionId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeSlotId?: string,
): Promise<void> {
  const existing = await timetableRepository.findSlotsForConflictCheck(
    institutionId,
    sectionId,
    dayOfWeek,
    excludeSlotId,
  );
  for (const slot of existing) {
    if (timesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
      throw new ConflictError(
        'This section already has a class at an overlapping time on the same day',
      );
    }
  }
}

async function resolveSlotDenormalized(
  institutionId: string,
  input: { courseId: string; sectionId: string; facultyId: string },
) {
  const [course, section, faculty] = await Promise.all([
    CourseModel.findOne({ _id: oid(input.courseId), institutionId: oid(institutionId), deletedAt: null })
      .select('title')
      .lean()
      .exec(),
    SectionModel.findOne({ _id: oid(input.sectionId), institutionId: oid(institutionId), deletedAt: null })
      .select('name')
      .lean()
      .exec(),
    FacultyModel.findOne({ _id: oid(input.facultyId), institutionId: oid(institutionId), deletedAt: null })
      .select('fullName firstName lastName')
      .lean()
      .exec(),
  ]);
  if (!course) throw new NotFoundError('Course not found');
  if (!section) throw new NotFoundError('Section not found');
  if (!faculty) throw new NotFoundError('Faculty not found');
  return {
    courseTitle: course.title as string,
    sectionName: section.name as string,
    facultyName:
      (faculty.fullName as string) ||
      `${faculty.firstName as string} ${faculty.lastName as string}`.trim(),
  };
}

async function ensureTimetableAccess(
  timetableId: string,
  institutionId: string,
  role: string,
  requireManage = false,
) {
  const doc = await timetableRepository.findById(timetableId, institutionId);
  if (!doc) throw new NotFoundError('Timetable not found');
  if (requireManage && role !== 'institution_admin') {
    throw new ForbiddenError('Timetable management requires institution admin');
  }
  if (!requireManage && role !== 'institution_admin' && doc.status !== 'published') {
    throw new ForbiddenError('Timetable is not published yet');
  }
  return doc;
}

export class TimetableService {
  async list(query: TimetableListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const skip = (query.page - 1) * query.limit;
    const { docs, total } = await timetableRepository.list(institutionId, {
      semesterId: query.semesterId,
      status: query.status,
      skip,
      limit: query.limit,
    });

    const items = await Promise.all(
      docs.map(async (doc) => {
        const slotCount = await timetableRepository.countSlots(String(doc._id));
        return timetableRepository.toDto(doc, slotCount);
      }),
    );

    return { items, meta: pageMeta(total, query.page, query.limit) };
  }

  async create(input: CreateTimetableInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'institution_admin') {
      throw new ForbiddenError('Only institution admin can create timetables');
    }

    const existing = await timetableRepository.findByInstitutionSemester(
      institutionId,
      input.semesterId,
    );
    if (existing) {
      throw new ConflictError('A timetable already exists for this semester');
    }

    const doc = await timetableRepository.create({
      institutionId,
      semesterId: input.semesterId,
      academicYearId: input.academicYearId,
      name: input.name,
    });
    return timetableRepository.toDto(doc, 0);
  }

  async publish(timetableId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'institution_admin') {
      throw new ForbiddenError('Only institution admin can publish timetables');
    }
    await ensureTimetableAccess(timetableId, institutionId, actor.role, true);
    const doc = await timetableRepository.publish(timetableId, institutionId);
    if (!doc) throw new NotFoundError('Timetable not found');
    const slotCount = await timetableRepository.countSlots(timetableId);
    return timetableRepository.toDto(doc, slotCount);
  }

  async listSlots(timetableId: string, query: TimetableSlotListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await ensureTimetableAccess(timetableId, institutionId, actor.role);

    const skip = (query.page - 1) * query.limit;
    const { docs, total } = await timetableRepository.listSlots(timetableId, institutionId, {
      dayOfWeek: query.dayOfWeek,
      sectionId: query.sectionId,
      facultyId: query.facultyId,
      courseId: query.courseId,
      status: query.status,
      skip,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      items: docs.map((d) => timetableRepository.slotToDto(d)),
      meta: pageMeta(total, query.page, query.limit),
    };
  }

  async createSlot(timetableId: string, input: CreateTimetableSlotInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'institution_admin') {
      throw new ForbiddenError('Only institution admin can manage timetable slots');
    }
    const timetable = await ensureTimetableAccess(timetableId, institutionId, actor.role, true);

    await assertNoSlotConflict(
      institutionId,
      input.sectionId,
      input.dayOfWeek,
      input.startTime,
      input.endTime,
    );

    const denorm = await resolveSlotDenormalized(institutionId, input);
    const doc = await timetableRepository.createSlot({
      timetableId: oid(timetableId),
      institutionId: oid(institutionId),
      semesterId: timetable.semesterId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      courseId: oid(input.courseId),
      courseTitle: denorm.courseTitle,
      sectionId: oid(input.sectionId),
      sectionName: denorm.sectionName,
      facultyId: oid(input.facultyId),
      facultyName: denorm.facultyName,
      room: input.room,
      status: input.status ?? 'active',
    });
    return timetableRepository.slotToDto(doc);
  }

  async updateSlot(slotId: string, input: UpdateTimetableSlotInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'institution_admin') {
      throw new ForbiddenError('Only institution admin can manage timetable slots');
    }

    const existing = await timetableRepository.findSlotById(slotId, institutionId);
    if (!existing) throw new NotFoundError('Timetable slot not found');

    const next = {
      dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
      startTime: input.startTime ?? existing.startTime,
      endTime: input.endTime ?? existing.endTime,
      sectionId: input.sectionId ?? String(existing.sectionId),
      courseId: input.courseId ?? String(existing.courseId),
      facultyId: input.facultyId ?? String(existing.facultyId),
      room: input.room ?? existing.room,
      status: input.status ?? existing.status,
    };

    if (next.startTime >= next.endTime) {
      throw new ConflictError('End time must be after start time');
    }

    await assertNoSlotConflict(
      institutionId,
      next.sectionId,
      next.dayOfWeek,
      next.startTime,
      next.endTime,
      slotId,
    );

    const patch: Record<string, unknown> = {
      dayOfWeek: next.dayOfWeek,
      startTime: next.startTime,
      endTime: next.endTime,
      room: next.room,
      status: next.status,
    };

    if (input.courseId || input.sectionId || input.facultyId) {
      const denorm = await resolveSlotDenormalized(institutionId, {
        courseId: next.courseId,
        sectionId: next.sectionId,
        facultyId: next.facultyId,
      });
      patch.courseId = oid(next.courseId);
      patch.courseTitle = denorm.courseTitle;
      patch.sectionId = oid(next.sectionId);
      patch.sectionName = denorm.sectionName;
      patch.facultyId = oid(next.facultyId);
      patch.facultyName = denorm.facultyName;
    }

    const doc = await timetableRepository.updateSlot(slotId, institutionId, patch);
    if (!doc) throw new NotFoundError('Timetable slot not found');
    return timetableRepository.slotToDto(doc);
  }

  async deleteSlot(slotId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'institution_admin') {
      throw new ForbiddenError('Only institution admin can manage timetable slots');
    }
    const doc = await timetableRepository.deleteSlot(slotId, institutionId);
    if (!doc) throw new NotFoundError('Timetable slot not found');
    return { deleted: true };
  }

  private slotToTodayClass(slot: {
    _id: Types.ObjectId;
    startTime: string;
    endTime: string;
    courseTitle: string;
    sectionName: string;
    facultyName: string;
    room: string;
  }): TimetableTodayClass {
    return {
      slotId: String(slot._id),
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseTitle: slot.courseTitle,
      sectionName: slot.sectionName,
      facultyName: slot.facultyName,
      room: slot.room,
    };
  }

  async today(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const timeZone = process.env.TIMETABLE_REMINDER_TZ ?? 'Asia/Kolkata';
    const now = new Date();
    const dayOfWeek = dayOfWeekFromDate(now, timeZone);

    const slots = await timetableRepository.findPublishedSlotsForDay(institutionId, dayOfWeek);
    const activeSlots = sortSlotsByDayAndTime(
      slots.map((s) => ({
        ...s.toObject(),
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
      })),
    );

    if (actor.role === 'institution_admin') {
      return {
        date: formatDateInTimeZone(now, timeZone),
        dayOfWeek,
        classes: activeSlots.map((s) => this.slotToTodayClass(s)),
      };
    }

    if (actor.role === 'faculty') {
      const faculty = await FacultyModel.findOne({
        institutionId: oid(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      })
        .select('_id')
        .lean()
        .exec();
      if (!faculty) {
        return { date: formatDateInTimeZone(now, timeZone), dayOfWeek, classes: [] };
      }
      const facultyId = String(faculty._id);
      const mine = activeSlots.filter((s) => String(s.facultyId) === facultyId);
      return {
        date: formatDateInTimeZone(now, timeZone),
        dayOfWeek,
        classes: mine.map((s) => this.slotToTodayClass(s)),
      };
    }

    const student = await StudentModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    })
      .select('sectionId')
      .lean()
      .exec();

    if (!student?.sectionId) {
      return { date: formatDateInTimeZone(now, timeZone), dayOfWeek, classes: [] };
    }

    const sectionId = String(student.sectionId);
    const mine = activeSlots.filter((s) => String(s.sectionId) === sectionId);
    return {
      date: formatDateInTimeZone(now, timeZone),
      dayOfWeek,
      classes: mine.map((s) => this.slotToTodayClass(s)),
    };
  }

  async isHolidayToday(institutionId: string, date: Date, timeZone: string): Promise<boolean> {
    const today = formatDateInTimeZone(date, timeZone);
    const startOfDay = new Date(`${today}T00:00:00.000Z`);
    const endOfDay = new Date(`${today}T23:59:59.999Z`);

    const calendars = await AcademicCalendarModel.find({
      institutionId: oid(institutionId),
      status: 'active',
      deletedAt: null,
    })
      .select('events')
      .lean()
      .exec();

    for (const cal of calendars) {
      for (const event of cal.events ?? []) {
        if (event.type !== 'holiday') continue;
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        if (eventStart <= endOfDay && eventEnd >= startOfDay) {
          return true;
        }
      }
    }
    return false;
  }

  async sendDailyClassReminders(): Promise<{ institutions: number; notified: number }> {
    const timeZone = process.env.TIMETABLE_REMINDER_TZ ?? 'Asia/Kolkata';
    const now = new Date();
    const dayOfWeek = dayOfWeekFromDate(now, timeZone);
    const dateLabel = formatDateInTimeZone(now, timeZone);

    const institutions = await InstitutionModel.find({ status: 'active', deletedAt: null })
      .select('_id name')
      .lean()
      .exec();

    let notified = 0;

    for (const inst of institutions) {
      const institutionId = String(inst._id);
      if (await this.isHolidayToday(institutionId, now, timeZone)) continue;

      const slots = await timetableRepository.findPublishedSlotsForDay(institutionId, dayOfWeek);
      if (slots.length === 0) continue;

      const facultyMap = new Map<string, typeof slots>();
      const studentSectionSlots = new Map<string, typeof slots>();

      for (const slot of slots) {
        const facultyId = String(slot.facultyId);
        const list = facultyMap.get(facultyId) ?? [];
        list.push(slot);
        facultyMap.set(facultyId, list);

        const sectionId = String(slot.sectionId);
        const sectionList = studentSectionSlots.get(sectionId) ?? [];
        sectionList.push(slot);
        studentSectionSlots.set(sectionId, sectionList);
      }

      const facultyRecords = await FacultyModel.find({
        _id: { $in: [...facultyMap.keys()].map(oid) },
        institutionId: oid(institutionId),
        deletedAt: null,
      })
        .select('_id email fullName firstName lastName')
        .lean()
        .exec();

      for (const faculty of facultyRecords) {
        const facultySlots = sortSlotsByDayAndTime(
          (facultyMap.get(String(faculty._id)) ?? []).map((s) => ({
            ...s.toObject(),
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
          })),
        );
        if (facultySlots.length === 0) continue;

        const email = (faculty.email as string).toLowerCase();
        const userMap = await notificationService.userIdsFromEmails([email], institutionId);
        const userId = userMap.get(email);
        if (!userId) continue;

        const name =
          (faculty.fullName as string) ||
          `${faculty.firstName as string} ${faculty.lastName as string}`.trim();
        const rows = facultySlots.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          courseTitle: s.courseTitle,
          sectionName: s.sectionName,
          facultyName: s.facultyName,
          room: s.room,
        }));
        const mail = buildClassReminderEmail(name, dateLabel, rows);
        const bodyText = rows
          .map(
            (r) =>
              `${r.startTime}-${r.endTime} ${r.courseTitle} (${r.sectionName}) Room ${r.room}`,
          )
          .join('\n');

        await notificationService.notify({
          institutionId,
          userId,
          type: 'class_reminder',
          title: mail.subject,
          body: `Your classes today (${dateLabel}):\n${bodyText}`,
          dedupeKey: `class_reminder:${dateLabel}:${userId}`,
          data: { date: dateLabel, role: 'faculty', classCount: rows.length },
          emailHtml: mail.html,
          emailText: mail.text,
        });
        notified += 1;
      }

      if (studentSectionSlots.size === 0) continue;

      const students = await StudentModel.find({
        institutionId: oid(institutionId),
        sectionId: { $in: [...studentSectionSlots.keys()].map(oid) },
        deletedAt: null,
        status: 'active',
      })
        .select('email fullName firstName lastName sectionId')
        .lean()
        .exec();

      for (const student of students) {
        if (!student.sectionId) continue;
        const sectionId = String(student.sectionId);
        const studentSlots = sortSlotsByDayAndTime(
          (studentSectionSlots.get(sectionId) ?? []).map((s) => ({
            ...s.toObject(),
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
          })),
        );
        if (studentSlots.length === 0) continue;

        const email = (student.email as string).toLowerCase();
        const userMap = await notificationService.userIdsFromEmails([email], institutionId);
        const userId = userMap.get(email);
        if (!userId) continue;

        const name =
          (student.fullName as string) ||
          `${student.firstName as string} ${student.lastName as string}`.trim();
        const rows = studentSlots.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          courseTitle: s.courseTitle,
          sectionName: s.sectionName,
          facultyName: s.facultyName,
          room: s.room,
        }));
        const mail = buildClassReminderEmail(name, dateLabel, rows);
        const bodyText = rows
          .map(
            (r) =>
              `${r.startTime}-${r.endTime} ${r.courseTitle} (${r.sectionName}) Room ${r.room}`,
          )
          .join('\n');

        await notificationService.notify({
          institutionId,
          userId,
          type: 'class_reminder',
          title: mail.subject,
          body: `Your classes today (${dateLabel}):\n${bodyText}`,
          dedupeKey: `class_reminder:${dateLabel}:${userId}`,
          data: { date: dateLabel, role: 'student', classCount: rows.length },
          emailHtml: mail.html,
          emailText: mail.text,
        });
        notified += 1;
      }
    }

    return { institutions: institutions.length, notified };
  }
}

export const timetableService = new TimetableService();
