import { Types } from 'mongoose';
import type { CreateCourseInput, CreateFacultyInput, CreateStudentInput } from '@learnova/validation';
import { EntityIdSequenceModel } from '../../models/entity-id-sequence.model.js';
import { InstitutionModel } from '../../models/institution.model.js';

const DEFAULT_PREFIX = 'LNV';

type EntityIdSegment = 'STU' | 'ADM' | 'FAC' | 'FC' | 'CRS';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function padSequence(seq: number, width = 5): string {
  return String(seq).padStart(width, '0');
}

async function getInstitutionPrefix(institutionId: string): Promise<string> {
  const inst = await InstitutionModel.findById(institutionId).select('code').lean().exec();
  return inst?.code?.toUpperCase() ?? DEFAULT_PREFIX;
}

async function nextSequence(
  institutionId: string,
  segment: EntityIdSegment,
  year: number | null,
): Promise<number> {
  const row = await EntityIdSequenceModel.findOneAndUpdate(
    { institutionId: oid(institutionId), segment, year },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
  return row.sequence;
}

async function allocateYearlyId(
  institutionId: string,
  segment: Extract<EntityIdSegment, 'STU' | 'ADM'>,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = await getInstitutionPrefix(institutionId);
  const seq = await nextSequence(institutionId, segment, year);
  return `${prefix}-${segment}-${year}-${padSequence(seq)}`;
}

async function allocateRollingId(
  institutionId: string,
  segment: Extract<EntityIdSegment, 'FAC' | 'FC' | 'CRS'>,
): Promise<string> {
  const prefix = await getInstitutionPrefix(institutionId);
  const seq = await nextSequence(institutionId, segment, null);
  return `${prefix}-${segment}-${padSequence(seq)}`;
}

export async function allocateStudentId(institutionId: string): Promise<string> {
  return allocateYearlyId(institutionId, 'STU');
}

export async function allocateAdmissionNumber(institutionId: string): Promise<string> {
  return allocateYearlyId(institutionId, 'ADM');
}

export async function allocateEmployeeId(institutionId: string): Promise<string> {
  return allocateRollingId(institutionId, 'FAC');
}

export async function allocateFacultyCode(institutionId: string): Promise<string> {
  return allocateRollingId(institutionId, 'FC');
}

export async function allocateCourseCode(institutionId: string): Promise<string> {
  return allocateRollingId(institutionId, 'CRS');
}

export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'course';
}

export async function ensureUniqueSlug(
  baseSlug: string,
  slugExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 0;
  while (await slugExists(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
}

export async function resolveStudentCreateIds(
  institutionId: string,
  input: Pick<CreateStudentInput, 'studentId' | 'admissionNumber'>,
): Promise<{ studentId: string; admissionNumber: string }> {
  const [studentId, admissionNumber] = await Promise.all([
    input.studentId?.trim()
      ? Promise.resolve(input.studentId.trim())
      : allocateStudentId(institutionId),
    input.admissionNumber?.trim()
      ? Promise.resolve(input.admissionNumber.trim())
      : allocateAdmissionNumber(institutionId),
  ]);
  return { studentId, admissionNumber };
}

export async function resolveFacultyCreateIds(
  institutionId: string,
  input: Pick<CreateFacultyInput, 'employeeId' | 'facultyCode'>,
): Promise<{ employeeId: string; facultyCode: string }> {
  const [employeeId, facultyCode] = await Promise.all([
    input.employeeId?.trim()
      ? Promise.resolve(input.employeeId.trim())
      : allocateEmployeeId(institutionId),
    input.facultyCode?.trim()
      ? Promise.resolve(input.facultyCode.trim().toUpperCase())
      : allocateFacultyCode(institutionId),
  ]);
  return { employeeId, facultyCode };
}

export async function resolveCourseCreateIds(
  institutionId: string,
  input: Pick<CreateCourseInput, 'courseCode' | 'slug' | 'title'>,
  slugExists: (slug: string) => Promise<boolean>,
): Promise<{ courseCode: string; slug: string }> {
  const courseCode = input.courseCode?.trim()
    ? input.courseCode.trim().toUpperCase()
    : await allocateCourseCode(institutionId);

  const baseSlug = input.slug?.trim() || generateSlug(input.title);
  const slug = (await ensureUniqueSlug(baseSlug, slugExists)).toLowerCase();

  return { courseCode, slug };
}
