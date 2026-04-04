import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { updateProfile } from "../lib/auth";
import { joinLeagueByCode } from "../lib/leagues";
import { useApp } from "../context/context";
import "./onboarding.css";

// ─── Interfaces ──────────────────────────────────────────────

interface StepCardProps {
  num: number;
  title: string;
  state: "active" | "done" | "pending";
  children: React.ReactNode;
}

interface StepUsernameProps {
  saving: boolean;
  onComplete: () => void;
  userId: string;
}

interface StepPhotoProps {
  saving: boolean;
  onComplete: () => void;
  userId: string;
}

interface StepTeamProps {
  saving: boolean;
  onComplete: () => void;
  userId: string;
}

interface StepInviteCodeProps {
  saving: boolean;
  onSkip: () => void;
  refreshLeagues: () => Promise<void>;
}

// ─── NFL Teams ───────────────────────────────────────────────

const TEAMS = [
  { abbr: "ARI", color: "#97233F" },
  { abbr: "ATL", color: "#A71930" },
  { abbr: "BAL", color: "#241773" },
  { abbr: "BUF", color: "#00338D" },
  { abbr: "CAR", color: "#0085CA" },
  { abbr: "CHI", color: "#0B1C3E" },
  { abbr: "CIN", color: "#FB4F14" },
  { abbr: "CLE", color: "#FF3C00" },
  { abbr: "DAL", color: "#003594" },
  { abbr: "DEN", color: "#FB4F14" },
  { abbr: "DET", color: "#0076B6" },
  { abbr: "GB", color: "#203731" },
  { abbr: "HOU", color: "#03202F" },
  { abbr: "IND", color: "#002C5F" },
  { abbr: "JAX", color: "#006778" },
  { abbr: "KC", color: "#E31837" },
  { abbr: "LAC", color: "#0080C6" },
  { abbr: "LAR", color: "#003594" },
  { abbr: "LV", color: "#A5ACAF" },
  { abbr: "MIA", color: "#008E97" },
  { abbr: "MIN", color: "#4F2683" },
  { abbr: "NE", color: "#002244" },
  { abbr: "NO", color: "#D3BC8D" },
  { abbr: "NYG", color: "#0B2265" },
  { abbr: "NYJ", color: "#125740" },
  { abbr: "PHI", color: "#004C54" },
  { abbr: "PIT", color: "#FFB612" },
  { abbr: "SEA", color: "#002244" },
  { abbr: "SF", color: "#AA0000" },
  { abbr: "TB", color: "#D50A0A" },
  { abbr: "TEN", color: "#4B92DB" },
  { abbr: "WSH", color: "#5A1414" },
];

// ─── Step wrapper ────────────────────────────────────────────

function StepCard({ num, title, state, children }: StepCardProps) {
  return (
    <div className={`step-card${state !== "pending" ? ` ${state}` : ""}`}>
      <div className="step-header">
        <div className="step-num">{num}</div>
        <div className="step-title">{title}</div>
        <div className="step-check">✓</div>
      </div>
      <div className="step-body">{children}</div>
    </div>
  );
}

// ─── Step 1: Username ────────────────────────────────────────

function StepUsername({ saving, onComplete, userId }: StepUsernameProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || trimmed.includes(" ")) {
      setError("Username cannot be empty or contain spaces.");
      return;
    }

    setBusy(true);

    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .neq("id", userId)
        .single();

      if (existing) {
        setError("Username already taken. Try another.");
        return;
      }

      await updateProfile(userId, { username: trimmed });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="step-field">
        <label className="step-label">Username</label>
        <input
          className={`step-input${error ? " error" : ""}`}
          type="text"
          placeholder="e.g. jordan_picks"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
        />
        {error && <div className="step-error">{error}</div>}
        <div className="step-hint">
          Shown to everyone in your league. No spaces.
        </div>
      </div>
      <button className="step-btn" type="submit" disabled={saving || busy}>
        {busy ? "Saving..." : "Continue →"}
      </button>
    </form>
  );
}

// ─── Step 2: Photo ───────────────────────────────────────────

function StepPhoto({ saving, onComplete, userId }: StepPhotoProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleContinue(skip: boolean) {
    if (!skip && file) {
      setBusy(true);
      try {
        const ext = file.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);

        await supabase
          .from("profiles")
          .update({ avatar_url: urlData.publicUrl })
          .eq("id", userId);
      } catch (err) {
        console.error("Avatar upload failed:", err);
      } finally {
        setBusy(false);
      }
    }
    onComplete();
  }

  return (
    <>
      <div className="avatar-upload">
        <div
          className={`avatar-preview${preview ? " has-image" : ""}`}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? <img src={preview} alt="Avatar" /> : "👤"}
        </div>
        <div>
          <button
            className="avatar-upload-btn"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            Upload photo
          </button>
          <div className="avatar-skip" onClick={() => handleContinue(true)}>
            Skip for now →
          </div>
        </div>
      </div>
      <div className="avatar-meta">
        JPG or PNG · Max 5MB · Shows in pick bar + leaderboard
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={saving || busy || !preview}
        onClick={() => handleContinue(false)}
      >
        {busy ? "Uploading..." : "Continue →"}
      </button>
    </>
  );
}

// ─── Step 3: Team ────────────────────────────────────────────

function StepTeam({ saving, onComplete, userId }: StepTeamProps) {
  const [selected, setSelected] = useState<(typeof TEAMS)[number] | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setBusy(true);
    try {
      await supabase
        .from("profiles")
        .update({
          favorite_team: selected.abbr,
          avatar_color: selected.color,
        })
        .eq("id", userId);
      onComplete();
    } catch {
      // silently continue
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="team-desc">
        Your team's colors ring your avatar across the app.
      </div>
      <div className="team-picker">
        {TEAMS.map((team) => (
          <div
            key={team.abbr}
            className={`team-option${selected?.abbr === team.abbr ? " selected" : ""}`}
            style={
              selected?.abbr === team.abbr
                ? { borderColor: team.color, background: team.color + "22" }
                : undefined
            }
            onClick={() => setSelected(team)}
          >
            <div className="team-dot" style={{ background: team.color }} />
            {team.abbr}
          </div>
        ))}
      </div>
      <div className="team-selected-label">
        Selected: <span>{selected?.abbr ?? "None"}</span>
      </div>
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={saving || busy || !selected}
        onClick={handleContinue}
      >
        {busy ? "Saving..." : "Continue →"}
      </button>
    </>
  );
}

// ─── Step 4: Invite Code ─────────────────────────────────────

function StepInviteCode({
  saving,
  onSkip,
  refreshLeagues,
}: StepInviteCodeProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

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

  const inputClass = [
    "invite-input",
    result?.type === "success" ? "valid" : "",
    result?.type === "error" ? "invalid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="invite-desc">
        Your commissioner will share a code to join their league.
      </div>
      <input
        className={inputClass}
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
        <div className={`invite-result ${result.type}`}>{result.message}</div>
      )}
      <div className="skip-invite">
        Don't have a code? <span onClick={onSkip}>Skip for now →</span>
      </div>
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={saving || busy || !code.replace(/-/g, "").trim()}
        onClick={handleJoin}
      >
        {busy ? "Joining..." : "JOIN LEAGUE →"}
      </button>
    </>
  );
}

// ─── Main Onboarding ─────────────────────────────────────────

export default function Onboarding() {
  const { user, refreshLeagues } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  function markDone(n: number) {
    setCompleted((prev) => new Set(prev).add(n));
    setStep(n + 1);
  }

  function stepState(n: number): "active" | "done" | "pending" {
    if (completed.has(n)) return "done";
    if (step === n) return "active";
    return "pending";
  }

  return (
    <div className="onboard-screen">
      <div className="auth-bg" />

      <div className="onboard-logo">
        <span className="onboard-logo-icon">🏈</span>
        <span className="onboard-logo-mark">GRIDIRON</span>
        <div className="onboard-logo-sub">Let's get you set up</div>
      </div>

      <div className="onboard-wrap">
        <StepCard num={1} title="Choose your name" state={stepState(1)}>
          <StepUsername
            saving={false}
            onComplete={() => markDone(1)}
            userId={user?.id ?? ""}
          />
        </StepCard>

        <StepCard num={2} title="Add a photo" state={stepState(2)}>
          <StepPhoto
            saving={false}
            onComplete={() => markDone(2)}
            userId={user?.id ?? ""}
          />
        </StepCard>

        <StepCard num={3} title="Pick your team" state={stepState(3)}>
          <StepTeam
            saving={false}
            onComplete={() => markDone(3)}
            userId={user?.id ?? ""}
          />
        </StepCard>

        <StepCard num={4} title="Enter your invite code" state={stepState(4)}>
          <StepInviteCode
            saving={false}
            onSkip={() => navigate("/waiting")}
            refreshLeagues={refreshLeagues}
          />
        </StepCard>
      </div>
    </div>
  );
}
