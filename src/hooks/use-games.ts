import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/client";
import {
  getGamesByWeek,
  getGamesBySeason,
  getGame,
  createGame,
  updateGame,
  upsertGames,
  deleteGame,
} from "../lib/game";
import type { Game, GameInsert, GameUpdate } from "../lib/types";

const KEYS = {
  byWeek: (weekId: string) => ["games", "week", weekId] as const,
  bySeason: (seasonId: string) => ["games", "season", seasonId] as const,
  detail: (id: string) => ["games", "detail", id] as const,
};

export function useGamesByWeek(weekId: string) {
  return useQuery({
    queryKey: KEYS.byWeek(weekId),
    queryFn: () => getGamesByWeek(weekId),
    enabled: !!weekId,
  });
}

export function useGamesBySeason(seasonId: string) {
  return useQuery({
    queryKey: KEYS.bySeason(seasonId),
    queryFn: () => getGamesBySeason(seasonId),
    enabled: !!seasonId,
  });
}

export function useGame(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getGame(id),
    enabled: !!id,
  });
}

export function useCreateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (game: GameInsert) => createGame(game),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["games"],
      }),
  });
}

export function useUpdateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: GameUpdate }) =>
      updateGame(id, updates),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["games"],
      }),
  });
}

export function useUpsertGames() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (games: GameInsert[]) => upsertGames(games),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["games"],
      }),
  });
}

export function useDeleteGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGame(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["games"],
      }),
  });
}

// ─── Realtime subscription ───────────────────────────────────

export function useGameRealtime(seasonId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!seasonId) {
      return;
    }

    const channel = supabase
      .channel("game-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game",
        },
        (payload) => {
          const updated = payload.new as Game;
          qc.setQueriesData<Game[]>(
            { queryKey: KEYS.bySeason(seasonId) },
            (old) => old?.map((g) => (g.id === updated.id ? updated : g)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId, qc]);
}
