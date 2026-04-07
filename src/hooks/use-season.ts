import { useQuery } from "@tanstack/react-query";
import {
  getSeasons,
  getSeason,
  getActiveSeason,
  getCurrentSeason,
} from "../lib/season";

const KEYS = {
  all: ["seasons"] as const,
  detail: (id: string) => ["seasons", id] as const,
  active: ["seasons", "active"] as const,
  current: ["seasons", "current"] as const,
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

export function useCurrentSeason() {
  return useQuery({
    queryKey: KEYS.current,
    queryFn: getCurrentSeason,
  });
}
