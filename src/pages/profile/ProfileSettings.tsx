import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Section from "../../components/Section";
import { useApp } from "../../context/context";
import { updateProfile } from "../../lib/auth";
import { supabase } from "../../lib/client";
import { TEAMS, getTeamColor } from "../../lib/teams";
import { PROFILE, APP } from "../../locales/en";

// ─── Team option ─────────────────────────────────────────────

interface TeamOptionProps {
  abbr: string;
  color: string;
  selected: boolean;
  onSelect: (abbr: string) => void;
}

function TeamOption({ abbr, color, selected, onSelect }: TeamOptionProps) {
  function handleClick() {
    onSelect(abbr);
  }

  const style = selected
    ? { borderColor: color, background: color + "22" }
    : undefined;

  return (
    <div
      className={`team-option${selected ? " selected" : ""}`}
      style={style}
      onClick={handleClick}
    >
      <div className="team-dot" style={{ background: color }} />
      {abbr}
    </div>
  );
}

// ─── Intensity option ────────────────────────────────────────

type Intensity = "off" | "subtle" | "normal" | "full";

interface IntensityOptionProps {
  value: Intensity;
  label: string;
  selected: boolean;
  onSelect: (v: Intensity) => void;
}

function IntensityOption({
  value,
  label,
  selected,
  onSelect,
}: IntensityOptionProps) {
  function handleClick() {
    onSelect(value);
  }

  return (
    <button
      className={`btn btn-sm ${selected ? "btn-primary" : "btn-ghost"}`}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}

const INTENSITY_OPTIONS: { value: Intensity; label: string }[] = [
  { value: "off", label: PROFILE.intensityOff },
  { value: "subtle", label: PROFILE.intensitySubtle },
  { value: "normal", label: PROFILE.intensityNormal },
  { value: "full", label: PROFILE.intensityFull },
];

// ─── ProfileSettings ────────────────────────────────────────

export default function ProfileSettings() {
  const { user, profile, refreshProfile } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Local state ──
  const [username, setUsername] = useState(profile?.username ?? "");
  const [team, setTeam] = useState(profile?.favorite_team ?? "");
  const [intensity, setIntensity] = useState<Intensity>(
    profile?.theme_intensity ?? "normal",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Sync from profile ──
  useEffect(() => {
    setUsername(profile?.username ?? "");
    setTeam(profile?.favorite_team ?? "");
    setIntensity(profile?.theme_intensity ?? "normal");
  }, [profile?.username, profile?.favorite_team, profile?.theme_intensity]);

  // ── Dirty tracking ──
  const dirtyUsername = username.trim() !== (profile?.username ?? "");
  const dirtyTeam = team !== (profile?.favorite_team ?? "");
  const dirtyIntensity = intensity !== (profile?.theme_intensity ?? "normal");
  const dirty = dirtyUsername || dirtyTeam || dirtyIntensity;

  // ── Avatar (saves immediately) ──
  const avatarUrl = profile?.avatar_url ?? null;
  const avatarColor = profile?.avatar_color ?? "var(--accent)";
  const initials = (profile?.username ?? "?").slice(0, 2).toUpperCase();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) {
      return;
    }
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const bustCache = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateProfile(user.id, { avatar_url: bustCache });
      await refreshProfile();

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }

  async function handleRemoveAvatar() {
    if (!user) {
      return;
    }
    await updateProfile(user.id, { avatar_url: null });
    await refreshProfile();
  }

  function handleUploadClick() {
    fileRef.current?.click();
  }

  let avatarContent: ReactNode = initials;
  if (avatarUrl) {
    avatarContent = <img src={avatarUrl} alt="" />;
  }

  // ── Field handlers ──
  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
    setError("");
  }

  function handleTeamSelect(abbr: string) {
    setTeam((prev) => (prev === abbr ? "" : abbr));
  }

  function handleIntensitySelect(v: Intensity) {
    setIntensity(v);
  }

  // ── Save all ──
  async function handleSave() {
    if (!user || !dirty) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updates: Record<string, unknown> = {};

      if (dirtyUsername) {
        updates.username = username.trim();
      }
      if (dirtyTeam) {
        const t = team || null;
        updates.favorite_team = t;
        updates.avatar_color = getTeamColor(t);
      }
      if (dirtyIntensity) {
        updates.theme_intensity = intensity;
      }

      await updateProfile(user.id, updates);
      await refreshProfile();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && dirty) {
      handleSave();
    }
  }

  return (
    <Section>
      <Section.Card>
        {/* Username */}
        <Section.Row
          label={PROFILE.usernameLabel}
          description={error || PROFILE.usernameDesc}
        >
          <input
            type="text"
            className="input setting-input-wide"
            value={username}
            placeholder={PROFILE.usernamePlaceholder}
            onChange={handleUsernameChange}
            onKeyDown={handleKeyDown}
          />
        </Section.Row>

        {/* Avatar */}
        <Section.Group title={PROFILE.avatarTitle} />
        <Section.Row label={PROFILE.photoLabel} description={PROFILE.photoDesc}>
          <div className="avatar-setting-row">
            <div
              className="nav-avatar avatar-lg"
              style={{ borderColor: avatarColor, background: avatarColor }}
            >
              {avatarContent}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleUploadClick}
            >
              {PROFILE.uploadButton}
            </button>
            {avatarUrl && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleRemoveAvatar}
              >
                {PROFILE.removePhoto}
              </button>
            )}
          </div>
        </Section.Row>

        {/* Favorite Team */}
        <Section.Group title={PROFILE.teamLabel} />
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="team-picker">
            {TEAMS.map((t) => (
              <TeamOption
                key={t.abbr}
                abbr={t.abbr}
                color={t.color}
                selected={team === t.abbr}
                onSelect={handleTeamSelect}
              />
            ))}
          </div>
          <div className="setting-desc" style={{ marginTop: 8 }}>
            {PROFILE.teamDesc}
          </div>
        </div>

        {/* Theme Intensity */}
        <Section.Group title={PROFILE.eyebrow} />
        <Section.Row
          label={PROFILE.intensityLabel}
          description={PROFILE.intensityDesc}
        >
          <div className="row-actions">
            {INTENSITY_OPTIONS.map((opt) => (
              <IntensityOption
                key={opt.value}
                value={opt.value}
                label={opt.label}
                selected={intensity === opt.value}
                onSelect={handleIntensitySelect}
              />
            ))}
          </div>
        </Section.Row>

        <Section.Footer>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? APP.saving : PROFILE.saveButton}
          </button>
        </Section.Footer>
      </Section.Card>
    </Section>
  );
}
