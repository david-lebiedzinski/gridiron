import type { ReactNode } from "react";
import { useEffect } from "react";
import PickChip from "./PickChip";
import type { GridWeek, GridMember, GridPick, GridGame } from "../../lib/picks";
import { deriveChipState, isGameLocked } from "../../lib/picks";
import { GRID } from "../../strings";

interface PicksTableProps {
  weeks: GridWeek[];
  members: GridMember[];
  picksByKey: Map<string, GridPick>;
  picksVisibleBeforeKickoff: boolean;
  currentUserId: string;
  currentWeekNumber: number;
  onPickCycle: (gameId: string, awayAbbr: string, homeAbbr: string) => void;
  savingGameIds: Set<string>;
  errorGameIds: Set<string>;
}

export default function PicksTable({
  weeks,
  members,
  picksByKey,
  picksVisibleBeforeKickoff,
  currentUserId,
  currentWeekNumber,
  onPickCycle,
  savingGameIds,
  errorGameIds,
}: PicksTableProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      document
        .getElementById("current-week-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(timer);
  }, [currentWeekNumber]);

  const totalCols = 5 + members.length;

  return (
    <div className="grid-table-outer">
      <table className="picks-table">
        <thead>
          <tr className="table-header">
            <th className="game-col">{GRID.colTime}</th>
            <th className="game-col">{GRID.colMatchup}</th>
            <th className="game-col">{GRID.colScore}</th>
            <th className="game-col">{GRID.colResult}</th>
            {members.map((m) => (
              <th key={m.user_id} className={m.isCurrentUser ? "me-col" : ""}>
                {m.isCurrentUser ? GRID.headerYou : m.username}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const weekClass = [
              "week-group",
              isPlayoff(week) ? "playoff" : "",
              week.week_type === "superbowl" ? "superbowl" : "",
              week.isCurrent ? "current-week" : "",
              week.isPast ? "past" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const fullClass = week.isCurrent
              ? `${weekClass} current-week-anchor`
              : weekClass;

            return (
              <WeekBlock key={week.week_id}>
                {/* Week header */}
                <tr
                  className={fullClass}
                  id={week.isCurrent ? "current-week-anchor" : undefined}
                >
                  <td colSpan={totalCols}>{week.label}</td>
                </tr>

                {/* Game rows */}
                {week.games.map((game) => (
                  <GameRow
                    key={game.id}
                    game={game}
                    week={week}
                    members={members}
                    picksByKey={picksByKey}
                    picksVisibleBeforeKickoff={picksVisibleBeforeKickoff}
                    currentUserId={currentUserId}
                    onPickCycle={onPickCycle}
                    savingGameIds={savingGameIds}
                    errorGameIds={errorGameIds}
                  />
                ))}
              </WeekBlock>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Game Row ────────────────────────────────────────────────

interface GameRowProps {
  game: GridGame;
  week: GridWeek;
  members: GridMember[];
  picksByKey: Map<string, GridPick>;
  picksVisibleBeforeKickoff: boolean;
  currentUserId: string;
  onPickCycle: (gameId: string, awayAbbr: string, homeAbbr: string) => void;
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
  onPickCycle,
  savingGameIds,
  errorGameIds,
}: GameRowProps) {
  const rowClass = [
    "game-row",
    week.isPast ? "past" : "",
    isPlayoff(week) ? "playoff" : "",
    week.week_type === "superbowl" ? "superbowl" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const locked = isGameLocked(game);
  const score =
    game.home_score != null && game.away_score != null
      ? `${game.away_score}\u2013${game.home_score}`
      : "0\u20130";

  const resultClass =
    game.status === "final" ? "final" : game.status === "in_progress" ? "live" : "open";
  const resultLabel =
    game.status === "final"
      ? GRID.statusFinal
      : game.status === "in_progress"
        ? GRID.statusLive
        : GRID.statusOpen;

  return (
    <tr className={rowClass}>
      <td className="game-col time-cell">{formatTime(game.kickoff_time)}</td>
      <td className="game-col matchup-cell">
        <span className="away">{game.away_abbr}</span>
        <span className="sep">@</span>
        <span className="home">{game.home_abbr}</span>
      </td>
      <td className="game-col score-cell">{score}</td>
      <td className={`game-col result-cell ${resultClass}`}>{resultLabel}</td>

      {members.map((m) => {
        const isMine = m.user_id === currentUserId;
        const pick = picksByKey.get(`${m.user_id}:${game.id}`);
        const state = deriveChipState(pick, game, isMine, picksVisibleBeforeKickoff);

        let bonusLabel: string | null = null;
        if (state === "correct" && pick?.is_sole_correct && pick.points_awarded != null) {
          bonusLabel = `+${pick.points_awarded}`;
        }

        let tooltip: string | null = null;
        if (pick) {
          if (state === "correct") {
            tooltip = `${pick.picked_team_abbr} \u00B7 ${bonusLabel ?? "+1pt"}`;
          } else if (state === "wrong") {
            tooltip = `${pick.picked_team_abbr} \u00B7 0pt`;
          } else if (state === "live") {
            tooltip = `${pick.picked_team_abbr} \u00B7 live`;
          } else if (state === "pending") {
            tooltip = `${pick.picked_team_abbr} \u00B7 pending`;
          }
        }

        function handleCycle() {
          onPickCycle(game.id, game.away_abbr, game.home_abbr);
        }

        return (
          <td key={m.user_id} className="pick-cell">
            <PickChip
              state={state}
              teamAbbr={pick?.picked_team_abbr ?? null}
              isMine={isMine}
              isLocked={locked}
              isSaving={isMine && savingGameIds.has(game.id)}
              isError={isMine && errorGameIds.has(game.id)}
              bonusLabel={bonusLabel}
              tooltip={tooltip}
              onCycle={handleCycle}
            />
          </td>
        );
      })}
    </tr>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function WeekBlock({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function isPlayoff(week: GridWeek): boolean {
  return (
    week.week_type === "wildcard" ||
    week.week_type === "divisional" ||
    week.week_type === "championship"
  );
}

function formatTime(kickoffTime: string): string {
  const d = new Date(kickoffTime);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
  const date = d.getDate();
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${day}, ${mon} ${date}, ${h}:${m}${ampm}`;
}
