import { useState, useEffect } from "react";
import Section from "../../components/Section";
import { useApp } from "../../context/context";
import { renameLeague } from "../../lib/commissioner";
import { COMMISSIONER_LEAGUE } from "../../locales/en";

export default function LeagueSettingsCard() {
  const { activeLeague, refreshLeagues } = useApp();
  const [name, setName] = useState(activeLeague?.name ?? "");
  const [saving, setSaving] = useState(false);

  const original = activeLeague?.name ?? "";
  const dirty = name.trim() !== original;

  useEffect(() => {
    setName(activeLeague?.name ?? "");
  }, [activeLeague?.name]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }

  async function handleSave() {
    if (!activeLeague || !dirty) {
      return;
    }
    setSaving(true);
    try {
      await renameLeague(activeLeague.id, name);
      await refreshLeagues();
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
      <Section.Header
        icon="🏷️"
        iconColor="icon-blue"
        title={COMMISSIONER_LEAGUE.sectionTitle}
      />
      <Section.Card>
        <Section.Row
          label={COMMISSIONER_LEAGUE.nameLabel}
          description={COMMISSIONER_LEAGUE.nameDesc}
        >
          <input
            type="text"
            className="input setting-input-wide"
            value={name}
            placeholder={COMMISSIONER_LEAGUE.namePlaceholder}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </Section.Row>
        <Section.Footer>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving
              ? COMMISSIONER_LEAGUE.saving
              : COMMISSIONER_LEAGUE.saveButton}
          </button>
        </Section.Footer>
      </Section.Card>
    </Section>
  );
}
