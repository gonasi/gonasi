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
  pgmq_public: {
    Tables: {
      [_ in never]: never
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
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          created_at: string | null
          credits_used: number
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used: number
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      block_progress: {
        Row: {
          attempt_count: number | null
          block_content_version: number | null
          block_id: string
          block_published_at: string | null
          block_weight: number
          chapter_id: string
          completed_at: string
          created_at: string
          earned_score: number | null
          id: string
          interaction_data: Json | null
          is_completed: boolean
          last_response: Json | null
          lesson_id: string
          lesson_progress_id: string
          organization_id: string
          progress_percentage: number | null
          published_course_id: string
          started_at: string
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          block_content_version?: number | null
          block_id: string
          block_published_at?: string | null
          block_weight?: number
          chapter_id: string
          completed_at?: string
          created_at?: string
          earned_score?: number | null
          id?: string
          interaction_data?: Json | null
          is_completed?: boolean
          last_response?: Json | null
          lesson_id: string
          lesson_progress_id: string
          organization_id: string
          progress_percentage?: number | null
          published_course_id: string
          started_at?: string
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          block_content_version?: number | null
          block_id?: string
          block_published_at?: string | null
          block_weight?: number
          chapter_id?: string
          completed_at?: string
          created_at?: string
          earned_score?: number | null
          id?: string
          interaction_data?: Json | null
          is_completed?: boolean
          last_response?: Json | null
          lesson_id?: string
          lesson_progress_id?: string
          organization_id?: string
          progress_percentage?: number | null
          published_course_id?: string
          started_at?: string
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_progress_lesson_progress_id_fkey"
            columns: ["lesson_progress_id"]
            isOneToOne: false
            referencedRelation: "lesson_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_progress_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_progress: {
        Row: {
          chapter_content_version: number | null
          chapter_id: string
          completed_at: string | null
          completed_blocks: number
          completed_lesson_weight: number
          completed_lessons: number
          completed_weight: number
          course_progress_id: string
          created_at: string
          id: string
          is_completed: boolean
          last_recalculated_at: string | null
          lesson_progress_percentage: number | null
          progress_percentage: number | null
          published_course_id: string
          total_blocks: number
          total_lesson_weight: number
          total_lessons: number
          total_weight: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_content_version?: number | null
          chapter_id: string
          completed_at?: string | null
          completed_blocks?: number
          completed_lesson_weight?: number
          completed_lessons?: number
          completed_weight?: number
          course_progress_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          last_recalculated_at?: string | null
          lesson_progress_percentage?: number | null
          progress_percentage?: number | null
          published_course_id: string
          total_blocks: number
          total_lesson_weight?: number
          total_lessons: number
          total_weight?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_content_version?: number | null
          chapter_id?: string
          completed_at?: string | null
          completed_blocks?: number
          completed_lesson_weight?: number
          completed_lessons?: number
          completed_weight?: number
          course_progress_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          last_recalculated_at?: string | null
          lesson_progress_percentage?: number | null
          progress_percentage?: number | null
          published_course_id?: string
          total_blocks?: number
          total_lesson_weight?: number
          total_lessons?: number
          total_weight?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_progress_course_progress_id_fkey"
            columns: ["course_progress_id"]
            isOneToOne: false
            referencedRelation: "course_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_progress_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          content_version: number
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          position: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_version?: number
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          position?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_version?: number
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          position?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_membership_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          enrollment_id: string
          id: string
          new_cohort_id: string | null
          old_cohort_id: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          enrollment_id: string
          id?: string
          new_cohort_id?: string | null
          old_cohort_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          enrollment_id?: string
          id?: string
          new_cohort_id?: string | null
          old_cohort_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_membership_history_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_membership_history_new_cohort_id_fkey"
            columns: ["new_cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_membership_history_old_cohort_id_fkey"
            columns: ["old_cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string
          created_by: string | null
          current_enrollment_count: number
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          max_enrollment: number | null
          name: string
          organization_id: string
          published_course_id: string
          start_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_enrollment_count?: number
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_enrollment?: number | null
          name: string
          organization_id: string
          published_course_id: string
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_enrollment_count?: number
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_enrollment?: number | null
          name?: string
          organization_id?: string
          published_course_id?: string
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          course_count: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_count?: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      course_editors: {
        Row: {
          added_at: string
          added_by: string | null
          course_id: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          course_id: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          course_id?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_editors_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_editors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_editors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_editors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollment_activities: {
        Row: {
          access_end: string
          access_start: string
          created_at: string
          created_by: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          enrollment_id: string
          id: string
          is_free: boolean
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          price_paid: number
          promotional_price: number | null
          tier_description: string | null
          tier_name: string | null
          was_promotional: boolean
        }
        Insert: {
          access_end: string
          access_start: string
          created_at?: string
          created_by: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          enrollment_id: string
          id?: string
          is_free: boolean
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          price_paid?: number
          promotional_price?: number | null
          tier_description?: string | null
          tier_name?: string | null
          was_promotional?: boolean
        }
        Update: {
          access_end?: string
          access_start?: string
          created_at?: string
          created_by?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          enrollment_id?: string
          id?: string
          is_free?: boolean
          payment_frequency?: Database["public"]["Enums"]["payment_frequency"]
          price_paid?: number
          promotional_price?: number | null
          tier_description?: string | null
          tier_name?: string | null
          was_promotional?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollment_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollment_activities_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          cohort_id: string | null
          completed_at: string | null
          created_at: string
          enrolled_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          published_course_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          published_course_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          published_course_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          cohort_id: string | null
          created_at: string
          delivery_logs: Json
          delivery_status: Database["public"]["Enums"]["invite_delivery_status"]
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_sent_at: string
          organization_id: string
          pricing_tier_id: string | null
          published_course_id: string
          resend_count: number
          revoked_at: string | null
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          cohort_id?: string | null
          created_at?: string
          delivery_logs?: Json
          delivery_status?: Database["public"]["Enums"]["invite_delivery_status"]
          email: string
          expires_at: string
          id?: string
          invited_by: string
          last_sent_at?: string
          organization_id: string
          pricing_tier_id?: string | null
          published_course_id: string
          resend_count?: number
          revoked_at?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          cohort_id?: string | null
          created_at?: string
          delivery_logs?: Json
          delivery_status?: Database["public"]["Enums"]["invite_delivery_status"]
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          last_sent_at?: string
          organization_id?: string
          pricing_tier_id?: string | null
          published_course_id?: string
          resend_count?: number
          revoked_at?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_invites_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_invites_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "course_pricing_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_invites_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_payments: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          enrollment_activity_id: string
          enrollment_id: string
          id: string
          net_amount: number
          org_payout_amount: number
          organization_id: string
          payment_intent_id: string | null
          payment_metadata: Json | null
          payment_method: string
          payment_processor_fee: number | null
          payment_processor_id: string | null
          payout_processed_at: string | null
          platform_fee: number
          platform_fee_percent: number
          refund_amount: number | null
          refund_reason: string | null
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          created_by: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          enrollment_activity_id: string
          enrollment_id: string
          id?: string
          net_amount: number
          org_payout_amount: number
          organization_id: string
          payment_intent_id?: string | null
          payment_metadata?: Json | null
          payment_method: string
          payment_processor_fee?: number | null
          payment_processor_id?: string | null
          payout_processed_at?: string | null
          platform_fee: number
          platform_fee_percent: number
          refund_amount?: number | null
          refund_reason?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          enrollment_activity_id?: string
          enrollment_id?: string
          id?: string
          net_amount?: number
          org_payout_amount?: number
          organization_id?: string
          payment_intent_id?: string | null
          payment_metadata?: Json | null
          payment_method?: string
          payment_processor_fee?: number | null
          payment_processor_id?: string | null
          payout_processed_at?: string | null
          platform_fee?: number
          platform_fee_percent?: number
          refund_amount?: number | null
          refund_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_payments_enrollment_activity_id_fkey"
            columns: ["enrollment_activity_id"]
            isOneToOne: false
            referencedRelation: "course_enrollment_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_pricing_tiers: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          is_active: boolean
          is_free: boolean
          is_popular: boolean
          is_recommended: boolean
          organization_id: string
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          position: number
          price: number
          pricing_version: number
          promotion_end_date: string | null
          promotion_start_date: string | null
          promotional_price: number | null
          tier_description: string | null
          tier_name: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean
          is_free?: boolean
          is_popular?: boolean
          is_recommended?: boolean
          organization_id: string
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          position?: number
          price: number
          pricing_version?: number
          promotion_end_date?: string | null
          promotion_start_date?: string | null
          promotional_price?: number | null
          tier_description?: string | null
          tier_name?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean
          is_free?: boolean
          is_popular?: boolean
          is_recommended?: boolean
          organization_id?: string
          payment_frequency?: Database["public"]["Enums"]["payment_frequency"]
          position?: number
          price?: number
          pricing_version?: number
          promotion_end_date?: string | null
          promotion_start_date?: string | null
          promotional_price?: number | null
          tier_description?: string | null
          tier_name?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_pricing_tiers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_pricing_tiers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_pricing_tiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_pricing_tiers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          completed_blocks: number
          completed_chapters: number
          completed_lesson_weight: number
          completed_lessons: number
          completed_weight: number
          created_at: string
          id: string
          is_completed: boolean
          last_recalculated_at: string | null
          lesson_progress_percentage: number | null
          progress_percentage: number | null
          published_course_id: string
          total_blocks: number
          total_chapters: number
          total_lesson_weight: number
          total_lessons: number
          total_weight: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_blocks?: number
          completed_chapters?: number
          completed_lesson_weight?: number
          completed_lessons?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          last_recalculated_at?: string | null
          lesson_progress_percentage?: number | null
          progress_percentage?: number | null
          published_course_id: string
          total_blocks: number
          total_chapters: number
          total_lesson_weight?: number
          total_lessons: number
          total_weight?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_blocks?: number
          completed_chapters?: number
          completed_lesson_weight?: number
          completed_lessons?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          last_recalculated_at?: string | null
          lesson_progress_percentage?: number | null
          progress_percentage?: number | null
          published_course_id?: string
          total_blocks?: number
          total_chapters?: number
          total_lesson_weight?: number
          total_lessons?: number
          total_weight?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sub_categories: {
        Row: {
          category_id: string
          course_count: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id: string
          course_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          course_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          blur_hash: string | null
          category_id: string | null
          content_version: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          last_published: string | null
          last_update_types:
            | Database["public"]["Enums"]["course_update_type"][]
            | null
          name: string
          organization_id: string | null
          overview_version: number
          pricing_version: number
          subcategory_id: string | null
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["course_access"]
        }
        Insert: {
          blur_hash?: string | null
          category_id?: string | null
          content_version?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_published?: string | null
          last_update_types?:
            | Database["public"]["Enums"]["course_update_type"][]
            | null
          name: string
          organization_id?: string | null
          overview_version?: number
          pricing_version?: number
          subcategory_id?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Update: {
          blur_hash?: string | null
          category_id?: string | null
          content_version?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_published?: string | null
          last_update_types?:
            | Database["public"]["Enums"]["course_update_type"][]
            | null
          name?: string
          organization_id?: string | null
          overview_version?: number
          pricing_version?: number
          subcategory_id?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "course_sub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_downgrade_attempts: {
        Row: {
          attempted_at: string
          created_at: string
          failure_type: string
          id: string
          last_retry_at: string | null
          metadata: Json
          next_retry_at: string | null
          organization_id: string
          resolution_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number
          severity: string
          updated_at: string
        }
        Insert: {
          attempted_at?: string
          created_at?: string
          failure_type: string
          id?: string
          last_retry_at?: string | null
          metadata?: Json
          next_retry_at?: string | null
          organization_id: string
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
          severity?: string
          updated_at?: string
        }
        Update: {
          attempted_at?: string
          created_at?: string
          failure_type?: string
          id?: string
          last_retry_at?: string | null
          metadata?: Json
          next_retry_at?: string | null
          organization_id?: string
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "failed_downgrade_attempts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      file_library: {
        Row: {
          blur_preview: string | null
          course_id: string
          created_at: string
          created_by: string | null
          extension: string
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          mime_type: string
          name: string
          organization_id: string
          path: string
          settings: Json | null
          size: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blur_preview?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          extension: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          mime_type: string
          name: string
          organization_id: string
          path: string
          settings?: Json | null
          size: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blur_preview?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          extension?: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string
          path?: string
          settings?: Json | null
          size?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_library_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_library_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gonasi_wallets: {
        Row: {
          balance_reserved: number
          balance_total: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          updated_at: string
        }
        Insert: {
          balance_reserved?: number
          balance_total?: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id?: string
          updated_at?: string
        }
        Update: {
          balance_reserved?: number
          balance_total?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_blocks: {
        Row: {
          chapter_id: string
          content: Json
          content_version: number
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          lesson_id: string
          organization_id: string
          plugin_type: string
          position: number
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chapter_id: string
          content?: Json
          content_version?: number
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_id: string
          organization_id: string
          plugin_type: string
          position?: number
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chapter_id?: string
          content?: Json
          content_version?: number
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_id?: string
          organization_id?: string
          plugin_type?: string
          position?: number
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          chapter_progress_id: string
          completed_at: string | null
          completed_blocks: number
          completed_weight: number
          created_at: string
          id: string
          is_completed: boolean
          last_recalculated_at: string | null
          lesson_content_version: number | null
          lesson_id: string
          progress_percentage: number | null
          published_course_id: string
          total_blocks: number
          total_weight: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_progress_id: string
          completed_at?: string | null
          completed_blocks?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          last_recalculated_at?: string | null
          lesson_content_version?: number | null
          lesson_id: string
          progress_percentage?: number | null
          published_course_id: string
          total_blocks: number
          total_weight?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_progress_id?: string
          completed_at?: string | null
          completed_blocks?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          last_recalculated_at?: string | null
          lesson_content_version?: number | null
          lesson_id?: string
          progress_percentage?: number | null
          published_course_id?: string
          total_blocks?: number
          total_weight?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_chapter_progress_id_fkey"
            columns: ["chapter_progress_id"]
            isOneToOne: false
            referencedRelation: "chapter_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reset_count: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          published_course_id: string
          reset_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          published_course_id: string
          reset_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          published_course_id?: string
          reset_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reset_count_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reset_count_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_types: {
        Row: {
          bg_color: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          lucide_icon: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bg_color: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          lucide_icon: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bg_color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          lucide_icon?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          chapter_id: string
          content_version: number
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          lesson_type_id: string
          name: string
          organization_id: string
          position: number | null
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chapter_id: string
          content_version?: number
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_type_id: string
          name: string
          organization_id: string
          position?: number | null
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chapter_id?: string
          content_version?: number
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_type_id?: string
          name?: string
          organization_id?: string
          position?: number | null
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_lesson_type_id_fkey"
            columns: ["lesson_type_id"]
            isOneToOne: false
            referencedRelation: "lesson_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_analytics: {
        Row: {
          accuracy_rate: number | null
          average_participants: number | null
          average_response_time_ms: number | null
          average_score: number | null
          created_at: string
          highest_score: number | null
          id: string
          live_session_id: string
          lowest_score: number | null
          median_response_time_ms: number | null
          median_score: number | null
          organization_id: string
          participation_rate: number | null
          peak_participants: number
          session_duration_seconds: number | null
          total_participants: number
          total_responses: number
          updated_at: string
        }
        Insert: {
          accuracy_rate?: number | null
          average_participants?: number | null
          average_response_time_ms?: number | null
          average_score?: number | null
          created_at?: string
          highest_score?: number | null
          id?: string
          live_session_id: string
          lowest_score?: number | null
          median_response_time_ms?: number | null
          median_score?: number | null
          organization_id: string
          participation_rate?: number | null
          peak_participants?: number
          session_duration_seconds?: number | null
          total_participants?: number
          total_responses?: number
          updated_at?: string
        }
        Update: {
          accuracy_rate?: number | null
          average_participants?: number | null
          average_response_time_ms?: number | null
          average_score?: number | null
          created_at?: string
          highest_score?: number | null
          id?: string
          live_session_id?: string
          lowest_score?: number | null
          median_response_time_ms?: number | null
          median_score?: number | null
          organization_id?: string
          participation_rate?: number | null
          peak_participants?: number
          session_duration_seconds?: number | null
          total_participants?: number
          total_responses?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_analytics_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: true
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_blocks: {
        Row: {
          activated_at: string | null
          average_response_time_ms: number | null
          closed_at: string | null
          content: Json
          correct_responses: number
          created_at: string
          created_by: string
          id: string
          live_session_id: string
          organization_id: string
          plugin_type: string
          position: number
          settings: Json
          status: Database["public"]["Enums"]["live_session_block_status"]
          time_limit: number | null
          total_responses: number
          updated_at: string
          updated_by: string | null
          weight: number
        }
        Insert: {
          activated_at?: string | null
          average_response_time_ms?: number | null
          closed_at?: string | null
          content?: Json
          correct_responses?: number
          created_at?: string
          created_by: string
          id?: string
          live_session_id: string
          organization_id: string
          plugin_type: string
          position?: number
          settings?: Json
          status?: Database["public"]["Enums"]["live_session_block_status"]
          time_limit?: number | null
          total_responses?: number
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Update: {
          activated_at?: string | null
          average_response_time_ms?: number | null
          closed_at?: string | null
          content?: Json
          correct_responses?: number
          created_at?: string
          created_by?: string
          id?: string
          live_session_id?: string
          organization_id?: string
          plugin_type?: string
          position?: number
          settings?: Json
          status?: Database["public"]["Enums"]["live_session_block_status"]
          time_limit?: number | null
          total_responses?: number
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_session_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_blocks_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_facilitators: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          live_session_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          live_session_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          live_session_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_facilitators_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_facilitators_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_facilitators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_facilitators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          is_instructor: boolean
          is_pinned: boolean
          live_session_id: string
          message: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          is_instructor?: boolean
          is_pinned?: boolean
          live_session_id: string
          message: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          is_instructor?: boolean
          is_pinned?: boolean
          live_session_id?: string
          message?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_messages_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_participants: {
        Row: {
          average_response_time_ms: number | null
          correct_responses: number
          created_at: string
          display_name: string | null
          id: string
          joined_at: string
          left_at: string | null
          live_session_id: string
          organization_id: string
          rank: number | null
          status: Database["public"]["Enums"]["live_participant_status"]
          total_responses: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_response_time_ms?: number | null
          correct_responses?: number
          created_at?: string
          display_name?: string | null
          id?: string
          joined_at?: string
          left_at?: string | null
          live_session_id: string
          organization_id: string
          rank?: number | null
          status?: Database["public"]["Enums"]["live_participant_status"]
          total_responses?: number
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_response_time_ms?: number | null
          correct_responses?: number
          created_at?: string
          display_name?: string | null
          id?: string
          joined_at?: string
          left_at?: string | null
          live_session_id?: string
          organization_id?: string
          rank?: number | null
          status?: Database["public"]["Enums"]["live_participant_status"]
          total_responses?: number
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_participants_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          live_session_block_id: string | null
          live_session_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          live_session_block_id?: string | null
          live_session_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          live_session_block_id?: string | null
          live_session_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_reactions_live_session_block_id_fkey"
            columns: ["live_session_block_id"]
            isOneToOne: false
            referencedRelation: "live_session_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_reactions_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_reactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_responses: {
        Row: {
          created_at: string
          id: string
          live_session_block_id: string
          live_session_id: string
          max_score: number
          organization_id: string
          participant_id: string
          response_data: Json
          response_time_ms: number
          score_earned: number
          status: Database["public"]["Enums"]["live_response_status"]
          submitted_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          live_session_block_id: string
          live_session_id: string
          max_score: number
          organization_id: string
          participant_id: string
          response_data: Json
          response_time_ms: number
          score_earned?: number
          status: Database["public"]["Enums"]["live_response_status"]
          submitted_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          live_session_block_id?: string
          live_session_id?: string
          max_score?: number
          organization_id?: string
          participant_id?: string
          response_data?: Json
          response_time_ms?: number
          score_earned?: number
          status?: Database["public"]["Enums"]["live_response_status"]
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_responses_live_session_block_id_fkey"
            columns: ["live_session_block_id"]
            isOneToOne: false
            referencedRelation: "live_session_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_responses_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "live_session_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          actual_start_time: string | null
          allow_late_join: boolean
          blur_hash: string | null
          course_id: string | null
          created_at: string
          created_by: string
          description: string | null
          enable_chat: boolean
          enable_reactions: boolean
          ended_at: string | null
          id: string
          image_url: string | null
          max_participants: number | null
          name: string
          organization_id: string
          published_course_id: string | null
          scheduled_start_time: string | null
          session_code: string
          session_key: string | null
          show_leaderboard: boolean
          status: Database["public"]["Enums"]["live_session_status"]
          time_limit_per_question: number | null
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["live_session_visibility"]
        }
        Insert: {
          actual_start_time?: string | null
          allow_late_join?: boolean
          blur_hash?: string | null
          course_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          enable_chat?: boolean
          enable_reactions?: boolean
          ended_at?: string | null
          id?: string
          image_url?: string | null
          max_participants?: number | null
          name: string
          organization_id: string
          published_course_id?: string | null
          scheduled_start_time?: string | null
          session_code: string
          session_key?: string | null
          show_leaderboard?: boolean
          status?: Database["public"]["Enums"]["live_session_status"]
          time_limit_per_question?: number | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["live_session_visibility"]
        }
        Update: {
          actual_start_time?: string | null
          allow_late_join?: boolean
          blur_hash?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          enable_chat?: boolean
          enable_reactions?: boolean
          ended_at?: string | null
          id?: string
          image_url?: string | null
          max_participants?: number | null
          name?: string
          organization_id?: string
          published_course_id?: string | null
          scheduled_start_time?: string | null
          session_code?: string
          session_key?: string | null
          show_leaderboard?: boolean
          status?: Database["public"]["Enums"]["live_session_status"]
          time_limit_per_question?: number | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["live_session_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_notification_reads: {
        Row: {
          dismissed_at: string | null
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          dismissed_at?: string | null
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          dismissed_at?: string | null
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "org_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_notifications: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          delivered_email: boolean
          delivered_in_app: boolean
          email_job_id: string | null
          id: string
          key: Database["public"]["Enums"]["org_notification_key"]
          link: string | null
          organization_id: string
          payload: Json
          performed_by: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          delivered_email?: boolean
          delivered_in_app?: boolean
          email_job_id?: string | null
          id?: string
          key: Database["public"]["Enums"]["org_notification_key"]
          link?: string | null
          organization_id: string
          payload?: Json
          performed_by?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          delivered_email?: boolean
          delivered_in_app?: boolean
          email_job_id?: string | null
          id?: string
          key?: Database["public"]["Enums"]["org_notification_key"]
          link?: string | null
          organization_id?: string
          payload?: Json
          performed_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_notifications_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_notifications_types: {
        Row: {
          body_template: string
          category: Database["public"]["Enums"]["org_notification_category"]
          created_at: string
          default_email: boolean
          default_in_app: boolean
          id: string
          key: Database["public"]["Enums"]["org_notification_key"]
          title_template: string
          visible_to_admin: boolean
          visible_to_editor: boolean
          visible_to_owner: boolean
        }
        Insert: {
          body_template: string
          category: Database["public"]["Enums"]["org_notification_category"]
          created_at?: string
          default_email?: boolean
          default_in_app?: boolean
          id?: string
          key: Database["public"]["Enums"]["org_notification_key"]
          title_template: string
          visible_to_admin?: boolean
          visible_to_editor?: boolean
          visible_to_owner?: boolean
        }
        Update: {
          body_template?: string
          category?: Database["public"]["Enums"]["org_notification_category"]
          created_at?: string
          default_email?: boolean
          default_in_app?: boolean
          id?: string
          key?: Database["public"]["Enums"]["org_notification_key"]
          title_template?: string
          visible_to_admin?: boolean
          visible_to_editor?: boolean
          visible_to_owner?: boolean
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          delivery_logs: Json
          delivery_status: Database["public"]["Enums"]["invite_delivery_status"]
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_sent_at: string
          organization_id: string
          resend_count: number
          revoked_at: string | null
          role: Database["public"]["Enums"]["org_role"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          delivery_logs?: Json
          delivery_status?: Database["public"]["Enums"]["invite_delivery_status"]
          email: string
          expires_at: string
          id?: string
          invited_by: string
          last_sent_at?: string
          organization_id: string
          resend_count?: number
          revoked_at?: string | null
          role: Database["public"]["Enums"]["org_role"]
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          delivery_logs?: Json
          delivery_status?: Database["public"]["Enums"]["invite_delivery_status"]
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          last_sent_at?: string
          organization_id?: string
          resend_count?: number
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          created_by: string | null
          current_period_end: string | null
          current_period_start: string
          downgrade_effective_at: string | null
          downgrade_executed_at: string | null
          downgrade_requested_at: string | null
          downgrade_requested_by: string | null
          id: string
          initial_next_payment_date: string | null
          next_payment_date: string | null
          next_plan_code: string | null
          next_tier: Database["public"]["Enums"]["subscription_tier"] | null
          organization_id: string
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          revert_tier: Database["public"]["Enums"]["subscription_tier"] | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          current_period_start?: string
          downgrade_effective_at?: string | null
          downgrade_executed_at?: string | null
          downgrade_requested_at?: string | null
          downgrade_requested_by?: string | null
          id?: string
          initial_next_payment_date?: string | null
          next_payment_date?: string | null
          next_plan_code?: string | null
          next_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          organization_id: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          revert_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          current_period_start?: string
          downgrade_effective_at?: string | null
          downgrade_executed_at?: string | null
          downgrade_requested_at?: string | null
          downgrade_requested_by?: string | null
          id?: string
          initial_next_payment_date?: string | null
          next_payment_date?: string | null
          next_plan_code?: string | null
          next_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          organization_id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          revert_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_next_tier_fkey"
            columns: ["next_tier"]
            isOneToOne: false
            referencedRelation: "tier_limits"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_revert_tier_fkey"
            columns: ["revert_tier"]
            isOneToOne: false
            referencedRelation: "tier_limits"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "organization_subscriptions_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "tier_limits"
            referencedColumns: ["tier"]
          },
        ]
      }
      organization_wallets: {
        Row: {
          balance_reserved: number
          balance_total: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance_reserved?: number
          balance_total?: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance_reserved?: number
          balance_total?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          avatar_url: string | null
          banner_blur_hash: string | null
          banner_url: string | null
          blur_hash: string | null
          created_at: string
          created_by: string | null
          deleted_by: string | null
          description: string | null
          email: string | null
          email_verified: boolean
          handle: string
          id: string
          is_public: boolean
          is_verified: boolean
          location: string | null
          name: string
          owned_by: string | null
          phone_number: string | null
          phone_number_verified: boolean
          updated_at: string
          updated_by: string | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_blur_hash?: string | null
          banner_url?: string | null
          blur_hash?: string | null
          created_at?: string
          created_by?: string | null
          deleted_by?: string | null
          description?: string | null
          email?: string | null
          email_verified?: boolean
          handle: string
          id?: string
          is_public?: boolean
          is_verified?: boolean
          location?: string | null
          name: string
          owned_by?: string | null
          phone_number?: string | null
          phone_number_verified?: boolean
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_blur_hash?: string | null
          banner_url?: string | null
          blur_hash?: string | null
          created_at?: string
          created_by?: string | null
          deleted_by?: string | null
          description?: string | null
          email?: string | null
          email_verified?: boolean
          handle?: string
          id?: string
          is_public?: boolean
          is_verified?: boolean
          location?: string | null
          name?: string
          owned_by?: string | null
          phone_number?: string | null
          phone_number_verified?: boolean
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owned_by_fkey"
            columns: ["owned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_ai_credits: {
        Row: {
          base_credits_remaining: number
          base_credits_total: number
          last_reset_at: string
          next_reset_at: string
          org_id: string
          purchased_credits_remaining: number
          purchased_credits_total: number
          updated_at: string
        }
        Insert: {
          base_credits_remaining?: number
          base_credits_total?: number
          last_reset_at?: string
          next_reset_at?: string
          org_id: string
          purchased_credits_remaining?: number
          purchased_credits_total?: number
          updated_at?: string
        }
        Update: {
          base_credits_remaining?: number
          base_credits_total?: number
          last_reset_at?: string
          next_reset_at?: string
          org_id?: string
          purchased_credits_remaining?: number
          purchased_credits_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_ai_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_verified: boolean
          active_organization_id: string | null
          avatar_url: string | null
          blur_hash: string | null
          country_code: string | null
          created_at: string
          email: string
          email_verified: boolean
          full_name: string | null
          id: string
          is_public: boolean
          mode: Database["public"]["Enums"]["profile_mode"]
          notifications_enabled: boolean
          phone_number: string | null
          phone_number_verified: boolean
          preferred_language: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_verified?: boolean
          active_organization_id?: string | null
          avatar_url?: string | null
          blur_hash?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          full_name?: string | null
          id: string
          is_public?: boolean
          mode?: Database["public"]["Enums"]["profile_mode"]
          notifications_enabled?: boolean
          phone_number?: string | null
          phone_number_verified?: boolean
          preferred_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_verified?: boolean
          active_organization_id?: string | null
          avatar_url?: string | null
          blur_hash?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          full_name?: string | null
          id?: string
          is_public?: boolean
          mode?: Database["public"]["Enums"]["profile_mode"]
          notifications_enabled?: boolean
          phone_number?: string | null
          phone_number_verified?: boolean
          preferred_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      published_course_structure_content: {
        Row: {
          course_structure_content: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          course_structure_content: Json
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          course_structure_content?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_course_structure_content_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      published_courses: {
        Row: {
          active_enrollments: number
          average_rating: number | null
          blur_hash: string | null
          category_id: string | null
          completion_rate: number | null
          content_changed_at: string | null
          content_version: number
          course_structure_overview: Json
          created_at: string
          description: string
          has_free_tier: boolean | null
          id: string
          image_url: string
          is_active: boolean
          last_update_types:
            | Database["public"]["Enums"]["course_update_type"][]
            | null
          min_price: number | null
          name: string
          organization_id: string
          overview_changed_at: string | null
          overview_version: number
          pricing_changed_at: string | null
          pricing_tiers: Json
          pricing_version: number
          published_at: string
          published_by: string
          subcategory_id: string | null
          total_blocks: number
          total_chapters: number
          total_enrollments: number
          total_lessons: number
          total_reviews: number
          updated_at: string
          version: number
          visibility: Database["public"]["Enums"]["course_access"]
        }
        Insert: {
          active_enrollments?: number
          average_rating?: number | null
          blur_hash?: string | null
          category_id?: string | null
          completion_rate?: number | null
          content_changed_at?: string | null
          content_version?: number
          course_structure_overview: Json
          created_at?: string
          description: string
          has_free_tier?: boolean | null
          id: string
          image_url: string
          is_active?: boolean
          last_update_types?:
            | Database["public"]["Enums"]["course_update_type"][]
            | null
          min_price?: number | null
          name: string
          organization_id: string
          overview_changed_at?: string | null
          overview_version?: number
          pricing_changed_at?: string | null
          pricing_tiers?: Json
          pricing_version?: number
          published_at?: string
          published_by: string
          subcategory_id?: string | null
          total_blocks: number
          total_chapters: number
          total_enrollments?: number
          total_lessons: number
          total_reviews?: number
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Update: {
          active_enrollments?: number
          average_rating?: number | null
          blur_hash?: string | null
          category_id?: string | null
          completion_rate?: number | null
          content_changed_at?: string | null
          content_version?: number
          course_structure_overview?: Json
          created_at?: string
          description?: string
          has_free_tier?: boolean | null
          id?: string
          image_url?: string
          is_active?: boolean
          last_update_types?:
            | Database["public"]["Enums"]["course_update_type"][]
            | null
          min_price?: number | null
          name?: string
          organization_id?: string
          overview_changed_at?: string | null
          overview_version?: number
          pricing_changed_at?: string | null
          pricing_tiers?: Json
          pricing_version?: number
          published_at?: string
          published_by?: string
          subcategory_id?: string | null
          total_blocks?: number
          total_chapters?: number
          total_enrollments?: number
          total_lessons?: number
          total_reviews?: number
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Relationships: [
          {
            foreignKeyName: "published_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_courses_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_courses_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_courses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "course_sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      published_file_library: {
        Row: {
          blur_preview: string | null
          course_id: string
          created_at: string
          created_by: string | null
          extension: string
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          mime_type: string
          name: string
          organization_id: string
          path: string
          settings: Json | null
          size: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blur_preview?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          extension: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          mime_type: string
          name: string
          organization_id: string
          path: string
          settings?: Json | null
          size: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blur_preview?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          extension?: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string
          path?: string
          settings?: Json | null
          size?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "published_file_library_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_file_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_file_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_file_library_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      tier_limits: {
        Row: {
          ai_tools_enabled: boolean
          ai_usage_limit_monthly: number
          analytics_level: Database["public"]["Enums"]["analytics_level"]
          created_at: string
          custom_domains_enabled: boolean
          max_custom_domains: number | null
          max_free_courses_per_org: number
          max_members_per_org: number
          paystack_plan_code: string | null
          paystack_plan_id: string | null
          plan_currency: string
          plan_interval: string
          platform_fee_percentage: number
          price_monthly_usd: number
          price_yearly_usd: number
          storage_limit_mb_per_org: number
          support_level: Database["public"]["Enums"]["support_level"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          white_label_enabled: boolean
        }
        Insert: {
          ai_tools_enabled?: boolean
          ai_usage_limit_monthly?: number
          analytics_level: Database["public"]["Enums"]["analytics_level"]
          created_at?: string
          custom_domains_enabled?: boolean
          max_custom_domains?: number | null
          max_free_courses_per_org: number
          max_members_per_org: number
          paystack_plan_code?: string | null
          paystack_plan_id?: string | null
          plan_currency?: string
          plan_interval?: string
          platform_fee_percentage?: number
          price_monthly_usd?: number
          price_yearly_usd?: number
          storage_limit_mb_per_org: number
          support_level: Database["public"]["Enums"]["support_level"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          white_label_enabled?: boolean
        }
        Update: {
          ai_tools_enabled?: boolean
          ai_usage_limit_monthly?: number
          analytics_level?: Database["public"]["Enums"]["analytics_level"]
          created_at?: string
          custom_domains_enabled?: boolean
          max_custom_domains?: number | null
          max_free_courses_per_org?: number
          max_members_per_org?: number
          paystack_plan_code?: string | null
          paystack_plan_id?: string | null
          plan_currency?: string
          plan_interval?: string
          platform_fee_percentage?: number
          price_monthly_usd?: number
          price_yearly_usd?: number
          storage_limit_mb_per_org?: number
          support_level?: Database["public"]["Enums"]["support_level"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          white_label_enabled?: boolean
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          delivered_email: boolean
          delivered_in_app: boolean
          email_job_id: string | null
          id: string
          key: Database["public"]["Enums"]["user_notification_key"]
          payload: Json
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          delivered_email?: boolean
          delivered_in_app?: boolean
          email_job_id?: string | null
          id?: string
          key: Database["public"]["Enums"]["user_notification_key"]
          payload?: Json
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          delivered_email?: boolean
          delivered_in_app?: boolean
          email_job_id?: string | null
          id?: string
          key?: Database["public"]["Enums"]["user_notification_key"]
          payload?: Json
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications_types: {
        Row: {
          body_template: string
          category: Database["public"]["Enums"]["user_notification_category"]
          created_at: string
          default_email: boolean
          default_in_app: boolean
          id: string
          key: Database["public"]["Enums"]["user_notification_key"]
          title_template: string
        }
        Insert: {
          body_template: string
          category: Database["public"]["Enums"]["user_notification_category"]
          created_at?: string
          default_email?: boolean
          default_in_app?: boolean
          id?: string
          key: Database["public"]["Enums"]["user_notification_key"]
          title_template: string
        }
        Update: {
          body_template?: string
          category?: Database["public"]["Enums"]["user_notification_category"]
          created_at?: string
          default_email?: boolean
          default_in_app?: boolean
          id?: string
          key?: Database["public"]["Enums"]["user_notification_key"]
          title_template?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount_paid: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          metadata: Json
          payment_reference: string
          published_course_id: string | null
          purchased_at: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["ledger_transaction_type"]
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id?: string
          metadata?: Json
          payment_reference: string
          published_course_id?: string | null
          purchased_at?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["ledger_transaction_type"]
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          metadata?: Json
          payment_reference?: string
          published_course_id?: string | null
          purchased_at?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["ledger_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_published_course_id_fkey"
            columns: ["published_course_id"]
            isOneToOne: false
            referencedRelation: "published_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance_reserved: number
          balance_total: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_reserved?: number
          balance_total?: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_reserved?: number
          balance_total?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          destination_wallet_id: string | null
          destination_wallet_type: Database["public"]["Enums"]["wallet_type"]
          direction: Database["public"]["Enums"]["transaction_direction"]
          id: string
          metadata: Json
          payment_reference: string
          related_entity_id: string | null
          related_entity_type: string | null
          source_wallet_id: string | null
          source_wallet_type: Database["public"]["Enums"]["wallet_type"]
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          destination_wallet_id?: string | null
          destination_wallet_type: Database["public"]["Enums"]["wallet_type"]
          direction: Database["public"]["Enums"]["transaction_direction"]
          id?: string
          metadata?: Json
          payment_reference: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source_wallet_id?: string | null
          source_wallet_type: Database["public"]["Enums"]["wallet_type"]
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          destination_wallet_id?: string | null
          destination_wallet_type?: Database["public"]["Enums"]["wallet_type"]
          direction?: Database["public"]["Enums"]["transaction_direction"]
          id?: string
          metadata?: Json
          payment_reference?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source_wallet_id?: string | null
          source_wallet_type?: Database["public"]["Enums"]["wallet_type"]
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Relationships: []
      }
    }
    Views: {
      v_organizations_ai_available_credits: {
        Row: {
          base_credits_remaining: number | null
          last_reset_at: string | null
          next_reset_at: string | null
          org_id: string | null
          purchased_credits_remaining: number | null
          total_available_credits: number | null
        }
        Insert: {
          base_credits_remaining?: number | null
          last_reset_at?: string | null
          next_reset_at?: string | null
          org_id?: string | null
          purchased_credits_remaining?: number | null
          total_available_credits?: never
        }
        Update: {
          base_credits_remaining?: number | null
          last_reset_at?: string | null
          next_reset_at?: string | null
          org_id?: string | null
          purchased_credits_remaining?: number | null
          total_available_credits?: never
        }
        Relationships: [
          {
            foreignKeyName: "organizations_ai_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_organization_invite: {
        Args: { invite_token: string; user_email: string; user_id: string }
        Returns: Json
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      calculate_access_end_date: {
        Args: {
          frequency: Database["public"]["Enums"]["payment_frequency"]
          start_date: string
        }
        Returns: string
      }
      calculate_leaderboard_ranks: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      can_accept_new_member: {
        Args: { arg_check_type?: string; arg_org_id: string }
        Returns: boolean
      }
      can_create_organization: {
        Args: { arg_user_id: string }
        Returns: boolean
      }
      can_publish_course: {
        Args: { course_id: string; org_id: string; user_id: string }
        Returns: boolean
      }
      can_publish_free_course: { Args: { p_org: string }; Returns: boolean }
      can_resend_course_invite: {
        Args: { p_invite_id: string }
        Returns: boolean
      }
      can_send_course_invite: {
        Args: { p_org_id: string; p_published_course_id: string }
        Returns: boolean
      }
      can_start_live_session: {
        Args: { arg_session_id: string }
        Returns: Json
      }
      can_switch_to_launch_tier: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      can_user_edit_course: {
        Args: { arg_course_id: string }
        Returns: boolean
      }
      can_user_edit_live_session: {
        Args: { arg_session_id: string }
        Returns: boolean
      }
      check_member_limit_for_org: {
        Args: { p_check_type?: string; p_organization_id: string }
        Returns: {
          active_members: number
          allowed: number
          check_type: string
          current: number
          exceeded: boolean
          pending_invites: number
          remaining: number
        }[]
      }
      check_storage_limit_for_org: {
        Args: {
          p_exclude_file_id?: string
          p_new_file_size: number
          p_org_id: string
        }
        Returns: Json
      }
      chk_org_storage_for_course: {
        Args: {
          course_id?: string
          net_storage_change_bytes: number
          org_id: string
        }
        Returns: Json
      }
      complete_block: {
        Args: {
          p_block_id: string
          p_chapter_id: string
          p_earned_score?: number
          p_interaction_data?: Json
          p_last_response?: Json
          p_lesson_id: string
          p_published_course_id: string
          p_time_spent_seconds?: number
        }
        Returns: Json
      }
      count_active_students: { Args: { org_id: string }; Returns: number }
      count_total_unique_students: { Args: { org_id: string }; Returns: number }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      delete_chapter: {
        Args: { p_chapter_id: string; p_deleted_by: string }
        Returns: undefined
      }
      delete_lesson: {
        Args: { p_deleted_by: string; p_lesson_id: string }
        Returns: undefined
      }
      delete_lesson_block: {
        Args: { p_block_id: string; p_deleted_by: string }
        Returns: undefined
      }
      delete_pricing_tier: {
        Args: { p_deleted_by: string; p_tier_id: string }
        Returns: undefined
      }
      detect_changed_blocks: {
        Args: { p_course_id: string; p_published_course_id: string }
        Returns: {
          block_id: string
          change_type: string
          chapter_id: string
          lesson_id: string
          new_version: number
          old_version: number
        }[]
      }
      determine_file_type: {
        Args: { extension: string }
        Returns: Database["public"]["Enums"]["file_type"]
      }
      dismiss_org_notification: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: undefined
      }
      enqueue_delete_course_progress: {
        Args: { course_id: string }
        Returns: undefined
      }
      enroll_user_in_free_course: {
        Args: {
          p_cohort_id?: string
          p_published_course_id: string
          p_tier_id: string
          p_user_id: string
        }
        Returns: Json
      }
      enroll_user_via_invite: {
        Args: {
          p_cohort_id?: string
          p_invite_id?: string
          p_published_course_id: string
          p_tier_id: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_session_code: { Args: never; Returns: string }
      get_active_organization_members: {
        Args: { _organization_id: string; _user_id: string }
        Returns: Json
      }
      get_available_payment_frequencies: {
        Args: { p_course_id: string }
        Returns: Database["public"]["Enums"]["payment_frequency"][]
      }
      get_completion_navigation_state: {
        Args: {
          course_structure: Json
          current_context: Record<string, unknown>
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_continue_navigation_state: {
        Args: {
          course_structure: Json
          current_context: Record<string, unknown>
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_course_navigation_info: {
        Args: {
          course_structure: Json
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_course_progress_overview: {
        Args: { p_published_course_id: string; p_user_id?: string }
        Returns: Json
      }
      get_current_navigation_state: {
        Args: {
          course_structure: Json
          current_context: Record<string, unknown>
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_effective_pricing_for_published_tier: {
        Args: { p_published_course_id: string; p_tier_id: string }
        Returns: {
          effective_price: number
          is_promotional: boolean
          promotional_price: number
        }[]
      }
      get_enrollment_status: {
        Args: { p_published_course_id: string; p_user_id: string }
        Returns: {
          days_remaining: number
          enrollment_id: string
          expires_at: string
          is_active: boolean
          is_enrolled: boolean
          latest_activity_id: string
        }[]
      }
      get_next_navigation_state: {
        Args: {
          course_structure: Json
          current_context: Record<string, unknown>
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_org_notifications_for_member: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_organization_id: string
          p_user_id: string
        }
        Returns: {
          body: string
          category: Database["public"]["Enums"]["org_notification_category"]
          created_at: string
          dismissed_at: string
          id: string
          is_dismissed: boolean
          is_read: boolean
          key: Database["public"]["Enums"]["org_notification_key"]
          link: string
          organization_id: string
          payload: Json
          read_at: string
          title: string
          visibility: Json
        }[]
      }
      get_org_tier: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_org_unread_count: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: number
      }
      get_organization_earnings_summary: {
        Args: { p_org_id: string }
        Returns: {
          balance_available: number
          balance_reserved: number
          balance_total: number
          currency_code: Database["public"]["Enums"]["currency_code"]
          current_month_earnings: number
          gross_earnings: number
          month_over_month_change: number
          month_over_month_percentage_change: number
          net_earnings: number
          organization_id: string
          previous_month_earnings: number
          total_fees: number
          trend: string
          wallet_id: string
        }[]
      }
      get_previous_navigation_state: {
        Args: {
          course_structure: Json
          current_context: Record<string, unknown>
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_published_course_pricing_tier: {
        Args: { p_published_course_id: string; p_tier_id: string }
        Returns: {
          currency_code: string
          is_active: boolean
          is_free: boolean
          is_popular: boolean
          is_recommended: boolean
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          position: number
          price: number
          promotion_end_date: string
          promotion_start_date: string
          promotional_price: number
          tier_description: string
          tier_id: string
          tier_name: string
        }[]
      }
      get_published_lesson_blocks: {
        Args: { p_chapter_id: string; p_course_id: string; p_lesson_id: string }
        Returns: Json
      }
      get_tier_limits: {
        Args: { p_org: string }
        Returns: {
          ai_tools_enabled: boolean
          ai_usage_limit_monthly: number
          analytics_level: Database["public"]["Enums"]["analytics_level"]
          created_at: string
          custom_domains_enabled: boolean
          max_custom_domains: number | null
          max_free_courses_per_org: number
          max_members_per_org: number
          paystack_plan_code: string | null
          paystack_plan_id: string | null
          plan_currency: string
          plan_interval: string
          platform_fee_percentage: number
          price_monthly_usd: number
          price_yearly_usd: number
          storage_limit_mb_per_org: number
          support_level: Database["public"]["Enums"]["support_level"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          white_label_enabled: boolean
        }
        SetofOptions: {
          from: "*"
          to: "tier_limits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_unified_navigation: {
        Args: {
          p_current_block_id?: string
          p_current_chapter_id?: string
          p_current_lesson_id?: string
          p_published_course_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_user_lesson_blocks_progress: {
        Args: { p_chapter_id: string; p_course_id: string; p_lesson_id: string }
        Returns: Json
      }
      get_user_org_role: {
        Args: { arg_org_id: string; arg_user_id: string }
        Returns: string
      }
      has_org_role: {
        Args: { arg_org_id: string; arg_user_id: string; required_role: string }
        Returns: boolean
      }
      has_pending_invite: {
        Args: { arg_org_id: string; user_email: string }
        Returns: boolean
      }
      insert_org_notification: {
        Args: {
          p_link?: string
          p_metadata?: Json
          p_organization_id: string
          p_performed_by?: string
          p_type_key: string
        }
        Returns: string
      }
      insert_user_notification: {
        Args: { p_metadata?: Json; p_type_key: string; p_user_id: string }
        Returns: string
      }
      invalidate_stale_block_progress: {
        Args: { p_changed_blocks: Json; p_published_course_id: string }
        Returns: {
          affected_lessons: string[]
          affected_users: string[]
          invalidated_count: number
          recalculated_chapters: number
          recalculated_lessons: number
        }[]
      }
      is_user_already_member: {
        Args: { arg_org_id: string; user_email: string }
        Returns: boolean
      }
      join_live_session: {
        Args: {
          p_display_name?: string
          p_session_code: string
          p_session_key?: string
        }
        Returns: Json
      }
      leave_live_session: { Args: { p_session_id: string }; Returns: Json }
      log_failed_downgrade: {
        Args: {
          p_failure_type: string
          p_metadata: Json
          p_organization_id: string
          p_severity?: string
        }
        Returns: string
      }
      mark_org_notification_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: undefined
      }
      process_course_payment_from_paystack: {
        Args: {
          p_amount_paid: number
          p_cohort_id?: string
          p_currency_code: string
          p_invite_id?: string
          p_metadata?: Json
          p_payment_method?: string
          p_payment_reference: string
          p_paystack_fee?: number
          p_paystack_transaction_id: string
          p_published_course_id: string
          p_tier_id: string
          p_user_id: string
        }
        Returns: Json
      }
      process_delete_course_progress: { Args: never; Returns: undefined }
      process_subscription_payment: {
        Args: {
          p_amount_paid: number
          p_currency_code: Database["public"]["Enums"]["currency_code"]
          p_metadata?: Json
          p_organization_id: string
          p_payment_reference: string
          p_paystack_fee: number
        }
        Returns: Json
      }
      process_subscription_upgrade_payment: {
        Args: {
          p_amount_paid: number
          p_currency_code: Database["public"]["Enums"]["currency_code"]
          p_metadata?: Json
          p_organization_id: string
          p_payment_reference: string
          p_paystack_fee: number
        }
        Returns: Json
      }
      readable_size: { Args: { bytes: number }; Returns: string }
      reorder_chapters: {
        Args: {
          chapter_positions: Json
          p_course_id: string
          p_updated_by: string
        }
        Returns: undefined
      }
      reorder_lesson_blocks:
        | { Args: { blocks: Json }; Returns: undefined }
        | {
            Args: {
              block_positions: Json
              p_lesson_id: string
              p_updated_by: string
            }
            Returns: undefined
          }
      reorder_lessons: {
        Args: {
          lesson_positions: Json
          p_chapter_id: string
          p_updated_by: string
        }
        Returns: undefined
      }
      reorder_live_session_blocks: {
        Args: {
          block_positions: Json
          p_live_session_id: string
          p_updated_by: string
        }
        Returns: undefined
      }
      reorder_pricing_tiers: {
        Args: {
          p_course_id: string
          p_updated_by: string
          tier_positions: Json
        }
        Returns: undefined
      }
      reset_org_ai_base_credits_when_due: { Args: never; Returns: undefined }
      resolve_current_context: {
        Args: {
          course_structure: Json
          p_block_id?: string
          p_chapter_id?: string
          p_lesson_id?: string
        }
        Returns: {
          block_global_order: number
          block_id: string
          chapter_global_order: number
          chapter_id: string
          lesson_global_order: number
          lesson_id: string
        }[]
      }
      resolve_failed_downgrade: {
        Args: {
          p_attempt_id: string
          p_resolution_action: string
          p_resolution_notes?: string
        }
        Returns: undefined
      }
      schedule_downgrade_retry: {
        Args: { p_attempt_id: string; p_retry_delay_minutes?: number }
        Returns: undefined
      }
      set_course_free: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: undefined
      }
      set_course_paid: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: undefined
      }
      subscription_upsert_webhook: {
        Args: {
          cancel_at_period_end?: boolean
          initial_next_payment_date?: string
          new_status: string
          new_tier: string
          org_id: string
          paystack_customer_code?: string
          paystack_subscription_code?: string
          period_end: string
          period_start: string
          start_ts: string
        }
        Returns: {
          cancel_at_period_end: boolean
          created_at: string
          created_by: string | null
          current_period_end: string | null
          current_period_start: string
          downgrade_effective_at: string | null
          downgrade_executed_at: string | null
          downgrade_requested_at: string | null
          downgrade_requested_by: string | null
          id: string
          initial_next_payment_date: string | null
          next_payment_date: string | null
          next_plan_code: string | null
          next_tier: Database["public"]["Enums"]["subscription_tier"] | null
          organization_id: string
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          revert_tier: Database["public"]["Enums"]["subscription_tier"] | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organization_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      switch_course_pricing_model: {
        Args: { p_course_id: string; p_target_model: string; p_user_id: string }
        Returns: undefined
      }
      update_block_stats: { Args: { p_block_id: string }; Returns: undefined }
      update_chapter_progress_for_user: {
        Args: {
          p_chapter_id: string
          p_course_progress_id: string
          p_published_course_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_course_progress_for_user: {
        Args: { p_published_course_id: string; p_user_id: string }
        Returns: undefined
      }
      update_lesson_progress_for_user: {
        Args: {
          p_lesson_id: string
          p_published_course_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_participant_stats: {
        Args: { p_participant_id: string }
        Returns: undefined
      }
      update_session_analytics: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      upsert_published_course_with_content: {
        Args: { course_data: Json; structure_content: Json }
        Returns: Json
      }
      user_has_active_access: {
        Args: { p_published_course_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      analytics_level: "none" | "basic" | "intermediate" | "advanced"
      app_permission:
        | "go_su_create"
        | "go_su_read"
        | "go_su_update"
        | "go_su_delete"
        | "go_admin_create"
        | "go_admin_read"
        | "go_admin_update"
        | "go_admin_delete"
        | "go_staff_create"
        | "go_staff_read"
        | "go_staff_update"
        | "go_staff_delete"
      app_role: "go_su" | "go_admin" | "go_staff" | "user"
      course_access: "public" | "unlisted" | "private"
      course_update_type: "content" | "pricing" | "overview"
      currency_code: "KES" | "USD"
      file_type: "image" | "audio" | "video" | "model3d" | "document" | "other"
      invite_delivery_status: "pending" | "sent" | "failed"
      ledger_transaction_type:
        | "course_purchase"
        | "payment_inflow"
        | "org_payout"
        | "platform_revenue"
        | "payment_gateway_fee"
        | "subscription_payment"
        | "subscription_upgrade_payment"
        | "ai_credit_purchase"
        | "sponsorship_payment"
        | "funds_hold"
        | "funds_release"
        | "withdrawal_request"
        | "withdrawal_complete"
        | "withdrawal_failed"
        | "reward_payout"
        | "refund"
        | "chargeback"
        | "manual_adjustment"
        | "currency_conversion"
        | "tax_withholding"
        | "tax_remittance"
      live_participant_status: "joined" | "left" | "kicked"
      live_response_status: "submitted" | "correct" | "incorrect" | "partial"
      live_session_block_status: "pending" | "active" | "closed" | "skipped"
      live_session_status: "draft" | "waiting" | "active" | "paused" | "ended"
      live_session_visibility: "public" | "unlisted" | "private"
      org_notification_category:
        | "billing"
        | "members"
        | "courses"
        | "purchases"
        | "content"
        | "compliance"
        | "system"
      org_notification_key:
        | "org_subscription_started"
        | "org_subscription_renewed"
        | "org_subscription_failed"
        | "org_subscription_expiring"
        | "org_payment_method_expiring"
        | "org_invoice_ready"
        | "org_tier_upgraded"
        | "org_tier_downgraded"
        | "org_downgrade_cancelled"
        | "org_subscription_cancelled"
        | "org_tier_downgrade_activated"
        | "org_member_invited"
        | "org_member_joined"
        | "org_member_left"
        | "org_member_role_changed"
        | "org_member_removed"
        | "org_ownership_transferred"
        | "org_course_created"
        | "org_course_updated"
        | "org_course_published"
        | "org_course_unpublished"
        | "org_course_archived"
        | "org_course_deleted"
        | "org_course_milestone_reached"
        | "org_course_enrollment_opened"
        | "org_course_enrollment_closed"
        | "org_course_review_posted"
        | "org_course_review_flagged"
        | "org_content_flagged"
        | "org_course_purchase_completed"
        | "org_course_purchase_refunded"
        | "org_course_purchase_failed"
        | "org_course_subscription_started"
        | "org_course_subscription_renewed"
        | "org_course_subscription_canceled"
        | "org_verification_approved"
        | "org_verification_rejected"
        | "org_policy_update_required"
        | "org_announcement"
        | "org_maintenance_notice"
      org_role: "owner" | "admin" | "editor"
      payment_frequency:
        | "monthly"
        | "bi_monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
      profile_mode: "personal" | "organization"
      subscription_status:
        | "active"
        | "non-renewing"
        | "attention"
        | "completed"
        | "cancelled"
      subscription_tier: "temp" | "launch" | "scale" | "impact"
      support_level: "none" | "community" | "email" | "priority"
      transaction_direction: "credit" | "debit"
      transaction_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
        | "reversed"
      user_notification_category:
        | "commerce"
        | "learning"
        | "billing"
        | "social"
        | "system"
      user_notification_key:
        | "course_purchase_success"
        | "course_purchase_failed"
        | "course_refund_processed"
        | "course_subscription_started"
        | "course_subscription_renewed"
        | "course_subscription_failed"
        | "course_subscription_expiring"
        | "course_enrollment_free_success"
        | "lesson_completed"
        | "course_completed"
        | "streak_reminder"
        | "new_chapter_unlocked"
        | "payment_method_expiring"
        | "invoice_ready"
        | "account_security_alert"
        | "organization_invite_received"
        | "organization_invite_accepted"
        | "organization_role_changed"
        | "announcement"
        | "maintenance_notice"
      wallet_type: "platform" | "organization" | "user" | "external"
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
  pgmq_public: {
    Enums: {},
  },
  public: {
    Enums: {
      analytics_level: ["none", "basic", "intermediate", "advanced"],
      app_permission: [
        "go_su_create",
        "go_su_read",
        "go_su_update",
        "go_su_delete",
        "go_admin_create",
        "go_admin_read",
        "go_admin_update",
        "go_admin_delete",
        "go_staff_create",
        "go_staff_read",
        "go_staff_update",
        "go_staff_delete",
      ],
      app_role: ["go_su", "go_admin", "go_staff", "user"],
      course_access: ["public", "unlisted", "private"],
      course_update_type: ["content", "pricing", "overview"],
      currency_code: ["KES", "USD"],
      file_type: ["image", "audio", "video", "model3d", "document", "other"],
      invite_delivery_status: ["pending", "sent", "failed"],
      ledger_transaction_type: [
        "course_purchase",
        "payment_inflow",
        "org_payout",
        "platform_revenue",
        "payment_gateway_fee",
        "subscription_payment",
        "subscription_upgrade_payment",
        "ai_credit_purchase",
        "sponsorship_payment",
        "funds_hold",
        "funds_release",
        "withdrawal_request",
        "withdrawal_complete",
        "withdrawal_failed",
        "reward_payout",
        "refund",
        "chargeback",
        "manual_adjustment",
        "currency_conversion",
        "tax_withholding",
        "tax_remittance",
      ],
      live_participant_status: ["joined", "left", "kicked"],
      live_response_status: ["submitted", "correct", "incorrect", "partial"],
      live_session_block_status: ["pending", "active", "closed", "skipped"],
      live_session_status: ["draft", "waiting", "active", "paused", "ended"],
      live_session_visibility: ["public", "unlisted", "private"],
      org_notification_category: [
        "billing",
        "members",
        "courses",
        "purchases",
        "content",
        "compliance",
        "system",
      ],
      org_notification_key: [
        "org_subscription_started",
        "org_subscription_renewed",
        "org_subscription_failed",
        "org_subscription_expiring",
        "org_payment_method_expiring",
        "org_invoice_ready",
        "org_tier_upgraded",
        "org_tier_downgraded",
        "org_downgrade_cancelled",
        "org_subscription_cancelled",
        "org_tier_downgrade_activated",
        "org_member_invited",
        "org_member_joined",
        "org_member_left",
        "org_member_role_changed",
        "org_member_removed",
        "org_ownership_transferred",
        "org_course_created",
        "org_course_updated",
        "org_course_published",
        "org_course_unpublished",
        "org_course_archived",
        "org_course_deleted",
        "org_course_milestone_reached",
        "org_course_enrollment_opened",
        "org_course_enrollment_closed",
        "org_course_review_posted",
        "org_course_review_flagged",
        "org_content_flagged",
        "org_course_purchase_completed",
        "org_course_purchase_refunded",
        "org_course_purchase_failed",
        "org_course_subscription_started",
        "org_course_subscription_renewed",
        "org_course_subscription_canceled",
        "org_verification_approved",
        "org_verification_rejected",
        "org_policy_update_required",
        "org_announcement",
        "org_maintenance_notice",
      ],
      org_role: ["owner", "admin", "editor"],
      payment_frequency: [
        "monthly",
        "bi_monthly",
        "quarterly",
        "semi_annual",
        "annual",
      ],
      profile_mode: ["personal", "organization"],
      subscription_status: [
        "active",
        "non-renewing",
        "attention",
        "completed",
        "cancelled",
      ],
      subscription_tier: ["temp", "launch", "scale", "impact"],
      support_level: ["none", "community", "email", "priority"],
      transaction_direction: ["credit", "debit"],
      transaction_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "reversed",
      ],
      user_notification_category: [
        "commerce",
        "learning",
        "billing",
        "social",
        "system",
      ],
      user_notification_key: [
        "course_purchase_success",
        "course_purchase_failed",
        "course_refund_processed",
        "course_subscription_started",
        "course_subscription_renewed",
        "course_subscription_failed",
        "course_subscription_expiring",
        "course_enrollment_free_success",
        "lesson_completed",
        "course_completed",
        "streak_reminder",
        "new_chapter_unlocked",
        "payment_method_expiring",
        "invoice_ready",
        "account_security_alert",
        "organization_invite_received",
        "organization_invite_accepted",
        "organization_role_changed",
        "announcement",
        "maintenance_notice",
      ],
      wallet_type: ["platform", "organization", "user", "external"],
    },
  },
} as const
