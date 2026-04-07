import { useMemo } from "react";
import Table from "@/components/DataTable";
import { ADMIN_GAME_EDITOR } from "@/locales/en";
import type { Game, Team } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────

interface GamesTableProps {
  games: Game[];
  teams: Team[];
  loading: boolean;
  onNavigate: (gameId: string) => void;
}

interface GameRowProps {
  game: Game;
  teamMap: Map<string, Team>;
  onNavigate: (gameId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<string, string> = {
  scheduled: "badge-neutral",
  in_progress: "badge-active",
  halftime: "badge-active",
  final: "badge-final",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: ADMIN_GAME_EDITOR.statusScheduled,
  in_progress: ADMIN_GAME_EDITOR.statusInProgress,
  halftime: ADMIN_GAME_EDITOR.statusHalftime,
  final: ADMIN_GAME_EDITOR.statusFinal,
};

function formatKickoff(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Row component ──────────────────────────────────────────

function GameRow({ game, teamMap, onNavigate }: GameRowProps) {
  const away = teamMap.get(game.away_team_id);
  const home = teamMap.get(game.home_team_id);

  const matchup = `${away?.abbr ?? "?"} @ ${home?.abbr ?? "?"}`;
  const kickoff = formatKickoff(game.kickoff_time);
  const badgeClass = STATUS_BADGE_CLASS[game.status] ?? "badge-neutral";
  const statusLabel = STATUS_LABEL[game.status] ?? game.status;

  const score =
    game.status === "scheduled"
      ? "\u2014"
      : `${game.away_score} - ${game.home_score}`;

  function handleClick() {
    onNavigate(game.id);
  }

  return (
    <tr onClick={handleClick} className="tr-clickable">
      <Table.BoldCell>{matchup}</Table.BoldCell>
      <Table.Cell>{kickoff}</Table.Cell>
      <Table.Cell>
        <span className={badgeClass}>{statusLabel}</span>
      </Table.Cell>
      <Table.MonoCell>{score}</Table.MonoCell>
    </tr>
  );
}

// ─── Columns ────────────────────────────────────────────────

const columns = [
  { label: ADMIN_GAME_EDITOR.colMatchup },
  { label: ADMIN_GAME_EDITOR.colKickoff },
  { label: ADMIN_GAME_EDITOR.colStatus },
  { label: ADMIN_GAME_EDITOR.colScore },
];

// ─── GamesTable ─────────────────────────────────────────────

function getRowKey(game: Game) {
  return game.id;
}

function GamesTable({ games, teams, loading, onNavigate }: GamesTableProps) {
  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of teams) {
      map.set(t.id, t);
    }
    return map;
  }, [teams]);

  function renderRow(game: Game) {
    return <GameRow game={game} teamMap={teamMap} onNavigate={onNavigate} />;
  }

  return (
    <Table
      columns={columns}
      data={games}
      loading={loading}
      emptyIcon="\uD83C\uDFC8"
      emptyMessage={ADMIN_GAME_EDITOR.emptyWeek}
      rowKey={getRowKey}
      renderRow={renderRow}
    />
  );
}

export default GamesTable;
