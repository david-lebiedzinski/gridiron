import { useQuery } from "@tanstack/react-query";
import { getTeams, getTeam, getTeamByAbbr } from "../lib/team";

const KEYS = {
  all: ["teams"] as const,
  detail: (id: string) => ["teams", id] as const,
  byAbbr: (abbr: string) => ["teams", "abbr", abbr] as const,
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
