'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  timetableApi,
  type CreateTimetableBody,
  type CreateTimetableSlotBody,
  type TimetableListParams,
  type TimetableSlotListParams,
  type UpdateTimetableSlotBody,
} from '../services/timetable-api';

export const timetableKeys = {
  all: ['timetable'] as const,
  list: (params?: TimetableListParams) => ['timetable', 'list', params] as const,
  slots: (timetableId: string, params?: TimetableSlotListParams) =>
    ['timetable', 'slots', timetableId, params] as const,
  today: ['timetable', 'today'] as const,
};

export function useTimetables(params?: TimetableListParams, enabled = true) {
  return useQuery({
    queryKey: timetableKeys.list(params),
    queryFn: () => timetableApi.list(params),
    enabled,
  });
}

export function useTimetableSlots(
  timetableId: string,
  params?: TimetableSlotListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: timetableKeys.slots(timetableId, params),
    queryFn: () => timetableApi.listSlots(timetableId, params),
    enabled: enabled && Boolean(timetableId),
  });
}

export function useTodayClasses(enabled = true) {
  return useQuery({
    queryKey: timetableKeys.today,
    queryFn: () => timetableApi.today(),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateTimetableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTimetableBody) => timetableApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all });
    },
  });
}

export function usePublishTimetableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableApi.publish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all });
    },
  });
}

export function useCreateTimetableSlotMutation(timetableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTimetableSlotBody) => timetableApi.createSlot(timetableId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.slots(timetableId) });
      void queryClient.invalidateQueries({ queryKey: timetableKeys.list() });
    },
  });
}

export function useUpdateTimetableSlotMutation(timetableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTimetableSlotBody }) =>
      timetableApi.updateSlot(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.slots(timetableId) });
    },
  });
}

export function useDeleteTimetableSlotMutation(timetableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableApi.deleteSlot(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.slots(timetableId) });
      void queryClient.invalidateQueries({ queryKey: timetableKeys.list() });
    },
  });
}
