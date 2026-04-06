import { memo } from "react";
import type { ChipState } from "../../lib/picks";

interface PickChipProps {
  state: ChipState;
  teamAbbr: string | null;
  isMine: boolean;
  isLocked: boolean;
  isSaving: boolean;
  isError: boolean;
  bonusLabel: string | null;
  tooltip: string | null;
  onCycle?: () => void;
}

const ICON_BY_STATE: Record<ChipState, string> = {
  correct: "\u2713",
  wrong: "\u2717",
  pending: "?",
  live: "\u25CF",
  hidden: "",
  empty: "",
};

const ABBR_BY_STATE: Record<ChipState, string> = {
  correct: "",
  wrong: "",
  pending: "",
  live: "",
  hidden: "\uD83D\uDD12",
  empty: "\u2014",
};

function PickChipInner({
  state,
  teamAbbr,
  isMine,
  isLocked,
  isSaving,
  isError,
  bonusLabel,
  tooltip,
  onCycle,
}: PickChipProps) {
  const classes = [
    "chip",
    state,
    isMine ? "mine" : "",
    isMine && isLocked ? "locked" : "",
    isSaving ? "saving" : "",
    isError ? "error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const displayAbbr = state === "hidden" ? ABBR_BY_STATE[state] : (teamAbbr ?? ABBR_BY_STATE[state]);
  const icon = ICON_BY_STATE[state];

  function handleClick() {
    if (isMine && !isLocked && onCycle) {
      onCycle();
    }
  }

  return (
    <div
      className={classes}
      data-tip={tooltip ?? undefined}
      onClick={handleClick}
    >
      {bonusLabel ? <div className="bonus-badge">{bonusLabel}</div> : null}
      <span className="chip-abbr">{displayAbbr}</span>
      {icon ? <span className="chip-icon">{icon}</span> : null}
    </div>
  );
}

const PickChip = memo(PickChipInner);
export default PickChip;
