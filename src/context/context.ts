import { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import { Profile, LeagueMembership, League, LeagueSeason } from "../types";

interface AppContextType {
  user: User | null;
  profile: Profile | null;
  memberships: LeagueMembership[];
  activeLeague: League | null;
  activeSeason: LeagueSeason | null;
  activeRole: "commissioner" | "member" | null;
  setActiveLeague: (league: League) => void;
  refreshLeagues: () => Promise<void>;
  loading: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
