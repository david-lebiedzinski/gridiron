import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useUpdateProfile } from "@/hooks/use-profile";
import { APP, ONBOARDING } from "@/locales/en";

interface StepUsernameProps {
  onComplete: () => void;
}

export default function StepUsername({ onComplete }: StepUsernameProps) {
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(ONBOARDING.usernameErrorEmpty);
      return;
    }

    try {
      await updateProfile.mutateAsync({ name: trimmed });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : APP.genericError);
    }
  }

  let errorEl: React.ReactNode = undefined;
  if (error) {
    errorEl = <div className="step-error">{error}</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="step-field">
        <label className="step-label">{ONBOARDING.usernameLabel}</label>
        <input
          className={`step-input${error ? " error" : ""}`}
          type="text"
          placeholder={ONBOARDING.usernamePlaceholder}
          value={name}
          onChange={handleNameChange}
        />
        {errorEl}
        <div className="step-hint">{ONBOARDING.usernameHint}</div>
      </div>
      <button
        className="step-btn"
        type="submit"
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? APP.saving : APP.continue}
      </button>
    </form>
  );
}
