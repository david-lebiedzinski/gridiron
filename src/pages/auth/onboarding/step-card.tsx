import type { ReactNode } from "react";

interface StepCardProps {
  num: number;
  title: string;
  state: "active" | "done" | "pending";
  children: ReactNode;
}

export default function StepCard({
  num,
  title,
  state,
  children,
}: StepCardProps) {
  return (
    <div className={`step-card${state !== "pending" ? ` ${state}` : ""}`}>
      <div className="step-header">
        <div className="step-num">{num}</div>
        <div className="step-title">{title}</div>
        <div className="step-check">{"\u2713"}</div>
      </div>
      <div className="step-body">{children}</div>
    </div>
  );
}
