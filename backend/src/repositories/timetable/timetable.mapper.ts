import type {
  Timetable,
  TimetableDayOfWeek,
  TimetableSlot,
  TimetableSlotStatus,
  TimetableStatus,
} from '@learnova/types';
import type { TimetableDocument, TimetableSlotDocument } from '../../models/index.js';

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function timetableToDto(doc: TimetableDocument, slotCount = 0): Timetable {
  return {
    id: String(doc._id),
    institutionId: String(doc.institutionId),
    semesterId: String(doc.semesterId),
    academicYearId: String(doc.academicYearId),
    name: doc.name,
    status: doc.status as TimetableStatus,
    publishedAt: toIso(doc.publishedAt),
    slotCount,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function timetableSlotToDto(doc: TimetableSlotDocument): TimetableSlot {
  return {
    id: String(doc._id),
    timetableId: String(doc.timetableId),
    institutionId: String(doc.institutionId),
    semesterId: String(doc.semesterId),
    dayOfWeek: doc.dayOfWeek as TimetableDayOfWeek,
    startTime: doc.startTime,
    endTime: doc.endTime,
    courseId: String(doc.courseId),
    courseTitle: doc.courseTitle,
    sectionId: String(doc.sectionId),
    sectionName: doc.sectionName,
    facultyId: String(doc.facultyId),
    facultyName: doc.facultyName,
    room: doc.room,
    status: doc.status as TimetableSlotStatus,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}
