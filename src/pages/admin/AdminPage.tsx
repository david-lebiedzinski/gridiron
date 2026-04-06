import Page from "../components/Page";
import { ADMIN } from "../constants";
import SeasonsTable from "./admin/SeasonsTable";
import LeaguesTable from "./admin/LeaguesTable";
import MembersTable from "./admin/MembersTable";

export default function AdminPage() {
  return (
    <Page>
      <Page.Header
        eyebrow={ADMIN.eyebrow}
        title={ADMIN.title}
        subtitle={ADMIN.subtitle}
      />
      <SeasonsTable />
      <LeaguesTable />
      <MembersTable />
    </Page>
  );
}
