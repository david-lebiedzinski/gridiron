import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useProfile } from "@/hooks/use-profile";
import { APP } from "@/locales/en";

export default function AvatarMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  const displayName = profile?.name ?? APP.fallbackUsername;
  const initials = displayName.slice(0, 2).toUpperCase();

  let avatarContent: ReactNode = initials;
  if (profile?.avatar) {
    avatarContent = <img src={profile.avatar} alt="Avatar" />;
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div className="nav-avatar">
          {avatarContent}
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover-content" sideOffset={8} align="end">
          <div className="popover-header">
            <div className="popover-name">{displayName}</div>
            <div className="popover-email">{user?.email}</div>
          </div>
          <Popover.Close asChild>
            <button className="popover-item danger" onClick={handleSignOut}>
              {APP.signOut}
            </button>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
