import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  PaginatedMeta,
  Timetable,
  TimetableSlot,
  TimetableTodayClass,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';

export interface TimetableListParams {
  semesterId?: string;
  status?: Timetable['status'];
  page?: number;
  limit?: number;
}

export interface TimetableSlotListParams {
  dayOfWeek?: TimetableSlot['dayOfWeek'];
  sectionId?: string;
  facultyId?: string;
  courseId?: string;
  status?: TimetableSlot['status'];
  page?: number;
  limit?: number;
  sortBy?: 'dayOfWeek' | 'startTime' | 'courseTitle' | 'sectionName';
  sortOrder?: 'asc' | 'desc';
}

export interface TimetableListResult {
  items: Timetable[];
  meta: PaginatedMeta;
}

export interface TimetableSlotListResult {
  items: TimetableSlot[];
  meta: PaginatedMeta;
}

export interface CreateTimetableBody {
  semesterId: string;
  academicYearId: string;
  name: string;
}

export interface CreateTimetableSlotBody {
  dayOfWeek: TimetableSlot['dayOfWeek'];
  startTime: string;
  endTime: string;
  courseId: string;
  sectionId: string;
  facultyId: string;
  room: string;
  status?: TimetableSlot['status'];
}

export type UpdateTimetableSlotBody = Partial<CreateTimetableSlotBody>;

export interface TimetableTodayResult {
  date: string;
  dayOfWeek: TimetableSlot['dayOfWeek'];
  classes: TimetableTodayClass[];
}

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const timetableApi = {
  list: async (params?: TimetableListParams): Promise<TimetableListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Timetable[] }>(
      `${API_ROUTES.TIMETABLES}${toQuery(params ?? {})}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params?.page, params?.limit) };
  },

  create: (body: CreateTimetableBody) =>
    apiClient.post<Timetable>(API_ROUTES.TIMETABLES, body),

  publish: (id: string) =>
    apiClient.patch<Timetable>(`${API_ROUTES.TIMETABLES}/${id}/publish`),

  listSlots: async (
    timetableId: string,
    params?: TimetableSlotListParams,
  ): Promise<TimetableSlotListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: TimetableSlot[] }>(
      `${API_ROUTES.TIMETABLES}/${timetableId}/slots${toQuery(params ?? {})}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params?.page, params?.limit) };
  },

  createSlot: (timetableId: string, body: CreateTimetableSlotBody) =>
    apiClient.post<TimetableSlot>(`${API_ROUTES.TIMETABLES}/${timetableId}/slots`, body),

  updateSlot: (slotId: string, body: UpdateTimetableSlotBody) =>
    apiClient.patch<TimetableSlot>(`${API_ROUTES.TIMETABLE_SLOTS}/${slotId}`, body),

  deleteSlot: (slotId: string) =>
    apiClient.delete<{ deleted: boolean }>(`${API_ROUTES.TIMETABLE_SLOTS}/${slotId}`),

  today: () => apiClient.get<TimetableTodayResult>(`${API_ROUTES.TIMETABLES}/today`),
};
