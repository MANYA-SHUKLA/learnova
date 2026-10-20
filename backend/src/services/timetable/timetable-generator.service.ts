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
import { generateGeminiJson, isGeminiConfigured } from '../ai/gemini.client.js';
import {
  type ActorContext,
} from './timetable.service.js';
import {
  DEFAULT_WORKING_DAYS,
  type CourseRecord,
  type FacultyRecord,
  type SectionRecord,
  extractTeachingMap,
  parseGeminiTimetableProposal,
  settleTimetable,
  uniqueDays,
} from './timetable-settler.js';
import {
  allowedCourseCodesForSemester,
  catalogSummaryForSemester,
  JNU_SOE_GENERATION_RULES,
  JNU_SOE_MONSOON_PERIODS,
  JNU_UNVERIFIED_COURSE_CODES,
} from './jnu-soe-monsoon-2026.js';
import { JNU_BTECH_PROGRESSION_SEMESTERS } from './jnu-master-instructions.js';
import {
  buildJnuSourceDatabase,
  buildOfficialSettledSlots,
  sourceDatabaseSummaryForSemester,
  teachingAssignmentsFromSettledSlots,
} from './jnu-timetable-source.js';
import { validateJnuTimetable } from './jnu-timetable-validator.js';
import type { SettleResult } from './timetable-settler.js';

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
  semesterNumber: number;
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
    courseCode: row.courseCode ?? null,
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
    'You are scheduling a JNU School of Engineering B.Tech weekly timetable for ONE semester only.',
    JNU_SOE_GENERATION_RULES,
    `Semester: ${input.semesterName} (number ${input.semesterNumber}). Class year ${input.classYear} of 4. Term: ${input.termLabel}. Academic year: ${input.academicYearName}.`,
    'Official course catalogue for this semester number:',
    catalogSummaryForSemester(input.semesterNumber),
    'Official locked assignments from uploaded timetable (preserve these day/time/room/faculty rows):',
    sourceDatabaseSummaryForSemester(input.semesterNumber),
    'Use only the provided ids. Do not invent ids, emails, or people.',
    'Your job is faculty assignment only. The server places day, time, and room and enforces no faculty/room conflicts.',
    'Return one assignment per course in the LMS catalog below. Use only courseId and facultyId from that catalog.',
    'Match faculty to the official catalogue names when possible. Shared CSE/ECE courses must use the same facultyId.',
    'Sessions per course per section = max(2, min(4, credits or 2)). The server schedules that many weekly sessions.',
    `Campus grid periods: ${JSON.stringify(input.periods)}.`,
    'Rooms: ELC Class 1, ELC Class 2, ELC Class 3 — max three parallel classes.',
    input.notes ? `Admin notes: ${input.notes}` : '',
    'Return JSON only: {"assignments":[{"courseId":"","facultyId":""}]}',
    'LMS catalog (ids for this institution):',
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

    const semesterNumber = Number(semester.number);
    if (!JNU_BTECH_PROGRESSION_SEMESTERS.includes(semesterNumber as (typeof JNU_BTECH_PROGRESSION_SEMESTERS)[number])) {
      throw new ValidationError(
        'JNU SOE generator supports B.Tech progression semesters I, III, V, VII and IX only',
      );
    }

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

    const allowedCodes = allowedCourseCodesForSemester(semesterNumber);

    const [courseDocsRaw, facultyDocs, sectionDocsRaw, departmentDocs] = await Promise.all([
      CourseModel.find({
        institutionId: oid(institutionId),
        deletedAt: null,
        status: { $in: ['published', 'review', 'scheduled'] },
        semesterIds: oid(input.semesterId),
      })
        .select('courseCode title credits facultyIds coordinatorId programIds departmentId category')
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
        name: /^B\.Tech /,
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

    const courseDocs = courseDocsRaw.filter((doc) => {
      const code = String(doc.courseCode ?? '').toUpperCase();
      if (JNU_UNVERIFIED_COURSE_CODES.has(code)) return false;
      if (allowedCodes && code && !allowedCodes.has(code)) return false;
      return true;
    });

    const sectionDocs = sectionDocsRaw;

    if (sectionDocs.length === 0) {
      throw new ValidationError('No active B.Tech sections found for this semester');
    }
    if (courseDocs.length === 0) {
      throw new ValidationError(
        'No eligible B.Tech courses linked to this semester (check course codes against the official catalogue)',
      );
    }
    if (facultyDocs.length === 0) {
      throw new ValidationError('No active faculty found to assign courses');
    }

    const mapCourseDoc = (doc: (typeof courseDocsRaw)[number]): CourseRecord => ({
      id: String(doc._id),
      courseCode: doc.courseCode as string,
      title: doc.title as string,
      credits: Number(doc.credits ?? 0),
      facultyIds: ((doc.facultyIds as Types.ObjectId[] | undefined) ?? []).map(String),
      coordinatorId: doc.coordinatorId ? String(doc.coordinatorId) : null,
      programIds: ((doc.programIds as Types.ObjectId[] | undefined) ?? []).map(String),
      departmentId: doc.departmentId ? String(doc.departmentId) : null,
      category: (doc.category as string | null) ?? null,
    });

    const courses: CourseRecord[] = courseDocs.map(mapCourseDoc);

    const coursesForOfficialGrid: CourseRecord[] = courseDocsRaw
      .filter((doc) => {
        const code = String(doc.courseCode ?? '').toUpperCase();
        return !JNU_UNVERIFIED_COURSE_CODES.has(code);
      })
      .map(mapCourseDoc);

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

    const workingDays = uniqueDays([...DEFAULT_WORKING_DAYS]);
    const periods = [...JNU_SOE_MONSOON_PERIODS];

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

    const isJnuProgression = JNU_BTECH_PROGRESSION_SEMESTERS.includes(
      semesterNumber as (typeof JNU_BTECH_PROGRESSION_SEMESTERS)[number],
    );
    const officialPreview = buildOfficialSettledSlots(
      semesterNumber,
      coursesForOfficialGrid,
      sections,
      faculty,
    );
    const useOfficialGrid = isJnuProgression && officialPreview.lockedCount > 0;

    let geminiUsed = false;
    let proposal = parseGeminiTimetableProposal(null);
    if (isGeminiConfigured() && !useOfficialGrid) {
      try {
        const raw = await generateGeminiJson({
          prompt: buildPrompt({
            semesterName: semester.name,
            semesterNumber,
            academicYearName: academicYear?.name ?? semesterYearId,
            classYear: classYearForSemesterNumber(semesterNumber),
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
          maxOutputTokens: 4096,
          timeoutMs: 120_000,
        });
        proposal = parseGeminiTimetableProposal(raw);
        geminiUsed = proposal.assignments.length > 0;
      } catch (err) {
        logger.warn({ err }, 'Gemini timetable proposal failed; using local settler');
      }
    }

    const sourceUncertainties = buildJnuSourceDatabase().uncertainties;

    let settled: SettleResult;
    if (useOfficialGrid) {
      if (officialPreview.slots.length === 0) {
        throw new ValidationError(
          'Official Monsoon grid could not be mapped. Run: SEED_INSTITUTION_ID=<id> pnpm --filter @learnova/backend seed:monsoon-2026',
        );
      }
      settled = {
        slots: officialPreview.slots,
        assignments: teachingAssignmentsFromSettledSlots(officialPreview.slots, coursesForOfficialGrid),
        warnings: [...officialPreview.warnings],
      };
    } else {
      settled = settleTimetable({
        courses,
        faculty,
        sections,
        workingDays,
        periods,
        geminiAssignments: proposal.assignments,
        proposedSlots: proposal.slots,
        occupied,
      });
    }

    if (settled.slots.length === 0) {
      throw new ValidationError(
        'Could not place any class slots. Run Monsoon seed (seed:monsoon-2026) or add sections/courses matching the official catalogue.',
      );
    }

    const warnings = [...settled.warnings];
    const droppedCourses = courseDocsRaw.length - courseDocs.length;
    if (droppedCourses > 0) {
      warnings.push(
        `${droppedCourses} course(s) skipped (not in the official B.Tech catalogue for this semester, or unverified codes EN711/EN714).`,
      );
    }
    if (useOfficialGrid) {
      warnings.unshift(
        `Loaded official Monsoon grid: ${officialPreview.mappedCount}/${officialPreview.lockedCount} rows (CSE ${officialPreview.cseSlotCount}, ECE ${officialPreview.eceSlotCount}) — JC BOSE / labs, combined classes where the source has them.`,
      );
      if (officialPreview.mappedCount < officialPreview.lockedCount) {
        warnings.unshift(
          `Some official rows missing (often EN201 for ECE or B.Tech ECE Sem section). Run: SEED_INSTITUTION_ID=<id> pnpm --filter @learnova/backend seed:monsoon-2026`,
        );
      }
    } else if (!isGeminiConfigured()) {
      warnings.unshift(
        'Official grid could not be fully mapped — using the local scheduler with ELC demo rooms. Prefer: pnpm --filter @learnova/backend seed:monsoon-2026',
      );
    } else if (!geminiUsed) {
      warnings.unshift(
        'Official grid could not be fully mapped — using the local scheduler. Prefer Monsoon seed for SOE JNU.',
      );
    } else {
      warnings.unshift(
        'Official grid could not be fully mapped — AI + local scheduler used. Prefer Monsoon seed for SOE JNU.',
      );
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

    const progressionSemesterIds = await SemesterModel.find({
      institutionId: oid(institutionId),
      number: { $in: [...JNU_BTECH_PROGRESSION_SEMESTERS] },
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();

    const allInstitutionSlots = await TimetableSlotModel.find({
      institutionId: oid(institutionId),
      semesterId: { $in: progressionSemesterIds.map((row) => row._id) },
      status: 'active',
      deletedAt: null,
    })
      .select('dayOfWeek startTime endTime facultyId facultyName sectionId sectionName room courseTitle')
      .lean()
      .exec();

    const toValidationSlot = (row: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      facultyId: Types.ObjectId | string;
      facultyName?: string;
      sectionId: Types.ObjectId | string;
      sectionName: string;
      room: string;
      courseTitle?: string;
    }) => ({
      dayOfWeek: row.dayOfWeek as TimetableDayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      facultyId: String(row.facultyId),
      facultyName: row.facultyName,
      sectionId: String(row.sectionId),
      sectionName: row.sectionName,
      room: row.room,
      courseTitle: row.courseTitle,
    });

    const thisSemesterValidation = validateJnuTimetable(
      created.map((row) => toValidationSlot(row)),
      { uncertainties: sourceUncertainties },
    );
    if (!thisSemesterValidation.valid) {
      warnings.push(
        `This semester: ${thisSemesterValidation.facultyClashes.length} faculty and ${thisSemesterValidation.roomClashes.length} room conflicts detected.`,
      );
    }

    const globalValidation = validateJnuTimetable(
      allInstitutionSlots.map((row) => toValidationSlot(row)),
      { uncertainties: sourceUncertainties },
    );
    if (globalValidation.facultyClashes.length > 0) {
      warnings.push(
        `${globalValidation.facultyClashes.length} faculty time overlap(s) across B.Tech semesters (Years I–IX run in the same week). Re-run Monsoon seed for all semesters or adjust slots before publish.`,
      );
    }

    return {
      timetable: timetableRepository.toDto(timetable, created.length),
      assignments: settled.assignments,
      slots: created,
      warnings,
    };
  }
}

export const timetableGeneratorService = new TimetableGeneratorService();
