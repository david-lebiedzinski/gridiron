import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import Table from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import { useApp } from "../../context/context";
import {
  getLeagueMembers,
  searchProfiles,
  addMemberToLeague,
} from "../../lib/leagues";
import { removeMember } from "../../lib/commissioner";
import { APP, COMMISSIONER_MEMBERS } from "../../locales/en";

type MemberRow = Awaited<ReturnType<typeof getLeagueMembers>>[number];

interface MemberProfile {
  id: string;
  username: string;
  avatar_color: string;
}

interface SearchResult {
  id: string;
  username: string;
  avatar_color: string;
}

// ─── Member Row ──────────────────────────────────────────────

interface MemberItemProps {
  member: MemberRow;
  isSelf: boolean;
  leagueId: string;
  commissionerId: string;
  onRefresh: () => void;
}

function MemberItem({
  member,
  isSelf,
  leagueId,
  commissionerId,
  onRefresh,
}: MemberItemProps) {
  const p = member.profiles as unknown as MemberProfile | null;

  async function handleRemove() {
    if (!p) {
      return;
    }
    await removeMember(leagueId, p.id, commissionerId);
    onRefresh();
  }

  const isCommissioner = member.role === "commissioner";

  let roleBadge: ReactNode = undefined;
  if (isCommissioner) {
    roleBadge = (
      <span className="badge badge-active">
        {COMMISSIONER_MEMBERS.badgeCommissioner}
      </span>
    );
  }

  let actions: ReactNode = undefined;
  if (!isSelf && !isCommissioner) {
    actions = (
      <ConfirmDialog
        trigger={
          <button className="btn btn-danger btn-sm">
            {COMMISSIONER_MEMBERS.remove}
          </button>
        }
        title={APP.confirm}
        description={COMMISSIONER_MEMBERS.confirmRemove(p?.username ?? "")}
        confirmLabel={APP.remove}
        onConfirm={handleRemove}
      />
    );
  }

  const joinedDate = new Date(member.joined_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <tr>
      <Table.UserCell
        name={p?.username ?? "Unknown"}
        avatarColor={p?.avatar_color}
        size="md"
      />
      <Table.Cell>{roleBadge}</Table.Cell>
      <Table.DimCell>{joinedDate}</Table.DimCell>
      <Table.ActionsCell>{actions}</Table.ActionsCell>
    </tr>
  );
}

// ─── Search Result Row ───────────────────────────────────────

interface SearchResultItemProps {
  profile: SearchResult;
  onAdd: (profile: SearchResult) => void;
}

function SearchResultItem({ profile, onAdd }: SearchResultItemProps) {
  function handleAdd() {
    onAdd(profile);
  }

  return (
    <div className="search-result-row">
      <Table.UserCell
        name={profile.username}
        avatarColor={profile.avatar_color}
        size="sm"
      />
      <button className="btn btn-green btn-sm" onClick={handleAdd}>
        {COMMISSIONER_MEMBERS.add}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

const COLUMNS = [
  { label: COMMISSIONER_MEMBERS.colMember },
  { label: COMMISSIONER_MEMBERS.colRole },
  { label: COMMISSIONER_MEMBERS.colJoined },
  { label: "" },
];

export default function MembersCard() {
  const { activeLeague, user } = useApp();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  // Add member dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leagueId = activeLeague?.id ?? "";
  const inviteCode = activeLeague?.invite_code ?? "—";

  const refresh = useCallback(async () => {
    if (!leagueId) {
      return;
    }
    setLoading(true);
    try {
      setMembers(await getLeagueMembers(leagueId));
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  if (!loaded.current && leagueId) {
    loaded.current = true;
    refresh();
  }

  async function handleCopyCode() {
    await navigator.clipboard?.writeText(inviteCode);
  }

  // ─── Search logic ────────────────────────────────────────

  function handleSearchChange(value: string) {
    setSearchQuery(value);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchProfiles(value.trim(), leagueId);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function handleAddMember(profile: SearchResult) {
    await addMemberToLeague(leagueId, profile.id);
    setSearchResults((prev) => prev.filter((p) => p.id !== profile.id));
    refresh();
  }

  function handleAddDialogChange(open: boolean) {
    setAddOpen(open);
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }

  // ─── Search results content ──────────────────────────────

  let searchContent: ReactNode = undefined;
  if (searching) {
    searchContent = <div className="spinner" style={{ margin: "12px auto" }} />;
  } else if (searchQuery.trim().length >= 2 && searchResults.length === 0) {
    searchContent = (
      <p className="t-body-sm t-muted" style={{ padding: "12px 0" }}>
        {COMMISSIONER_MEMBERS.noResults}
      </p>
    );
  } else if (searchResults.length > 0) {
    searchContent = (
      <div className="search-results">
        {searchResults.map((p) => (
          <SearchResultItem key={p.id} profile={p} onAdd={handleAddMember} />
        ))}
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-icon icon-green">{"\uD83D\uDC65"}</div>
        <h2 className="t-display-md">{COMMISSIONER_MEMBERS.sectionTitle}</h2>
        <div className="section-line" />
        <span className="t-mono-sm t-muted">
          {COMMISSIONER_MEMBERS.membersCount(members.length)}
        </span>
      </div>

      {/* Invite code + Add member */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="invite-code-row">
          <span className="t-label">
            {COMMISSIONER_MEMBERS.inviteCodeLabel}
          </span>
          <span
            className="code-pill"
            style={{ fontSize: 16, letterSpacing: "0.15em" }}
          >
            {inviteCode}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleCopyCode}>
            {COMMISSIONER_MEMBERS.copy}
          </button>
          <FormDialog
            open={addOpen}
            onOpenChange={handleAddDialogChange}
            trigger={
              <button className="btn btn-green btn-sm">
                {COMMISSIONER_MEMBERS.addMember}
              </button>
            }
            title={COMMISSIONER_MEMBERS.addMemberTitle}
            description={COMMISSIONER_MEMBERS.addMemberDesc}
            submitLabel={APP.cancel}
            onSubmit={() => setAddOpen(false)}
          >
            <div className="form-group">
              <input
                className="input"
                type="text"
                placeholder={COMMISSIONER_MEMBERS.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
              />
            </div>
            {searchContent}
          </FormDialog>
        </div>
      </div>

      {/* Member list */}
      <Table
        columns={COLUMNS}
        data={members}
        loading={loading}
        emptyIcon={"\uD83D\uDC65"}
        emptyMessage="No members yet."
        rowKey={(m) => {
          const p = m.profiles as unknown as MemberProfile | null;
          return p?.id ?? m.joined_at;
        }}
        renderRow={(m) => {
          const p = m.profiles as unknown as MemberProfile | null;
          return (
            <MemberItem
              key={p?.id ?? m.joined_at}
              member={m}
              isSelf={p?.id === user?.id}
              leagueId={leagueId}
              commissionerId={user?.id ?? ""}
              onRefresh={refresh}
            />
          );
        }}
      />
    </div>
  );
}
