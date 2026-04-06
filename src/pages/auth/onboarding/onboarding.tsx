import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP, ONBOARDING } from "@/locales/en";
import StepCard from "./step-card";
import StepUsername from "./step-username";
import StepPhoto from "./step-photo";
import StepTeam from "./step-team";
import StepInvite from "./step-invite";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  function markDone(n: number) {
    setCompleted((prev) => new Set(prev).add(n));
    setStep(n + 1);
  }

  function stepState(n: number): "active" | "done" | "pending" {
    if (completed.has(n)) {
      return "done";
    }
    if (step === n) {
      return "active";
    }
    return "pending";
  }

  function handleStep1Done() {
    markDone(1);
  }

  function handleStep2Done() {
    markDone(2);
  }

  function handleStep3Done() {
    markDone(3);
  }

  function handleSkipInvite() {
    navigate("/waiting");
  }

  return (
    <div className="onboard-screen">
      <div className="auth-bg" />

      <div className="onboard-logo">
        <span className="onboard-logo-icon">{"\uD83C\uDFC8"}</span>
        <span className="onboard-logo-mark">{APP.name}</span>
        <div className="onboard-logo-sub">{ONBOARDING.subtitle}</div>
      </div>

      <div className="onboard-wrap">
        <StepCard num={1} title={ONBOARDING.step1Title} state={stepState(1)}>
          <StepUsername onComplete={handleStep1Done} />
        </StepCard>

        <StepCard num={2} title={ONBOARDING.step2Title} state={stepState(2)}>
          <StepPhoto onComplete={handleStep2Done} />
        </StepCard>

        <StepCard num={3} title={ONBOARDING.step3Title} state={stepState(3)}>
          <StepTeam onComplete={handleStep3Done} />
        </StepCard>

        <StepCard num={4} title={ONBOARDING.step4Title} state={stepState(4)}>
          <StepInvite onSkip={handleSkipInvite} />
        </StepCard>
      </div>
    </div>
  );
}
