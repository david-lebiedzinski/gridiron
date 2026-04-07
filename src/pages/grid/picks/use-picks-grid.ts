import { useCallback, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth";
import { useLeagueContext } from "@/context/league";
import { useCurrentSeason } from "@/hooks/use-season";
import { useLeague, useLeagueMembers } from "@/hooks/use-league";
import { useWeeks } from "@/hooks/use-week";
import { useGamesBySeason, useGameRealtime } from "@/hooks/use-games";
import { useTeams } from "@/hooks/use-teams";
import { useProfiles } from "@/hooks/use-profile";
import {
  usePicksByLeagueSeason,
  useUpsertPick,
  useDeletePick,
} from "@/hooks/use-picks";
import type { Game, League, Pick, Profile, Team, Week } from "@/lib/types";
import { GRID } from "@/locales/en";

// ─── Types ──────────────────────────────────────────────────

export interface GridGame {
  id: string;
  week_id: string;
  away_team_id: string;
  home_team_id: string;
  away_abbr: string;
  home_abbr: string;
  away_score: number;
  home_score: number;
  status: string;
  period: number | null;
  display_clock: string | null;
  winner_id: string | null;
  kickoff_time: string;
}

export interface GridWeek {
  id: string;
  label: string;
  phase: string;
  games: GridGame[];
  isCurrent: boolean;
  isPast: boolean;
}

export interface GridMember {
  user_id: string;
  name: string;
  avatar: string | null;
  total_points: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface UsePicksGridResult {
  weeks: GridWeek[];
  members: GridMember[];
  picksByKey: Map<string, Pick>;
  league: League | null;
  loading: boolean;
  error: string | null;
  cyclePick: (gameId: string) => void;
  savingGameIds: Set<string>;
  errorGameIds: Set<string>;
  toast: ToastState | null;
}

// ─── Hook ───────────────────────────────────────────────────

export function usePicksGrid(): UsePicksGridResult {
  const { user } = useAuth();
  const { activeLeagueId } = useLeagueContext();
  const userId = user?.id ?? "";

  const { data: season } = useCurrentSeason();
  const seasonId = season?.id ?? "";

  const { data: league = null } = useLeague(activeLeagueId ?? "");
  const { data: weeks = [], isLoading: weeksLoading } = useWeeks(seasonId);
  const { data: games = [], isLoading: gamesLoading } =
    useGamesBySeason(seasonId);
  const { data: teams = [] } = useTeams();
  const { data: leagueMembers = [] } = useLeagueMembers(activeLeagueId ?? "");
  const { data: profiles = [] } = useProfiles();
  const { data: picks = [], isLoading: picksLoading } = usePicksByLeagueSeason(
    activeLeagueId ?? "",
    seasonId,
  );

  useGameRealtime(seasonId);

  const upsertPick = useUpsertPick();
  const deletePick = useDeletePick();

  // Local optimistic overrides + saving/error tracking
  const [overrides, setOverrides] = useState<Map<string, Pick | null>>(
    new Map(),
  );
  const [savingGameIds, setSavingGameIds] = useState<Set<string>>(new Set());
  const [errorGameIds, setErrorGameIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const snapshots = useRef<Map<string, Pick | undefined>>(new Map());

  // ─── Derived ──

  const teamsById = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of teams) {
      map.set(t.id, t);
    }
    return map;
  }, [teams]);

  const profilesById = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const p of profiles) {
      map.set(p.id, p);
    }
    return map;
  }, [profiles]);

  const gamesById = useMemo(() => {
    const map = new Map<string, Game>();
    for (const g of games) {
      map.set(g.id, g);
    }
    return map;
  }, [games]);

  const picksByKey = useMemo(() => {
    const map = new Map<string, Pick>();
    for (const p of picks) {
      map.set(`${p.user_id}:${p.game_id}`, p);
    }
    // Apply overrides
    for (const [key, override] of overrides) {
      if (override === null) {
        map.delete(key);
      } else {
        map.set(key, override);
      }
    }
    return map;
  }, [picks, overrides]);

  const gridWeeks: GridWeek[] = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    function buildGridGame(g: Game): GridGame {
      const home = teamsById.get(g.home_team_id);
      const away = teamsById.get(g.away_team_id);
      return {
        id: g.id,
        week_id: g.week_id,
        away_team_id: g.away_team_id,
        home_team_id: g.home_team_id,
        away_abbr: away?.abbr ?? "?",
        home_abbr: home?.abbr ?? "?",
        away_score: g.away_score ?? 0,
        home_score: g.home_score ?? 0,
        status: g.status,
        period: g.period,
        display_clock: g.display_clock,
        winner_id: g.winner_id,
        kickoff_time: g.kickoff_time,
      };
    }

    function buildGridWeek(w: Week): GridWeek {
      const weekGames = games
        .filter((g) => g.week_id === w.id)
        .map(buildGridGame)
        .sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time));
      const isCurrent = w.start_date <= today && today <= w.end_date;
      const isPast = w.end_date < today;
      return {
        id: w.id,
        label: w.label,
        phase: w.phase,
        games: weekGames,
        isCurrent,
        isPast,
      };
    }

    return weeks.map(buildGridWeek);
  }, [weeks, games, teamsById]);

  const members: GridMember[] = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of picks) {
      if (p.points != null) {
        totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + p.points);
      }
    }

    const list: GridMember[] = leagueMembers.map((m) => {
      const profile = profilesById.get(m.user_id);
      return {
        user_id: m.user_id,
        name: profile?.name ?? "Unknown",
        avatar: profile?.avatar ?? null,
        total_points: totals.get(m.user_id) ?? 0,
        rank: 0,
        isCurrentUser: m.user_id === userId,
      };
    });

    list.sort((a, b) => b.total_points - a.total_points);
    list.forEach((m, idx) => {
      m.rank = idx + 1;
    });
    return list;
  }, [leagueMembers, profilesById, picks, userId]);

  // ─── Actions ──

  const showToast = useCallback((t: ToastState) => {
    setToast(t);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const persistPick = useCallback(
    async (gameId: string, nextTeamId: string | null, key: string) => {
      if (!activeLeagueId || !userId) {
        return;
      }

      setSavingGameIds((prev) => new Set(prev).add(gameId));

      try {
        if (nextTeamId) {
          await upsertPick.mutateAsync({
            league_id: activeLeagueId,
            user_id: userId,
            game_id: gameId,
            team_id: nextTeamId,
          });
          const team = teamsById.get(nextTeamId);
          showToast({
            message: GRID.toastPicked(team?.abbr ?? ""),
            type: "success",
          });
        } else {
          await deletePick.mutateAsync({
            leagueId: activeLeagueId,
            userId,
            gameId,
          });
          showToast({ message: GRID.toastCleared, type: "info" });
        }
        snapshots.current.delete(gameId);
        // Clear override now that server is canonical
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } catch {
        // Rollback override
        const snap = snapshots.current.get(gameId);
        setOverrides((prev) => {
          const next = new Map(prev);
          if (snap) {
            next.set(key, snap);
          } else {
            next.set(key, null);
          }
          return next;
        });
        snapshots.current.delete(gameId);

        setErrorGameIds((prev) => new Set(prev).add(gameId));
        showToast({ message: GRID.toastError, type: "error" });
        setTimeout(() => {
          setErrorGameIds((prev) => {
            const next = new Set(prev);
            next.delete(gameId);
            return next;
          });
        }, 350);
      } finally {
        setSavingGameIds((prev) => {
          const next = new Set(prev);
          next.delete(gameId);
          return next;
        });
      }
    },
    [activeLeagueId, userId, upsertPick, deletePick, teamsById, showToast],
  );

  const cyclePick = useCallback(
    (gameId: string) => {
      if (!userId || !activeLeagueId) {
        return;
      }
      const game = gamesById.get(gameId);
      if (!game) {
        return;
      }
      if (game.status !== "scheduled") {
        return;
      }

      const key = `${userId}:${gameId}`;
      const current = picksByKey.get(key);

      let nextTeamId: string | null;
      if (!current) {
        nextTeamId = game.away_team_id;
      } else if (current.team_id === game.away_team_id) {
        nextTeamId = game.home_team_id;
      } else {
        nextTeamId = null;
      }

      if (!snapshots.current.has(gameId)) {
        snapshots.current.set(gameId, current);
      }

      // Optimistic
      setOverrides((prev) => {
        const next = new Map(prev);
        if (nextTeamId) {
          next.set(key, {
            league_id: activeLeagueId,
            user_id: userId,
            game_id: gameId,
            team_id: nextTeamId,
            is_correct: null,
            is_sole_correct: null,
            points: null,
          });
        } else {
          next.set(key, null);
        }
        return next;
      });

      const existing = debounceTimers.current.get(gameId);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        debounceTimers.current.delete(gameId);
        persistPick(gameId, nextTeamId, key);
      }, 300);

      debounceTimers.current.set(gameId, timer);
    },
    [userId, activeLeagueId, gamesById, picksByKey, persistPick],
  );

  return {
    weeks: gridWeeks,
    members,
    picksByKey,
    league,
    loading: weeksLoading || gamesLoading || picksLoading,
    error: null,
    cyclePick,
    savingGameIds,
    errorGameIds,
    toast,
  };
}
