import type { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
}

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
}

function PageRoot({ children }: PageProps) {
  return <div className="page">{children}</div>;
}

function PageHeader({ title, eyebrow, subtitle }: PageHeaderProps) {
  let eyebrowEl: ReactNode = undefined;
  if (eyebrow) {
    eyebrowEl = (
      <p className="t-eyebrow">
        <span className="t-eyebrow-dot" />
        {eyebrow}
      </p>
    );
  }

  let subtitleEl: ReactNode = undefined;
  if (subtitle) {
    subtitleEl = <p className="t-body-sm t-muted">{subtitle}</p>;
  }

  return (
    <div className="page-header">
      <div>
        {eyebrowEl}
        <h1 className="t-display-xl">{title}</h1>
        {subtitleEl}
      </div>
    </div>
  );
}

const Page = Object.assign(PageRoot, { Header: PageHeader });
export default Page;
