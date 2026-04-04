import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useApp } from "./context/context";
import AuthScreen from "./screens/Auth";
import OnboardingScreen from "./screens/Onboarding";
import WaitingScreen from "./screens/Waiting";
import AppShell from "./components/AppShell";

// ─── Placeholder screens (replace as you build each one) ─────

function PicksScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--muted)] font-[Oswald] text-lg">
        Picks — coming soon
      </p>
    </div>
  );
}

function GridScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--muted)] font-[Oswald] text-lg">
        Grid — coming soon
      </p>
    </div>
  );
}

function LeaderboardScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--muted)] font-[Oswald] text-lg">
        Leaderboard — coming soon
      </p>
    </div>
  );
}

function AnalyticsScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--muted)] font-[Oswald] text-lg">
        Analytics — coming soon
      </p>
    </div>
  );
}

function CommissionerScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--muted)] font-[Oswald] text-lg">
        Commissioner — coming soon
      </p>
    </div>
  );
}

function AdminScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--muted)] font-[Oswald] text-lg">
        Admin — coming soon
      </p>
    </div>
  );
}

// ─── Route guards ────────────────────────────────────────────

function ProtectedRoute() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function CommissionerRoute() {
  const { activeRole } = useApp();
  if (activeRole !== "commissioner") return <Navigate to="/picks" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { profile } = useApp();
  if (!profile?.is_super_admin) return <Navigate to="/picks" replace />;
  return <Outlet />;
}

function PublicRoute() {
  const { user, memberships, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (memberships.length === 0) return <Navigate to="/waiting" replace />;
    return <Navigate to={defaultRoute()} replace />;
  }
  return <Outlet />;
}

// ─── Helpers ─────────────────────────────────────────────────

function defaultRoute() {
  return window.innerWidth < 768 ? "/picks" : "/grid";
}

// ─── App ─────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — redirect to app if logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthScreen />} />
          <Route path="/signup" element={<AuthScreen />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/picks" element={<PicksScreen />} />
            <Route path="/grid" element={<GridScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            <Route path="/analytics/:userId" element={<AnalyticsScreen />} />

            {/* Commissioner */}
            <Route element={<CommissionerRoute />}>
              <Route path="/commissioner" element={<CommissionerScreen />} />
              <Route path="/commissioner/*" element={<CommissionerScreen />} />
            </Route>

            {/* Super admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminScreen />} />
              <Route path="/admin/*" element={<AdminScreen />} />
            </Route>
          </Route>

          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/waiting" element={<WaitingScreen />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
