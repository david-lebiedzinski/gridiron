import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPicksByGame,
  getPicksBySeason,
  getUserPicks,
  upsertPick,
  deletePick,
  getWeekBonuses,
  createWeekBonus,
} from "../lib/pick";
import type { PickInsert, WeekBonusInsert } from "../lib/types";

const KEYS = {
  byGame: (leagueId: string, gameId: string) =>
    ["picks", leagueId, "game", gameId] as const,
  bySeason: (leagueId: string, seasonId: string) =>
    ["picks", leagueId, "season", seasonId] as const,
  byUser: (leagueId: string, userId: string) =>
    ["picks", leagueId, "user", userId] as const,
  weekBonuses: (leagueId: string) => ["week-bonuses", leagueId] as const,
};

export function usePicksByGame(leagueId: string, gameId: string) {
  return useQuery({
    queryKey: KEYS.byGame(leagueId, gameId),
    queryFn: () => getPicksByGame(leagueId, gameId),
    enabled: !!leagueId && !!gameId,
  });
}

export function usePicksBySeason(leagueId: string, seasonId: string) {
  return useQuery({
    queryKey: KEYS.bySeason(leagueId, seasonId),
    queryFn: () => getPicksBySeason(leagueId, seasonId),
    enabled: !!leagueId && !!seasonId,
  });
}

export function useUserPicks(leagueId: string, userId: string) {
  return useQuery({
    queryKey: KEYS.byUser(leagueId, userId),
    queryFn: () => getUserPicks(leagueId, userId),
    enabled: !!leagueId && !!userId,
  });
}

export function useUpsertPick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pick: PickInsert) => upsertPick(pick),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["picks"] }),
  });
}

export function useDeletePick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leagueId,
      userId,
      gameId,
    }: {
      leagueId: string;
      userId: string;
      gameId: string;
    }) => deletePick(leagueId, userId, gameId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["picks"] }),
  });
}

export function useWeekBonuses(leagueId: string) {
  return useQuery({
    queryKey: KEYS.weekBonuses(leagueId),
    queryFn: () => getWeekBonuses(leagueId),
    enabled: !!leagueId,
  });
}

export function useCreateWeekBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bonus: WeekBonusInsert) => createWeekBonus(bonus),
    onSuccess: (_, variables) =>
      qc.invalidateQueries({
        queryKey: KEYS.weekBonuses(variables.league_id),
      }),
  });
}
