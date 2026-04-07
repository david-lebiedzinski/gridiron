import { Navigate, useRoutes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { AdminGuard, AuthGuard, GuestGuard } from "@/components/guards";
import AppShell from "@/components/AppShell";
import {
  LoginPage,
  SignupPage,
  OnboardingPage,
  WaitingPage,
} from "@/pages/auth";
import {
  AdminPage,
  SeasonDetail,
  LeagueDetail,
  GameDetail,
} from "@/pages/admin";
import { NotFoundPage } from "@/pages/error";
import GridPage from "@/pages/grid/grid-page";

const routes: RouteObject[] = [
  // ── Guest only ──
  {
    path: "/login",
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: "/signup",
    element: (
      <GuestGuard>
        <SignupPage />
      </GuestGuard>
    ),
  },

  // ── Auth required — no shell ──
  {
    path: "/onboarding",
    element: (
      <AuthGuard>
        <OnboardingPage />
      </AuthGuard>
    ),
  },
  {
    path: "/waiting",
    element: (
      <AuthGuard>
        <WaitingPage />
      </AuthGuard>
    ),
  },

  // ── Auth required — with shell ──
  {
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { path: "/leaderboard", element: <div>Leaderboard Page</div> },
      { index: true, element: <Navigate to="/picks" replace /> },
      { path: "/picks", element: <GridPage /> },
      { path: "/grid", element: <GridPage /> },
      {
        element: <AdminGuard />,
        children: [
          { path: "/admin/seasons/:seasonId", element: <SeasonDetail /> },
          { path: "/admin/leagues/:leagueId", element: <LeagueDetail /> },
          { path: "/admin/games/:gameId", element: <GameDetail /> },
          { path: "/admin", element: <AdminPage /> },
        ],
      },
    ],
  },

  // ── Catch-all ──
  { path: "*", element: <NotFoundPage /> },
];

export function Router() {
  return useRoutes(routes);
}
