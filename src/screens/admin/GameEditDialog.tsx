import { useState, useEffect } from "react";
import FormDialog from "../../components/FormDialog";
import { upsertLiveGameState } from "../../lib/adminGames";
import type { AdminGame, LiveGameStateInput } from "../../lib/adminGames";
import { ADMIN_GAME_EDITOR } from "../../strings";

// ─── Props ───────────────────────────────────────────────────

interface GameEditDialogProps {
  game: AdminGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// ─── Status options ──────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "STATUS_SCHEDULED", label: ADMIN_GAME_EDITOR.statusScheduled },
  { value: "STATUS_IN_PROGRESS", label: ADMIN_GAME_EDITOR.statusInProgress },
  { value: "STATUS_HALFTIME", label: ADMIN_GAME_EDITOR.statusHalftime },
  { value: "STATUS_FINAL", label: ADMIN_GAME_EDITOR.statusFinal },
];

// ─── Helpers ─────────────────────────────────────────────────

function buildInitialState(game: AdminGame): LiveGameStateInput {
  return {
    status: game.status,
    period: game.period,
    display_clock: game.display_clock,
    home_score: game.home_score,
    away_score: game.away_score,
    possession: game.possession,
    down_distance: game.down_distance,
    last_play: game.last_play,
    is_red_zone: game.is_red_zone,
  };
}

// ─── Component ───────────────────────────────────────────────

export default function GameEditDialog({
  game,
  open,
  onOpenChange,
  onSaved,
}: GameEditDialogProps) {
  const [form, setForm] = useState<LiveGameStateInput>(() =>
    buildInitialState(game),
  );

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(game));
    }
  }, [open, game]);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm({ ...form, status: e.target.value });
  }

  function handlePeriodChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setForm({ ...form, period: val === "" ? null : Number(val) });
  }

  function handleClockChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, display_clock: e.target.value || null });
  }

  function handleHomeScoreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setForm({ ...form, home_score: val === "" ? null : val });
  }

  function handleAwayScoreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setForm({ ...form, away_score: val === "" ? null : val });
  }

  function handlePossessionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm({ ...form, possession: e.target.value || null });
  }

  function handleDownDistanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, down_distance: e.target.value || null });
  }

  function handleLastPlayChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm({ ...form, last_play: e.target.value || null });
  }

  function handleRedZoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, is_red_zone: e.target.checked });
  }

  async function handleSubmit() {
    await upsertLiveGameState(game.id, form);
    onOpenChange(false);
    onSaved();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={<></>}
      title={ADMIN_GAME_EDITOR.dialogTitle}
      description={ADMIN_GAME_EDITOR.dialogDescription(
        game.away_abbr,
        game.home_abbr,
      )}
      submitLabel={ADMIN_GAME_EDITOR.dialogSubmit}
      onSubmit={handleSubmit}
      wide
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">{ADMIN_GAME_EDITOR.fieldStatus}</label>
          <select value={form.status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((opt) => (
              <StatusOption
                key={opt.value}
                value={opt.value}
                label={opt.label}
              />
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{ADMIN_GAME_EDITOR.fieldPeriod}</label>
          <input
            type="number"
            min={1}
            max={5}
            value={form.period ?? ""}
            onChange={handlePeriodChange}
            placeholder="1-5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{ADMIN_GAME_EDITOR.fieldClock}</label>
          <input
            type="text"
            value={form.display_clock ?? ""}
            onChange={handleClockChange}
            placeholder="12:34"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldPossession}
          </label>
          <select
            value={form.possession ?? ""}
            onChange={handlePossessionChange}
          >
            <PossessionOption
              value=""
              label={ADMIN_GAME_EDITOR.possessionNone}
            />
            <PossessionOption value={game.home_abbr} label={game.home_abbr} />
            <PossessionOption value={game.away_abbr} label={game.away_abbr} />
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldHomeScore(game.home_abbr)}
          </label>
          <input
            type="number"
            min={0}
            value={form.home_score ?? ""}
            onChange={handleHomeScoreChange}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldAwayScore(game.away_abbr)}
          </label>
          <input
            type="number"
            min={0}
            value={form.away_score ?? ""}
            onChange={handleAwayScoreChange}
            placeholder="0"
          />
        </div>

        <div className="form-group form-group-full">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldDownDistance}
          </label>
          <input
            type="text"
            value={form.down_distance ?? ""}
            onChange={handleDownDistanceChange}
            placeholder="3rd & 7"
          />
        </div>

        <div className="form-group form-group-full">
          <label className="form-label">
            {ADMIN_GAME_EDITOR.fieldLastPlay}
          </label>
          <textarea
            rows={2}
            value={form.last_play ?? ""}
            onChange={handleLastPlayChange}
            placeholder="Pass complete to..."
          />
        </div>

        <div className="form-group form-group-full">
          <div className="form-check">
            <input
              type="checkbox"
              checked={form.is_red_zone ?? false}
              onChange={handleRedZoneChange}
            />
            <label className="form-label">
              {ADMIN_GAME_EDITOR.fieldRedZone}
            </label>
          </div>
        </div>
      </div>
    </FormDialog>
  );
}

// ─── Option sub-components ───────────────────────────────────

interface OptionProps {
  value: string;
  label: string;
}

function StatusOption({ value, label }: OptionProps) {
  return <option value={value}>{label}</option>;
}

function PossessionOption({ value, label }: OptionProps) {
  return <option value={value}>{label}</option>;
}
