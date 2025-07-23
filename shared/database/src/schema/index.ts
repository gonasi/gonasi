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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      block_progress: {
        Row: {
          attempt_count: number | null
          block_id: string
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
          block_id: string
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
          block_id?: string
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
          chapter_id: string
          completed_at: string | null
          completed_blocks: number
          completed_lesson_weight: number
          completed_lessons: number
          completed_weight: number
          created_at: string
          id: string
          is_completed: boolean
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
          chapter_id: string
          completed_at?: string | null
          completed_blocks?: number
          completed_lesson_weight?: number
          completed_lessons?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
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
          chapter_id?: string
          completed_at?: string | null
          completed_blocks?: number
          completed_lesson_weight?: number
          completed_lessons?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
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
        Relationships: [
          {
            foreignKeyName: "course_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_categories_updated_by_fkey"
            columns: ["updated_by"]
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
          completed_at: string | null
          created_at: string
          enrolled_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          published_course_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          published_course_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          published_course_id?: string
          user_id?: string
        }
        Relationships: [
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
          {
            foreignKeyName: "course_sub_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sub_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          blur_hash: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          last_published: string | null
          name: string
          organization_id: string | null
          owned_by: string | null
          subcategory_id: string | null
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["course_access"]
        }
        Insert: {
          blur_hash?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_published?: string | null
          name: string
          organization_id?: string | null
          owned_by?: string | null
          subcategory_id?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Update: {
          blur_hash?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_published?: string | null
          name?: string
          organization_id?: string | null
          owned_by?: string | null
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
            foreignKeyName: "courses_owned_by_fkey"
            columns: ["owned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      gonasi_wallet_transactions: {
        Row: {
          amount: number
          course_payment_id: string | null
          created_at: string
          direction: string
          id: string
          metadata: Json | null
          type: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          course_payment_id?: string | null
          created_at?: string
          direction: string
          id?: string
          metadata?: Json | null
          type: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          course_payment_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          metadata?: Json | null
          type?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gonasi_wallet_transactions_course_payment_id_fkey"
            columns: ["course_payment_id"]
            isOneToOne: false
            referencedRelation: "course_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gonasi_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "gonasi_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      gonasi_wallets: {
        Row: {
          available_balance: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          pending_balance: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id?: string
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          pending_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      lesson_blocks: {
        Row: {
          chapter_id: string
          content: Json
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
          completed_at: string | null
          completed_blocks: number
          completed_weight: number
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          progress_percentage: number | null
          published_course_id: string
          total_blocks: number
          total_weight: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_blocks?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          progress_percentage?: number | null
          published_course_id: string
          total_blocks: number
          total_weight?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_blocks?: number
          completed_weight?: number
          created_at?: string
          id?: string
          is_completed?: boolean
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
        Relationships: [
          {
            foreignKeyName: "lesson_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          chapter_id: string
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
      organization_wallets: {
        Row: {
          available_balance: number
          created_at: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id: string
          organization_id: string
          pending_balance: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["currency_code"]
          id?: string
          organization_id: string
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["currency_code"]
          id?: string
          organization_id?: string
          pending_balance?: number
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
          tier: Database["public"]["Enums"]["subscription_tier"]
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
          tier?: Database["public"]["Enums"]["subscription_tier"]
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
          tier?: Database["public"]["Enums"]["subscription_tier"]
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
            foreignKeyName: "organizations_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "tier_limits"
            referencedColumns: ["tier"]
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
          course_structure_overview: Json
          created_at: string
          description: string
          has_free_tier: boolean | null
          id: string
          image_url: string
          is_active: boolean
          min_price: number | null
          name: string
          organization_id: string
          pricing_tiers: Json
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
          course_structure_overview: Json
          created_at?: string
          description: string
          has_free_tier?: boolean | null
          id: string
          image_url: string
          is_active?: boolean
          min_price?: number | null
          name: string
          organization_id: string
          pricing_tiers?: Json
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
          course_structure_overview?: Json
          created_at?: string
          description?: string
          has_free_tier?: boolean | null
          id?: string
          image_url?: string
          is_active?: boolean
          min_price?: number | null
          name?: string
          organization_id?: string
          pricing_tiers?: Json
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
          ai_usage_limit_monthly: number | null
          analytics_level: Database["public"]["Enums"]["analytics_level"]
          custom_domains_enabled: boolean
          max_custom_domains: number | null
          max_free_courses_per_org: number
          max_members_per_org: number
          max_organizations_per_user: number
          platform_fee_percentage: number
          price_monthly_usd: number
          price_yearly_usd: number
          storage_limit_mb_per_org: number
          support_level: Database["public"]["Enums"]["support_level"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          white_label_enabled: boolean
        }
        Insert: {
          ai_tools_enabled?: boolean
          ai_usage_limit_monthly?: number | null
          analytics_level: Database["public"]["Enums"]["analytics_level"]
          custom_domains_enabled?: boolean
          max_custom_domains?: number | null
          max_free_courses_per_org: number
          max_members_per_org: number
          max_organizations_per_user: number
          platform_fee_percentage?: number
          price_monthly_usd?: number
          price_yearly_usd?: number
          storage_limit_mb_per_org: number
          support_level: Database["public"]["Enums"]["support_level"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          white_label_enabled?: boolean
        }
        Update: {
          ai_tools_enabled?: boolean
          ai_usage_limit_monthly?: number | null
          analytics_level?: Database["public"]["Enums"]["analytics_level"]
          custom_domains_enabled?: boolean
          max_custom_domains?: number | null
          max_free_courses_per_org?: number
          max_members_per_org?: number
          max_organizations_per_user?: number
          platform_fee_percentage?: number
          price_monthly_usd?: number
          price_yearly_usd?: number
          storage_limit_mb_per_org?: number
          support_level?: Database["public"]["Enums"]["support_level"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          white_label_enabled?: boolean
        }
        Relationships: []
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
      wallet_transactions: {
        Row: {
          amount: number
          course_payment_id: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          metadata: Json | null
          type: string
          wallet_id: string
          withdrawal_request_id: string | null
        }
        Insert: {
          amount: number
          course_payment_id?: string | null
          created_at?: string
          created_by?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          type: string
          wallet_id: string
          withdrawal_request_id?: string | null
        }
        Update: {
          amount?: number
          course_payment_id?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          type?: string
          wallet_id?: string
          withdrawal_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_course_payment_id_fkey"
            columns: ["course_payment_id"]
            isOneToOne: false
            referencedRelation: "course_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "organization_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invite: {
        Args: { invite_token: string; user_id: string; user_email: string }
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
          start_date: string
          frequency: Database["public"]["Enums"]["payment_frequency"]
        }
        Returns: string
      }
      can_accept_new_member: {
        Args: { arg_org_id: string }
        Returns: boolean
      }
      can_create_organization: {
        Args: { tier_name: string; arg_user_id: string }
        Returns: boolean
      }
      can_user_edit_course: {
        Args: { arg_course_id: string }
        Returns: boolean
      }
      check_storage_limit: {
        Args: {
          p_organization_id: string
          p_new_file_size: number
          p_exclude_file_path?: string
        }
        Returns: boolean
      }
      complete_block: {
        Args: {
          p_published_course_id: string
          p_chapter_id: string
          p_lesson_id: string
          p_block_id: string
          p_block_weight?: number
          p_earned_score?: number
          p_time_spent_seconds?: number
          p_interaction_data?: Json
          p_last_response?: Json
        }
        Returns: Json
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      delete_chapter: {
        Args: { p_chapter_id: string; p_deleted_by: string }
        Returns: undefined
      }
      delete_lesson: {
        Args: { p_lesson_id: string; p_deleted_by: string }
        Returns: undefined
      }
      delete_lesson_block: {
        Args: { p_block_id: string; p_deleted_by: string }
        Returns: undefined
      }
      delete_pricing_tier: {
        Args: { p_tier_id: string; p_deleted_by: string }
        Returns: undefined
      }
      determine_file_type: {
        Args: { extension: string }
        Returns: Database["public"]["Enums"]["file_type"]
      }
      enroll_user_in_published_course: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          p_tier_id: string
          p_tier_name: string
          p_tier_description: string
          p_payment_frequency: string
          p_currency_code: string
          p_is_free: boolean
          p_effective_price: number
          p_organization_id: string
          p_promotional_price?: number
          p_is_promotional?: boolean
          p_payment_processor_id?: string
          p_payment_amount?: number
          p_payment_method?: string
          p_payment_processor_fee?: number
          p_created_by?: string
        }
        Returns: Json
      }
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
          p_user_id: string
          p_published_course_id: string
          course_structure: Json
          current_context: Record<string, unknown>
        }
        Returns: Json
      }
      get_continue_navigation_state: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          course_structure: Json
          current_context: Record<string, unknown>
        }
        Returns: Json
      }
      get_course_navigation_info: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          course_structure: Json
        }
        Returns: Json
      }
      get_course_progress_overview: {
        Args: { p_published_course_id: string; p_user_id?: string }
        Returns: Json
      }
      get_current_navigation_state: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          course_structure: Json
          current_context: Record<string, unknown>
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
        Args: { p_user_id: string; p_published_course_id: string }
        Returns: {
          enrollment_id: string
          is_enrolled: boolean
          is_active: boolean
          expires_at: string
          days_remaining: number
          latest_activity_id: string
        }[]
      }
      get_lesson_navigation_ids: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          p_current_lesson_id: string
        }
        Returns: Json
      }
      get_next_navigation_state: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          course_structure: Json
          current_context: Record<string, unknown>
        }
        Returns: Json
      }
      get_previous_navigation_state: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          course_structure: Json
          current_context: Record<string, unknown>
        }
        Returns: Json
      }
      get_published_course_pricing_tier: {
        Args: { p_published_course_id: string; p_tier_id: string }
        Returns: {
          tier_id: string
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          is_free: boolean
          price: number
          currency_code: string
          promotional_price: number
          promotion_start_date: string
          promotion_end_date: string
          tier_name: string
          tier_description: string
          is_active: boolean
          position: number
          is_popular: boolean
          is_recommended: boolean
        }[]
      }
      get_published_lesson_blocks: {
        Args: { p_course_id: string; p_chapter_id: string; p_lesson_id: string }
        Returns: Json
      }
      get_tier_limits_for_org: {
        Args: { org_id: string }
        Returns: Json
      }
      get_unified_navigation: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          p_current_block_id?: string
          p_current_lesson_id?: string
          p_current_chapter_id?: string
        }
        Returns: Json
      }
      get_user_lesson_blocks_progress: {
        Args: { p_course_id: string; p_chapter_id: string; p_lesson_id: string }
        Returns: Json
      }
      get_user_org_role: {
        Args: { arg_org_id: string; arg_user_id: string }
        Returns: string
      }
      has_org_role: {
        Args: { arg_org_id: string; required_role: string; arg_user_id: string }
        Returns: boolean
      }
      has_pending_invite: {
        Args: { arg_org_id: string; user_email: string }
        Returns: boolean
      }
      is_user_already_member: {
        Args: { arg_org_id: string; user_email: string }
        Returns: boolean
      }
      process_course_payment_to_wallets: {
        Args: {
          p_payment_id: string
          p_organization_id: string
          p_published_course_id: string
          p_user_id: string
          p_tier_name: string
          p_currency_code: string
          p_gross_amount: number
          p_payment_processor_fee: number
          p_platform_fee_from_gross: number
          p_org_payout: number
          p_platform_fee_percent: number
          p_created_by?: string
        }
        Returns: Json
      }
      reorder_chapters: {
        Args: {
          p_course_id: string
          chapter_positions: Json
          p_updated_by: string
        }
        Returns: undefined
      }
      reorder_lesson_blocks: {
        Args:
          | { blocks: Json }
          | { p_lesson_id: string; block_positions: Json; p_updated_by: string }
        Returns: undefined
      }
      reorder_lessons: {
        Args: {
          p_chapter_id: string
          lesson_positions: Json
          p_updated_by: string
        }
        Returns: undefined
      }
      reorder_pricing_tiers: {
        Args: {
          p_course_id: string
          tier_positions: Json
          p_updated_by: string
        }
        Returns: undefined
      }
      resolve_current_context: {
        Args: {
          course_structure: Json
          p_block_id?: string
          p_lesson_id?: string
          p_chapter_id?: string
        }
        Returns: {
          block_id: string
          lesson_id: string
          chapter_id: string
          block_global_order: number
          lesson_global_order: number
          chapter_global_order: number
        }[]
      }
      rpc_verify_and_set_active_organization: {
        Args: { organization_id_from_url: string }
        Returns: Json
      }
      set_course_free: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: undefined
      }
      set_course_paid: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: undefined
      }
      switch_course_pricing_model: {
        Args: { p_course_id: string; p_user_id: string; p_target_model: string }
        Returns: undefined
      }
      update_chapter_progress_for_user: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          p_chapter_id: string
        }
        Returns: undefined
      }
      update_course_progress_for_user: {
        Args: { p_user_id: string; p_published_course_id: string }
        Returns: undefined
      }
      update_lesson_progress_for_user: {
        Args: {
          p_user_id: string
          p_published_course_id: string
          p_lesson_id: string
        }
        Returns: undefined
      }
      upsert_published_course_with_content: {
        Args: { course_data: Json; structure_content: Json }
        Returns: undefined
      }
      user_has_active_access: {
        Args: { p_user_id: string; p_published_course_id: string }
        Returns: boolean
      }
    }
    Enums: {
      analytics_level: "basic" | "intermediate" | "advanced" | "enterprise"
      app_permission:
        | "course_categories.insert"
        | "course_categories.update"
        | "course_categories.delete"
        | "course_sub_categories.insert"
        | "course_sub_categories.update"
        | "course_sub_categories.delete"
        | "featured_courses_pricing.insert"
        | "featured_courses_pricing.update"
        | "featured_courses_pricing.delete"
        | "lesson_types.insert"
        | "lesson_types.update"
        | "lesson_types.delete"
        | "pricing_tier.crud"
        | "go_wallet.view"
        | "go_wallet.withdraw"
      app_role: "go_su" | "go_admin" | "go_staff" | "user"
      course_access: "public" | "private"
      currency_code: "KES" | "USD"
      file_type: "image" | "audio" | "video" | "model3d" | "document" | "other"
      invite_delivery_status: "pending" | "sent" | "failed"
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
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      subscription_tier: "launch" | "scale" | "impact" | "enterprise"
      support_level: "community" | "email" | "priority" | "dedicated"
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
    Enums: {
      analytics_level: ["basic", "intermediate", "advanced", "enterprise"],
      app_permission: [
        "course_categories.insert",
        "course_categories.update",
        "course_categories.delete",
        "course_sub_categories.insert",
        "course_sub_categories.update",
        "course_sub_categories.delete",
        "featured_courses_pricing.insert",
        "featured_courses_pricing.update",
        "featured_courses_pricing.delete",
        "lesson_types.insert",
        "lesson_types.update",
        "lesson_types.delete",
        "pricing_tier.crud",
        "go_wallet.view",
        "go_wallet.withdraw",
      ],
      app_role: ["go_su", "go_admin", "go_staff", "user"],
      course_access: ["public", "private"],
      currency_code: ["KES", "USD"],
      file_type: ["image", "audio", "video", "model3d", "document", "other"],
      invite_delivery_status: ["pending", "sent", "failed"],
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
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      subscription_tier: ["launch", "scale", "impact", "enterprise"],
      support_level: ["community", "email", "priority", "dedicated"],
    },
  },
} as const

