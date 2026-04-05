import Page from "../components/Page";
import Section from "../components/Section";
import { usePicksGrid } from "./grid/usePicksGrid";
import PicksTable from "./grid/PicksTable";
import Toast from "./grid/Toast";
import { GRID } from "../strings";
import { useApp } from "../context/context";
import "./grid/grid.css";

export default function GridScreen() {
  const { user, activeSeason } = useApp();
  const {
    weeks,
    members,
    picksByKey,
    settings,
    currentWeekNumber,
    loading,
    error,
    handlePickCycle,
    savingGameIds,
    errorGameIds,
    toast,
  } = usePicksGrid();

  const seasonYear = activeSeason?.nfl_seasons?.year;
  const eyebrow = seasonYear ? `${seasonYear} ${GRID.eyebrow}` : GRID.eyebrow;

  let content;
  if (loading) {
    content = (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: 300 }}
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="empty-state">
        <div className="empty-state-icon">!</div>
        <p className="t-body-sm t-muted">{error}</p>
      </div>
    );
  } else if (!activeSeason || weeks.length === 0) {
    content = (
      <div className="empty-state">
        <div className="empty-state-icon">{"\uD83C\uDFC8"}</div>
        <p className="t-body-sm t-muted">{GRID.emptyNoSeason}</p>
      </div>
    );
  } else {
    content = (
      <>
        <PicksTable
          weeks={weeks}
          members={members}
          picksByKey={picksByKey}
          picksVisibleBeforeKickoff={
            settings?.picks_visible_before_kickoff ?? false
          }
          currentUserId={user?.id ?? ""}
          currentWeekNumber={currentWeekNumber}
          onPickCycle={handlePickCycle}
          savingGameIds={savingGameIds}
          errorGameIds={errorGameIds}
        />
      </>
    );
  }

  return (
    <Page>
      <Page.Header
        eyebrow={eyebrow}
        title={GRID.title}
        subtitle={GRID.subtitle}
      />
      <div style={{ paddingTop: 16 }}>
        <Section>
          <Section.Card>{content}</Section.Card>
        </Section>
        <Toast message={toast?.message ?? null} type={toast?.type ?? "info"} />
      </div>
    </Page>
  );
}
