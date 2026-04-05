import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/context";
import { APP, NAV } from "../strings";
import LeagueSelector from "./LeagueSelector";
import AvatarMenu from "./AvatarMenu";

export default function AppShell() {
  const { activeRole, profile } = useApp();

  let commissionerLink: ReactNode = undefined;
  if (activeRole === "commissioner") {
    commissionerLink = <NavLink to="/commissioner">{NAV.league}</NavLink>;
  }

  let adminLink: ReactNode = undefined;
  if (profile?.is_super_admin) {
    adminLink = <NavLink to="/admin">{NAV.admin}</NavLink>;
  }

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="nav-logo">
          <span className="nav-logo-emoji">🏈</span>
          {APP.name}
        </NavLink>

        <LeagueSelector />

        <div className="nav-links">
          <NavLink to="/picks">{NAV.picks}</NavLink>
          <NavLink to="/leaderboard">{NAV.leaderboard}</NavLink>
          <NavLink to="/analytics">{NAV.analytics}</NavLink>
          <NavLink to="/profile">{NAV.profile}</NavLink>
          {commissionerLink}
          {adminLink}
        </div>

        <AvatarMenu />
      </nav>
      <Outlet />
    </>
  );
}
