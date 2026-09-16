import type { GenerateTimetableInput } from '@learnova/validation';
import type { GenerateTimetableResult } from '@learnova/types';
import { Types } from 'mongoose';
import {
  AcademicYearModel,
  CourseModel,
  DepartmentModel,
  FacultyModel,
  SectionModel,
  SemesterModel,
} from '../../models/index.js';
import { timetableRepository } from '../../repositories/timetable/index.js';
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
  notes?: string;
  workingDays: string[];
  periods: Array<{ startTime: string; endTime: string }>;
  courses: CourseRecord[];
  faculty: FacultyRecord[];
  sections: SectionRecord[];
  departments: Map<string, string>;
  assigned: Array<{ courseId: string; facultyId: string }>;
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
    'You are scheduling a college weekly class timetable.',
    `Semester: ${input.semesterName}. Academic year: ${input.academicYearName}.`,
    'Use only the provided ids. Do not invent ids, emails, or people.',
    'Honor existing assignedFacultyId values. Fill faculty only for courses where assignedFacultyId is null.',
    'Place each course for every compatible section (matching programIds, or all sections if programIds is empty).',
    'Sessions per course per section = max(2, min(4, credits or 2)).',
    'No faculty, section, or room may overlap on the same day and time.',
    `Working days: ${input.workingDays.join(', ')}.`,
    `Periods: ${JSON.stringify(input.periods)}.`,
    input.notes ? `Admin notes (honor if possible): ${input.notes}` : '',
    'Return JSON only with shape:',
    '{"assignments":[{"courseId":"","facultyId":""}],"slots":[{"dayOfWeek":"mon","startTime":"09:00","endTime":"10:00","courseId":"","sectionId":"","facultyId":"","room":"R-101"}]}',
    'Catalog:',
    JSON.stringify({
      faculty: compactFaculty,
      courses: compactCourses,
      sections: compactSections,
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

    const workingDays = uniqueDays(input.workingDays ?? DEFAULT_WORKING_DAYS);
    const periods = input.periods?.length ? input.periods : DEFAULT_PERIODS;

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
          notes: input.notes,
          workingDays,
          periods,
          courses,
          faculty,
          sections,
          departments,
          assigned,
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
    });

    if (settled.slots.length === 0) {
      throw new ValidationError('Could not place any class slots for this semester');
    }

    const warnings = [...settled.warnings];
    if (!geminiUsed) {
      warnings.unshift('Gemini was unavailable; timetable was generated with the local scheduler.');
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
