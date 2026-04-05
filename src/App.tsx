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
import AdminPage from "./screens/Admin";
import SeasonDetailPage from "./screens/admin/SeasonDetail";
import CommissionerPage from "./screens/Commissioner";
import ProfilePage from "./screens/Profile";
import GridScreen from "./screens/Grid";

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


// ─── Route guards ────────────────────────────────────────────

function AuthRequired() {
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

function GuestOnly() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/picks" replace />;
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

// ─── App ─────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest only — redirect to /picks if already logged in */}
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<AuthScreen />} />
          <Route path="/signup" element={<AuthScreen />} />
        </Route>

        {/* Auth required — no other checks */}
        <Route element={<AuthRequired />}>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/waiting" element={<WaitingScreen />} />

          <Route element={<AppShell />}>
            <Route path="/picks" element={<PicksScreen />} />
            <Route path="/grid" element={<GridScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            <Route path="/analytics" element={<AnalyticsScreen />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Commissioner */}
            <Route element={<CommissionerRoute />}>
              <Route path="/commissioner" element={<CommissionerPage />} />
              <Route path="/commissioner/*" element={<CommissionerPage />} />
            </Route>

            {/* Super admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/seasons/:seasonId" element={<SeasonDetailPage />} />
              <Route path="/admin/*" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
