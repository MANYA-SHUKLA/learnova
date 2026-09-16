export { timetableApi } from './services/timetable-api';
export type {
  CreateTimetableBody,
  CreateTimetableSlotBody,
  GenerateTimetableBody,
  TimetableListParams,
  TimetableSlotListParams,
  TimetableTodayResult,
  UpdateTimetableSlotBody,
} from './services/timetable-api';
export {
  timetableKeys,
  useCreateTimetableMutation,
  useCreateTimetableSlotMutation,
  useDeleteTimetableSlotMutation,
  useGenerateTimetableMutation,
  usePublishTimetableMutation,
  useTodayClasses,
  useTimetableSlots,
  useTimetables,
  useUpdateTimetableSlotMutation,
} from './hooks/use-timetable-queries';
export { TimetablePage } from './components/timetable-page';
