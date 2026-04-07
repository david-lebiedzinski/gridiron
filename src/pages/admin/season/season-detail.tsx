import { useMemo } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Page from "@/components/Page";
import Section from "@/components/Section";
import { useSeason } from "@/hooks/use-season";
import { useWeeks } from "@/hooks/use-week";
import { useGamesBySeason } from "@/hooks/use-games";
import { useTeams } from "@/hooks/use-teams";
import GamesTable from "../game/game-table";
import type { Week, Game, Team } from "@/lib/types";
import { ADMIN_SEASONS, ADMIN_GAME_EDITOR } from "@/locales/en";

function buildWeekLabel(week: Week): string {
  return week.label;
}

interface WeekSectionProps {
  week: Week;
  games: Game[];
  teams: Team[];
  loading: boolean;
  onGameNavigate: (gameId: string) => void;
}

function WeekSection({
  week,
  games,
  teams,
  loading,
  onGameNavigate,
}: WeekSectionProps) {
  return (
    <Section>
      <Section.Header
        icon="📅"
        iconColor="icon-blue"
        title={buildWeekLabel(week)}
      />
      <GamesTable
        games={games}
        teams={teams}
        loading={loading}
        onNavigate={onGameNavigate}
      />
    </Section>
  );
}

export default function SeasonDetail() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const { data: season } = useSeason(seasonId ?? "");
  const { data: weeks = [], isLoading: weeksLoading } = useWeeks(
    seasonId ?? "",
  );
  const { data: games = [], isLoading: gamesLoading } = useGamesBySeason(
    seasonId ?? "",
  );
  const { data: teams = [] } = useTeams();

  const gamesByWeek = useMemo(() => {
    const map = new Map<string, Game[]>();
    for (const g of games) {
      const list = map.get(g.week_id) ?? [];
      list.push(g);
      map.set(g.week_id, list);
    }
    return map;
  }, [games]);

  function handleGameNavigate(gameId: string) {
    navigate(`/admin/games/${gameId}`);
  }

  if (!season) {
    return (
      <Page>
        <div className="empty-state">
          <span className="spinner spinner-lg" />
        </div>
      </Page>
    );
  }

  const loading = weeksLoading || gamesLoading;

  let weekSections: ReactNode = undefined;
  if (!loading && weeks.length > 0) {
    weekSections = weeks.map((week) => (
      <WeekSection
        key={week.id}
        week={week}
        games={gamesByWeek.get(week.id) ?? []}
        teams={teams}
        loading={false}
        onGameNavigate={handleGameNavigate}
      />
    ));
  }

  let emptyState: ReactNode = undefined;
  if (!loading && weeks.length === 0) {
    emptyState = (
      <div className="empty-state">
        <div className="empty-state-icon">📅</div>
        <p>{ADMIN_GAME_EDITOR.emptyWeek}</p>
      </div>
    );
  }

  let loadingState: ReactNode = undefined;
  if (loading) {
    loadingState = (
      <div className="empty-state">
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <Page>
      <Page.Header
        eyebrow={ADMIN_GAME_EDITOR.pageTitle(season.year)}
        title={ADMIN_SEASONS.seasonLabel(season.year)}
        subtitle={ADMIN_GAME_EDITOR.pageSubtitle}
      />

      {loadingState}
      {weekSections}
      {emptyState}
    </Page>
  );
}
