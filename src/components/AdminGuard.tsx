import { Navigate, Outlet } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";

export function AdminGuard() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return <Navigate to="/picks" replace />;
  }

  return <Outlet />;
}
