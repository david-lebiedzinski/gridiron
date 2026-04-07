import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";

interface AuthGuardProps {
  children?: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) {
    window.location.replace("/login");
    return null;
  }

  return <>{children ?? <Outlet />}</>;
}
