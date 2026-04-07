import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useJoinLeague } from "@/hooks/use-league";
import { getLeagueByInviteCode } from "@/lib/league";
import { APP, AUTH, WAITING } from "@/locales/en";
import AuthLayout from "./auth-layout";

export default function WaitingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
        setResult({ type: "error", message: WAITING.joinError });
        return;
      }

      await joinLeague.mutateAsync({
        leagueId: league.id,
        userId: user.id,
      });

      setResult({
        type: "success",
        message: WAITING.joinSuccess(league.name),
      });
      setTimeout(() => navigate("/picks"), 1000);
    } catch {
      setResult({ type: "error", message: WAITING.joinError });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  let resultEl: React.ReactNode = undefined;
  if (result) {
    resultEl = (
      <div className={`invite-result ${result.type}`}>{result.message}</div>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-card" style={{ textAlign: "center" }}>
        <span className="waiting-icon">{WAITING.icon}</span>
        <div className="auth-card-title">{WAITING.title}</div>
        <div className="auth-card-sub">{WAITING.body}</div>

        <div className="waiting-dots">
          <div className="waiting-dot" />
          <div className="waiting-dot" />
          <div className="waiting-dot" />
        </div>

        <div className="auth-divider">
          <span className="auth-divider-text">{WAITING.codeLabel}</span>
        </div>

        <input
          className="auth-input waiting-code-input"
          type="text"
          placeholder={APP.codePlaceholder}
          maxLength={9}
          value={code}
          onChange={handleCodeChange}
        />
        {resultEl}
        <button
          className="auth-btn"
          disabled={busy || !code.replace(/-/g, "").trim()}
          onClick={handleJoin}
        >
          {WAITING.joinButton}
        </button>

        <div className="auth-divider">
          <span className="auth-divider-text">{AUTH.divider}</span>
        </div>

        <div className="waiting-signout">
          {WAITING.signOutPrefix}{" "}
          <button className="waiting-signout-link" onClick={handleSignOut}>
            {WAITING.signOutAction}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
