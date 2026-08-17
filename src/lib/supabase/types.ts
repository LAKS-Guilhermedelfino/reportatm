/**
 * Tipos do schema Postgres, escritos à mão a partir de supabase/migrations/
 * (sem Docker/login disponíveis para `supabase gen types` neste ambiente).
 * Ao rodar `supabase login` + `supabase gen types --linked` no futuro,
 * pode substituir este arquivo pelo gerado — a forma é a mesma.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "gestora" | "consultora";
export type GoalPeriodType = "monthly" | "biweekly" | "weekly" | "daily";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          active: boolean;
          started_at: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          active?: boolean;
          started_at?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          company_id: string;
          consultant_id: string;
          report_date: string;
          filled_at: string | null;
          filled_by: string | null;
          late: boolean;
          notes: string | null;
          new_leads_received: number;
          new_leads_contacted: number;
          old_leads_contacted: number;
          old_leads_replied: number;
          followup_cold_done: number;
          followup_cold_replied: number;
          followup_warm_done: number;
          followup_warm_replied: number;
          followup_hot_done: number;
          followup_hot_replied: number;
          calls_made: number;
          calls_answered: number;
          meetings_scheduled: number;
          meetings_held: number;
          quotes_sent: number;
          negotiations_open: number;
          proposals_submitted: number;
          sales_closed: number;
          sales_amount_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          consultant_id: string;
          report_date: string;
          filled_at?: string | null;
          filled_by?: string | null;
          late?: boolean;
          notes?: string | null;
          new_leads_received?: number;
          new_leads_contacted?: number;
          old_leads_contacted?: number;
          old_leads_replied?: number;
          followup_cold_done?: number;
          followup_cold_replied?: number;
          followup_warm_done?: number;
          followup_warm_replied?: number;
          followup_hot_done?: number;
          followup_hot_replied?: number;
          calls_made?: number;
          calls_answered?: number;
          meetings_scheduled?: number;
          meetings_held?: number;
          quotes_sent?: number;
          negotiations_open?: number;
          proposals_submitted?: number;
          sales_closed?: number;
          sales_amount_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_reports"]["Insert"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          company_id: string;
          consultant_id: string | null;
          period_type: GoalPeriodType;
          period_start: string;
          period_end: string;
          goal_followup_cold: number | null;
          goal_followup_warm: number | null;
          goal_followup_hot: number | null;
          goal_calls_made: number | null;
          goal_meetings_scheduled: number | null;
          goal_meetings_held: number | null;
          goal_proposals_submitted: number | null;
          goal_sales_closed: number | null;
          goal_sales_amount_cents: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          consultant_id?: string | null;
          period_type: GoalPeriodType;
          period_start: string;
          period_end: string;
          goal_followup_cold?: number | null;
          goal_followup_warm?: number | null;
          goal_followup_hot?: number | null;
          goal_calls_made?: number | null;
          goal_meetings_scheduled?: number | null;
          goal_meetings_held?: number | null;
          goal_proposals_submitted?: number | null;
          goal_sales_closed?: number | null;
          goal_sales_amount_cents?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
        Relationships: [];
      };
      business_days: {
        Row: {
          id: string;
          company_id: string;
          weekday_mask: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          weekday_mask?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_days"]["Insert"]>;
        Relationships: [];
      };
      holidays: {
        Row: {
          id: string;
          company_id: string;
          date: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          date: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["holidays"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          company_id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string;
          before: Json | null;
          after: Json | null;
          created_at: string;
          updated_at: string;
        };
        // Só escrito pelas triggers SECURITY DEFINER (ver
        // 20260813183603_audit_triggers.sql) — nenhum papel tem policy de
        // INSERT/UPDATE, então não há Insert/Update viável pelo client.
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
