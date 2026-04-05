import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import Table from "../../components/DataTable";
import { useApp } from "../../context/context";
import { getAllLeagues, deleteLeague } from "../../lib/leagues";
import { createLeague, regenerateInviteCode } from "../../lib/commissioner";
import { ADMIN_LEAGUES, APP } from "../../strings";

type AdminLeague = Awaited<ReturnType<typeof getAllLeagues>>[number];

interface CommissionerProfile {
  username: string;
  avatar_color: string;
  avatar_url: string | null;
}

interface LeagueRowProps {
  league: AdminLeague;
  onRefresh: () => void;
}

function LeagueRow({ league, onRefresh }: LeagueRowProps) {
  const p = league.profiles as unknown as CommissionerProfile | null;

  async function handleRegenCode() {
    await regenerateInviteCode(league.id);
    onRefresh();
  }

  async function handleDelete() {
    await deleteLeague(league.id);
    onRefresh();
  }

  let commissionerCell: ReactNode = (
    <Table.MonoCell>—</Table.MonoCell>
  );
  if (p) {
    commissionerCell = (
      <Table.UserCell
        name={p.username}
        avatarColor={p.avatar_color}
        avatarUrl={p.avatar_url}
      />
    );
  }

  return (
    <tr>
      <Table.BoldCell>{league.name}</Table.BoldCell>
      {commissionerCell}
      <Table.NumericCell>
        {(league.league_members as unknown[])?.length ?? 0}
      </Table.NumericCell>
      <Table.Cell>
        <span className="code-pill">{league.invite_code}</span>
      </Table.Cell>
      <Table.ActionsCell>
        <button className="btn btn-ghost btn-sm" onClick={handleRegenCode}>
          {ADMIN_LEAGUES.regenCode}
        </button>
        <ConfirmDialog
          trigger={
            <button className="btn btn-danger btn-sm">{APP.delete}</button>
          }
          title={APP.confirmDelete}
          description={ADMIN_LEAGUES.confirmDelete}
          onConfirm={handleDelete}
        />
      </Table.ActionsCell>
    </tr>
  );
}

const COLUMNS = [
  { label: ADMIN_LEAGUES.colLeague },
  { label: ADMIN_LEAGUES.colCommissioner },
  { label: ADMIN_LEAGUES.colMembers, className: "col-num" },
  { label: ADMIN_LEAGUES.colInviteCode },
  { label: "" },
];

export default function LeaguesTable() {
  const { user } = useApp();
  const [leagues, setLeagues] = useState<AdminLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLeagues(await getAllLeagues());
    } finally {
      setLoading(false);
    }
  }, []);

  if (!loaded.current) {
    loaded.current = true;
    refresh();
  }

  async function handleCreate() {
    if (!newName.trim() || !user) {
      return;
    }
    await createLeague(newName.trim(), user.id);
    setNewName("");
    setDialogOpen(false);
    refresh();
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewName(e.target.value);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleCreate();
    }
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-icon icon-green">🏆</div>
        <h2 className="t-display-md">{ADMIN_LEAGUES.sectionTitle}</h2>
        <div className="section-line" />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trigger={
            <button className="btn btn-primary btn-sm">
              {ADMIN_LEAGUES.newLeague}
            </button>
          }
          title={ADMIN_LEAGUES.dialogTitle}
          description={ADMIN_LEAGUES.dialogDesc}
          submitLabel={ADMIN_LEAGUES.dialogSubmit}
          onSubmit={handleCreate}
        >
          <div className="form-group">
            <label>{ADMIN_LEAGUES.leagueNameLabel}</label>
            <input
              type="text"
              placeholder={ADMIN_LEAGUES.leagueNamePlaceholder}
              value={newName}
              onChange={handleNameChange}
              onKeyDown={handleNameKeyDown}
              autoFocus
            />
          </div>
        </FormDialog>
      </div>

      <Table
        columns={COLUMNS}
        data={leagues}
        loading={loading}
        emptyIcon="🏆"
        emptyMessage={ADMIN_LEAGUES.emptyState}
        rowKey={(l) => l.id}
        renderRow={(l) => (
          <LeagueRow key={l.id} league={l} onRefresh={refresh} />
        )}
      />
    </div>
  );
}
