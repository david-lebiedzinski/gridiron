import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getUserLeagues } from "../lib/leagues";
import { supabase } from "../lib/supabase";
import type { League, LeagueMembership, Profile } from "../types";
import { AppContext } from "./context";

// ─── Provider ──────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  // active league for the user
  const [activeLeague, setActiveLeagueState] = useState<League | null>(null);
  const [memberships, setMemberships] = useState<LeagueMembership[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(userId: string) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);
    }

    try {
      const memberships = await getUserLeagues(userId);
      setMemberships(memberships);

      const savedLeagueId = localStorage.getItem("activeLeagueId");
      const saved = memberships.find((m) => m.leagues.id === savedLeagueId);
      if (saved) {
        setActiveLeagueState(saved.leagues);
      } else if (memberships.length === 1) {
        setActiveLeagueState(memberships[0].leagues);
      }
    } catch (err) {
      console.error("Failed to load leagues:", err);
      setMemberships([]);
    }
  }

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(async ({ data: { user: authUser } }) => {
        if (cancelled) return;
        if (authUser) {
          setUser(authUser);
          await loadUserData(authUser.id).catch(console.error);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        loadUserData(session.user.id).catch(console.error);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setMemberships([]);
        setActiveLeagueState(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshLeagues() {
    if (!user) return;
    const leagueData = ((await getUserLeagues(user.id)) ??
      []) as LeagueMembership[];
    setMemberships(leagueData);
  }

  function setActiveLeague(league: League) {
    setActiveLeagueState(league);
    localStorage.setItem("activeLeagueId", league.id);
  }

  const activeSeason =
    activeLeague?.league_seasons?.find((s) => s.is_active) ??
    activeLeague?.league_seasons?.[0] ??
    null;

  const activeRole =
    memberships.find((m) => m.leagues.id === activeLeague?.id)?.role ?? null;

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        memberships,
        activeLeague,
        activeSeason,
        activeRole,
        setActiveLeague,
        refreshLeagues,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
