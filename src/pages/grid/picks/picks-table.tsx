import PickChip, { deriveChipState } from "./pick-chip";
import type { GridGame, GridMember, GridWeek } from "./use-picks-grid";
import type { Pick } from "@/lib/types";
import { GRID } from "@/locales/en";

interface PicksTableProps {
  weeks: GridWeek[];
  members: GridMember[];
  picksByKey: Map<string, Pick>;
  picksVisibleBeforeKickoff: boolean;
  currentUserId: string;
  cyclePick: (gameId: string) => void;
  savingGameIds: Set<string>;
  errorGameIds: Set<string>;
}

// ─── Helpers ────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${day}, ${h}:${m}${ampm}`;
}

function gameCenterLabel(game: GridGame): string {
  if (game.status === "final") {
    return GRID.statusFinal;
  }
  if (game.status === "in_progress") {
    if (game.period != null && game.display_clock) {
      return `${GRID.periodLabel(game.period)}, ${game.display_clock}`;
    }
    return GRID.statusLive;
  }
  if (game.status === "halftime") {
    return GRID.statusHalf;
  }
  return formatTime(game.kickoff_time);
}

// ─── PickCell ───────────────────────────────────────────────

interface PickCellProps {
  game: GridGame;
  member: GridMember;
  pick: Pick | undefined;
  picksVisibleBeforeKickoff: boolean;
  isMine: boolean;
  isSaving: boolean;
  isError: boolean;
  cyclePick: (gameId: string) => void;
}

function PickCell({
  game,
  pick,
  picksVisibleBeforeKickoff,
  isMine,
  isSaving,
  isError,
  cyclePick,
}: PickCellProps) {
  const state = deriveChipState(
    pick,
    {
      ...game,
      status: game.status,
      winner_id: game.winner_id,
    } as never,
    isMine,
    picksVisibleBeforeKickoff,
  );

  const locked = game.status !== "scheduled";

  let teamAbbr: string | null = null;
  if (pick) {
    if (pick.team_id === game.home_team_id) {
      teamAbbr = game.home_abbr;
    } else if (pick.team_id === game.away_team_id) {
      teamAbbr = game.away_abbr;
    }
  }

  function handleCycle() {
    cyclePick(game.id);
  }

  return (
    <td className="pick-cell">
      <PickChip
        state={state}
        teamAbbr={teamAbbr}
        isMine={isMine}
        isLocked={locked}
        isSaving={isSaving}
        isError={isError}
        onCycle={handleCycle}
      />
    </td>
  );
}

// ─── GameRow ────────────────────────────────────────────────

interface GameRowProps {
  game: GridGame;
  week: GridWeek;
  members: GridMember[];
  picksByKey: Map<string, Pick>;
  picksVisibleBeforeKickoff: boolean;
  currentUserId: string;
  cyclePick: (gameId: string) => void;
  savingGameIds: Set<string>;
  errorGameIds: Set<string>;
}

function GameRow({
  game,
  week,
  members,
  picksByKey,
  picksVisibleBeforeKickoff,
  currentUserId,
  cyclePick,
  savingGameIds,
  errorGameIds,
}: GameRowProps) {
  const rowClass = ["game-row", week.isPast ? "past" : ""]
    .filter(Boolean)
    .join(" ");

  const hasScore = game.status === "final" || game.status === "in_progress";
  const centerLabel = gameCenterLabel(game);

  let scoreEls = null;
  if (hasScore) {
    scoreEls = (
      <>
        <span className="gi-score">{game.away_score}</span>
        <span className="gi-score">{game.home_score}</span>
      </>
    );
  }

  return (
    <tr className={rowClass}>
      <td className="game-col">
        <div className="game-info">
          <span className="gi-away">{game.away_abbr}</span>
          {hasScore && <span className="gi-score">{game.away_score}</span>}
          <span className="gi-center">{centerLabel}</span>
          {hasScore && <span className="gi-score">{game.home_score}</span>}
          <span className="gi-home">{game.home_abbr}</span>
        </div>
      </td>
      {members.map((m) => {
        const isMine = m.user_id === currentUserId;
        const pick = picksByKey.get(`${m.user_id}:${game.id}`);
        return (
          <PickCell
            key={m.user_id}
            game={game}
            member={m}
            pick={pick}
            picksVisibleBeforeKickoff={picksVisibleBeforeKickoff}
            isMine={isMine}
            isSaving={isMine && savingGameIds.has(game.id)}
            isError={isMine && errorGameIds.has(game.id)}
            cyclePick={cyclePick}
          />
        );
      })}
      {scoreEls && null}
    </tr>
  );
}

// ─── WeekBlock ──────────────────────────────────────────────

interface WeekBlockProps {
  week: GridWeek;
  members: GridMember[];
  picksByKey: Map<string, Pick>;
  picksVisibleBeforeKickoff: boolean;
  currentUserId: string;
  cyclePick: (gameId: string) => void;
  savingGameIds: Set<string>;
  errorGameIds: Set<string>;
  totalCols: number;
}

function WeekBlock({
  week,
  members,
  picksByKey,
  picksVisibleBeforeKickoff,
  currentUserId,
  cyclePick,
  savingGameIds,
  errorGameIds,
  totalCols,
}: WeekBlockProps) {
  const headerClass = [
    "week-group",
    week.isCurrent ? "current-week" : "",
    week.isPast ? "past" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <tr
        className={headerClass}
        id={week.isCurrent ? "current-week-anchor" : undefined}
      >
        <td colSpan={totalCols}>{week.label}</td>
      </tr>
      {week.games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          week={week}
          members={members}
          picksByKey={picksByKey}
          picksVisibleBeforeKickoff={picksVisibleBeforeKickoff}
          currentUserId={currentUserId}
          cyclePick={cyclePick}
          savingGameIds={savingGameIds}
          errorGameIds={errorGameIds}
        />
      ))}
    </>
  );
}

// ─── PicksTable ─────────────────────────────────────────────

export default function PicksTable({
  weeks,
  members,
  picksByKey,
  picksVisibleBeforeKickoff,
  currentUserId,
  cyclePick,
  savingGameIds,
  errorGameIds,
}: PicksTableProps) {
  const totalCols = 1 + members.length;

  return (
    <div className="grid-table-outer">
      <table className="picks-table">
        <thead>
          <tr className="table-header">
            <th className="game-col">{GRID.colGame}</th>
            {members.map((m) => (
              <th key={m.user_id} className={m.isCurrentUser ? "me-col" : ""}>
                {m.isCurrentUser ? GRID.headerYou : m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <WeekBlock
              key={week.id}
              week={week}
              members={members}
              picksByKey={picksByKey}
              picksVisibleBeforeKickoff={picksVisibleBeforeKickoff}
              currentUserId={currentUserId}
              cyclePick={cyclePick}
              savingGameIds={savingGameIds}
              errorGameIds={errorGameIds}
              totalCols={totalCols}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
