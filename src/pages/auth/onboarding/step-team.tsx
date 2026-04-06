import { useState } from "react";
import { useTeams } from "@/hooks/use-teams";
import { useUpdateProfile } from "@/hooks/use-profile";
import { APP, ONBOARDING } from "@/locales/en";
import type { Team } from "@/lib/types";

interface StepTeamProps {
  onComplete: () => void;
}

export default function StepTeam({ onComplete }: StepTeamProps) {
  const { data: teams } = useTeams();
  const updateProfile = useUpdateProfile();

  const [selected, setSelected] = useState<Team | null>(null);

  async function handleContinue() {
    if (!selected) {
      return;
    }

    try {
      await updateProfile.mutateAsync({ favorite_team_id: selected.id });
      onComplete();
    } catch {
      // silently continue
    }
  }

  return (
    <>
      <div className="team-desc">{ONBOARDING.teamDesc}</div>
      <div className="team-picker">
        {(teams ?? []).map((team) => (
          <TeamOption
            key={team.id}
            team={team}
            isSelected={selected?.id === team.id}
            onSelect={setSelected}
          />
        ))}
      </div>
      <div className="team-selected-label">
        {ONBOARDING.selectedPrefix}
        <span>{selected?.abbr ?? APP.none}</span>
      </div>
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={updateProfile.isPending || !selected}
        onClick={handleContinue}
      >
        {updateProfile.isPending ? APP.saving : APP.continue}
      </button>
    </>
  );
}

interface TeamOptionProps {
  team: Team;
  isSelected: boolean;
  onSelect: (team: Team) => void;
}

function TeamOption({ team, isSelected, onSelect }: TeamOptionProps) {
  function handleClick() {
    onSelect(team);
  }

  const style = isSelected
    ? {
        borderColor: team.color ?? undefined,
        background: (team.color ?? "") + "22",
      }
    : undefined;

  return (
    <div
      className={`team-option${isSelected ? " selected" : ""}`}
      style={style}
      onClick={handleClick}
    >
      <div
        className="team-dot"
        style={{ background: team.color ?? undefined }}
      />
      {team.abbr}
    </div>
  );
}
