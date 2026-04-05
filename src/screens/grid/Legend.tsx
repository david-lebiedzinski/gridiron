import { GRID } from "../../strings";

export default function Legend() {
  return (
    <div className="grid-legend">
      <div className="legend-item">
        <div className="legend-swatch swatch-correct">{"\u2713"}</div>
        {GRID.legendCorrect}
      </div>
      <div className="legend-item">
        <div className="legend-swatch swatch-wrong">{"\u2717"}</div>
        {GRID.legendWrong}
      </div>
      <div className="legend-item">
        <div className="legend-swatch swatch-pending">?</div>
        {GRID.legendPending}
      </div>
      <div className="legend-item">
        <div className="legend-swatch swatch-hidden">{"\uD83D\uDD12"}</div>
        {GRID.legendHidden}
      </div>
      <div className="legend-item legend-spacer">
        <div className="swatch-bonus">+2</div>
        {GRID.legendSoleBonus}
      </div>
      <div className="legend-item legend-hint">{GRID.legendTapHint}</div>
    </div>
  );
}
