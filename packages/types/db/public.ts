export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          department_name: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          department_name: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          department_name?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      kpi_categories: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          kpi_category_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string
          category_name: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          kpi_category_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          kpi_category_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_categories_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
        ]
      }
      kpi_kpi_categories: {
        Row: {
          category_id: string
          created_at: string
          kpi_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          kpi_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          kpi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_kpi_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kpi_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "kpi_kpi_categories_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["kpi_id"]
          },
        ]
      }
      kpi_snapshot_configs: {
        Row: {
          created_at: string | null
          created_by: string | null
          graphql_query: string | null
          id: string
          kpi_id: string | null
          notes: string | null
          source_board_ids: Json | null
          transform_function: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          graphql_query?: string | null
          id?: string
          kpi_id?: string | null
          notes?: string | null
          source_board_ids?: Json | null
          transform_function?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          graphql_query?: string | null
          id?: string
          kpi_id?: string | null
          notes?: string | null
          source_board_ids?: Json | null
          transform_function?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshot_configs_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["kpi_id"]
          },
        ]
      }
      kpis: {
        Row: {
          closer_name: string | null;
          closer_monday_id: string | null;
          channel: string
          created_at: string
          created_by: string | null
          data_type: Database["public"]["Enums"]["kpi_data_type"]
          definition_url: string | null
          department_id: string
          description: string | null
          direction: Database["public"]["Enums"]["kpi_direction"]
          effort: number | null
          impact: number | null
          is_active: boolean
          kpi_id: string
          kpi_key: string
          kpi_name: string
          location: string
          monday_item_id: string | null
          priority: number | null
          red_value: number
          role_resp: string
          symbol_position: Database["public"]["Enums"]["symbol_position"]
          target_frequency: Database["public"]["Enums"]["kpi_target_frequency"]
          target_value: number | null
          unit_of_measure: Database["public"]["Enums"]["kpi_unit_of_measure"]
          updated_at: string
          updated_by: string | null
          yellow_value: number
        }
        Insert: {
          channel?: string
          created_at?: string
          created_by?: string | null
          data_type: Database["public"]["Enums"]["kpi_data_type"]
          definition_url?: string | null
          department_id: string
          description?: string | null
          direction?: Database["public"]["Enums"]["kpi_direction"]
          effort?: number | null
          impact?: number | null
          is_active?: boolean
          kpi_id?: string
          kpi_key?: string
          kpi_name: string
          location: string
          monday_item_id?: string | null
          priority?: number | null
          red_value?: number
          role_resp: string
          symbol_position?: Database["public"]["Enums"]["symbol_position"]
          target_frequency?: Database["public"]["Enums"]["kpi_target_frequency"]
          target_value?: number | null
          unit_of_measure: Database["public"]["Enums"]["kpi_unit_of_measure"]
          updated_at?: string
          updated_by?: string | null
          yellow_value?: number
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          data_type?: Database["public"]["Enums"]["kpi_data_type"]
          definition_url?: string | null
          department_id?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["kpi_direction"]
          effort?: number | null
          impact?: number | null
          is_active?: boolean
          kpi_id?: string
          kpi_key?: string
          kpi_name?: string
          location?: string
          monday_item_id?: string | null
          priority?: number | null
          red_value?: number
          role_resp?: string
          symbol_position?: Database["public"]["Enums"]["symbol_position"]
          target_frequency?: Database["public"]["Enums"]["kpi_target_frequency"]
          target_value?: number | null
          unit_of_measure?: Database["public"]["Enums"]["kpi_unit_of_measure"]
          updated_at?: string
          updated_by?: string | null
          yellow_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpis_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
        ]
      }
      snapshots: {
        Row: {
          created_at: string
          date_value: string | null
          kpi_id: string
          numeric_value: number | null
          snapshot_data: Json | null
          snapshot_date: string
          snapshot_id: string
          text_value: string | null
        }
        Insert: {
          created_at?: string
          date_value?: string | null
          kpi_id: string
          numeric_value?: number | null
          snapshot_data?: Json | null
          snapshot_date: string
          snapshot_id?: string
          text_value?: string | null
        }
        Update: {
          created_at?: string
          date_value?: string | null
          kpi_id?: string
          numeric_value?: number | null
          snapshot_data?: Json | null
          snapshot_date?: string
          snapshot_id?: string
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["kpi_id"]
          },
        ]
      }
      sprint_boards: {
        Row: {
          id: string
          inserted_at: string
          is_active: boolean
          is_archived: boolean
          monday_id: number
          name: string
          sprint_end_date: string
          sprint_start_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          inserted_at?: string
          is_active?: boolean
          is_archived?: boolean
          monday_id: number
          name: string
          sprint_end_date: string
          sprint_start_date: string
          updated_at?: string
        }
        Update: {
          id?: string
          inserted_at?: string
          is_active?: boolean
          is_archived?: boolean
          monday_id?: number
          name?: string
          sprint_end_date?: string
          sprint_start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      kpi_data_type:
        | "numeric"
        | "percentage"
        | "currency"
        | "boolean"
        | "text"
        | "date"
      kpi_direction: "up" | "down"
      kpi_target_frequency:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      kpi_unit_of_measure:
        | "EUR"
        | "USD"
        | "GBP"
        | "years"
        | "months"
        | "weeks"
        | "days"
        | "hours"
        | "minutes"
        | "percent"
        | "count"
        | "ratio"
        | "text"
      symbol_position: "left" | "right"
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
  public: {
    Enums: {
      kpi_data_type: [
        "numeric",
        "percentage",
        "currency",
        "boolean",
        "text",
        "date",
      ],
      kpi_direction: ["up", "down"],
      kpi_target_frequency: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      kpi_unit_of_measure: [
        "EUR",
        "USD",
        "GBP",
        "years",
        "months",
        "weeks",
        "days",
        "hours",
        "minutes",
        "percent",
        "count",
        "ratio",
        "text",
      ],
      symbol_position: ["left", "right"],
    },
  },
} as const
