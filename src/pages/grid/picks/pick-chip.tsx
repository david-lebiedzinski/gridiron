import type { Game, Pick } from "@/lib/types";

export type ChipState =
  | "empty"
  | "pending"
  | "correct"
  | "wrong"
  | "live"
  | "hidden";

export function deriveChipState(
  pick: Pick | undefined,
  game: Game,
  isMine: boolean,
  picksVisibleBeforeKickoff: boolean,
): ChipState {
  if (!isMine && !picksVisibleBeforeKickoff && game.status === "scheduled") {
    if (pick) {
      return "hidden";
    }
    return "empty";
  }
  if (!pick) {
    return "empty";
  }
  if (game.status === "scheduled") {
    return "pending";
  }
  if (game.status === "in_progress" || game.status === "halftime") {
    return "live";
  }
  if (game.status === "final") {
    if (pick.team_id === game.winner_id) {
      return "correct";
    }
    return "wrong";
  }
  return "pending";
}

interface PickChipProps {
  state: ChipState;
  teamAbbr: string | null;
  isMine: boolean;
  isLocked: boolean;
  isSaving: boolean;
  isError: boolean;
  onCycle: () => void;
}

export default function PickChip({
  state,
  teamAbbr,
  isMine,
  isLocked,
  isSaving,
  isError,
  onCycle,
}: PickChipProps) {
  const classes = [
    "pick-chip",
    `chip-${state}`,
    isMine ? "chip-mine" : "",
    isLocked ? "chip-locked" : "",
    isSaving ? "chip-saving" : "",
    isError ? "chip-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleClick() {
    if (isMine && !isLocked) {
      onCycle();
    }
  }

  let label: string = "";
  if (state === "hidden") {
    label = "?";
  } else if (teamAbbr) {
    label = teamAbbr;
  }

  return (
    <button type="button" className={classes} onClick={handleClick}>
      {label}
    </button>
  );
}
