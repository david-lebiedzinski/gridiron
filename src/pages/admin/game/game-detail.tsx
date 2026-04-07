import { useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useGame, useUpdateGame } from "@/hooks/use-games";
import { useTeams } from "@/hooks/use-teams";
import Page from "@/components/Page";
import { ADMIN_GAME_EDITOR } from "@/locales/en";
import type { Game, Team } from "@/lib/types";

// ─── Form values ────────────────────────────────────────────

interface GameFormValues {
  status: string;
  period: number;
  display_clock: string;
  home_score: number;
  away_score: number;
  possession_id: string;
  down_distance: string;
  last_play: string;
  is_red_zone: boolean;
}

function buildDefaults(game: Game): GameFormValues {
  return {
    status: game.status,
    period: game.period ?? 1,
    display_clock: game.display_clock ?? "",
    home_score: game.home_score ?? 0,
    away_score: game.away_score ?? 0,
    possession_id: game.possession_id ?? "",
    down_distance: game.down_distance ?? "",
    last_play: game.last_play ?? "",
    is_red_zone: game.is_red_zone ?? false,
  };
}

// ─── Form ───────────────────────────────────────────────────

interface GameFormProps {
  game: Game;
  teams: Team[];
}

function GameForm({ game, teams }: GameFormProps) {
  const updateGame = useUpdateGame();
  const { register, handleSubmit } = useForm<GameFormValues>({
    defaultValues: buildDefaults(game),
  });

  const teamLookup = useMemo(
    () => ({
      home: teams.find((t) => t.id === game.home_team_id),
      away: teams.find((t) => t.id === game.away_team_id),
    }),
    [game, teams],
  );

  const homeAbbr = teamLookup.home?.abbr ?? "HOME";
  const awayAbbr = teamLookup.away?.abbr ?? "AWAY";

  async function onSubmit(updates: GameFormValues) {
    await updateGame.mutateAsync({
      id: game.id,
      updates,
    });
  }

  let backLink: ReactNode = undefined;

  return (
    <>
      <Page.Header
        eyebrow={ADMIN_GAME_EDITOR.colMatchup}
        title={`${awayAbbr} @ ${homeAbbr}`}
        subtitle={ADMIN_GAME_EDITOR.pageSubtitle}
      />
      {backLink}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">{ADMIN_GAME_EDITOR.fieldStatus}</label>
          <select {...register("status")}>
            <option value="scheduled">
              {ADMIN_GAME_EDITOR.statusScheduled}
            </option>
            <option value="in_progress">
              {ADMIN_GAME_EDITOR.statusInProgress}
            </option>
            <option value="halftime">{ADMIN_GAME_EDITOR.statusHalftime}</option>
            <option value="final">{ADMIN_GAME_EDITOR.statusFinal}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{ADMIN_GAME_EDITOR.fieldPeriod}</label>
          <input
            type="number"
            min={1}
            max={5}
            {...register("period", { valueAsNumber: true })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{ADMIN_GAME_EDITOR.fieldClock}</label>
          <input
            type="text"
            placeholder="5:32"
            {...register("display_clock")}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldAwayScore(awayAbbr)}
          </label>
          <input
            type="number"
            min={0}
            {...register("away_score", { valueAsNumber: true })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldHomeScore(homeAbbr)}
          </label>
          <input
            type="number"
            min={0}
            {...register("home_score", { valueAsNumber: true })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldPossession}
          </label>
          <select {...register("possession_id")}>
            <option value="">{ADMIN_GAME_EDITOR.possessionNone}</option>
            <option value={game.home_team_id}>{homeAbbr}</option>
            <option value={game.away_team_id}>{awayAbbr}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldDownDistance}
          </label>
          <input type="text" {...register("down_distance")} />
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldLastPlay}
          </label>
          <input type="text" {...register("last_play")} />
        </div>

        <div className="form-group">
          <label className="form-label">
            <input type="checkbox" {...register("is_red_zone")} />
            {ADMIN_GAME_EDITOR.fieldRedZone}
          </label>
        </div>

        <button type="submit" className="btn btn-primary">
          {ADMIN_GAME_EDITOR.dialogSubmit}
        </button>
      </form>
    </>
  );
}

// ─── GameDetail ─────────────────────────────────────────────

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const { data: game } = useGame(gameId ?? "");
  const { data: teams = [] } = useTeams();

  if (!game) {
    return (
      <Page>
        <div className="empty-state">
          <span className="spinner spinner-lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <GameForm key={game.id} game={game} teams={teams} />
    </Page>
  );
}
