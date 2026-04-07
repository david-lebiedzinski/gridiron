import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Section from "@/components/Section";
import Table from "@/components/DataTable";
import { useSeasons } from "@/hooks/use-season";
import type { Season } from "@/lib/types";
import { ADMIN_SEASONS } from "@/locales/en";

function isSeasonActive(season: Season): boolean {
  const today = new Date().toISOString().split("T")[0];
  return season.start_date <= today && today <= season.end_date;
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${fmt(start)} — ${fmt(end)}`;
}

interface SeasonRowProps {
  season: Season;
  active: boolean;
  onNavigate: (id: string) => void;
}

function SeasonRow({ season, active, onNavigate }: SeasonRowProps) {
  let statusBadge: ReactNode = undefined;
  if (active) {
    statusBadge = (
      <span className="badge badge-active">{ADMIN_SEASONS.badgeActive}</span>
    );
  } else {
    statusBadge = (
      <span className="badge badge-neutral">{ADMIN_SEASONS.badgeInactive}</span>
    );
  }

  function handleClick() {
    onNavigate(season.id);
  }

  return (
    <tr
      className={active ? "tr-clickable" : "tr-clickable row-dim"}
      onClick={handleClick}
    >
      <Table.BoldCell>{ADMIN_SEASONS.seasonLabel(season.year)}</Table.BoldCell>
      <Table.Cell>{statusBadge}</Table.Cell>
      <Table.DimCell>
        {formatDateRange(season.start_date, season.end_date)}
      </Table.DimCell>
    </tr>
  );
}

const COLUMNS = [
  { label: ADMIN_SEASONS.colSeason },
  { label: ADMIN_SEASONS.colStatus },
  { label: ADMIN_SEASONS.colDateRange },
];

export default function SeasonsTable() {
  const navigate = useNavigate();
  const { data: seasons = [], isLoading } = useSeasons();

  function handleNavigate(id: string) {
    navigate(`/admin/seasons/${id}`);
  }

  function getRowKey(s: Season) {
    return s.id;
  }

  function renderRow(s: Season) {
    return (
      <SeasonRow
        season={s}
        active={isSeasonActive(s)}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <Section>
      <Section.Header
        icon="🏈"
        iconColor="icon-amber"
        title={ADMIN_SEASONS.sectionTitle}
      />
      <Table
        columns={COLUMNS}
        data={seasons}
        loading={isLoading}
        emptyIcon="🏈"
        emptyMessage={ADMIN_SEASONS.emptyState}
        rowKey={getRowKey}
        renderRow={renderRow}
      />
    </Section>
  );
}
