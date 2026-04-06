import { createContext, useContext, useState } from "react";

interface LeagueContextType {
  activeLeagueId: string | null;
  setActiveLeagueId: (id: string) => void;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

interface LeagueProviderProps {
  children: React.ReactNode;
}

export function LeagueProvider({ children }: LeagueProviderProps) {
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(() =>
    localStorage.getItem("activeLeagueId"),
  );

  function setActiveLeagueId(id: string) {
    setActiveLeagueIdState(id);
    localStorage.setItem("activeLeagueId", id);
  }

  return (
    <LeagueContext.Provider
      value={{
        activeLeagueId,
        setActiveLeagueId,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLeagueContext() {
  const ctx = useContext(LeagueContext);
  if (!ctx) {
    throw new Error("useLeagueContext must be used within LeagueProvider");
  }
  return ctx;
}
