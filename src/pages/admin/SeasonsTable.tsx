import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  getNFLSeasons,
  startNextSeason,
  calculateNextSeasonYear,
} from "../../lib/nflSeasons";
import { ADMIN_SEASONS } from "../../locales/en";
import type { NFLSeason } from "../../types";

// ─── SeasonRow (display-only) ────────────────────────────────

interface SeasonRowProps {
  season: NFLSeason & { created_at?: string };
  onNavigate: (id: string) => void;
}

function SeasonRow({ season, onNavigate }: SeasonRowProps) {
  let statusBadge: ReactNode = undefined;
  if (season.is_active) {
    statusBadge = (
      <span className="badge badge-active">{ADMIN_SEASONS.badgeActive}</span>
    );
  } else {
    statusBadge = (
      <span className="badge badge-archived">
        {ADMIN_SEASONS.badgeInactive}
      </span>
    );
  }

  const createdDate = new Date(season.created_at ?? "").toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" },
  );

  function handleClick() {
    onNavigate(season.id);
  }

  return (
    <tr
      className={[!season.is_active ? "row-dim" : "", "row-clickable"]
        .filter(Boolean)
        .join(" ")}
      onClick={handleClick}
    >
      <Table.BoldCell>{ADMIN_SEASONS.seasonLabel(season.year)}</Table.BoldCell>
      <Table.Cell>{statusBadge}</Table.Cell>
      <Table.DimCell>{createdDate}</Table.DimCell>
    </tr>
  );
}

// ─── SeasonsTable ────────────────────────────────────────────

const COLUMNS = [
  { label: ADMIN_SEASONS.colSeason },
  { label: ADMIN_SEASONS.colStatus },
  { label: ADMIN_SEASONS.colCreated },
];

export default function SeasonsTable() {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<NFLSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSeasons(await getNFLSeasons());
    } finally {
      setLoading(false);
    }
  }, []);

  if (!loaded.current) {
    loaded.current = true;
    refresh();
  }

  const nextYear = calculateNextSeasonYear(seasons);

  function handleSeasonClick(id: string) {
    navigate(`/admin/seasons/${id}`);
  }

  async function handleStartSeason() {
    setStarting(true);
    try {
      await startNextSeason(nextYear);
      await refresh();
    } finally {
      setStarting(false);
    }
  }

  let buttonLabel = ADMIN_SEASONS.startButton(nextYear);
  if (starting) {
    buttonLabel = ADMIN_SEASONS.starting;
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-icon icon-amber">🏈</div>
        <h2 className="t-display-md">{ADMIN_SEASONS.sectionTitle}</h2>
        <div className="section-line" />
        <ConfirmDialog
          trigger={
            <button
              className="btn btn-primary btn-sm"
              disabled={starting || loading}
            >
              {buttonLabel}
            </button>
          }
          title={ADMIN_SEASONS.confirmStartTitle}
          description={ADMIN_SEASONS.confirmStart(nextYear)}
          confirmLabel={ADMIN_SEASONS.confirmStartButton(nextYear)}
          variant="default"
          onConfirm={handleStartSeason}
        />
      </div>

      <Table
        columns={COLUMNS}
        data={seasons}
        loading={loading}
        emptyIcon="🏈"
        emptyMessage={ADMIN_SEASONS.emptyState}
        rowKey={(s) => s.id}
        renderRow={(s) => (
          <SeasonRow
            key={s.id}
            season={s as NFLSeason & { created_at?: string }}
            onNavigate={handleSeasonClick}
          />
        )}
      />
    </div>
  );
}
