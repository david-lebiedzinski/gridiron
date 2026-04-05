import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/context";
import { getLeagueMembers, deleteLeague } from "../../lib/leagues";
import {
  transferCommissioner,
  regenerateInviteCode,
} from "../../lib/commissioner";
import ConfirmDialog from "../../components/ConfirmDialog";
import Section from "../../components/Section";
import { DANGER_ZONE } from "../../strings";

type MemberRow = Awaited<ReturnType<typeof getLeagueMembers>>[number];

interface MemberProfile {
  id: string;
  username: string;
}

export default function DangerZone() {
  const { activeLeague, user, refreshLeagues, memberships } = useApp();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [transferTarget, setTransferTarget] = useState("");

  const leagueId = activeLeague?.id ?? "";

  useEffect(() => {
    if (leagueId) {
      getLeagueMembers(leagueId).then(setMembers);
    }
  }, [leagueId]);

  const otherMembers = members.filter((m) => {
    const p = m.profiles as unknown as MemberProfile | null;
    return p?.id !== user?.id;
  });

  function getTransferTargetName(): string {
    const target = otherMembers.find((m) => {
      const p = m.profiles as unknown as MemberProfile | null;
      return p?.id === transferTarget;
    });
    return (
      (target?.profiles as unknown as MemberProfile | null)?.username ??
      "this member"
    );
  }

  async function handleTransfer() {
    if (!transferTarget || !user) {
      return;
    }
    await transferCommissioner(leagueId, transferTarget, user.id);
    window.location.reload();
  }

  async function handleRegenCode() {
    await regenerateInviteCode(leagueId);
    await refreshLeagues();
  }

  async function handleDeleteLeague() {
    await deleteLeague(leagueId);
    await refreshLeagues();
    const remaining = memberships.filter((m) => m.leagues.id !== leagueId);
    if (remaining.length > 0) {
      navigate("/picks");
    } else {
      navigate("/waiting");
    }
  }

  function handleTransferTargetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTransferTarget(e.target.value);
  }

  let transferSelect: ReactNode = undefined;
  if (otherMembers.length > 0) {
    transferSelect = (
      <div className="transfer-select-row">
        <select
          className="input"
          style={{ width: "auto", minWidth: 160 }}
          value={transferTarget}
          onChange={handleTransferTargetChange}
        >
          <option value="">Select member...</option>
          {otherMembers.map((m) => {
            const p = m.profiles as unknown as MemberProfile | null;
            return (
              <option key={p?.id} value={p?.id ?? ""}>
                {p?.username ?? "Unknown"}
              </option>
            );
          })}
        </select>
        <ConfirmDialog
          trigger={
            <button
              className="btn btn-danger btn-sm"
              disabled={!transferTarget}
            >
              Transfer
            </button>
          }
          title={DANGER_ZONE.confirmTransferTitle}
          description={DANGER_ZONE.confirmTransfer(getTransferTargetName())}
          confirmLabel="Transfer"
          onConfirm={handleTransfer}
        />
      </div>
    );
  }

  return (
    <Section>
      <Section.Header icon="⚠️" iconColor="icon-red" title="Danger Zone" />

      <Section.Card variant="danger">
        <Section.Row
          label="Transfer commissioner"
          description="Hand commissioner role to another member. You become a regular member."
        >
          {transferSelect}
        </Section.Row>

        <Section.Row
          label="Regenerate invite code"
          description="Invalidates the current code immediately. Anyone with the old code can no longer join."
        >
          <ConfirmDialog
            trigger={
              <button className="btn btn-danger btn-sm">Regenerate</button>
            }
            title={DANGER_ZONE.confirmRegenTitle}
            description={DANGER_ZONE.confirmRegen}
            confirmLabel="Regenerate"
            variant="default"
            onConfirm={handleRegenCode}
          />
        </Section.Row>

        <Section.Row
          label="Delete league"
          description="Permanently delete this league and all associated seasons, picks, and member data. This cannot be undone."
        >
          <ConfirmDialog
            trigger={
              <button className="btn btn-danger btn-sm">Delete</button>
            }
            title={DANGER_ZONE.confirmDeleteTitle}
            description={DANGER_ZONE.confirmDelete}
            onConfirm={handleDeleteLeague}
          />
        </Section.Row>
      </Section.Card>
    </Section>
  );
}
