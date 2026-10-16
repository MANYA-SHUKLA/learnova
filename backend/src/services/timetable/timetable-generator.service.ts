import type { GenerateTimetableInput } from '@learnova/validation';
import type { GenerateTimetableResult, TimetableDayOfWeek } from '@learnova/types';
import { Types } from 'mongoose';
import {
  AcademicYearModel,
  CourseModel,
  DepartmentModel,
  FacultyModel,
  SectionModel,
  SemesterModel,
  TimetableSlotModel,
} from '../../models/index.js';
import { timetableRepository } from '../../repositories/timetable/index.js';
import {
  classYearForSemesterNumber,
  semesterWindowLabel,
} from '../../utils/timetable/academic-calendar.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors/index.js';
import { logger } from '../../utils/logger/index.js';
import { generateGeminiJson, ensureGeminiEnabled } from '../ai/gemini.client.js';
import {
  type ActorContext,
} from './timetable.service.js';
import {
  DEFAULT_PERIODS,
  DEFAULT_WORKING_DAYS,
  type CourseRecord,
  type FacultyRecord,
  type SectionRecord,
  extractTeachingMap,
  parseGeminiTimetableProposal,
  settleTimetable,
  uniqueDays,
} from './timetable-settler.js';

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function facultyDisplayName(row: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return (row.fullName || `${row.firstName ?? ''} ${row.lastName ?? ''}`).trim();
}

function buildPrompt(input: {
  semesterName: string;
  academicYearName: string;
  classYear: number;
  termLabel: string;
  notes?: string;
  workingDays: string[];
  periods: Array<{ startTime: string; endTime: string }>;
  courses: CourseRecord[];
  faculty: FacultyRecord[];
  sections: SectionRecord[];
  departments: Map<string, string>;
  assigned: Array<{ courseId: string; facultyId: string }>;
  occupied: Array<{ dayOfWeek: string; startTime: string; endTime: string; facultyId: string; room: string }>;
}): string {
  const compactFaculty = input.faculty.map((row) => ({
    id: row.id,
    name: row.name,
    department: row.departmentId ? input.departments.get(row.departmentId) ?? null : null,
    specialization: row.specialization,
  }));
  const compactCourses = input.courses.map((row) => ({
    id: row.id,
    title: row.title,
    credits: row.credits,
    department: row.departmentId ? input.departments.get(row.departmentId) ?? null : null,
    programIds: row.programIds,
    assignedFacultyId: input.assigned.find((item) => item.courseId === row.id)?.facultyId ?? null,
  }));
  const compactSections = input.sections.map((row) => ({
    id: row.id,
    name: row.name,
    programId: row.programId,
  }));

  return [
    'You are scheduling a college weekly class timetable for ONE semester only.',
    `Semester: ${input.semesterName}. Class year ${input.classYear} of 4. Term window: ${input.termLabel}. Academic year: ${input.academicYearName}.`,
    'Class years are 1 to 4. Odd semesters (1, 3, 5, 7) run July–December. Even semesters (2, 4, 6, 8) run January–May.',
    'Do not place Semester 1 and Semester 2, or any odd semester with an even semester, in this timetable.',
    'Honor assignedFacultyId. A year class is taught by several teachers. Do not give every subject in the year to one or two people.',
    'Odd and even terms run in different months, so a teacher may teach in both. The same term still cannot double-book a teacher.',
    'Use only the provided ids. Do not invent ids, emails, or people.',
    'Place each course for every compatible section (matching programIds, or all sections if programIds is empty).',
    'Sessions per course per section = max(2, min(4, credits or 2)).',
    'No faculty, section, or room may overlap on the same day and time, except a combined class.',
    'Courses with the same title for different programs (CSE and ECE) are one combined class: same day, time, room, and teacher, with one slot for each section.',
    'Other class years in this same term already occupy the busy slots listed below.',
    'Campus constraints are fixed. Do not change days, times, or venues.',
    `Working days (Mon–Fri only): ${input.workingDays.join(', ')}.`,
    `Periods (09:00–18:00, lunch 13:00–14:00 skipped): ${JSON.stringify(input.periods)}.`,
    'Only 3 rooms are available: ELC Class 1, ELC Class 2, and ELC Class 3.',
    'Theory and lab sessions share those 3 rooms. Never place more than 3 classes at the same time.',
    'If admin notes name subjects that should keep labs, schedule those lab sessions in one of the 3 rooms at the times they give. If they omit a subject, do not add a lab for it.',
    input.notes ? `Admin notes (honor if they do not break the campus constraints): ${input.notes}` : '',
    'Return JSON only with shape:',
    '{"assignments":[{"courseId":"","facultyId":""}],"slots":[{"dayOfWeek":"mon","startTime":"09:00","endTime":"10:00","courseId":"","sectionId":"","facultyId":"","room":"ELC Class 1"}]}',
    'Catalog:',
    JSON.stringify({
      faculty: compactFaculty,
      courses: compactCourses,
      sections: compactSections,
      busySlots: input.occupied,
    }),
  ]
    .filter(Boolean)
    .join('\n');
}

export class TimetableGeneratorService {
  async generate(input: GenerateTimetableInput, actor: ActorContext): Promise<GenerateTimetableResult> {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'institution_admin') {
      throw new ForbiddenError('Only institution admin can generate timetables');
    }

    const semester = await SemesterModel.findOne({
      _id: oid(input.semesterId),
      institutionId: oid(institutionId),
      deletedAt: null,
    })
      .lean()
      .exec();
    if (!semester) throw new NotFoundError('Semester not found');

    const semesterYearId = String(semester.academicYearId);
    if (input.academicYearId && input.academicYearId !== semesterYearId) {
      throw new ValidationError('academicYearId does not match the selected semester');
    }

    const academicYear = await AcademicYearModel.findOne({
      _id: oid(semesterYearId),
      institutionId: oid(institutionId),
      deletedAt: null,
    })
      .select('name')
      .lean()
      .exec();

    const [courseDocs, facultyDocs, sectionDocs, departmentDocs] = await Promise.all([
      CourseModel.find({
        institutionId: oid(institutionId),
        deletedAt: null,
        status: { $in: ['published', 'review', 'scheduled'] },
        semesterIds: oid(input.semesterId),
      })
        .select('title credits facultyIds coordinatorId programIds departmentId category')
        .lean()
        .exec(),
      FacultyModel.find({
        institutionId: oid(institutionId),
        deletedAt: null,
        isActive: true,
        status: 'active',
      })
        .select('fullName firstName lastName departmentId specialization courseIds')
        .lean()
        .exec(),
      SectionModel.find({
        institutionId: oid(institutionId),
        semesterId: oid(input.semesterId),
        deletedAt: null,
        status: 'active',
      })
        .select('name programId')
        .lean()
        .exec(),
      DepartmentModel.find({
        institutionId: oid(institutionId),
        deletedAt: null,
      })
        .select('name')
        .lean()
        .exec(),
    ]);

    if (sectionDocs.length === 0) {
      throw new ValidationError('No active sections found for this semester');
    }
    if (courseDocs.length === 0) {
      throw new ValidationError('No courses linked to this semester');
    }
    if (facultyDocs.length === 0) {
      throw new ValidationError('No active faculty found to assign courses');
    }

    const courses: CourseRecord[] = courseDocs.map((doc) => ({
      id: String(doc._id),
      title: doc.title as string,
      credits: Number(doc.credits ?? 0),
      facultyIds: ((doc.facultyIds as Types.ObjectId[] | undefined) ?? []).map(String),
      coordinatorId: doc.coordinatorId ? String(doc.coordinatorId) : null,
      programIds: ((doc.programIds as Types.ObjectId[] | undefined) ?? []).map(String),
      departmentId: doc.departmentId ? String(doc.departmentId) : null,
      category: (doc.category as string | null) ?? null,
    }));

    const faculty: FacultyRecord[] = facultyDocs.map((doc) => ({
      id: String(doc._id),
      name: facultyDisplayName(doc),
      departmentId: doc.departmentId ? String(doc.departmentId) : null,
      specialization: (doc.specialization as string | null) ?? null,
      courseIds: ((doc.courseIds as Types.ObjectId[] | undefined) ?? []).map(String),
    }));

    const sections: SectionRecord[] = sectionDocs.map((doc) => ({
      id: String(doc._id),
      name: doc.name as string,
      programId: String(doc.programId),
    }));

    const departments = new Map(
      departmentDocs.map((doc) => [String(doc._id), doc.name as string]),
    );

    const workingDays = uniqueDays(DEFAULT_WORKING_DAYS);
    const periods = DEFAULT_PERIODS;

    const sameTermSemesters = await SemesterModel.find({
      institutionId: oid(institutionId),
      academicYearId: semester.academicYearId,
      term: semester.term,
      _id: { $ne: semester._id },
      status: 'active',
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    const occupiedDocs =
      sameTermSemesters.length === 0
        ? []
        : await TimetableSlotModel.find({
            institutionId: oid(institutionId),
            semesterId: { $in: sameTermSemesters.map((row) => row._id) },
            status: 'active',
            deletedAt: null,
          })
            .select('dayOfWeek startTime endTime facultyId room')
            .lean()
            .exec();
    const occupied = occupiedDocs.map((row) => ({
      dayOfWeek: row.dayOfWeek as TimetableDayOfWeek,
      startTime: row.startTime as string,
      endTime: row.endTime as string,
      facultyId: String(row.facultyId),
      room: row.room as string,
    }));

    const extracted = extractTeachingMap(courses, faculty);
    const assigned = [...extracted.entries()].map(([courseId, facultyId]) => ({
      courseId,
      facultyId,
    }));

    ensureGeminiEnabled();

    let geminiUsed = false;
    let proposal = parseGeminiTimetableProposal(null);
    try {
      const raw = await generateGeminiJson({
        prompt: buildPrompt({
          semesterName: semester.name,
          academicYearName: academicYear?.name ?? semesterYearId,
          classYear: classYearForSemesterNumber(Number(semester.number)),
          termLabel: semesterWindowLabel(String(semester.term)),
          notes: input.notes,
          workingDays,
          periods,
          courses,
          faculty,
          sections,
          departments,
          assigned,
          occupied,
        }),
        maxOutputTokens: 8192,
      });
      proposal = parseGeminiTimetableProposal(raw);
      geminiUsed = true;
    } catch (err) {
      logger.warn({ err }, 'Gemini timetable proposal failed; using local settler');
    }

    const settled = settleTimetable({
      courses,
      faculty,
      sections,
      workingDays,
      periods,
      geminiAssignments: proposal.assignments,
      proposedSlots: proposal.slots,
      occupied,
    });

    if (settled.slots.length === 0) {
      throw new ValidationError('Could not place any class slots for this semester');
    }

    const warnings = [...settled.warnings];
    if (!geminiUsed) {
      warnings.unshift('AI was unavailable; timetable was generated with the local scheduler.');
    }

    let timetable = await timetableRepository.findByInstitutionSemester(institutionId, input.semesterId);
    const existingSlotCount = timetable
      ? await timetableRepository.countSlots(String(timetable._id))
      : 0;

    if (timetable && existingSlotCount > 0 && !input.replaceExisting) {
      throw new ConflictError(
        'This semester already has class slots. Confirm replaceExisting to generate a new draft.',
      );
    }

    if (!timetable) {
      timetable = await timetableRepository.create({
        institutionId,
        semesterId: input.semesterId,
        academicYearId: semesterYearId,
        name: `${semester.name} Timetable`,
      });
    } else if (timetable.status === 'published') {
      const reverted = await timetableRepository.revertToDraft(String(timetable._id), institutionId);
      if (reverted) timetable = reverted;
    }

    const timetableId = String(timetable._id);
    if (existingSlotCount > 0) {
      await timetableRepository.softDeleteSlotsForTimetable(timetableId, institutionId);
    }

    const created = await timetableRepository.createSlots(
      settled.slots.map((slot) => ({
        timetableId: oid(timetableId),
        institutionId: oid(institutionId),
        semesterId: oid(input.semesterId),
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courseId: oid(slot.courseId),
        courseTitle: slot.courseTitle,
        sectionId: oid(slot.sectionId),
        sectionName: slot.sectionName,
        facultyId: oid(slot.facultyId),
        facultyName: slot.facultyName,
        room: slot.room,
        status: 'active',
      })),
    );

    return {
      timetable: timetableRepository.toDto(timetable, created.length),
      assignments: settled.assignments,
      slots: created,
      warnings,
    };
  }
}

export const timetableGeneratorService = new TimetableGeneratorService();
