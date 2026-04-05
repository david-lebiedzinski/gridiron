export interface NFLTeam {
  abbr: string;
  color: string;
}

export const TEAMS: NFLTeam[] = [
  { abbr: "ARI", color: "#97233F" },
  { abbr: "ATL", color: "#A71930" },
  { abbr: "BAL", color: "#241773" },
  { abbr: "BUF", color: "#00338D" },
  { abbr: "CAR", color: "#0085CA" },
  { abbr: "CHI", color: "#0B1C3E" },
  { abbr: "CIN", color: "#FB4F14" },
  { abbr: "CLE", color: "#FF3C00" },
  { abbr: "DAL", color: "#003594" },
  { abbr: "DEN", color: "#FB4F14" },
  { abbr: "DET", color: "#0076B6" },
  { abbr: "GB", color: "#203731" },
  { abbr: "HOU", color: "#03202F" },
  { abbr: "IND", color: "#002C5F" },
  { abbr: "JAX", color: "#006778" },
  { abbr: "KC", color: "#E31837" },
  { abbr: "LAC", color: "#0080C6" },
  { abbr: "LAR", color: "#003594" },
  { abbr: "LV", color: "#A5ACAF" },
  { abbr: "MIA", color: "#008E97" },
  { abbr: "MIN", color: "#4F2683" },
  { abbr: "NE", color: "#002244" },
  { abbr: "NO", color: "#D3BC8D" },
  { abbr: "NYG", color: "#0B2265" },
  { abbr: "NYJ", color: "#125740" },
  { abbr: "PHI", color: "#004C54" },
  { abbr: "PIT", color: "#FFB612" },
  { abbr: "SEA", color: "#002244" },
  { abbr: "SF", color: "#AA0000" },
  { abbr: "TB", color: "#D50A0A" },
  { abbr: "TEN", color: "#4B92DB" },
  { abbr: "WSH", color: "#5A1414" },
];

export function getTeamColor(abbr: string | null): string {
  if (!abbr) {
    return "#f5a623";
  }
  const team = TEAMS.find((t) => t.abbr === abbr);
  return team?.color ?? "#f5a623";
}
