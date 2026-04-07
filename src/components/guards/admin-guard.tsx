import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";
import { ForbiddenPage } from "@/pages/error";

interface AdminGuardProps {
  children?: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return <ForbiddenPage />;
  }

  return <>{children ?? <Outlet />}</>;
}
