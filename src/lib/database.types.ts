export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      games: {
        Row: {
          away_abbr: string;
          away_team: string;
          created_at: string | null;
          espn_game_id: string;
          home_abbr: string;
          home_team: string;
          id: string;
          kickoff_time: string;
          spread: string | null;
          week_id: string;
          winner_abbr: string | null;
        };
        Insert: {
          away_abbr: string;
          away_team: string;
          created_at?: string | null;
          espn_game_id: string;
          home_abbr: string;
          home_team: string;
          id?: string;
          kickoff_time: string;
          spread?: string | null;
          week_id: string;
          winner_abbr?: string | null;
        };
        Update: {
          away_abbr?: string;
          away_team?: string;
          created_at?: string | null;
          espn_game_id?: string;
          home_abbr?: string;
          home_team?: string;
          id?: string;
          kickoff_time?: string;
          spread?: string | null;
          week_id?: string;
          winner_abbr?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_week_id_fkey";
            columns: ["week_id"];
            isOneToOne: false;
            referencedRelation: "nfl_weeks";
            referencedColumns: ["id"];
          },
        ];
      };
      league_members: {
        Row: {
          joined_at: string;
          league_id: string;
          role: Database["public"]["Enums"]["member_role"];
          stats_visibility: Database["public"]["Enums"]["stats_visibility"];
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          league_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          stats_visibility?: Database["public"]["Enums"]["stats_visibility"];
          user_id: string;
        };
        Update: {
          joined_at?: string;
          league_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          stats_visibility?: Database["public"]["Enums"]["stats_visibility"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      league_seasons: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean;
          league_id: string;
          locked: boolean;
          name: string;
          nfl_season_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          league_id: string;
          locked?: boolean;
          name: string;
          nfl_season_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          league_id?: string;
          locked?: boolean;
          name?: string;
          nfl_season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_seasons_nfl_season_id_fkey";
            columns: ["nfl_season_id"];
            isOneToOne: false;
            referencedRelation: "nfl_seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      leagues: {
        Row: {
          commissioner_id: string;
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
        Insert: {
          commissioner_id: string;
          created_at?: string;
          id?: string;
          invite_code?: string;
          name: string;
        };
        Update: {
          commissioner_id?: string;
          created_at?: string;
          id?: string;
          invite_code?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      live_game_state: {
        Row: {
          away_score: string | null;
          display_clock: string | null;
          down_distance: string | null;
          game_id: string;
          home_score: string | null;
          is_red_zone: boolean | null;
          last_play: string | null;
          period: number | null;
          possession: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          away_score?: string | null;
          display_clock?: string | null;
          down_distance?: string | null;
          game_id: string;
          home_score?: string | null;
          is_red_zone?: boolean | null;
          last_play?: string | null;
          period?: number | null;
          possession?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          away_score?: string | null;
          display_clock?: string | null;
          down_distance?: string | null;
          game_id?: string;
          home_score?: string | null;
          is_red_zone?: boolean | null;
          last_play?: string | null;
          period?: number | null;
          possession?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "live_game_state_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: true;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      nfl_seasons: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean;
          year: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          year: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          year?: number;
        };
        Relationships: [];
      };
      nfl_weeks: {
        Row: {
          id: string;
          season_id: string;
          week_number: number;
          week_type: Database["public"]["Enums"]["week_type"];
        };
        Insert: {
          id?: string;
          season_id: string;
          week_number: number;
          week_type?: Database["public"]["Enums"]["week_type"];
        };
        Update: {
          id?: string;
          season_id?: string;
          week_number?: number;
          week_type?: Database["public"]["Enums"]["week_type"];
        };
        Relationships: [
          {
            foreignKeyName: "nfl_weeks_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "nfl_seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      pick_streaks: {
        Row: {
          current_correct_streak: number;
          current_wrong_streak: number;
          id: string;
          last_updated: string | null;
          league_season_id: string;
          longest_correct_streak: number;
          longest_wrong_streak: number;
          user_id: string;
        };
        Insert: {
          current_correct_streak?: number;
          current_wrong_streak?: number;
          id?: string;
          last_updated?: string | null;
          league_season_id: string;
          longest_correct_streak?: number;
          longest_wrong_streak?: number;
          user_id: string;
        };
        Update: {
          current_correct_streak?: number;
          current_wrong_streak?: number;
          id?: string;
          last_updated?: string | null;
          league_season_id?: string;
          longest_correct_streak?: number;
          longest_wrong_streak?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pick_streaks_league_season_id_fkey";
            columns: ["league_season_id"];
            isOneToOne: false;
            referencedRelation: "league_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pick_streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      picks: {
        Row: {
          game_id: string;
          id: string;
          is_correct: boolean | null;
          is_sole_correct: boolean | null;
          is_upset: boolean | null;
          league_season_id: string;
          picked_at: string;
          picked_team_abbr: string;
          points_awarded: number | null;
          user_id: string;
        };
        Insert: {
          game_id: string;
          id?: string;
          is_correct?: boolean | null;
          is_sole_correct?: boolean | null;
          is_upset?: boolean | null;
          league_season_id: string;
          picked_at?: string;
          picked_team_abbr: string;
          points_awarded?: number | null;
          user_id: string;
        };
        Update: {
          game_id?: string;
          id?: string;
          is_correct?: boolean | null;
          is_sole_correct?: boolean | null;
          is_upset?: boolean | null;
          league_season_id?: string;
          picked_at?: string;
          picked_team_abbr?: string;
          points_awarded?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "picks_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "picks_league_season_id_fkey";
            columns: ["league_season_id"];
            isOneToOne: false;
            referencedRelation: "league_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "picks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_color: string;
          avatar_url: string | null;
          created_at: string;
          favorite_team: string | null;
          id: string;
          is_super_admin: boolean;
          theme_intensity: Database["public"]["Enums"]["theme_intensity"];
          username: string;
        };
        Insert: {
          avatar_color?: string;
          avatar_url?: string | null;
          created_at?: string;
          favorite_team?: string | null;
          id: string;
          is_super_admin?: boolean;
          theme_intensity?: Database["public"]["Enums"]["theme_intensity"];
          username: string;
        };
        Update: {
          avatar_color?: string;
          avatar_url?: string | null;
          created_at?: string;
          favorite_team?: string | null;
          id?: string;
          is_super_admin?: boolean;
          theme_intensity?: Database["public"]["Enums"]["theme_intensity"];
          username?: string;
        };
        Relationships: [];
      };
      season_settings: {
        Row: {
          base_correct_pts: number;
          championship_multiplier: number;
          divisional_multiplier: number;
          league_season_id: string;
          locked: boolean;
          picks_visible_before_kickoff: boolean;
          sole_correct_bonus: number;
          stats_public_default: boolean;
          superbowl_multiplier: number;
          theme_override: string | null;
          tiebreaker_playoff_pts: boolean;
          tiebreaker_superbowl_pred: boolean;
          upset_multiplier: number;
          weekly_bonus_regular: number;
          weekly_bonus_scales: boolean;
          wildcard_multiplier: number;
        };
        Insert: {
          base_correct_pts?: number;
          championship_multiplier?: number;
          divisional_multiplier?: number;
          league_season_id: string;
          locked?: boolean;
          picks_visible_before_kickoff?: boolean;
          sole_correct_bonus?: number;
          stats_public_default?: boolean;
          superbowl_multiplier?: number;
          theme_override?: string | null;
          tiebreaker_playoff_pts?: boolean;
          tiebreaker_superbowl_pred?: boolean;
          upset_multiplier?: number;
          weekly_bonus_regular?: number;
          weekly_bonus_scales?: boolean;
          wildcard_multiplier?: number;
        };
        Update: {
          base_correct_pts?: number;
          championship_multiplier?: number;
          divisional_multiplier?: number;
          league_season_id?: string;
          locked?: boolean;
          picks_visible_before_kickoff?: boolean;
          sole_correct_bonus?: number;
          stats_public_default?: boolean;
          superbowl_multiplier?: number;
          theme_override?: string | null;
          tiebreaker_playoff_pts?: boolean;
          tiebreaker_superbowl_pred?: boolean;
          upset_multiplier?: number;
          weekly_bonus_regular?: number;
          weekly_bonus_scales?: boolean;
          wildcard_multiplier?: number;
        };
        Relationships: [
          {
            foreignKeyName: "season_settings_league_season_id_fkey";
            columns: ["league_season_id"];
            isOneToOne: true;
            referencedRelation: "league_seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      superbowl_predictions: {
        Row: {
          id: string;
          league_season_id: string;
          predicted_total_score: number;
          user_id: string;
        };
        Insert: {
          id?: string;
          league_season_id: string;
          predicted_total_score: number;
          user_id: string;
        };
        Update: {
          id?: string;
          league_season_id?: string;
          predicted_total_score?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "superbowl_predictions_league_season_id_fkey";
            columns: ["league_season_id"];
            isOneToOne: false;
            referencedRelation: "league_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "superbowl_predictions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      join_league_by_code: { Args: { code: string }; Returns: Json };
    };
    Enums: {
      member_role: "commissioner" | "member";
      stats_visibility: "league_default" | "public" | "private";
      theme_intensity: "off" | "subtle" | "normal" | "full";
      week_type:
        | "regular"
        | "wildcard"
        | "divisional"
        | "championship"
        | "superbowl";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["commissioner", "member"],
      stats_visibility: ["league_default", "public", "private"],
      theme_intensity: ["off", "subtle", "normal", "full"],
      week_type: [
        "regular",
        "wildcard",
        "divisional",
        "championship",
        "superbowl",
      ],
    },
  },
} as const;
