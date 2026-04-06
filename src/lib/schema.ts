export type Database = {
  public: {
    Tables: {
      team: {
        Row: {
          id: string;
          abbr: string;
          city: string;
          name: string;
          conference: string;
          division: string;
          color: string | null;
        };
        Insert: {
          id?: string;
          abbr: string;
          city: string;
          name: string;
          conference: string;
          division: string;
          color?: string | null;
        };
        Update: {
          id?: string;
          abbr?: string;
          city?: string;
          name?: string;
          conference?: string;
          division?: string;
          color?: string | null;
        };
        Relationships: [];
      };
      team_record: {
        Row: {
          team_id: string;
          season_id: string;
          wins: number;
          losses: number;
          ties: number;
        };
        Insert: {
          team_id: string;
          season_id: string;
          wins?: number;
          losses?: number;
          ties?: number;
        };
        Update: {
          team_id?: string;
          season_id?: string;
          wins?: number;
          losses?: number;
          ties?: number;
        };
        Relationships: [
          {
            foreignKeyName: "team_record_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_record_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "season";
            referencedColumns: ["id"];
          },
        ];
      };
      season: {
        Row: {
          id: string;
          year: number;
          start_date: string;
          end_date: string;
        };
        Insert: {
          id?: string;
          year: number;
          start_date: string;
          end_date: string;
        };
        Update: {
          id?: string;
          year?: number;
          start_date?: string;
          end_date?: string;
        };
        Relationships: [];
      };
      week: {
        Row: {
          id: string;
          season_id: string;
          type: string;
          number: number;
          name: string | null;
          start_date: string;
          end_date: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          type: string;
          number: number;
          name?: string | null;
          start_date: string;
          end_date: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          type?: string;
          number?: number;
          name?: string | null;
          start_date?: string;
          end_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "week_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "season";
            referencedColumns: ["id"];
          },
        ];
      };
      game: {
        Row: {
          id: string;
          season_id: string;
          week_id: string;
          home_team_id: string;
          away_team_id: string;
          description: string | null;
          kickoff_time: string;
          status: string;
          home_score: number;
          away_score: number;
          spread: number | null;
          period: number | null;
          display_clock: string | null;
          possession_id: string | null;
          down_distance: string | null;
          last_play: string | null;
          is_red_zone: boolean;
          winner_id: string | null;
          espn_game_id: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          week_id: string;
          home_team_id: string;
          away_team_id: string;
          description?: string | null;
          kickoff_time: string;
          status?: string;
          home_score?: number;
          away_score?: number;
          spread?: number | null;
          period?: number | null;
          display_clock?: string | null;
          possession_id?: string | null;
          down_distance?: string | null;
          last_play?: string | null;
          is_red_zone?: boolean;
          winner_id?: string | null;
          espn_game_id: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          week_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          description?: string | null;
          kickoff_time?: string;
          status?: string;
          home_score?: number;
          away_score?: number;
          spread?: number | null;
          period?: number | null;
          display_clock?: string | null;
          possession_id?: string | null;
          down_distance?: string | null;
          last_play?: string | null;
          is_red_zone?: boolean;
          winner_id?: string | null;
          espn_game_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "season";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_week_id_fkey";
            columns: ["week_id"];
            isOneToOne: false;
            referencedRelation: "week";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_possession_id_fkey";
            columns: ["possession_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
        ];
      };
      profile: {
        Row: {
          id: string;
          name: string;
          avatar: string | null;
          favorite_team_id: string | null;
          is_admin: boolean;
          theme_intensity: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar?: string | null;
          favorite_team_id?: string | null;
          is_admin?: boolean;
          theme_intensity?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string | null;
          favorite_team_id?: string | null;
          is_admin?: boolean;
          theme_intensity?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_favorite_team_id_fkey";
            columns: ["favorite_team_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
        ];
      };
      league: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
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
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          base_correct_pts?: number;
          upset_multiplier?: number;
          sole_correct_bonus?: number;
          wildcard_multiplier?: number;
          divisional_multiplier?: number;
          championship_multiplier?: number;
          superbowl_multiplier?: number;
          weekly_bonus_regular?: number;
          weekly_bonus_scales?: boolean;
          picks_visible_before_kickoff?: boolean;
          stats_public_default?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          base_correct_pts?: number;
          upset_multiplier?: number;
          sole_correct_bonus?: number;
          wildcard_multiplier?: number;
          divisional_multiplier?: number;
          championship_multiplier?: number;
          superbowl_multiplier?: number;
          weekly_bonus_regular?: number;
          weekly_bonus_scales?: boolean;
          picks_visible_before_kickoff?: boolean;
          stats_public_default?: boolean;
        };
        Relationships: [];
      };
      league_member: {
        Row: {
          league_id: string;
          user_id: string;
        };
        Insert: {
          league_id: string;
          user_id: string;
        };
        Update: {
          league_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_member_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "league";
            referencedColumns: ["id"];
          },
        ];
      };
      pick: {
        Row: {
          league_id: string;
          user_id: string;
          game_id: string;
          team_id: string;
          is_correct: boolean | null;
          is_sole_correct: boolean | null;
          points: number | null;
        };
        Insert: {
          league_id: string;
          user_id: string;
          game_id: string;
          team_id: string;
          is_correct?: boolean | null;
          is_sole_correct?: boolean | null;
          points?: number | null;
        };
        Update: {
          league_id?: string;
          user_id?: string;
          game_id?: string;
          team_id?: string;
          is_correct?: boolean | null;
          is_sole_correct?: boolean | null;
          points?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pick_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "league";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pick_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pick_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "team";
            referencedColumns: ["id"];
          },
        ];
      };
      week_bonus: {
        Row: {
          league_id: string;
          user_id: string;
          week_id: string;
          points: number;
        };
        Insert: {
          league_id: string;
          user_id: string;
          week_id: string;
          points: number;
        };
        Update: {
          league_id?: string;
          user_id?: string;
          week_id?: string;
          points?: number;
        };
        Relationships: [
          {
            foreignKeyName: "week_bonus_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "league";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "week_bonus_week_id_fkey";
            columns: ["week_id"];
            isOneToOne: false;
            referencedRelation: "week";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
