import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import Page from "@/components/Page";
import Section from "@/components/Section";
import Table from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useLeague,
  useLeagueMembers,
  useUpdateLeague,
  useDeleteLeague,
} from "@/hooks/use-league";
import { useProfiles } from "@/hooks/use-profile";
import type { League, LeagueMember, Profile } from "@/lib/types";
import { ADMIN_LEAGUES } from "@/locales/en";

// ─── Form values ────────────────────────────────────────────

interface LeagueFormValues {
  name: string;
  base_correct_pts: number;
  upset_multiplier: number;
  sole_correct_bonus: number;
  wildcard_multiplier: number;
  divisional_multiplier: number;
  championship_multiplier: number;
  superbowl_multiplier: number;
  weekly_bonus_regular: number;
  weekly_bonus_scales: boolean;
  picks_visible_before_kickoff: boolean;
  stats_public_default: boolean;
}

function buildDefaults(league: League): LeagueFormValues {
  return {
    name: league.name,
    base_correct_pts: league.base_correct_pts,
    upset_multiplier: league.upset_multiplier,
    sole_correct_bonus: league.sole_correct_bonus,
    wildcard_multiplier: league.wildcard_multiplier,
    divisional_multiplier: league.divisional_multiplier,
    championship_multiplier: league.championship_multiplier,
    superbowl_multiplier: league.superbowl_multiplier,
    weekly_bonus_regular: league.weekly_bonus_regular,
    weekly_bonus_scales: league.weekly_bonus_scales,
    picks_visible_before_kickoff: league.picks_visible_before_kickoff,
    stats_public_default: league.stats_public_default,
  };
}

// ─── Field config ──────────────────────────────────────────

interface NumberField {
  key: keyof LeagueFormValues;
  label: string;
}

const SCORING_FIELDS: NumberField[] = [
  { key: "base_correct_pts", label: ADMIN_LEAGUES.baseCorrectPts },
  { key: "upset_multiplier", label: ADMIN_LEAGUES.upsetMultiplier },
  { key: "sole_correct_bonus", label: ADMIN_LEAGUES.soleCorrectBonus },
];

const PLAYOFF_FIELDS: NumberField[] = [
  { key: "wildcard_multiplier", label: ADMIN_LEAGUES.wildcardMultiplier },
  { key: "divisional_multiplier", label: ADMIN_LEAGUES.divisionalMultiplier },
  {
    key: "championship_multiplier",
    label: ADMIN_LEAGUES.championshipMultiplier,
  },
  { key: "superbowl_multiplier", label: ADMIN_LEAGUES.superbowlMultiplier },
];

const BONUS_NUMBER_FIELDS: NumberField[] = [
  { key: "weekly_bonus_regular", label: ADMIN_LEAGUES.weeklyBonusRegular },
];

interface BoolField {
  key: keyof LeagueFormValues;
  label: string;
}

const BONUS_BOOL_FIELDS: BoolField[] = [
  { key: "weekly_bonus_scales", label: ADMIN_LEAGUES.weeklyBonusScales },
];

const VISIBILITY_FIELDS: BoolField[] = [
  {
    key: "picks_visible_before_kickoff",
    label: ADMIN_LEAGUES.picksVisibleBeforeKickoff,
  },
  { key: "stats_public_default", label: ADMIN_LEAGUES.statsPublicDefault },
];

// ─── Number row ────────────────────────────────────────────

interface NumberRowProps {
  field: NumberField;
  register: UseFormRegister<LeagueFormValues>;
}

function NumberRow({ field, register }: NumberRowProps) {
  return (
    <Section.Row label={field.label}>
      <input
        type="number"
        className="input setting-input"
        {...register(field.key, { valueAsNumber: true })}
      />
    </Section.Row>
  );
}

// ─── Boolean row ───────────────────────────────────────────

interface BoolRowProps {
  field: BoolField;
  register: UseFormRegister<LeagueFormValues>;
}

function BoolRow({ field, register }: BoolRowProps) {
  return (
    <Section.Row label={field.label}>
      <input type="checkbox" className="toggle" {...register(field.key)} />
    </Section.Row>
  );
}

// ─── Member row ────────────────────────────────────────────

interface MemberRowProps {
  member: LeagueMember;
  profile: Profile | undefined;
}

function MemberRow({ member, profile }: MemberRowProps) {
  const displayName = profile?.name ?? member.user_id;
  const avatar = profile?.avatar ?? null;

  return (
    <tr>
      <Table.UserCell name={displayName} avatarUrl={avatar} />
      <Table.DimCell>{member.user_id}</Table.DimCell>
    </tr>
  );
}

const MEMBER_COLUMNS = [
  { label: ADMIN_LEAGUES.colMember },
  { label: ADMIN_LEAGUES.colUserId },
];

// ─── LeagueDetailForm ──────────────────────────────────────

interface LeagueDetailFormProps {
  league: League;
  members: LeagueMember[];
  profiles: Profile[];
}

function LeagueDetailForm({
  league,
  members,
  profiles,
}: LeagueDetailFormProps) {
  const navigate = useNavigate();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();

  const { register, handleSubmit, formState } = useForm<LeagueFormValues>({
    defaultValues: buildDefaults(league),
  });

  const [copied, setCopied] = useState(false);

  async function onSubmit(values: LeagueFormValues) {
    await updateLeague.mutateAsync({
      id: league.id,
      updates: { ...values, name: values.name.trim() },
    });
  }

  async function handleDelete() {
    await deleteLeague.mutateAsync(league.id);
    navigate("/admin");
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getProfileForUser(userId: string): Profile | undefined {
    return profiles.find((p) => p.id === userId);
  }

  function getMemberKey(member: LeagueMember) {
    return member.user_id;
  }

  function renderMemberRow(member: LeagueMember) {
    return (
      <MemberRow member={member} profile={getProfileForUser(member.user_id)} />
    );
  }

  function renderNumberFields(fields: NumberField[]) {
    return fields.map((field) => (
      <NumberRow key={field.key} field={field} register={register} />
    ));
  }

  function renderBoolFields(fields: BoolField[]) {
    return fields.map((field) => (
      <BoolRow key={field.key} field={field} register={register} />
    ));
  }

  let copyLabel: ReactNode = ADMIN_LEAGUES.copyCode;
  if (copied) {
    copyLabel = ADMIN_LEAGUES.copied;
  }

  return (
    <Page>
      <Page.Header
        eyebrow={ADMIN_LEAGUES.sectionTitle}
        title={league.name}
        subtitle={ADMIN_LEAGUES.dialogDesc}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Settings ── */}
        <Section>
          <Section.Header
            icon="&#9881;"
            iconColor="accent"
            title={ADMIN_LEAGUES.settingsTitle}
          />
          <Section.Card>
            <Section.Row label={ADMIN_LEAGUES.leagueNameLabel}>
              <input
                type="text"
                className="input setting-input-wide"
                {...register("name")}
              />
            </Section.Row>

            <Section.Row label={ADMIN_LEAGUES.inviteCodeLabel}>
              <div className="row-actions">
                <span className="code-pill">{league.invite_code}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopyCode}
                >
                  {copyLabel}
                </button>
              </div>
            </Section.Row>

            <Section.Group title={ADMIN_LEAGUES.scoringTitle} />
            {renderNumberFields(SCORING_FIELDS)}

            <Section.Group title={ADMIN_LEAGUES.playoffTitle} />
            {renderNumberFields(PLAYOFF_FIELDS)}

            <Section.Group title={ADMIN_LEAGUES.bonusTitle} />
            {renderNumberFields(BONUS_NUMBER_FIELDS)}
            {renderBoolFields(BONUS_BOOL_FIELDS)}

            <Section.Group title={ADMIN_LEAGUES.visibilityTitle} />
            {renderBoolFields(VISIBILITY_FIELDS)}

            <Section.Footer>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting
                  ? ADMIN_LEAGUES.savingSettings
                  : ADMIN_LEAGUES.saveSettings}
              </button>
            </Section.Footer>
          </Section.Card>
        </Section>
      </form>

      {/* ── Members ── */}
      <Section>
        <Section.Header
          icon="&#128101;"
          iconColor="accent"
          title={ADMIN_LEAGUES.membersTitle}
        />
        <Table
          columns={MEMBER_COLUMNS}
          data={members}
          loading={false}
          emptyIcon="&#128100;"
          emptyMessage={ADMIN_LEAGUES.emptyMembers}
          rowKey={getMemberKey}
          renderRow={renderMemberRow}
        />
      </Section>

      {/* ── Danger Zone ── */}
      <Section>
        <Section.Header
          icon="&#9888;"
          iconColor="danger"
          title={ADMIN_LEAGUES.dangerTitle}
        />
        <Section.Card variant="danger">
          <Section.Row
            label={ADMIN_LEAGUES.deleteLeague}
            description={ADMIN_LEAGUES.deleteLeagueDesc}
          >
            <ConfirmDialog
              trigger={
                <button className="btn btn-danger">
                  {ADMIN_LEAGUES.deleteLeague}
                </button>
              }
              title={ADMIN_LEAGUES.confirmDeleteTitle}
              description={ADMIN_LEAGUES.confirmDelete}
              onConfirm={handleDelete}
            />
          </Section.Row>
        </Section.Card>
      </Section>
    </Page>
  );
}

// ─── LeagueDetail (outer) ──────────────────────────────────

export default function LeagueDetail() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { data: league } = useLeague(leagueId ?? "");
  const { data: members = [] } = useLeagueMembers(leagueId ?? "");
  const { data: profiles = [] } = useProfiles();

  if (!league) {
    return (
      <Page>
        <div className="empty-state">
          <span className="spinner spinner-lg" />
        </div>
      </Page>
    );
  }

  return (
    <LeagueDetailForm
      key={league.id}
      league={league}
      members={members}
      profiles={profiles}
    />
  );
}
