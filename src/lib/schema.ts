export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      game: {
        Row: {
          away_score: number | null
          away_team_id: string
          away_team_record: string | null
          display_clock: string | null
          down_distance: string | null
          espn_event_id: string
          headline: string | null
          home_score: number | null
          home_team_id: string
          home_team_record: string | null
          id: string
          is_red_zone: boolean | null
          kickoff_time: string
          last_play: string | null
          period: number | null
          possession_id: string | null
          spread: number | null
          status: string
          week_id: string
          winner_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          away_team_record?: string | null
          display_clock?: string | null
          down_distance?: string | null
          espn_event_id: string
          headline?: string | null
          home_score?: number | null
          home_team_id: string
          home_team_record?: string | null
          id?: string
          is_red_zone?: boolean | null
          kickoff_time: string
          last_play?: string | null
          period?: number | null
          possession_id?: string | null
          spread?: number | null
          status?: string
          week_id: string
          winner_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          away_team_record?: string | null
          display_clock?: string | null
          down_distance?: string | null
          espn_event_id?: string
          headline?: string | null
          home_score?: number | null
          home_team_id?: string
          home_team_record?: string | null
          id?: string
          is_red_zone?: boolean | null
          kickoff_time?: string
          last_play?: string | null
          period?: number | null
          possession_id?: string | null
          spread?: number | null
          status?: string
          week_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_possession_id_fkey"
            columns: ["possession_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "week"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      league: {
        Row: {
          base_correct_pts: number
          championship_multiplier: number
          divisional_multiplier: number
          id: string
          invite_code: string
          name: string
          picks_visible_before_kickoff: boolean
          sole_correct_bonus: number
          stats_public_default: boolean
          superbowl_multiplier: number
          upset_multiplier: number
          weekly_bonus_regular: number
          weekly_bonus_scales: boolean
          wildcard_multiplier: number
        }
        Insert: {
          base_correct_pts?: number
          championship_multiplier?: number
          divisional_multiplier?: number
          id?: string
          invite_code?: string
          name: string
          picks_visible_before_kickoff?: boolean
          sole_correct_bonus?: number
          stats_public_default?: boolean
          superbowl_multiplier?: number
          upset_multiplier?: number
          weekly_bonus_regular?: number
          weekly_bonus_scales?: boolean
          wildcard_multiplier?: number
        }
        Update: {
          base_correct_pts?: number
          championship_multiplier?: number
          divisional_multiplier?: number
          id?: string
          invite_code?: string
          name?: string
          picks_visible_before_kickoff?: boolean
          sole_correct_bonus?: number
          stats_public_default?: boolean
          superbowl_multiplier?: number
          upset_multiplier?: number
          weekly_bonus_regular?: number
          weekly_bonus_scales?: boolean
          wildcard_multiplier?: number
        }
        Relationships: []
      }
      league_member: {
        Row: {
          league_id: string
          user_id: string
        }
        Insert: {
          league_id: string
          user_id: string
        }
        Update: {
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_member_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "league"
            referencedColumns: ["id"]
          },
        ]
      }
      pick: {
        Row: {
          game_id: string
          is_correct: boolean | null
          is_sole_correct: boolean | null
          league_id: string
          points: number | null
          team_id: string
          user_id: string
        }
        Insert: {
          game_id: string
          is_correct?: boolean | null
          is_sole_correct?: boolean | null
          league_id: string
          points?: number | null
          team_id: string
          user_id: string
        }
        Update: {
          game_id?: string
          is_correct?: boolean | null
          is_sole_correct?: boolean | null
          league_id?: string
          points?: number | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pick_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pick_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "league"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pick_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          avatar: string | null
          favorite_team_id: string | null
          id: string
          is_admin: boolean
          name: string
          theme_intensity: string
        }
        Insert: {
          avatar?: string | null
          favorite_team_id?: string | null
          id: string
          is_admin?: boolean
          name: string
          theme_intensity?: string
        }
        Update: {
          avatar?: string | null
          favorite_team_id?: string | null
          id?: string
          is_admin?: boolean
          name?: string
          theme_intensity?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      season: {
        Row: {
          end_date: string
          id: string
          last_synced_at: string | null
          start_date: string
          year: number
        }
        Insert: {
          end_date: string
          id?: string
          last_synced_at?: string | null
          start_date: string
          year: number
        }
        Update: {
          end_date?: string
          id?: string
          last_synced_at?: string | null
          start_date?: string
          year?: number
        }
        Relationships: []
      }
      team: {
        Row: {
          abbr: string
          alternate_color: string | null
          color: string | null
          display_name: string
          espn_id: string
          id: string
          location: string
          name: string
        }
        Insert: {
          abbr: string
          alternate_color?: string | null
          color?: string | null
          display_name: string
          espn_id: string
          id?: string
          location: string
          name: string
        }
        Update: {
          abbr?: string
          alternate_color?: string | null
          color?: string | null
          display_name?: string
          espn_id?: string
          id?: string
          location?: string
          name?: string
        }
        Relationships: []
      }
      week: {
        Row: {
          counts_for_standings: boolean
          detail: string | null
          end_date: string
          espn_value: number
          id: string
          label: string
          phase: string
          season_id: string
          start_date: string
        }
        Insert: {
          counts_for_standings?: boolean
          detail?: string | null
          end_date: string
          espn_value: number
          id?: string
          label: string
          phase: string
          season_id: string
          start_date: string
        }
        Update: {
          counts_for_standings?: boolean
          detail?: string | null
          end_date?: string
          espn_value?: number
          id?: string
          label?: string
          phase?: string
          season_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
        ]
      }
      week_bonus: {
        Row: {
          league_id: string
          points: number
          user_id: string
          week_id: string
        }
        Insert: {
          league_id: string
          points: number
          user_id: string
          week_id: string
        }
        Update: {
          league_id?: string
          points?: number
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_bonus_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "league"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_bonus_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "week"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

