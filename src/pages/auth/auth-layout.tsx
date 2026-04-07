import type { ReactNode } from "react";
import { APP } from "@/locales/en";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-screen">
      <div className="auth-bg" />

      <div className="auth-logo">
        <span className="auth-logo-icon">{"\uD83C\uDFC8"}</span>
        <span className="auth-logo-mark">{APP.name}</span>
        <div className="auth-logo-sub">{APP.tagline}</div>
      </div>

      <div className="auth-card-wrap">
        {children}
        <div className="auth-tagline">{APP.motto}</div>
      </div>
    </div>
  );
}
