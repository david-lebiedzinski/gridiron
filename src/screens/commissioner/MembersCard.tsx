import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import Table from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useApp } from "../../context/context";
import { getLeagueMembers } from "../../lib/leagues";
import { removeMember } from "../../lib/commissioner";
import { APP, COMMISSIONER_MEMBERS } from "../../strings";

type MemberRow = Awaited<ReturnType<typeof getLeagueMembers>>[number];

interface MemberProfile {
  id: string;
  username: string;
  avatar_color: string;
}

interface MemberItemProps {
  member: MemberRow;
  isSelf: boolean;
  leagueId: string;
  commissionerId: string;
  onRefresh: () => void;
}

function MemberItem({
  member,
  isSelf,
  leagueId,
  commissionerId,
  onRefresh,
}: MemberItemProps) {
  const p = member.profiles as unknown as MemberProfile | null;

  async function handleRemove() {
    if (!p) {
      return;
    }
    await removeMember(leagueId, p.id, commissionerId);
    onRefresh();
  }

  const isCommissioner = member.role === "commissioner";

  let roleBadge: ReactNode = undefined;
  if (isCommissioner) {
    roleBadge = (
      <span className="badge badge-active">
        {COMMISSIONER_MEMBERS.badgeCommissioner}
      </span>
    );
  }

  let actions: ReactNode = undefined;
  if (!isSelf && !isCommissioner) {
    actions = (
      <ConfirmDialog
        trigger={
          <button className="btn btn-danger btn-sm">
            {COMMISSIONER_MEMBERS.remove}
          </button>
        }
        title={APP.confirm}
        description={COMMISSIONER_MEMBERS.confirmRemove(p?.username ?? "")}
        confirmLabel={APP.remove}
        onConfirm={handleRemove}
      />
    );
  }

  const joinedDate = new Date(member.joined_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <tr>
      <Table.UserCell
        name={p?.username ?? "Unknown"}
        avatarColor={p?.avatar_color}
        size="md"
      />
      <Table.Cell>{roleBadge}</Table.Cell>
      <Table.DimCell>{joinedDate}</Table.DimCell>
      <Table.ActionsCell>{actions}</Table.ActionsCell>
    </tr>
  );
}

const COLUMNS = [
  { label: COMMISSIONER_MEMBERS.colMember },
  { label: COMMISSIONER_MEMBERS.colRole },
  { label: COMMISSIONER_MEMBERS.colJoined },
  { label: "" },
];

export default function MembersCard() {
  const { activeLeague, user } = useApp();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  const leagueId = activeLeague?.id ?? "";
  const inviteCode = activeLeague?.invite_code ?? "—";

  const refresh = useCallback(async () => {
    if (!leagueId) {
      return;
    }
    setLoading(true);
    try {
      setMembers(await getLeagueMembers(leagueId));
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  if (!loaded.current && leagueId) {
    loaded.current = true;
    refresh();
  }

  async function handleCopyCode() {
    await navigator.clipboard?.writeText(inviteCode);
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-icon icon-green">👥</div>
        <h2 className="t-display-md">{COMMISSIONER_MEMBERS.sectionTitle}</h2>
        <div className="section-line" />
        <span className="t-mono-sm t-muted">
          {COMMISSIONER_MEMBERS.membersCount(members.length)}
        </span>
      </div>

      {/* Invite code */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="invite-code-row">
          <span className="t-label">
            {COMMISSIONER_MEMBERS.inviteCodeLabel}
          </span>
          <span
            className="code-pill"
            style={{ fontSize: 16, letterSpacing: "0.15em" }}
          >
            {inviteCode}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleCopyCode}>
            {COMMISSIONER_MEMBERS.copy}
          </button>
        </div>
      </div>

      {/* Member list */}
      <Table
        columns={COLUMNS}
        data={members}
        loading={loading}
        emptyIcon="👥"
        emptyMessage="No members yet."
        rowKey={(m) => {
          const p = m.profiles as unknown as MemberProfile | null;
          return p?.id ?? m.joined_at;
        }}
        renderRow={(m) => {
          const p = m.profiles as unknown as MemberProfile | null;
          return (
            <MemberItem
              key={p?.id ?? m.joined_at}
              member={m}
              isSelf={p?.id === user?.id}
              leagueId={leagueId}
              commissionerId={user?.id ?? ""}
              onRefresh={refresh}
            />
          );
        }}
      />
    </div>
  );
}
