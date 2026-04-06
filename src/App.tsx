import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth";
import { LeagueProvider } from "@/context/league";
import AppShell from "@/components/AppShell";
import { AuthRequired, GuestOnly } from "@/components/AuthGuard";
import { AdminGuard } from "@/components/AdminGuard";
import AdminPage from "@/pages/admin/AdminPage";
import SeasonDetailPage from "@/pages/admin/SeasonDetail";
import {
  LoginPage,
  SignupPage,
  OnboardingPage,
  WaitingPage,
} from "@/pages/auth";
import GridPage from "@/pages/grid/GridPage";
import CommissionerPage from "@/pages/league/CommissionerPage";
import ProfilePage from "@/pages/profile/ProfilePage";

import "@/styles/theme.css";
import "@/styles/components.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Render the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LeagueProvider>
          <BrowserRouter>
            <Routes>
              {/* Guest only */}
              <Route element={<GuestOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              {/* Auth required */}
              <Route element={<AuthRequired />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/waiting" element={<WaitingPage />} />

                <Route element={<AppShell />}>
                  <Route path="/picks" element={<GridPage />} />
                  <Route path="/league" element={<CommissionerPage />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Admin */}
                  <Route element={<AdminGuard />}>
                    <Route path="/admin" element={<AdminPage />} />
                    <Route
                      path="/admin/seasons/:seasonId"
                      element={<SeasonDetailPage />}
                    />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </LeagueProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
