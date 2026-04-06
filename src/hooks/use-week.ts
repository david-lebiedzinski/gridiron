import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWeeks,
  getWeek,
  getCurrentWeek,
  createWeek,
  updateWeek,
  deleteWeek,
} from "../lib/week";
import type { WeekInsert, WeekUpdate } from "../lib/types";

const KEYS = {
  bySeason: (seasonId: string) => ["weeks", seasonId] as const,
  detail: (id: string) => ["weeks", "detail", id] as const,
  current: (seasonId: string) => ["weeks", "current", seasonId] as const,
};

export function useWeeks(seasonId: string) {
  return useQuery({
    queryKey: KEYS.bySeason(seasonId),
    queryFn: () => getWeeks(seasonId),
    enabled: !!seasonId,
  });
}

export function useWeek(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getWeek(id),
    enabled: !!id,
  });
}

export function useCurrentWeek(seasonId: string) {
  return useQuery({
    queryKey: KEYS.current(seasonId),
    queryFn: () => getCurrentWeek(seasonId),
    enabled: !!seasonId,
  });
}

export function useCreateWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (week: WeekInsert) => createWeek(week),
    onSuccess: (_, variables) =>
      qc.invalidateQueries({
        queryKey: KEYS.bySeason(variables.season_id),
      }),
  });
}

export function useUpdateWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: WeekUpdate }) =>
      updateWeek(id, updates),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["weeks"],
      }),
  });
}

export function useDeleteWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWeek(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["weeks"],
      }),
  });
}
