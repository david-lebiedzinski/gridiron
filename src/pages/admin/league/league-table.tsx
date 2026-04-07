import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Section from "@/components/Section";
import Table from "@/components/DataTable";
import FormDialog from "@/components/FormDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useLeagues,
  useCreateLeague,
  useDeleteLeague,
} from "@/hooks/use-league";
import type { League } from "@/lib/types";
import { ADMIN_LEAGUES, APP } from "@/locales/en";

// ─── Row sub-component ─────────────────────────────────────

interface LeagueRowProps {
  league: League;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

function LeagueRow({ league, onNavigate, onDelete }: LeagueRowProps) {
  function handleRowClick() {
    onNavigate(league.id);
  }

  function handleDelete() {
    return onDelete(league.id);
  }

  return (
    <tr className="tr-clickable" onClick={handleRowClick}>
      <Table.BoldCell>{league.name}</Table.BoldCell>
      <Table.MonoCell>
        <span className="code-pill">{league.invite_code}</span>
      </Table.MonoCell>
      <Table.ActionsCell>
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

// ─── Columns ───────────────────────────────────────────────

const COLUMNS = [
  { label: ADMIN_LEAGUES.colLeague },
  { label: ADMIN_LEAGUES.colInviteCode },
  { label: "", className: "col-actions" },
];

// ─── LeaguesTable ──────────────────────────────────────────

export default function LeaguesTable() {
  const { data: leagues = [], isLoading } = useLeagues();
  const createLeague = useCreateLeague();
  const deleteLeague = useDeleteLeague();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  // ── Handlers ──

  function handleNavigate(id: string) {
    navigate(`/admin/leagues/${id}`);
  }

  async function handleDelete(id: string) {
    await deleteLeague.mutateAsync(id);
  }

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }
    await createLeague.mutateAsync({ name: name.trim() });
    setName("");
    setDialogOpen(false);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }

  // ── Render helpers ──

  function getRowKey(league: League) {
    return league.id;
  }

  function renderRow(league: League) {
    return (
      <LeagueRow
        league={league}
        onNavigate={handleNavigate}
        onDelete={handleDelete}
      />
    );
  }

  // ── Trigger button ──

  let triggerButton: ReactNode = undefined;
  if (!isLoading) {
    triggerButton = (
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
        <label className="field">
          <span className="field-label">{ADMIN_LEAGUES.leagueNameLabel}</span>
          <input
            type="text"
            className="input"
            value={name}
            placeholder={ADMIN_LEAGUES.leagueNamePlaceholder}
            onChange={handleNameChange}
          />
        </label>
      </FormDialog>
    );
  }

  return (
    <Section>
      <Section.Header
        icon="🏈"
        iconColor="accent"
        title={ADMIN_LEAGUES.sectionTitle}
        right={triggerButton}
      />
      <Table
        columns={COLUMNS}
        data={leagues}
        loading={isLoading}
        emptyIcon="🏟️"
        emptyMessage={ADMIN_LEAGUES.emptyState}
        rowKey={getRowKey}
        renderRow={renderRow}
      />
    </Section>
  );
}
