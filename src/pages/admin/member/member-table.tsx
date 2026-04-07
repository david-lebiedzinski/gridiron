import type { ReactNode } from "react";
import { useProfiles } from "@/hooks/use-profile";
import { useTeams } from "@/hooks/use-teams";
import Table from "@/components/DataTable";
import { ADMIN_MEMBERS, APP } from "@/locales/en";
import type { Profile, Team } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────

interface MemberRowProps {
  profile: Profile;
  teamMap: Map<string, Team>;
}

// ─── Row component ──────────────────────────────────────────

function MemberRow({ profile, teamMap }: MemberRowProps) {
  const team = profile.favorite_team_id
    ? teamMap.get(profile.favorite_team_id)
    : undefined;

  const teamLabel = team ? team.abbr : "\u2014";

  const roleBadge = profile.is_admin
    ? ADMIN_MEMBERS.badgeAdmin
    : ADMIN_MEMBERS.badgeMember;

  return (
    <tr>
      <Table.UserCell
        name={profile.name}
        avatarUrl={profile.avatar}
        avatarColor={team?.color ?? undefined}
      />
      <Table.Cell>{teamLabel}</Table.Cell>
      <Table.Cell>
        <span className={profile.is_admin ? "badge-active" : "badge-neutral"}>
          {roleBadge}
        </span>
      </Table.Cell>
    </tr>
  );
}

// ─── Columns ────────────────────────────────────────────────

const columns = [
  { label: ADMIN_MEMBERS.colUser },
  { label: ADMIN_MEMBERS.colTeam },
  { label: ADMIN_MEMBERS.colRole },
];

// ─── MembersTable ───────────────────────────────────────────

function getRowKey(profile: Profile) {
  return profile.id;
}

function MembersTable() {
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();

  const loading = profilesLoading || teamsLoading;

  const teamMap = new Map<string, Team>();
  for (const t of teams) {
    teamMap.set(t.id, t);
  }

  let headerSubtext: ReactNode = undefined;
  if (!loading && profiles.length > 0) {
    headerSubtext = (
      <span className="t-body-sm t-muted">
        {ADMIN_MEMBERS.totalLabel(profiles.length)}
      </span>
    );
  }

  function renderRow(profile: Profile) {
    return <MemberRow profile={profile} teamMap={teamMap} />;
  }

  return (
    <section>
      <div className="section-header">
        <h2>{ADMIN_MEMBERS.sectionTitle}</h2>
        {headerSubtext}
      </div>
      <Table
        columns={columns}
        data={profiles}
        loading={loading}
        emptyIcon={APP.fallbackInitial}
        emptyMessage={ADMIN_MEMBERS.emptyState}
        rowKey={getRowKey}
        renderRow={renderRow}
      />
    </section>
  );
}

export default MembersTable;
