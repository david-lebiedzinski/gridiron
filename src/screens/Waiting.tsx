import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";
import { joinLeagueByCode } from "../lib/leagues";
import { useApp } from "../context/context";
import "./onboarding.css";

export default function Waiting() {
  const { user, profile, refreshLeagues } = useApp();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const initials = (profile?.username ?? user?.email ?? "?")
    .slice(0, 2)
    .toUpperCase();

  function formatCode(raw: string) {
    let val = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (val.length > 4) val = val.slice(0, 4) + "-" + val.slice(4, 8);
    return val;
  }

  async function handleJoin() {
    if (!code.replace(/-/g, "").trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await joinLeagueByCode(code.replace(/-/g, ""));
      setResult({
        type: "success",
        message: `✓ ${data.league_name} · Welcome!`,
      });
      await refreshLeagues();
      setTimeout(() => navigate("/picks"), 1000);
    } catch {
      setResult({
        type: "error",
        message: "✗ Invalid code. Check with your commissioner.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="onboard-screen">
      <div className="auth-bg" />

      <div className="onboard-logo">
        <span className="onboard-logo-icon">🏈</span>
        <span className="onboard-logo-mark">GRIDIRON</span>
      </div>

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          flex: 1,
        }}
      >
        <div className="waiting-card">
          <div className="waiting-user">
            <div className="waiting-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="waiting-name">{profile?.username ?? "User"}</div>
              <div className="waiting-email">{user?.email}</div>
            </div>
            <button className="waiting-signout" onClick={handleSignOut}>
              Sign out
            </button>
          </div>

          <span className="waiting-icon">📬</span>
          <div className="waiting-title">You're in the system</div>
          <div className="waiting-body">
            Your account is all set. Now you just need an{" "}
            <strong>invite code</strong> from your league commissioner to start
            picking.
          </div>

          <div className="waiting-dots">
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <div className="waiting-dot" />
          </div>

          <div className="have-code">
            <div className="have-code-label">Got a code? Enter it now</div>
            <input
              className="waiting-invite-input"
              type="text"
              placeholder="XXXX-XXXX"
              maxLength={9}
              value={code}
              onChange={(e) => {
                setCode(formatCode(e.target.value));
                setResult(null);
              }}
            />
            {result && (
              <div className={`invite-result ${result.type}`}>
                {result.message}
              </div>
            )}
            <button
              className="waiting-submit"
              disabled={busy || !code.replace(/-/g, "").trim()}
              onClick={handleJoin}
            >
              JOIN LEAGUE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
