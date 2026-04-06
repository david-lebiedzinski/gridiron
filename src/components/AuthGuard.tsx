import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";

export function AuthRequired() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/picks" replace />;
  }

  return <Outlet />;
}
