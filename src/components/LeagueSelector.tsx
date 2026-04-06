import { useState } from "react";
import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useApp } from "../context/context";
import { joinLeagueByCode } from "../lib/leagues";
import { APP, LEAGUE_SELECTOR } from "../locales/en";
import FormDialog from "./FormDialog";
import type { League, LeagueMembership } from "../types";

interface LeagueRowProps {
  membership: LeagueMembership;
  isActive: boolean;
  onSelect: (league: League) => void;
}

function LeagueRow({ membership, isActive, onSelect }: LeagueRowProps) {
  const league = membership.leagues;

  function handleClick() {
    onSelect(league);
  }

  return (
    <Popover.Close asChild>
      <button
        className="popover-item"
        style={isActive ? { color: "var(--accent)" } : undefined}
        onClick={handleClick}
      >
        {league.name}
      </button>
    </Popover.Close>
  );
}

export default function LeagueSelector() {
  const { memberships, activeLeague, setActiveLeague, refreshLeagues } =
    useApp();

  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  async function handleJoin() {
    if (joinCode.length < 4) {
      return;
    }
    setJoinError("");
    try {
      await joinLeagueByCode(joinCode);
      setJoinCode("");
      setJoinDialogOpen(false);
      await refreshLeagues();
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : LEAGUE_SELECTOR.invalidCode,
      );
    }
  }

  function handleJoinDialogChange(open: boolean) {
    setJoinDialogOpen(open);
    if (!open) {
      setJoinCode("");
      setJoinError("");
    }
  }

  function handleOpenJoinDialog() {
    setJoinDialogOpen(true);
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setJoinCode(e.target.value.toUpperCase());
  }

  function handleCodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleJoin();
    }
  }

  let joinErrorEl: ReactNode = undefined;
  if (joinError) {
    joinErrorEl = (
      <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
        {joinError}
      </p>
    );
  }

  return (
    <>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="btn btn-ghost btn-sm">
            {activeLeague?.name ?? APP.selectLeague} ▾
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="popover-content"
            sideOffset={8}
            align="start"
          >
            {memberships.map((m) => (
              <LeagueRow
                key={m.leagues.id}
                membership={m}
                isActive={activeLeague?.id === m.leagues.id}
                onSelect={setActiveLeague}
              />
            ))}
            <Popover.Close asChild>
              <button
                className="popover-item"
                style={{ color: "var(--text-3)" }}
                onClick={handleOpenJoinDialog}
              >
                {APP.joinLeague}
              </button>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <FormDialog
        open={joinDialogOpen}
        onOpenChange={handleJoinDialogChange}
        trigger={<span />}
        title={LEAGUE_SELECTOR.joinTitle}
        description={LEAGUE_SELECTOR.joinDesc}
        submitLabel={LEAGUE_SELECTOR.joinSubmit}
        onSubmit={handleJoin}
      >
        <div className="form-group">
          <label>{LEAGUE_SELECTOR.inviteCodeLabel}</label>
          <input
            className="input join-code-input"
            type="text"
            placeholder={APP.codePlaceholder}
            value={joinCode}
            onChange={handleCodeChange}
            onKeyDown={handleCodeKeyDown}
            autoFocus
          />
        </div>
        {joinErrorEl}
      </FormDialog>
    </>
  );
}
