import Page from "../components/Page";
import LeagueSettingsCard from "./commissioner/LeagueSettingsCard";
import MembersCard from "./commissioner/MembersCard";
import SettingsCard from "./commissioner/SettingsCard";
import DangerZone from "./commissioner/DangerZone";
import { COMMISSIONER } from "../strings";

export default function CommissionerPage() {
  return (
    <Page>
      <Page.Header
        eyebrow={COMMISSIONER.eyebrow}
        title={COMMISSIONER.title}
        subtitle={COMMISSIONER.subtitle}
      />
      <LeagueSettingsCard />
      <MembersCard />
      <SettingsCard />
      <DangerZone />
    </Page>
  );
}
