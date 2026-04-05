import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { updateProfile } from "../lib/auth";
import { joinLeagueByCode } from "../lib/leagues";
import { useApp } from "../context/context";
import { TEAMS } from "../lib/teams";
import { APP, ONBOARDING } from "../strings";
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
  refreshProfile: () => Promise<void>;
}

interface StepInviteCodeProps {
  saving: boolean;
  onSkip: () => void;
  refreshLeagues: () => Promise<void>;
}

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
      setError(ONBOARDING.usernameErrorEmpty);
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
        setError(ONBOARDING.usernameErrorTaken);
        return;
      }

      await updateProfile(userId, { username: trimmed });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : APP.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="step-field">
        <label className="step-label">{ONBOARDING.usernameLabel}</label>
        <input
          className={`step-input${error ? " error" : ""}`}
          type="text"
          placeholder={ONBOARDING.usernamePlaceholder}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
        />
        {error && <div className="step-error">{error}</div>}
        <div className="step-hint">
          {ONBOARDING.usernameHint}
        </div>
      </div>
      <button className="step-btn" type="submit" disabled={saving || busy}>
        {busy ? APP.saving : APP.continue}
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
            {ONBOARDING.uploadPhoto}
          </button>
          <div className="avatar-skip" onClick={() => handleContinue(true)}>
            {ONBOARDING.skipForNow}
          </div>
        </div>
      </div>
      <div className="avatar-meta">
        {ONBOARDING.photoHint}
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
        {busy ? ONBOARDING.uploading : APP.continue}
      </button>
    </>
  );
}

// ─── Step 3: Team ────────────────────────────────────────────

function StepTeam({ saving, onComplete, userId, refreshProfile }: StepTeamProps) {
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
      await refreshProfile();
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
        {ONBOARDING.teamDesc}
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
        {ONBOARDING.selectedPrefix}<span>{selected?.abbr ?? APP.none}</span>
      </div>
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={saving || busy || !selected}
        onClick={handleContinue}
      >
        {busy ? APP.saving : APP.continue}
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
        message: ONBOARDING.joinSuccess(data.league_name),
      });
      await refreshLeagues();
      setTimeout(() => navigate("/picks"), 1000);
    } catch {
      setResult({
        type: "error",
        message: ONBOARDING.joinError,
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
        {ONBOARDING.inviteDesc}
      </div>
      <input
        className={inputClass}
        type="text"
        placeholder={APP.codePlaceholder}
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
        {ONBOARDING.noCode}<span onClick={onSkip}>{ONBOARDING.skipForNow}</span>
      </div>
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={saving || busy || !code.replace(/-/g, "").trim()}
        onClick={handleJoin}
      >
        {busy ? ONBOARDING.joining : ONBOARDING.joinLeague}
      </button>
    </>
  );
}

// ─── Main Onboarding ─────────────────────────────────────────

export default function Onboarding() {
  const { user, refreshLeagues, refreshProfile } = useApp();
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
        <span className="onboard-logo-mark">{APP.name}</span>
        <div className="onboard-logo-sub">{ONBOARDING.subtitle}</div>
      </div>

      <div className="onboard-wrap">
        <StepCard num={1} title={ONBOARDING.step1Title} state={stepState(1)}>
          <StepUsername
            saving={false}
            onComplete={() => markDone(1)}
            userId={user?.id ?? ""}
          />
        </StepCard>

        <StepCard num={2} title={ONBOARDING.step2Title} state={stepState(2)}>
          <StepPhoto
            saving={false}
            onComplete={() => markDone(2)}
            userId={user?.id ?? ""}
          />
        </StepCard>

        <StepCard num={3} title={ONBOARDING.step3Title} state={stepState(3)}>
          <StepTeam
            saving={false}
            onComplete={() => markDone(3)}
            userId={user?.id ?? ""}
            refreshProfile={refreshProfile}
          />
        </StepCard>

        <StepCard num={4} title={ONBOARDING.step4Title} state={stepState(4)}>
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
