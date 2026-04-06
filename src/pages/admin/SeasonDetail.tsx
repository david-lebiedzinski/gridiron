import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import Page from "../../components/Page";
import Table from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import GameEditDialog from "./GameEditDialog";
import {
  getSeasonGames,
  upsertLiveGameState,
  resetLiveGameState,
  generateSimulatedState,
} from "../../lib/adminGames";
import type { AdminWeek, AdminGame } from "../../lib/adminGames";
import { buildWeekLabel } from "../../lib/picks";
import { supabase } from "../../lib/client";
import { ADMIN_GAME_EDITOR } from "../../locales/en";
import type { WeekType } from "../../types";

// ─── Column definitions ──────────────────────────────────────

const GAME_COLUMNS = [
  { label: ADMIN_GAME_EDITOR.colMatchup },
  { label: ADMIN_GAME_EDITOR.colKickoff },
  { label: ADMIN_GAME_EDITOR.colStatus },
  { label: ADMIN_GAME_EDITOR.colScore },
  { label: "" },
];

// ─── SeasonDetailPage ────────────────────────────────────────

export default function SeasonDetailPage() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const [weeks, setWeeks] = useState<AdminWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    setLoading(true);
    try {
      const [weekData, seasonData] = await Promise.all([
        getSeasonGames(seasonId),
        supabase.from("nfl_seasons").select("year").eq("id", seasonId).single(),
      ]);
      setWeeks(weekData);
      if (seasonData.data) {
        setSeasonYear(seasonData.data.year);
      }
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  if (!loaded.current) {
    loaded.current = true;
    refresh();
  }

  const title = seasonYear ? ADMIN_GAME_EDITOR.pageTitle(seasonYear) : "Season";

  return (
    <Page>
      <Page.Header
        eyebrow="Admin"
        title={title}
        subtitle={ADMIN_GAME_EDITOR.pageSubtitle}
      />
      <Link
        to="/admin"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: "var(--space-4)" }}
      >
        {ADMIN_GAME_EDITOR.backToAdmin}
      </Link>

      {loading && weeks.length === 0 ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        weeks.map((week) => (
          <WeekSection key={week.id} week={week} onRefresh={refresh} />
        ))
      )}
    </Page>
  );
}

// ─── WeekSection ─────────────────────────────────────────────

interface WeekSectionProps {
  week: AdminWeek;
  onRefresh: () => void;
}

function WeekSection({ week, onRefresh }: WeekSectionProps) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-icon icon-green">🏈</div>
        <h2 className="t-display-md">
          {buildWeekLabel(week.week_number, week.week_type as WeekType)}
        </h2>
        <div className="section-line" />
        <span className="t-mono-sm t-muted">{week.games.length} games</span>
      </div>

      <Table
        columns={GAME_COLUMNS}
        data={week.games}
        loading={false}
        emptyIcon="🏈"
        emptyMessage={ADMIN_GAME_EDITOR.emptyWeek}
        rowKey={(g) => g.id}
        renderRow={(g) => <GameRow key={g.id} game={g} onRefresh={onRefresh} />}
      />
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  STATUS_SCHEDULED: {
    label: ADMIN_GAME_EDITOR.statusScheduled,
    className: "badge badge-neutral",
  },
  STATUS_IN_PROGRESS: {
    label: ADMIN_GAME_EDITOR.statusInProgress,
    className: "badge badge-active",
  },
  STATUS_HALFTIME: {
    label: ADMIN_GAME_EDITOR.statusHalftime,
    className: "badge badge-active",
  },
  STATUS_FINAL: {
    label: ADMIN_GAME_EDITOR.statusFinal,
    className: "badge badge-archived",
  },
};

// ─── GameRow ─────────────────────────────────────────────────

interface GameRowProps {
  game: AdminGame;
  onRefresh: () => void;
}

function GameRow({ game, onRefresh }: GameRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  const matchup = `${game.away_abbr} @ ${game.home_abbr}`;

  const kickoff = new Date(game.kickoff_time).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const badge = STATUS_BADGE_MAP[game.status] ?? {
    label: game.status,
    className: "badge",
  };

  let score: ReactNode = undefined;
  if (game.home_score != null && game.away_score != null) {
    score = (
      <span className="t-mono-sm">
        {game.away_score} - {game.home_score}
      </span>
    );
  } else {
    score = <span className="t-muted">—</span>;
  }

  function handleEditClick() {
    setEditOpen(true);
  }

  async function handleSimulate() {
    const state = generateSimulatedState(game);
    await upsertLiveGameState(game.id, state);
    onRefresh();
  }

  async function handleReset() {
    await resetLiveGameState(game.id);
    onRefresh();
  }

  function handleSaved() {
    onRefresh();
  }

  return (
    <tr>
      <Table.BoldCell>{matchup}</Table.BoldCell>
      <Table.DimCell>{kickoff}</Table.DimCell>
      <Table.Cell>
        <span className={badge.className}>{badge.label}</span>
      </Table.Cell>
      <Table.Cell>{score}</Table.Cell>
      <Table.ActionsCell>
        <button className="btn btn-ghost btn-sm" onClick={handleEditClick}>
          {ADMIN_GAME_EDITOR.editButton}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleSimulate}>
          {ADMIN_GAME_EDITOR.simulateButton}
        </button>
        <ConfirmDialog
          trigger={
            <button className="btn btn-ghost btn-sm">
              {ADMIN_GAME_EDITOR.resetButton}
            </button>
          }
          title={ADMIN_GAME_EDITOR.confirmResetTitle}
          description={ADMIN_GAME_EDITOR.confirmReset}
          confirmLabel={ADMIN_GAME_EDITOR.resetButton}
          variant="danger"
          onConfirm={handleReset}
        />
        <GameEditDialog
          game={game}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={handleSaved}
        />
      </Table.ActionsCell>
    </tr>
  );
}
