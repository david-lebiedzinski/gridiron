import Page from "@/components/Page";
import { useSyncFromESPN } from "@/hooks/use-games";
import { ADMIN } from "@/locales/en";
import SeasonsTable from "./season/season-table";
import LeaguesTable from "./league/league-table";
import MembersTable from "./member/member-table";

export default function AdminPage() {
  const sync = useSyncFromESPN();

  function handleSync() {
    sync.mutate();
  }

  return (
    <Page>
      <Page.Header
        subtitle={ADMIN.subtitle}
        eyebrow={ADMIN.eyebrow}
        title={ADMIN.title}
      />
      <div className="page-actions">
        <button
          className="btn btn-primary"
          disabled={sync.isPending}
          onClick={handleSync}
        >
          {sync.isPending ? ADMIN.syncing : ADMIN.syncButton}
        </button>
      </div>
      <SeasonsTable />
      <LeaguesTable />
      <MembersTable />
    </Page>
  );
}
