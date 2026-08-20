import type { ID } from '../common/index.js';

export type TimetableStatus = 'draft' | 'published' | 'archived';

export type TimetableDayOfWeek =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun';

export type TimetableSlotStatus = 'active' | 'cancelled';

export interface Timetable {
  id: ID;
  institutionId: ID;
  semesterId: ID;
  academicYearId: ID;
  name: string;
  status: TimetableStatus;
  publishedAt: string | null;
  slotCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: ID;
  timetableId: ID;
  institutionId: ID;
  semesterId: ID;
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  courseId: ID;
  courseTitle: string;
  sectionId: ID;
  sectionName: string;
  facultyId: ID;
  facultyName: string;
  room: string;
  status: TimetableSlotStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableTodayClass {
  slotId: ID;
  startTime: string;
  endTime: string;
  courseTitle: string;
  sectionName: string;
  facultyName: string;
  room: string;
}
