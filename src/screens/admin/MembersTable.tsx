import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import Table from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import { getAllProfiles, deleteProfile } from "../../lib/leagues";
import { ADMIN_MEMBERS, APP } from "../../strings";

type AdminProfile = Awaited<ReturnType<typeof getAllProfiles>>[number];

interface MemberRowProps {
  member: AdminProfile;
  onRefresh: () => void;
}

function MemberRow({ member, onRefresh }: MemberRowProps) {
  async function handleDelete() {
    await deleteProfile(member.id);
    onRefresh();
  }

  let roleBadge: ReactNode = undefined;
  if (member.is_super_admin) {
    roleBadge = (
      <span className="badge badge-active">{ADMIN_MEMBERS.badgeAdmin}</span>
    );
  } else {
    roleBadge = (
      <span className="badge badge-neutral">{ADMIN_MEMBERS.badgeMember}</span>
    );
  }

  let deleteButton: ReactNode = undefined;
  if (!member.is_super_admin) {
    deleteButton = (
      <ConfirmDialog
        trigger={
          <button className="btn btn-danger btn-sm">{APP.delete}</button>
        }
        title={APP.confirmDelete}
        description={ADMIN_MEMBERS.confirmDelete}
        onConfirm={handleDelete}
      />
    );
  }

  const createdDate = new Date(member.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <tr>
      <Table.UserCell
        name={member.username ?? APP.fallbackUsername}
        avatarColor={member.avatar_color}
        avatarUrl={member.avatar_url}
      />
      <Table.MonoCell>{member.favorite_team ?? "—"}</Table.MonoCell>
      <Table.Cell>{roleBadge}</Table.Cell>
      <Table.DimCell>{createdDate}</Table.DimCell>
      <Table.ActionsCell>{deleteButton}</Table.ActionsCell>
    </tr>
  );
}

const COLUMNS = [
  { label: ADMIN_MEMBERS.colUser },
  { label: ADMIN_MEMBERS.colTeam },
  { label: ADMIN_MEMBERS.colRole },
  { label: ADMIN_MEMBERS.colJoined },
  { label: "" },
];

export default function MembersTable() {
  const [members, setMembers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await getAllProfiles());
    } finally {
      setLoading(false);
    }
  }, []);

  if (!loaded.current) {
    loaded.current = true;
    refresh();
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-icon icon-blue">👤</div>
        <h2 className="t-display-md">{ADMIN_MEMBERS.sectionTitle}</h2>
        <div className="section-line" />
        <span className="t-mono-sm t-muted">
          {ADMIN_MEMBERS.totalLabel(members.length)}
        </span>
      </div>

      <Table
        columns={COLUMNS}
        data={members}
        loading={loading}
        emptyIcon="👤"
        emptyMessage={ADMIN_MEMBERS.emptyState}
        rowKey={(m) => m.id}
        renderRow={(m) => (
          <MemberRow key={m.id} member={m} onRefresh={refresh} />
        )}
      />
    </div>
  );
}
