import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";
import { APP, NAV } from "@/locales/en";
import LeagueSelector from "./LeagueSelector";
import AvatarMenu from "./AvatarMenu";

export default function AppShell() {
  const { data: profile } = useProfile();

  let adminLink: ReactNode = undefined;
  if (profile?.is_admin) {
    adminLink = <NavLink to="/admin">{NAV.admin}</NavLink>;
  }

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="nav-logo">
          <span className="nav-logo-emoji">{"\uD83C\uDFC8"}</span>
          {APP.name}
        </NavLink>

        <LeagueSelector />

        <div className="nav-links">
          <NavLink to="/grid">{NAV.grid}</NavLink>
          <NavLink to="/picks">{NAV.picks}</NavLink>
          <NavLink to="/leaderboard">{NAV.leaderboard}</NavLink>

          {adminLink}
        </div>

        <AvatarMenu />
      </nav>
      <Outlet />
    </>
  );
}
