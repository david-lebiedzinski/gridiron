import type { ReactNode } from "react";

/* ── Root ── */

interface SectionRootProps {
  children: ReactNode;
}

function SectionRoot({ children }: SectionRootProps) {
  return <div className="section">{children}</div>;
}

/* ── Header ── */

interface SectionHeaderProps {
  icon: string;
  iconColor: string;
  title: string;
  right?: ReactNode;
}

function SectionHeader({ icon, iconColor, title, right }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className={`section-icon ${iconColor}`}>{icon}</div>
      <h2 className="t-display-md">{title}</h2>
      <div className="section-line" />
      {right}
    </div>
  );
}

/* ── Card ── */

interface SectionCardProps {
  children: ReactNode;
  variant?: "default" | "danger";
}

function SectionCard({ children, variant = "default" }: SectionCardProps) {
  const className = variant === "danger" ? "card danger-card" : "card";
  return (
    <div className={className} style={{ padding: 0 }}>
      {children}
    </div>
  );
}

/* ── Group header (e.g. "Scoring", "Playoff Multipliers") ── */

interface SectionGroupProps {
  title: string;
}

function SectionGroup({ title }: SectionGroupProps) {
  return (
    <div className="settings-section-header">
      <span className="t-display-sm">{title}</span>
    </div>
  );
}

/* ── Row ── */

interface SectionRowProps {
  label: string;
  description?: string;
  children?: ReactNode;
}

function SectionRow({ label, description, children }: SectionRowProps) {
  let descEl: ReactNode = undefined;
  if (description) {
    descEl = <div className="setting-desc">{description}</div>;
  }

  return (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">{label}</div>
        {descEl}
      </div>
      {children}
    </div>
  );
}

/* ── Footer actions ── */

interface SectionFooterProps {
  children: ReactNode;
}

function SectionFooter({ children }: SectionFooterProps) {
  return <div className="card-footer-actions">{children}</div>;
}

/* ── Compound export ── */

const Section = Object.assign(SectionRoot, {
  Header: SectionHeader,
  Card: SectionCard,
  Group: SectionGroup,
  Row: SectionRow,
  Footer: SectionFooter,
});

export default Section;
