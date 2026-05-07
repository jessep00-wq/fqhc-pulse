export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_health_snapshots: {
        Row: {
          active_pdsa_count: number
          champion_user_id: string | null
          created_at: string
          first_pdsa_done: boolean
          health_status: string
          id: string
          last_export_at: string | null
          onboarding_complete: boolean
          organization_id: string
          period: string
          risk_flag: string | null
          weekly_active_users: number
        }
        Insert: {
          active_pdsa_count?: number
          champion_user_id?: string | null
          created_at?: string
          first_pdsa_done?: boolean
          health_status?: string
          id?: string
          last_export_at?: string | null
          onboarding_complete?: boolean
          organization_id: string
          period?: string
          risk_flag?: string | null
          weekly_active_users?: number
        }
        Update: {
          active_pdsa_count?: number
          champion_user_id?: string | null
          created_at?: string
          first_pdsa_done?: boolean
          health_status?: string
          id?: string
          last_export_at?: string | null
          onboarding_complete?: boolean
          organization_id?: string
          period?: string
          risk_flag?: string | null
          weekly_active_users?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          text: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          text: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_financials: {
        Row: {
          created_at: string
          grant_trend: number
          hrsa_quality_award: number
          id: string
          organization_id: string
          period: string
          revenue_protected: number
          shared_savings: number
          site_id: string | null
          trend: number
        }
        Insert: {
          created_at?: string
          grant_trend?: number
          hrsa_quality_award?: number
          id?: string
          organization_id: string
          period?: string
          revenue_protected?: number
          shared_savings?: number
          site_id?: string | null
          trend?: number
        }
        Update: {
          created_at?: string
          grant_trend?: number
          hrsa_quality_award?: number
          id?: string
          organization_id?: string
          period?: string
          revenue_protected?: number
          shared_savings?: number
          site_id?: string | null
          trend?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_financials_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          npi: string | null
          onboarding_status: string
          owner_id: string | null
          source: string | null
          stage: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          npi?: string | null
          onboarding_status?: string
          owner_id?: string | null
          source?: string | null
          stage?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          npi?: string | null
          onboarding_status?: string
          owner_id?: string | null
          source?: string | null
          stage?: string
        }
        Relationships: []
      }
      pdsa_cycles: {
        Row: {
          act_next_steps: string | null
          aim_statement: string | null
          analysis_summary: string | null
          assigned_staff: string[] | null
          clinical_workflow_impact: string | null
          created_at: string
          decision: string | null
          id: string
          improvement_pct: number | null
          measurement_plan: string | null
          organization_id: string
          prediction: string | null
          root_cause: string | null
          site_id: string | null
          status: string
          study_results: string | null
          target_goal: string | null
          template_id: string | null
          test_description: string | null
          title: string
          uds_measure: string | null
          what_didnt_work: string | null
          what_worked: string | null
        }
        Insert: {
          act_next_steps?: string | null
          aim_statement?: string | null
          analysis_summary?: string | null
          assigned_staff?: string[] | null
          clinical_workflow_impact?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          improvement_pct?: number | null
          measurement_plan?: string | null
          organization_id: string
          prediction?: string | null
          root_cause?: string | null
          site_id?: string | null
          status?: string
          study_results?: string | null
          target_goal?: string | null
          template_id?: string | null
          test_description?: string | null
          title: string
          uds_measure?: string | null
          what_didnt_work?: string | null
          what_worked?: string | null
        }
        Update: {
          act_next_steps?: string | null
          aim_statement?: string | null
          analysis_summary?: string | null
          assigned_staff?: string[] | null
          clinical_workflow_impact?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          improvement_pct?: number | null
          measurement_plan?: string | null
          organization_id?: string
          prediction?: string | null
          root_cause?: string | null
          site_id?: string | null
          status?: string
          study_results?: string | null
          target_goal?: string | null
          template_id?: string | null
          test_description?: string | null
          title?: string
          uds_measure?: string | null
          what_didnt_work?: string | null
          what_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdsa_cycles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdsa_cycles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_internal: boolean
          last_active_at: string | null
          last_login_at: string | null
          organization_id: string | null
          staff_role: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_internal?: boolean
          last_active_at?: string | null
          last_login_at?: string | null
          organization_id?: string | null
          staff_role?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_internal?: boolean
          last_active_at?: string | null
          last_login_at?: string | null
          organization_id?: string | null
          staff_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          id: string
          organization_id: string
          plan: string
          renews_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          plan?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          plan?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          acknowledged: boolean
          assigned_role: string | null
          created_at: string
          due_date: string | null
          id: string
          organization_id: string
          pdsa_cycle_id: string | null
          priority: string
          site_id: string | null
          status: string
          title: string
        }
        Insert: {
          acknowledged?: boolean
          assigned_role?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id: string
          pdsa_cycle_id?: string | null
          priority?: string
          site_id?: string | null
          status?: string
          title: string
        }
        Update: {
          acknowledged?: boolean
          assigned_role?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          pdsa_cycle_id?: string | null
          priority?: string
          site_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_pdsa_cycle_id_fkey"
            columns: ["pdsa_cycle_id"]
            isOneToOne: false
            referencedRelation: "pdsa_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          organization_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          organization_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      uds_targets: {
        Row: {
          created_at: string
          id: string
          measure_id: string
          organization_id: string
          target_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          measure_id: string
          organization_id: string
          target_value: number
        }
        Update: {
          created_at?: string
          id?: string
          measure_id?: string
          organization_id?: string
          target_value?: number
        }
        Relationships: []
      }
      uds_trends: {
        Row: {
          created_at: string
          id: string
          measure_id: string
          month: string
          organization_id: string
          site_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          measure_id: string
          month: string
          organization_id: string
          site_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          measure_id?: string
          month?: string
          organization_id?: string
          site_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "uds_trends_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uds_trends_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_founder_admin: { Args: { _user_id: string }; Returns: boolean }
      seed_demo_data: { Args: { org_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "founder_admin"
        | "internal_support"
        | "org_admin"
        | "standard_user"
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
      app_role: [
        "founder_admin",
        "internal_support",
        "org_admin",
        "standard_user",
      ],
    },
  },
} as const
