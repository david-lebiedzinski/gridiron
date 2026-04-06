/**
 * Centralized UI strings.
 *
 * Every user-facing string should live here so copy is easy to find,
 * update, and (eventually) translate. Import the section you need:
 *
 *   import { AUTH } from "../strings";
 *
 * For strings with dynamic values, use functions:
 *
 *   COMMISSIONER.confirmRemoveMember("Jordan")
 */

/* ── Global / shared ─────────────────────────────────────── */

export const APP = {
  name: "GRIDIRON",
  tagline: "NFL Pick'em League",
  motto: "Pick. Predict. Dominate.",
  fallbackUsername: "User",
  fallbackInitial: "?",
  genericError: "Something went wrong.",
  saving: "Saving...",
  continue: "Continue →",
  cancel: "Cancel",
  delete: "Delete",
  signOut: "↩ Sign out",
  selectLeague: "Select League",
  joinLeague: "+ Join a league",
  codePlaceholder: "XXXX-XXXX",
  none: "None",
  confirm: "Are you sure?",
  confirmDelete: "Confirm delete",
  remove: "Remove",
} as const;

/* ── Auth ─────────────────────────────────────────────────── */

export const AUTH = {
  createAccount: "Create account",
  welcomeBack: "Welcome back",
  signupSubtitle: "Join the league. Start picking.",
  signinSubtitle: "Sign in to your account",
  emailLabel: "Email",
  passwordLabel: "Password",
  confirmPasswordLabel: "Confirm Password",
  passwordPlaceholder: "At least 8 characters",
  passwordMask: "••••••••",
  passwordHint: "Min 8 characters",
  submitSignup: "CREATE ACCOUNT",
  submitSignin: "SIGN IN",
  divider: "or",
  hasAccount: "Already have an account? ",
  noAccount: "Don't have an account? ",
  signIn: "Sign in",
  signUp: "Sign up",
  errorPasswordLength: "Password must be at least 8 characters.",
  errorPasswordMismatch: "Passwords do not match.",
} as const;

/* ── Onboarding ───────────────────────────────────────────── */

export const ONBOARDING = {
  subtitle: "Let's get you set up",
  step1Title: "Choose your name",
  step2Title: "Add a photo",
  step3Title: "Pick your team",
  step4Title: "Enter your invite code",
  usernameLabel: "Username",
  usernamePlaceholder: "e.g. jordan_picks",
  usernameHint: "Shown to everyone in your league. No spaces.",
  usernameErrorEmpty: "Username cannot be empty or contain spaces.",
  usernameErrorTaken: "Username already taken. Try another.",
  uploadPhoto: "Upload photo",
  skipForNow: "Skip for now →",
  photoHint: "JPG or PNG · Max 5MB · Shows in pick bar + leaderboard",
  uploading: "Uploading...",
  teamDesc: "Your team's colors ring your avatar across the app.",
  selectedPrefix: "Selected: ",
  inviteDesc: "Your commissioner will share a code to join their league.",
  joinSuccess: (leagueName: string) => `✓ ${leagueName} · Welcome!`,
  joinError: "✗ Invalid code. Check with your commissioner.",
  noCode: "Don't have a code? ",
  joining: "Joining...",
  joinLeague: "JOIN LEAGUE →",
} as const;

/* ── Waiting ──────────────────────────────────────────────── */

export const WAITING = {
  signOut: "Sign out",
  icon: "\u23F3",
  title: "You're in the system",
  body: "Your account is all set. Now you just need an invite code from your league commissioner to start picking.",
  codeLabel: "Got a code? Enter it now",
  joinButton: "JOIN LEAGUE",
  joinSuccess: (name: string) => `Joined ${name}!`,
  joinError: "Invalid invite code. Please try again.",
} as const;

/* ── Nav / AppShell ───────────────────────────────────────── */

export const NAV = {
  picks: "Picks",
  leaderboard: "Leaderboard",
  analytics: "Analytics",
  profile: "Profile",
  commissioner: "Commissioner",
  league: "League",
  admin: "Admin",
} as const;

/* ── League selector ──────────────────────────────────────── */

export const LEAGUE_SELECTOR = {
  joinTitle: "Join a League",
  joinDesc: "Enter the invite code from your league commissioner.",
  joinSubmit: "Join",
  inviteCodeLabel: "Invite Code",
  invalidCode: "Invalid code",
} as const;

/* ── Admin ────────────────────────────────────────────────── */

export const ADMIN = {
  eyebrow: "Admin",
  title: "Command Center",
  subtitle: "Manage leagues, seasons, and members.",
} as const;

export const ADMIN_SEASONS = {
  sectionTitle: "Seasons",
  colSeason: "Season",
  colStatus: "Status",
  colCreated: "Created",
  badgeActive: "Active",
  badgeInactive: "Inactive",
  emptyState: "No seasons yet. Start one to get going.",
  seasonLabel: (year: number) => `${year} NFL Season`,
  startButton: (year: number) => `Start ${year} Season`,
  starting: "Starting…",
  confirmStartTitle: "Start season",
  confirmStart: (year: number) =>
    `Start the ${year} season? This will archive the current season and roll all leagues forward.`,
  confirmStartButton: (year: number) => `Start ${year}`,
} as const;

export const ADMIN_LEAGUES = {
  sectionTitle: "Leagues",
  colLeague: "League",
  colCommissioner: "Commissioner",
  colMembers: "Members",
  colInviteCode: "Invite Code",
  newLeague: "+ New League",
  dialogTitle: "New League",
  dialogDesc: "Create a league and invite members with a join code.",
  dialogSubmit: "Create League",
  leagueNameLabel: "League Name",
  leagueNamePlaceholder: "The Boys",
  emptyState: "No leagues yet. Create one to get started.",
  regenCode: "Regen Code",
  confirmDelete: "Delete this league? This cannot be undone.",
} as const;

export const ADMIN_MEMBERS = {
  sectionTitle: "Members",
  colUser: "User",
  colTeam: "Team",
  colRole: "Role",
  colJoined: "Joined",
  badgeAdmin: "Admin",
  badgeMember: "Member",
  emptyState: "No members yet.",
  totalLabel: (count: number) => `${count} total`,
  confirmDelete: "Delete this member? This removes them from all leagues.",
} as const;

/* ── Commissioner ─────────────────────────────────────────── */

export const COMMISSIONER = {
  eyebrow: "Commissioner",
  title: "League Settings",
  subtitle: "Manage members, scoring, and league configuration.",
} as const;

/* ── Profile ─────────────────────────────────────────────── */

export const PROFILE = {
  eyebrow: "Settings",
  title: "Profile",
  subtitle: "Manage your account, avatar, and preferences.",
  accountTitle: "Account",
  usernameLabel: "Username",
  usernameDesc: "Your unique display name.",
  usernamePlaceholder: "e.g. gridironKing",
  avatarTitle: "Avatar",
  photoLabel: "Photo",
  photoDesc: "Upload a profile photo (optional).",
  uploadButton: "Upload",
  removePhoto: "Remove",
  teamTitle: "Favorite Team",
  teamLabel: "Team",
  teamDesc: "Sets your avatar color to match your team.",
  noTeam: "None",
  themeTitle: "Theme",
  intensityLabel: "Game Day Intensity",
  intensityDesc: "Controls the strength of visual effects on game day.",
  intensityOff: "Off",
  intensitySubtle: "Subtle",
  intensityNormal: "Normal",
  intensityFull: "Full",
  saveButton: "Save Changes",
} as const;

export const COMMISSIONER_LEAGUE = {
  sectionTitle: "League Settings",
  nameLabel: "League Name",
  nameDesc: "The display name for your league.",
  namePlaceholder: "My League",
  saveButton: "Save Changes",
  saving: "Saving…",
} as const;

export const COMMISSIONER_MEMBERS = {
  sectionTitle: "Members",
  colMember: "Member",
  colRole: "Role",
  colJoined: "Joined",
  badgeCommissioner: "Commissioner",
  makeCommissioner: "Make commissioner",
  remove: "Remove",
  inviteCodeLabel: "Invite Code",
  copy: "Copy",
  regenerate: "Regenerate",
  membersCount: (count: number) => `${count} members`,
  confirmRemove: (name: string) => `Remove ${name} from the league?`,
  confirmTransfer: (name: string) =>
    `Make ${name} the commissioner? You will become a regular member.`,
  confirmRegenCode: "Regenerate invite code? The old code will stop working.",
  addMember: "Add Member",
  addMemberTitle: "Add Member",
  addMemberDesc: "Search for a user by username to add them to the league.",
  searchPlaceholder: "Search username\u2026",
  noResults: "No users found.",
  add: "Add",
  addedMember: (name: string) => `${name} added to the league.`,
} as const;

export const SETTINGS = {
  sectionTitle: "Season Settings",
  lockedBanner: "🔒 Season is active — settings are locked",
  emptyNoSeason: "No active season — an admin needs to start one.",
  emptyNoSettings: "No settings found for this season.",
  saveButton: "Save Settings",

  groupScoring: "Scoring",
  baseCorrectPickLabel: "Base correct pick",
  baseCorrectPickDesc: "Points for a correct pick in regular season",
  upsetMultiplierLabel: "Upset multiplier",
  upsetMultiplierDesc: "Multiplied by base for correct upset pick",
  soleCorrectBonusLabel: "Sole correct bonus",
  soleCorrectBonusDesc: "Bonus points when only you got it right",
  weeklyBonusLabel: "Weekly bonus",
  weeklyBonusDesc: "Awarded to week's top scorer (split on ties)",
  weeklyBonusScalesLabel: "Weekly bonus scales in playoffs",
  weeklyBonusScalesDesc: "Multiplies weekly bonus by round multiplier",

  groupPlayoff: "Playoff Multipliers",
  wildCardLabel: "Wild Card",
  wildCardDesc: "Multiplier for Wild Card round",
  divisionalLabel: "Divisional",
  divisionalDesc: "Multiplier for Divisional round",
  championshipLabel: "Conference Championship",
  championshipDesc: "Multiplier for Conference Championship",
  superBowlLabel: "Super Bowl",
  superBowlDesc: "Multiplier for Super Bowl",

  groupVisibility: "Visibility",
  picksVisibleLabel: "Picks visible before kickoff",
  picksVisibleDesc: "Show other players' picks before the game starts",
  analyticsPublicLabel: "Analytics public by default",
  analyticsPublicDesc: "Members can view each other's analytics",

  groupTiebreakers: "Tiebreakers",
  sbPredictionLabel: "Super Bowl score prediction",
  sbPredictionDesc: "First tiebreaker — closest to actual combined score",
  playoffPointsLabel: "Most playoff points",
  playoffPointsDesc: "Second tiebreaker if Super Bowl prediction is equal",
} as const;

export const DANGER_ZONE = {
  sectionTitle: "Danger Zone",
  transferLabel: "Transfer commissioner",
  transferDesc:
    "Hand commissioner role to another member. You become a regular member.",
  transferButton: "Transfer",
  selectMember: "Select member...",
  regenLabel: "Regenerate invite code",
  regenDesc:
    "Invalidates the current code immediately. Anyone with the old code can no longer join.",
  regenButton: "Regenerate",
  deleteLabel: "Delete league",
  deleteDesc:
    "Permanently delete this league and all associated seasons, picks, and member data. This cannot be undone.",
  deleteButton: "Delete",
  confirmTransferTitle: "Transfer commissioner",
  confirmTransfer: (name: string) =>
    `Transfer commissioner to ${name}? You will become a regular member.`,
  confirmRegenTitle: "Regenerate invite code",
  confirmRegen:
    "Regenerate invite code? The current code will stop working immediately.",
  confirmDeleteTitle: "Delete league",
  confirmDelete:
    "Delete this league permanently? All seasons, picks, and member data will be lost.",
} as const;

/* ── Admin Game Editor ────────────────────────────────────────── */

export const ADMIN_GAME_EDITOR = {
  pageTitle: (year: number) => `${year} Season`,
  pageSubtitle: "Edit game states for testing.",
  backToAdmin: "← Back to Admin",

  colMatchup: "Matchup",
  colKickoff: "Kickoff",
  colStatus: "Status",
  colScore: "Score",

  editButton: "Edit",
  simulateButton: "Sim",
  resetButton: "Reset",

  dialogTitle: "Edit Game State",
  dialogDescription: (away: string, home: string) => `${away} @ ${home}`,
  dialogSubmit: "Save",

  fieldStatus: "Status",
  fieldPeriod: "Period",
  fieldClock: "Clock",
  fieldHomeScore: (abbr: string) => `${abbr} Score`,
  fieldAwayScore: (abbr: string) => `${abbr} Score`,
  fieldPossession: "Possession",
  fieldDownDistance: "Down & Distance",
  fieldLastPlay: "Last Play",
  fieldRedZone: "Red Zone",

  possessionNone: "None",

  statusScheduled: "Scheduled",
  statusInProgress: "In Progress",
  statusHalftime: "Halftime",
  statusFinal: "Final",

  emptyWeek: "No games in this week.",
  confirmReset: "Reset this game to scheduled defaults?",
  confirmResetTitle: "Reset Game State",
} as const;

/* ── Picks Grid ──────────────────────────────────────────────── */

export const GRID = {
  eyebrow: "Season",
  title: "Grid",
  subtitle: "View and make your picks across the entire season.",

  legendCorrect: "Correct",
  legendWrong: "Wrong",
  legendPending: "Pending",
  legendHidden: "Hidden",
  legendSoleBonus: "Sole bonus",
  legendTapHint: "TAP YOUR CELLS TO PICK",

  colWk: "Wk",
  colStatus: "Status",
  colMatchup: "Matchup",
  colGame: "Game",
  colSeasonPts: "SEASON PTS",
  colPts: "PTS",

  statusFinal: "Final",
  statusLive: "Live",
  statusHalf: "Half",
  statusOpen: "Open",
  periodLabel: (period: number) =>
    period <= 4 ? `Q${period}` : `OT${period - 4 > 1 ? period - 4 : ""}`,

  headerYou: "You",
  ptsSuffix: "pts",

  toastPicked: (team: string) => `${team} picked`,
  toastCleared: "Pick cleared",
  toastError: "Failed to save pick. Try again.",

  emptyNoSeason: "No active season.",
  emptyLoading: "Loading picks\u2026",

  sectionTitle: "Season Picks",
} as const;
