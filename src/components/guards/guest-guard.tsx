import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";

interface GuestGuardProps {
  children?: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (user) {
    window.location.replace("/admin");
    return null;
  }

  return <>{children ?? <Outlet />}</>;
}
