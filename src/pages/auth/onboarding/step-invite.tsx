import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useJoinLeague } from "@/hooks/use-league";
import { getLeagueByInviteCode } from "@/lib/league";
import { APP, ONBOARDING } from "@/locales/en";

interface StepInviteProps {
  onSkip: () => void;
}

export default function StepInvite({ onSkip }: StepInviteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const joinLeague = useJoinLeague();

  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  function formatCode(raw: string): string {
    let val = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (val.length > 4) {
      val = val.slice(0, 4) + "-" + val.slice(4, 8);
    }
    return val;
  }

  function handleCodeChange(e: ChangeEvent<HTMLInputElement>) {
    setCode(formatCode(e.target.value));
    setResult(null);
  }

  async function handleJoin() {
    const cleanCode = code.replace(/-/g, "").trim();
    if (!cleanCode || !user) {
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const league = await getLeagueByInviteCode(cleanCode);
      if (!league) {
        setResult({ type: "error", message: ONBOARDING.joinError });
        return;
      }

      await joinLeague.mutateAsync({
        leagueId: league.id,
        userId: user.id,
      });

      setResult({
        type: "success",
        message: ONBOARDING.joinSuccess(league.name),
      });
      setTimeout(() => navigate("/picks"), 1000);
    } catch {
      setResult({ type: "error", message: ONBOARDING.joinError });
    } finally {
      setBusy(false);
    }
  }

  const inputClass = [
    "invite-input",
    result?.type === "success" ? "valid" : "",
    result?.type === "error" ? "invalid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  let resultEl: React.ReactNode = undefined;
  if (result) {
    resultEl = (
      <div className={`invite-result ${result.type}`}>{result.message}</div>
    );
  }

  return (
    <>
      <div className="invite-desc">{ONBOARDING.inviteDesc}</div>
      <input
        className={inputClass}
        type="text"
        placeholder={APP.codePlaceholder}
        maxLength={9}
        value={code}
        onChange={handleCodeChange}
      />
      {resultEl}
      <div className="skip-invite">
        {ONBOARDING.noCode}
        <span onClick={onSkip}>{ONBOARDING.skipForNow}</span>
      </div>
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={busy || !code.replace(/-/g, "").trim()}
        onClick={handleJoin}
      >
        {busy ? ONBOARDING.joining : ONBOARDING.joinLeague}
      </button>
    </>
  );
}
