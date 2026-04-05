import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useApp } from "../../context/context";
import {
  getSeasonSettings,
  updateSeasonSettings,
} from "../../lib/commissioner";
import Section from "../../components/Section";
import type { SeasonSettings } from "../../types";
import { SETTINGS, APP } from "../../strings";

interface NumberSettingProps {
  label: string;
  description: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

function NumberSetting({
  label,
  description,
  value,
  disabled,
  onChange,
}: NumberSettingProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(parseFloat(e.target.value) || 0);
  }

  return (
    <Section.Row label={label} description={description}>
      <input
        type="number"
        className="input setting-input"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
    </Section.Row>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSetting({
  label,
  description,
  value,
  disabled,
  onChange,
}: ToggleSettingProps) {
  function handleClick() {
    if (!disabled) {
      onChange(!value);
    }
  }

  return (
    <Section.Row label={label} description={description}>
      <button
        className={`toggle ${value ? "on" : ""}`}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="toggle-knob" />
      </button>
    </Section.Row>
  );
}

export default function SettingsCard() {
  const { activeSeason } = useApp();
  const [settings, setSettings] = useState<SeasonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);
  const savedSettings = useRef<SeasonSettings | null>(null);

  const leagueSeasonId = activeSeason?.id ?? "";
  const locked = activeSeason?.locked ?? true;

  const refresh = useCallback(async () => {
    if (!leagueSeasonId) {
      return;
    }
    setLoading(true);
    try {
      const data = (await getSeasonSettings(leagueSeasonId)) as SeasonSettings;
      setSettings(data);
      savedSettings.current = data;
    } finally {
      setLoading(false);
    }
  }, [leagueSeasonId]);

  if (!loaded.current && leagueSeasonId) {
    loaded.current = true;
    refresh();
  }

  function updateField<K extends keyof SeasonSettings>(
    key: K,
    value: SeasonSettings[K],
  ) {
    if (!settings) {
      return;
    }
    setSettings({ ...settings, [key]: value });
  }

  async function handleSave() {
    if (!settings || !leagueSeasonId) {
      return;
    }
    setSaving(true);
    try {
      await updateSeasonSettings(leagueSeasonId, settings);
      savedSettings.current = { ...settings };
    } finally {
      setSaving(false);
    }
  }

  let lockedBanner: ReactNode = undefined;
  if (locked) {
    lockedBanner = (
      <div className="settings-locked-banner">
        <span className="t-mono-sm" style={{ color: "var(--accent)" }}>
          {SETTINGS.lockedBanner}
        </span>
      </div>
    );
  }

  const dirty =
    settings !== null &&
    savedSettings.current !== null &&
    JSON.stringify(settings) !== JSON.stringify(savedSettings.current);

  let saveButton: ReactNode = undefined;
  if (!locked && settings) {
    saveButton = (
      <Section.Footer>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? APP.saving : SETTINGS.saveButton}
        </button>
      </Section.Footer>
    );
  }

  if (!activeSeason) {
    return (
      <Section>
        <Section.Header
          icon="⚙️"
          iconColor="icon-amber"
          title={SETTINGS.sectionTitle}
        />
        <div className="empty-state">
          <div className="empty-state-icon">⚙️</div>
          <p>{SETTINGS.emptyNoSeason}</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <Section.Header
        icon="⚙️"
        iconColor="icon-amber"
        title={SETTINGS.sectionTitle}
        right={<span className="t-mono-sm t-muted">{activeSeason.name}</span>}
      />

      {loading ? (
        <div className="empty-state">
          <span className="spinner spinner-lg" />
        </div>
      ) : !settings ? (
        <div className="empty-state">
          <p>{SETTINGS.emptyNoSettings}</p>
        </div>
      ) : (
        <Section.Card>
          {lockedBanner}

          <Section.Group title={SETTINGS.groupScoring} />
          <NumberSetting
            label={SETTINGS.baseCorrectPickLabel}
            description={SETTINGS.baseCorrectPickDesc}
            value={settings.base_correct_pts}
            disabled={locked}
            onChange={(v) => updateField("base_correct_pts", v)}
          />
          <NumberSetting
            label={SETTINGS.upsetMultiplierLabel}
            description={SETTINGS.upsetMultiplierDesc}
            value={settings.upset_multiplier}
            disabled={locked}
            onChange={(v) => updateField("upset_multiplier", v)}
          />
          <NumberSetting
            label={SETTINGS.soleCorrectBonusLabel}
            description={SETTINGS.soleCorrectBonusDesc}
            value={settings.sole_correct_bonus}
            disabled={locked}
            onChange={(v) => updateField("sole_correct_bonus", v)}
          />
          <NumberSetting
            label={SETTINGS.weeklyBonusLabel}
            description={SETTINGS.weeklyBonusDesc}
            value={settings.weekly_bonus_regular}
            disabled={locked}
            onChange={(v) => updateField("weekly_bonus_regular", v)}
          />
          <ToggleSetting
            label={SETTINGS.weeklyBonusScalesLabel}
            description={SETTINGS.weeklyBonusScalesDesc}
            value={settings.weekly_bonus_scales}
            disabled={locked}
            onChange={(v) => updateField("weekly_bonus_scales", v)}
          />

          <Section.Group title={SETTINGS.groupPlayoff} />
          <NumberSetting
            label={SETTINGS.wildCardLabel}
            description={SETTINGS.wildCardDesc}
            value={settings.wildcard_multiplier}
            disabled={locked}
            onChange={(v) => updateField("wildcard_multiplier", v)}
          />
          <NumberSetting
            label={SETTINGS.divisionalLabel}
            description={SETTINGS.divisionalDesc}
            value={settings.divisional_multiplier}
            disabled={locked}
            onChange={(v) => updateField("divisional_multiplier", v)}
          />
          <NumberSetting
            label={SETTINGS.championshipLabel}
            description={SETTINGS.championshipDesc}
            value={settings.championship_multiplier}
            disabled={locked}
            onChange={(v) => updateField("championship_multiplier", v)}
          />
          <NumberSetting
            label={SETTINGS.superBowlLabel}
            description={SETTINGS.superBowlDesc}
            value={settings.superbowl_multiplier}
            disabled={locked}
            onChange={(v) => updateField("superbowl_multiplier", v)}
          />

          <Section.Group title={SETTINGS.groupVisibility} />
          <ToggleSetting
            label={SETTINGS.picksVisibleLabel}
            description={SETTINGS.picksVisibleDesc}
            value={false}
            disabled={locked}
            onChange={() => {}}
          />
          <ToggleSetting
            label={SETTINGS.analyticsPublicLabel}
            description={SETTINGS.analyticsPublicDesc}
            value={settings.stats_public_default ?? true}
            disabled={locked}
            onChange={(v) => updateField("stats_public_default", v)}
          />

          <Section.Group title={SETTINGS.groupTiebreakers} />
          <ToggleSetting
            label={SETTINGS.sbPredictionLabel}
            description={SETTINGS.sbPredictionDesc}
            value={settings.tiebreaker_superbowl_pred}
            disabled={locked}
            onChange={(v) => updateField("tiebreaker_superbowl_pred", v)}
          />
          <ToggleSetting
            label={SETTINGS.playoffPointsLabel}
            description={SETTINGS.playoffPointsDesc}
            value={settings.tiebreaker_playoff_pts}
            disabled={locked}
            onChange={(v) => updateField("tiebreaker_playoff_pts", v)}
          />

          {saveButton}
        </Section.Card>
      )}
    </Section>
  );
}
