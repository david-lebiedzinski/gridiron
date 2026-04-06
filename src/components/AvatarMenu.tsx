import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useApp } from "../context/context";
import { signOut } from "../lib/auth";
import { APP } from "../locales/en";

export default function AvatarMenu() {
  const { user, profile } = useApp();
  const { avatar_url, avatar_color, username } = profile ?? {};

  function handleSignOut() {
    signOut();
  }

  let avatarContent: ReactNode = username?.slice(0, 2).toUpperCase() ?? "?";
  if (avatar_url) {
    avatarContent = <img src={avatar_url} alt="Avatar" />;
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div
          className="nav-avatar"
          style={{ borderColor: avatar_color || "var(--accent)" }}
        >
          {avatarContent}
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover-content" sideOffset={8} align="end">
          <div className="popover-header">
            <div className="popover-name">{username}</div>
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
