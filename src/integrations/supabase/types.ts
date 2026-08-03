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
      ai_incidents: {
        Row: {
          ai_tool_id: string | null
          corrective_action: string | null
          created_at: string
          description: string
          id: string
          incident_type: string
          occurred_at: string
          organization_id: string
          patient_impact: boolean
          patient_impact_detail: string | null
          qi_committee_reviewed: boolean
          qi_review_date: string | null
          reported_by: string | null
          resolution_status: string
          resolved_at: string | null
          updated_at: string
        }
        Insert: {
          ai_tool_id?: string | null
          corrective_action?: string | null
          created_at?: string
          description: string
          id?: string
          incident_type?: string
          occurred_at?: string
          organization_id: string
          patient_impact?: boolean
          patient_impact_detail?: string | null
          qi_committee_reviewed?: boolean
          qi_review_date?: string | null
          reported_by?: string | null
          resolution_status?: string
          resolved_at?: string | null
          updated_at?: string
        }
        Update: {
          ai_tool_id?: string | null
          corrective_action?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          occurred_at?: string
          organization_id?: string
          patient_impact?: boolean
          patient_impact_detail?: string | null
          qi_committee_reviewed?: boolean
          qi_review_date?: string | null
          reported_by?: string | null
          resolution_status?: string
          resolved_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_policies: {
        Row: {
          activated_at: string | null
          board_chair_approved_at: string | null
          board_chair_approved_by: string | null
          body_md: string
          ceo_approved_at: string | null
          ceo_approved_by: string | null
          cmo_approved_at: string | null
          cmo_approved_by: string | null
          created_at: string
          id: string
          next_review_date: string | null
          organization_id: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          board_chair_approved_at?: string | null
          board_chair_approved_by?: string | null
          body_md?: string
          ceo_approved_at?: string | null
          ceo_approved_by?: string | null
          cmo_approved_at?: string | null
          cmo_approved_by?: string | null
          created_at?: string
          id?: string
          next_review_date?: string | null
          organization_id: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          activated_at?: string | null
          board_chair_approved_at?: string | null
          board_chair_approved_by?: string | null
          body_md?: string
          ceo_approved_at?: string | null
          ceo_approved_by?: string | null
          cmo_approved_at?: string | null
          cmo_approved_by?: string | null
          created_at?: string
          id?: string
          next_review_date?: string | null
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_review_events: {
        Row: {
          action_taken: string
          ai_tool_id: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          output_category: string
          output_summary: string | null
          patient_reference: string | null
          reviewed_at: string
          reviewer_user_id: string | null
        }
        Insert: {
          action_taken?: string
          ai_tool_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          output_category?: string
          output_summary?: string | null
          patient_reference?: string | null
          reviewed_at?: string
          reviewer_user_id?: string | null
        }
        Update: {
          action_taken?: string
          ai_tool_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          output_category?: string
          output_summary?: string | null
          patient_reference?: string | null
          reviewed_at?: string
          reviewer_user_id?: string | null
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          ai_category: string
          created_at: string
          data_accessed: string[]
          date_adopted: string | null
          handles_phi: boolean
          id: string
          internal_owner_user_id: string | null
          is_shadow_ai: boolean
          name: string
          notes: string | null
          organization_id: string
          patient_impact: string
          purpose: string | null
          reported_by: string | null
          risk_tier: number
          status: string
          updated_at: string
          user_role: string | null
          vendor: string | null
          vendor_agreement_status: string
          workflow_location: string | null
        }
        Insert: {
          ai_category?: string
          created_at?: string
          data_accessed?: string[]
          date_adopted?: string | null
          handles_phi?: boolean
          id?: string
          internal_owner_user_id?: string | null
          is_shadow_ai?: boolean
          name: string
          notes?: string | null
          organization_id: string
          patient_impact?: string
          purpose?: string | null
          reported_by?: string | null
          risk_tier?: number
          status?: string
          updated_at?: string
          user_role?: string | null
          vendor?: string | null
          vendor_agreement_status?: string
          workflow_location?: string | null
        }
        Update: {
          ai_category?: string
          created_at?: string
          data_accessed?: string[]
          date_adopted?: string | null
          handles_phi?: boolean
          id?: string
          internal_owner_user_id?: string | null
          is_shadow_ai?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          patient_impact?: string
          purpose?: string | null
          reported_by?: string | null
          risk_tier?: number
          status?: string
          updated_at?: string
          user_role?: string | null
          vendor?: string | null
          vendor_agreement_status?: string
          workflow_location?: string | null
        }
        Relationships: []
      }
      ai_vendor_reviews: {
        Row: {
          ai_tool_id: string
          audit_rights: string | null
          baa_file_path: string | null
          baa_signed: boolean
          created_at: string
          data_retention_terms: string | null
          id: string
          indemnification: string | null
          known_limitations: string | null
          model_update_notification: string | null
          next_review_date: string | null
          organization_id: string
          review_date: string
          reviewer_user_id: string | null
          signed_agreement_path: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_tool_id: string
          audit_rights?: string | null
          baa_file_path?: string | null
          baa_signed?: boolean
          created_at?: string
          data_retention_terms?: string | null
          id?: string
          indemnification?: string | null
          known_limitations?: string | null
          model_update_notification?: string | null
          next_review_date?: string | null
          organization_id: string
          review_date?: string
          reviewer_user_id?: string | null
          signed_agreement_path?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_tool_id?: string
          audit_rights?: string | null
          baa_file_path?: string | null
          baa_signed?: boolean
          created_at?: string
          data_retention_terms?: string | null
          id?: string
          indemnification?: string | null
          known_limitations?: string | null
          model_update_notification?: string | null
          next_review_date?: string | null
          organization_id?: string
          review_date?: string
          reviewer_user_id?: string | null
          signed_agreement_path?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      download_log: {
        Row: {
          downloaded_at: string
          file_path: string
          id: string
          order_id: string | null
        }
        Insert: {
          downloaded_at?: string
          file_path: string
          id?: string
          order_id?: string | null
        }
        Update: {
          downloaded_at?: string
          file_path?: string
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      manual_downloads: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_org: string
          claim_ticket: string | null
          claim_ticket_expires_at: string | null
          created_at: string
          download_ip: string | null
          downloaded_at: string | null
          expires_at: string
          id: string
          paid_at: string
          stripe_session_id: string
          token: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_org: string
          claim_ticket?: string | null
          claim_ticket_expires_at?: string | null
          created_at?: string
          download_ip?: string | null
          downloaded_at?: string | null
          expires_at: string
          id?: string
          paid_at?: string
          stripe_session_id: string
          token: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_org?: string
          claim_ticket?: string | null
          claim_ticket_expires_at?: string | null
          created_at?: string
          download_ip?: string | null
          downloaded_at?: string | null
          expires_at?: string
          id?: string
          paid_at?: string
          stripe_session_id?: string
          token?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          bundle_ids: string[]
          created_at: string
          currency: string
          customer_email: string
          download_links: Json
          email_sent_at: string | null
          environment: string
          id: string
          product_ids: string[]
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          bundle_ids?: string[]
          created_at?: string
          currency?: string
          customer_email: string
          download_links?: Json
          email_sent_at?: string | null
          environment?: string
          id?: string
          product_ids?: string[]
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          bundle_ids?: string[]
          created_at?: string
          currency?: string
          customer_email?: string
          download_links?: Json
          email_sent_at?: string | null
          environment?: string
          id?: string
          product_ids?: string[]
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: "org_financials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          archived_at: string | null
          created_at: string
          data_mode: string
          id: string
          is_test: boolean
          name: string
          notes: string | null
          npi: string | null
          onboarding_status: string
          org_type: string | null
          owner_id: string | null
          quality_lead_email: string | null
          quality_lead_name: string | null
          reporting_period: string | null
          source: string | null
          stage: string
          timezone: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          data_mode?: string
          id?: string
          is_test?: boolean
          name: string
          notes?: string | null
          npi?: string | null
          onboarding_status?: string
          org_type?: string | null
          owner_id?: string | null
          quality_lead_email?: string | null
          quality_lead_name?: string | null
          reporting_period?: string | null
          source?: string | null
          stage?: string
          timezone?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          data_mode?: string
          id?: string
          is_test?: boolean
          name?: string
          notes?: string | null
          npi?: string | null
          onboarding_status?: string
          org_type?: string | null
          owner_id?: string | null
          quality_lead_email?: string | null
          quality_lead_name?: string | null
          reporting_period?: string | null
          source?: string | null
          stage?: string
          timezone?: string | null
        }
        Relationships: []
      }
      pdsa_cycles: {
        Row: {
          act_next_steps: string | null
          actual_outcome: string | null
          aim_statement: string | null
          analysis_summary: string | null
          assigned_staff: string[] | null
          baseline_rate: number | null
          clinical_workflow_impact: string | null
          completeness_score: number
          created_at: string
          decision: string | null
          focus_area: string | null
          id: string
          improvement_pct: number | null
          intervention_description: string | null
          measurement_plan: string | null
          next_cycle_decision: string | null
          next_cycle_id: string | null
          organization_id: string
          owner_user_id: string | null
          predicted_outcome: string | null
          prediction: string | null
          previous_cycle_id: string | null
          root_cause: string | null
          site_id: string | null
          start_date: string | null
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
          actual_outcome?: string | null
          aim_statement?: string | null
          analysis_summary?: string | null
          assigned_staff?: string[] | null
          baseline_rate?: number | null
          clinical_workflow_impact?: string | null
          completeness_score?: number
          created_at?: string
          decision?: string | null
          focus_area?: string | null
          id?: string
          improvement_pct?: number | null
          intervention_description?: string | null
          measurement_plan?: string | null
          next_cycle_decision?: string | null
          next_cycle_id?: string | null
          organization_id: string
          owner_user_id?: string | null
          predicted_outcome?: string | null
          prediction?: string | null
          previous_cycle_id?: string | null
          root_cause?: string | null
          site_id?: string | null
          start_date?: string | null
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
          actual_outcome?: string | null
          aim_statement?: string | null
          analysis_summary?: string | null
          assigned_staff?: string[] | null
          baseline_rate?: number | null
          clinical_workflow_impact?: string | null
          completeness_score?: number
          created_at?: string
          decision?: string | null
          focus_area?: string | null
          id?: string
          improvement_pct?: number | null
          intervention_description?: string | null
          measurement_plan?: string | null
          next_cycle_decision?: string | null
          next_cycle_id?: string | null
          organization_id?: string
          owner_user_id?: string | null
          predicted_outcome?: string | null
          prediction?: string | null
          previous_cycle_id?: string | null
          root_cause?: string | null
          site_id?: string | null
          start_date?: string | null
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
      pdsa_drafts: {
        Row: {
          created_at: string
          current_step: string
          form_data: Json
          id: string
          organization_id: string
          pdsa_cycle_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: string
          form_data?: Json
          id?: string
          organization_id: string
          pdsa_cycle_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: string
          form_data?: Json
          id?: string
          organization_id?: string
          pdsa_cycle_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdsa_evidence: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          note: string | null
          organization_id: string
          pdsa_cycle_id: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          note?: string | null
          organization_id: string
          pdsa_cycle_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          note?: string | null
          organization_id?: string
          pdsa_cycle_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      playbook_leads: {
        Row: {
          created_at: string
          full_name: string
          health_center_name: string
          id: string
          last_nurture_sent_at: string | null
          notes: string | null
          nurture_step: number
          reminder_sent_at: string | null
          role: string
          source: string
          tags: string[]
          welcome_sent_at: string | null
          work_email: string
        }
        Insert: {
          created_at?: string
          full_name: string
          health_center_name: string
          id?: string
          last_nurture_sent_at?: string | null
          notes?: string | null
          nurture_step?: number
          reminder_sent_at?: string | null
          role: string
          source?: string
          tags?: string[]
          welcome_sent_at?: string | null
          work_email: string
        }
        Update: {
          created_at?: string
          full_name?: string
          health_center_name?: string
          id?: string
          last_nurture_sent_at?: string | null
          notes?: string | null
          nurture_step?: number
          reminder_sent_at?: string | null
          role?: string
          source?: string
          tags?: string[]
          welcome_sent_at?: string | null
          work_email?: string
        }
        Relationships: []
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
          welcome_email_sent_at: string | null
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
          welcome_email_sent_at?: string | null
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
          welcome_email_sent_at?: string | null
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
      qi_meetings: {
        Row: {
          agenda_summary: string[]
          attendees: string[]
          chair_name: string | null
          created_at: string
          created_by: string | null
          id: string
          key_decisions: string[]
          meeting_date: string
          organization_id: string
          site_id: string | null
        }
        Insert: {
          agenda_summary?: string[]
          attendees?: string[]
          chair_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_decisions?: string[]
          meeting_date: string
          organization_id: string
          site_id?: string | null
        }
        Update: {
          agenda_summary?: string[]
          attendees?: string[]
          chair_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_decisions?: string[]
          meeting_date?: string
          organization_id?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qi_meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qi_meetings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      qi_oversight_roles: {
        Row: {
          area: string
          created_at: string
          documentation_location: string | null
          id: string
          organization_id: string
          owner_name_override: string | null
          owner_role: string | null
          review_frequency: string | null
          sort_order: number
        }
        Insert: {
          area: string
          created_at?: string
          documentation_location?: string | null
          id?: string
          organization_id: string
          owner_name_override?: string | null
          owner_role?: string | null
          review_frequency?: string | null
          sort_order?: number
        }
        Update: {
          area?: string
          created_at?: string
          documentation_location?: string | null
          id?: string
          organization_id?: string
          owner_name_override?: string | null
          owner_role?: string | null
          review_frequency?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "qi_oversight_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qi_report_approvals: {
        Row: {
          approver_name_snapshot: string | null
          approver_title_snapshot: string | null
          approver_user_id: string | null
          created_at: string
          decided_at: string
          decision: string
          decision_note: string | null
          id: string
          organization_id: string
          report_id: string
          role: string
        }
        Insert: {
          approver_name_snapshot?: string | null
          approver_title_snapshot?: string | null
          approver_user_id?: string | null
          created_at?: string
          decided_at?: string
          decision: string
          decision_note?: string | null
          id?: string
          organization_id: string
          report_id: string
          role: string
        }
        Update: {
          approver_name_snapshot?: string | null
          approver_title_snapshot?: string | null
          approver_user_id?: string | null
          created_at?: string
          decided_at?: string
          decision?: string
          decision_note?: string | null
          id?: string
          organization_id?: string
          report_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "qi_report_approvals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "qi_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      qi_report_board_actions: {
        Row: {
          created_at: string
          detail: string | null
          due_date: string | null
          id: string
          kind: string
          organization_id: string
          owner_user_id: string | null
          report_id: string
          resolved_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          due_date?: string | null
          id?: string
          kind?: string
          organization_id: string
          owner_user_id?: string | null
          report_id: string
          resolved_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          due_date?: string | null
          id?: string
          kind?: string
          organization_id?: string
          owner_user_id?: string | null
          report_id?: string
          resolved_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "qi_report_board_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "qi_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      qi_reports: {
        Row: {
          ai_draft_meta: Json
          board_sections: Json
          committee_sections: Json
          created_at: string
          generated_by: string | null
          id: string
          organization_id: string
          period_end: string | null
          period_label: string
          period_start: string | null
          report_type: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_draft_meta?: Json
          board_sections?: Json
          committee_sections?: Json
          created_at?: string
          generated_by?: string | null
          id?: string
          organization_id: string
          period_end?: string | null
          period_label: string
          period_start?: string | null
          report_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_draft_meta?: Json
          board_sections?: Json
          committee_sections?: Json
          created_at?: string
          generated_by?: string | null
          id?: string
          organization_id?: string
          period_end?: string | null
          period_label?: string
          period_start?: string | null
          report_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      readiness_submissions: {
        Row: {
          answers: Json
          created_at: string
          email: string
          email_sent_at: string | null
          first_name: string
          health_center: string | null
          id: string
          score: number
          source: string | null
          state: string | null
          tier: string
          user_agent: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          email: string
          email_sent_at?: string | null
          first_name: string
          health_center?: string | null
          id?: string
          score: number
          source?: string | null
          state?: string | null
          tier: string
          user_agent?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string
          email_sent_at?: string | null
          first_name?: string
          health_center?: string | null
          id?: string
          score?: number
          source?: string | null
          state?: string | null
          tier?: string
          user_agent?: string | null
        }
        Relationships: []
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
      store_bundles: {
        Row: {
          buyer_guidance: string | null
          created_at: string
          currency: string
          hero_emoji: string | null
          hero_icon: string | null
          hero_image_url: string | null
          id: string
          included_product_ids: string[]
          long_description: string | null
          name: string
          preview_image_urls: string[]
          price_cents: number
          short_description: string | null
          slug: string
          sort_order: number
          status: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_guidance?: string | null
          created_at?: string
          currency?: string
          hero_emoji?: string | null
          hero_icon?: string | null
          hero_image_url?: string | null
          id?: string
          included_product_ids?: string[]
          long_description?: string | null
          name: string
          preview_image_urls?: string[]
          price_cents: number
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_guidance?: string | null
          created_at?: string
          currency?: string
          hero_emoji?: string | null
          hero_icon?: string | null
          hero_image_url?: string | null
          id?: string
          included_product_ids?: string[]
          long_description?: string | null
          name?: string
          preview_image_urls?: string[]
          price_cents?: number
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_product_files: {
        Row: {
          created_at: string
          file_path: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_product_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          bullets: Json
          buyer_guidance: string | null
          category: string
          created_at: string
          currency: string
          file_count: number
          hero_emoji: string | null
          hero_icon: string | null
          hero_image_url: string | null
          id: string
          is_coming_soon: boolean
          long_description: string | null
          name: string
          preview_image_urls: string[]
          price_cents: number
          sample_preview_url: string | null
          short_description: string | null
          slug: string
          sort_order: number
          status: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          uds_framing: string | null
          updated_at: string
          whats_inside: Json
          who_its_for: Json
        }
        Insert: {
          bullets?: Json
          buyer_guidance?: string | null
          category: string
          created_at?: string
          currency?: string
          file_count?: number
          hero_emoji?: string | null
          hero_icon?: string | null
          hero_image_url?: string | null
          id?: string
          is_coming_soon?: boolean
          long_description?: string | null
          name: string
          preview_image_urls?: string[]
          price_cents: number
          sample_preview_url?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          uds_framing?: string | null
          updated_at?: string
          whats_inside?: Json
          who_its_for?: Json
        }
        Update: {
          bullets?: Json
          buyer_guidance?: string | null
          category?: string
          created_at?: string
          currency?: string
          file_count?: number
          hero_emoji?: string | null
          hero_icon?: string | null
          hero_image_url?: string | null
          id?: string
          is_coming_soon?: boolean
          long_description?: string | null
          name?: string
          preview_image_urls?: string[]
          price_cents?: number
          sample_preview_url?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          uds_framing?: string | null
          updated_at?: string
          whats_inside?: Json
          who_its_for?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          environment: string
          id: string
          organization_id: string
          plan: string
          renews_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          organization_id: string
          plan?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          organization_id?: string
          plan?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      admin_delete_organization: {
        Args: { _org_id: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: never
        Returns: {
          auth_created_at: string
          email: string
          email_confirmed_at: string
          full_name: string
          id: string
          last_sign_in_at: string
          organization_id: string
          organization_name: string
          profile_created_at: string
          profile_updated_at: string
          staff_role: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_cron_secret: { Args: never; Returns: string }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_founder_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      org_access_status: { Args: { _org_id: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reset_stale_generating_drafts: { Args: never; Returns: number }
      seed_demo_data: { Args: { org_id: string }; Returns: undefined }
      slugify: { Args: { input: string }; Returns: string }
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
