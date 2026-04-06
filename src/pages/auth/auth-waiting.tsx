import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useProfile } from "@/hooks/use-profile";
import { useJoinLeague } from "@/hooks/use-league";
import { getLeagueByInviteCode } from "@/lib/league";
import { APP, WAITING } from "@/locales/en";

export default function WaitingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const joinLeague = useJoinLeague();

  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const displayName = profile?.name ?? APP.fallbackUsername;
  const initials = displayName.slice(0, 2).toUpperCase();

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

  let avatarContent: React.ReactNode;
  if (profile?.avatar) {
    avatarContent = <img src={profile.avatar} alt={displayName} />;
  } else {
    avatarContent = initials;
  }

  let resultEl: React.ReactNode = undefined;
  if (result) {
    resultEl = (
      <div className={`invite-result ${result.type}`}>{result.message}</div>
    );
  }

  return (
    <div className="onboard-screen">
      <div className="auth-bg" />

      <div className="onboard-logo">
        <span className="onboard-logo-icon">{"\uD83C\uDFC8"}</span>
        <span className="onboard-logo-mark">{APP.name}</span>
      </div>

      <div className="waiting-outer">
        <div className="waiting-card">
          <div className="waiting-user">
            <div className="waiting-avatar">{avatarContent}</div>
            <div>
              <div className="waiting-name">{displayName}</div>
              <div className="waiting-email">{user?.email}</div>
            </div>
            <button className="waiting-signout" onClick={handleSignOut}>
              {APP.signOut}
            </button>
          </div>

          <span className="waiting-icon">{WAITING.icon}</span>
          <div className="waiting-title">{WAITING.title}</div>
          <div className="waiting-body">{WAITING.body}</div>

          <div className="waiting-dots">
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <div className="waiting-dot" />
          </div>

          <div className="have-code">
            <div className="have-code-label">{WAITING.codeLabel}</div>
            <input
              className="waiting-invite-input"
              type="text"
              placeholder={APP.codePlaceholder}
              maxLength={9}
              value={code}
              onChange={handleCodeChange}
            />
            {resultEl}
            <button
              className="waiting-submit"
              disabled={busy || !code.replace(/-/g, "").trim()}
              onClick={handleJoin}
            >
              {WAITING.joinButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
