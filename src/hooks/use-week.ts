import { useQuery } from "@tanstack/react-query";
import { getWeeks, getWeek, getCurrentWeek } from "../lib/week";

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
