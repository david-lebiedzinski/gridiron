import { useState } from "react";
import type { ReactNode, ChangeEvent, KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useAuth } from "@/context/auth";
import { useLeagueContext } from "@/context/league";
import { useUserLeagues, useJoinLeague } from "@/hooks/use-league";
import { getLeagueByInviteCode } from "@/lib/league";
import { APP, LEAGUE_SELECTOR } from "@/locales/en";
import type { League } from "@/lib/types";
import FormDialog from "./FormDialog";

interface LeagueRowProps {
  league: League;
  isActive: boolean;
  onSelect: (id: string) => void;
}

function LeagueRow({ league, isActive, onSelect }: LeagueRowProps) {
  function handleClick() {
    onSelect(league.id);
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
  const { user } = useAuth();
  const { activeLeagueId, setActiveLeagueId } = useLeagueContext();
  const { data: leagues } = useUserLeagues(user?.id ?? "");
  const joinLeague = useJoinLeague();

  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const activeLeague = (leagues ?? []).find((l) => l.id === activeLeagueId);

  async function handleJoin() {
    if (joinCode.length < 4 || !user) {
      return;
    }
    setJoinError("");
    try {
      const league = await getLeagueByInviteCode(joinCode);
      if (!league) {
        setJoinError(LEAGUE_SELECTOR.invalidCode);
        return;
      }
      await joinLeague.mutateAsync({
        leagueId: league.id,
        userId: user.id,
      });
      setJoinCode("");
      setJoinDialogOpen(false);
      setActiveLeagueId(league.id);
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

  function handleCodeChange(e: ChangeEvent<HTMLInputElement>) {
    setJoinCode(e.target.value.toUpperCase());
  }

  function handleCodeKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleJoin();
    }
  }

  function handleSelectLeague(id: string) {
    setActiveLeagueId(id);
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
            {activeLeague?.name ?? APP.selectLeague} {"\u25BE"}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="popover-content"
            sideOffset={8}
            align="start"
          >
            {(leagues ?? []).map((league) => (
              <LeagueRow
                key={league.id}
                league={league}
                isActive={activeLeagueId === league.id}
                onSelect={handleSelectLeague}
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
