import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeams,
  getTeam,
  getTeamByAbbr,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamRecords,
  upsertTeamRecord,
} from "../lib/team";
import type { TeamInsert, TeamUpdate, TeamRecordInsert } from "../lib/types";

const KEYS = {
  all: ["teams"] as const,
  detail: (id: string) => ["teams", id] as const,
  byAbbr: (abbr: string) => ["teams", "abbr", abbr] as const,
  records: (seasonId: string) => ["team-records", seasonId] as const,
};

export function useTeams() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: getTeams,
    staleTime: Infinity,
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getTeam(id),
    enabled: !!id,
  });
}

export function useTeamByAbbr(abbr: string) {
  return useQuery({
    queryKey: KEYS.byAbbr(abbr),
    queryFn: () => getTeamByAbbr(abbr),
    enabled: !!abbr,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (team: TeamInsert) => createTeam(team),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TeamUpdate }) =>
      updateTeam(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useTeamRecords(seasonId: string) {
  return useQuery({
    queryKey: KEYS.records(seasonId),
    queryFn: () => getTeamRecords(seasonId),
    enabled: !!seasonId,
  });
}

export function useUpsertTeamRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record: TeamRecordInsert) => upsertTeamRecord(record),
    onSuccess: (_, variables) =>
      qc.invalidateQueries({ queryKey: KEYS.records(variables.season_id) }),
  });
}
