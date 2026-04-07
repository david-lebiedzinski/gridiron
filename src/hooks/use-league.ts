import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeagues,
  getLeague,
  getLeagueByInviteCode,
  getUserLeagues,
  createLeague,
  updateLeague,
  deleteLeague,
  getLeagueMembers,
  joinLeague,
  leaveLeague,
  regenerateInviteCode,
} from "../lib/league";
import type { LeagueInsert, LeagueUpdate } from "../lib/types";

const KEYS = {
  all: ["leagues"] as const,
  detail: (id: string) => ["leagues", id] as const,
  byInvite: (code: string) => ["leagues", "invite", code] as const,
  userLeagues: (userId: string) => ["leagues", "user", userId] as const,
  members: (leagueId: string) => ["league-members", leagueId] as const,
};

export function useLeagues() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: getLeagues,
  });
}

export function useLeague(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getLeague(id),
    enabled: !!id,
  });
}

export function useLeagueByInviteCode(code: string) {
  return useQuery({
    queryKey: KEYS.byInvite(code),
    queryFn: () => getLeagueByInviteCode(code),
    enabled: !!code,
  });
}

export function useUserLeagues(userId: string) {
  return useQuery({
    queryKey: KEYS.userLeagues(userId),
    queryFn: () => getUserLeagues(userId),
    enabled: !!userId,
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (league: LeagueInsert) => createLeague(league),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LeagueUpdate }) =>
      updateLeague(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeague(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useLeagueMembers(leagueId: string) {
  return useQuery({
    queryKey: KEYS.members(leagueId),
    queryFn: () => getLeagueMembers(leagueId),
    enabled: !!leagueId,
  });
}

export function useJoinLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, userId }: { leagueId: string; userId: string }) =>
      joinLeague(leagueId, userId),
    onSuccess: (_, { leagueId }) =>
      qc.invalidateQueries({ queryKey: KEYS.members(leagueId) }),
  });
}

export function useLeaveLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, userId }: { leagueId: string; userId: string }) =>
      leaveLeague(leagueId, userId),
    onSuccess: (_, { leagueId }) =>
      qc.invalidateQueries({ queryKey: KEYS.members(leagueId) }),
  });
}

export function useRegenerateInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => regenerateInviteCode(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(data.id) });
    },
  });
}
