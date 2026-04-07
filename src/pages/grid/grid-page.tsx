import type { ReactNode } from "react";
import Page from "@/components/Page";
import Section from "@/components/Section";
import Toast from "@/components/toast";
import { useAuth } from "@/context/auth";
import { usePicksGrid } from "./picks/use-picks-grid";
import PicksTable from "./picks/picks-table";
import { GRID } from "@/locales/en";
import "@/styles/grid.css";

export default function GridPage() {
  const { user } = useAuth();
  const {
    weeks,
    members,
    picksByKey,
    league,
    loading,
    error,
    cyclePick,
    savingGameIds,
    errorGameIds,
    toast,
  } = usePicksGrid();

  let content: ReactNode = null;

  if (loading) {
    content = (
      <div className="empty-state">
        <span className="spinner spinner-lg" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="empty-state">
        <div className="empty-state-icon">!</div>
        <p>{error}</p>
      </div>
    );
  } else if (weeks.length === 0) {
    content = (
      <div className="empty-state">
        <div className="empty-state-icon">🏈</div>
        <p>{GRID.emptyNoSeason}</p>
      </div>
    );
  } else {
    content = (
      <PicksTable
        weeks={weeks}
        members={members}
        picksByKey={picksByKey}
        picksVisibleBeforeKickoff={league?.picks_visible_before_kickoff ?? false}
        currentUserId={user?.id ?? ""}
        cyclePick={cyclePick}
        savingGameIds={savingGameIds}
        errorGameIds={errorGameIds}
      />
    );
  }

  return (
    <Page>
      <Page.Header
        eyebrow={GRID.eyebrow}
        title={GRID.title}
        subtitle={GRID.subtitle}
      />
      <Section>
        <Section.Card>{content}</Section.Card>
      </Section>
      <Toast message={toast?.message ?? null} type={toast?.type ?? "info"} />
    </Page>
  );
}
