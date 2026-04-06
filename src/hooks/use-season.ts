import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSeasons,
  getSeason,
  getActiveSeason,
  createSeason,
  updateSeason,
  deleteSeason,
} from "../lib/season";
import type { SeasonInsert, SeasonUpdate } from "../lib/types";

const KEYS = {
  all: ["seasons"] as const,
  detail: (id: string) => ["seasons", id] as const,
  active: ["seasons", "active"] as const,
};

export function useSeasons() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: getSeasons,
  });
}

export function useSeason(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getSeason(id),
    enabled: !!id,
  });
}

export function useActiveSeason() {
  return useQuery({
    queryKey: KEYS.active,
    queryFn: getActiveSeason,
  });
}

export function useCreateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (season: SeasonInsert) => createSeason(season),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.active });
    },
  });
}

export function useUpdateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SeasonUpdate }) =>
      updateSeason(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.active });
    },
  });
}

export function useDeleteSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSeason(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.active });
    },
  });
}
