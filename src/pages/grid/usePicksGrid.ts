import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../../context/context";
import {
  fetchSeasonGames,
  fetchLeaguePicks,
  upsertPick,
  deletePick,
  getCurrentWeekNumber,
  groupGamesByWeek,
} from "../../lib/picks";
import type { GridWeek, GridMember, GridPick } from "../../lib/picks";
import { getLeagueMembers } from "../../lib/leagues";
import { getSeasonSettings } from "../../lib/commissioner";
import { calculateLeaderboard } from "../../lib/scoring";
import { supabase } from "../../lib/client";
import type { SeasonSettings } from "../../types";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface UsePicksGridResult {
  weeks: GridWeek[];
  members: GridMember[];
  picksByKey: Map<string, GridPick>;
  settings: SeasonSettings | null;
  currentWeekNumber: number;
  loading: boolean;
  error: string | null;
  handlePickCycle: (gameId: string, awayAbbr: string, homeAbbr: string) => void;
  savingGameIds: Set<string>;
  errorGameIds: Set<string>;
  toast: ToastState | null;
}

export function usePicksGrid(): UsePicksGridResult {
  const { user, activeLeague, activeSeason } = useApp();

  const [weeks, setWeeks] = useState<GridWeek[]>([]);
  const [members, setMembers] = useState<GridMember[]>([]);
  const [picksByKey, setPicksByKey] = useState<Map<string, GridPick>>(
    new Map(),
  );
  const [settings, setSettings] = useState<SeasonSettings | null>(null);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingGameIds, setSavingGameIds] = useState<Set<string>>(new Set());
  const [errorGameIds, setErrorGameIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);

  // Debounce timers per game
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // Snapshot for rollback on error
  const pickSnapshots = useRef<Map<string, GridPick | undefined>>(new Map());

  const userId = user?.id ?? "";
  const leagueId = activeLeague?.id;
  const leagueSeasonId = activeSeason?.id;
  const nflSeasonId = activeSeason?.nfl_seasons?.id;

  // ─── Load data ────────────────────────────────────────────

  useEffect(() => {
    if (!leagueId || !leagueSeasonId || !nflSeasonId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [games, picks, seasonSettings, memberRows, leaderboard] =
          await Promise.all([
            fetchSeasonGames(nflSeasonId!),
            fetchLeaguePicks(leagueSeasonId!),
            getSeasonSettings(leagueSeasonId!),
            getLeagueMembers(leagueId!),
            getSeasonSettings(leagueSeasonId!).then((s) =>
              calculateLeaderboard(leagueId!, leagueSeasonId!, s),
            ),
          ]);

        if (cancelled) {
          return;
        }

        // Build picks map
        const pMap = new Map<string, GridPick>();
        for (const pick of picks) {
          pMap.set(`${pick.user_id}:${pick.game_id}`, pick);
        }

        // Build leaderboard rank map
        const rankMap = new Map<
          string,
          { rank: number; totalPoints: number }
        >();
        leaderboard.forEach((entry, idx) => {
          rankMap.set(entry.user_id, {
            rank: idx + 1,
            totalPoints: entry.total_points,
          });
        });

        // Build members sorted by rank
        const gridMembers: GridMember[] = memberRows
          .filter((m) => m.profiles)
          .map((m) => {
            const profile = m.profiles!;
            const lb = rankMap.get(profile.id);
            return {
              user_id: profile.id,
              username: profile.username,
              avatar_color: profile.avatar_color,
              total_points: lb?.totalPoints ?? 0,
              rank: lb?.rank ?? memberRows.length,
              isCurrentUser: profile.id === userId,
            };
          })
          .sort((a, b) => a.rank - b.rank);

        // Group games into weeks
        const weekNum = getCurrentWeekNumber(games);
        const grouped = groupGamesByWeek(games, weekNum);

        setPicksByKey(pMap);
        setMembers(gridMembers);
        setWeeks(grouped);
        setCurrentWeekNumber(weekNum);
        setSettings(seasonSettings);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load picks data",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [leagueId, leagueSeasonId, nflSeasonId, userId]);

  // ─── Realtime: live_game_state changes ────────────────────

  const refreshGames = useCallback(async () => {
    if (!nflSeasonId) {
      return;
    }
    try {
      const games = await fetchSeasonGames(nflSeasonId);
      const weekNum = getCurrentWeekNumber(games);
      const grouped = groupGamesByWeek(games, weekNum);
      setWeeks(grouped);
      setCurrentWeekNumber(weekNum);
    } catch {
      // Silent — don't overwrite existing error or loading state
    }
  }, [nflSeasonId]);

  useEffect(() => {
    if (!nflSeasonId) {
      return;
    }

    const channel = supabase
      .channel("live-game-state")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_game_state",
        },
        () => {
          refreshGames();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nflSeasonId, refreshGames]);

  // ─── Pick cycling ─────────────────────────────────────────

  const handlePickCycle = useCallback(
    (gameId: string, awayAbbr: string, homeAbbr: string) => {
      if (!userId || !leagueSeasonId) {
        return;
      }

      const key = `${userId}:${gameId}`;
      const currentPick = picksByKey.get(key);
      const currentAbbr = currentPick?.picked_team_abbr ?? null;

      // Cycle: null → away → home → null
      let nextAbbr: string | null;
      if (!currentAbbr) {
        nextAbbr = awayAbbr;
      } else if (currentAbbr === awayAbbr) {
        nextAbbr = homeAbbr;
      } else {
        nextAbbr = null;
      }

      // Save snapshot for rollback (only save first time per debounce cycle)
      if (!pickSnapshots.current.has(gameId)) {
        pickSnapshots.current.set(gameId, currentPick);
      }

      // Optimistic update
      setPicksByKey((prev) => {
        const next = new Map(prev);
        if (nextAbbr) {
          next.set(key, {
            user_id: userId,
            game_id: gameId,
            picked_team_abbr: nextAbbr,
            is_correct: null,
            is_sole_correct: null,
            points_awarded: null,
          });
        } else {
          next.delete(key);
        }
        return next;
      });

      // Debounced save
      const existingTimer = debounceTimers.current.get(gameId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        debounceTimers.current.delete(gameId);
        persistPick(gameId, nextAbbr, key);
      }, 300);

      debounceTimers.current.set(gameId, timer);
    },
    [userId, leagueSeasonId, picksByKey],
  );

  async function persistPick(
    gameId: string,
    pickedTeamAbbr: string | null,
    key: string,
  ) {
    setSavingGameIds((prev) => new Set(prev).add(gameId));

    try {
      if (pickedTeamAbbr) {
        await upsertPick(userId, gameId, leagueSeasonId!, pickedTeamAbbr);
        showToast({ message: `${pickedTeamAbbr} picked`, type: "success" });
      } else {
        await deletePick(userId, gameId, leagueSeasonId!);
        showToast({ message: "Pick cleared", type: "info" });
      }
      // Clear snapshot on success
      pickSnapshots.current.delete(gameId);
    } catch {
      // Rollback
      const snapshot = pickSnapshots.current.get(gameId);
      setPicksByKey((prev) => {
        const next = new Map(prev);
        if (snapshot) {
          next.set(key, snapshot);
        } else {
          next.delete(key);
        }
        return next;
      });
      pickSnapshots.current.delete(gameId);

      // Error feedback
      setErrorGameIds((prev) => new Set(prev).add(gameId));
      showToast({ message: "Failed to save pick. Try again.", type: "error" });
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
  }

  function showToast(t: ToastState) {
    setToast(t);
    setTimeout(() => setToast(null), 2000);
  }

  return {
    weeks,
    members,
    picksByKey,
    settings,
    currentWeekNumber,
    loading,
    error,
    handlePickCycle,
    savingGameIds,
    errorGameIds,
    toast,
  };
}
