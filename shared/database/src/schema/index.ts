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
      assigned_courses_to_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          course_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          course_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          course_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_courses_to_members_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_courses_to_members_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_courses_to_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          position: number | null
          requires_payment: boolean | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          position?: number | null
          requires_payment?: boolean | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          requires_payment?: boolean | null
          updated_at?: string
          updated_by?: string
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
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string
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
      course_sub_categories: {
        Row: {
          category_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string
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
          approval_status: Database["public"]["Enums"]["course_approval_status"]
          approved_by: string | null
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          last_approved_at: string | null
          last_approved_by: string | null
          last_rejected_at: string | null
          last_rejected_by: string | null
          monthly_subscription_price: number | null
          name: string
          pathway_id: string | null
          pricing_model: Database["public"]["Enums"]["course_pricing"]
          status: Database["public"]["Enums"]["course_status"]
          subcategory_id: string | null
          updated_at: string
          updated_by: string
          validation_complete: boolean
          visibility: Database["public"]["Enums"]["course_access"]
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["course_approval_status"]
          approved_by?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          last_approved_at?: string | null
          last_approved_by?: string | null
          last_rejected_at?: string | null
          last_rejected_by?: string | null
          monthly_subscription_price?: number | null
          name: string
          pathway_id?: string | null
          pricing_model?: Database["public"]["Enums"]["course_pricing"]
          status?: Database["public"]["Enums"]["course_status"]
          subcategory_id?: string | null
          updated_at?: string
          updated_by: string
          validation_complete?: boolean
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["course_approval_status"]
          approved_by?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          last_approved_at?: string | null
          last_approved_by?: string | null
          last_rejected_at?: string | null
          last_rejected_by?: string | null
          monthly_subscription_price?: number | null
          name?: string
          pathway_id?: string | null
          pricing_model?: Database["public"]["Enums"]["course_pricing"]
          status?: Database["public"]["Enums"]["course_status"]
          subcategory_id?: string | null
          updated_at?: string
          updated_by?: string
          validation_complete?: boolean
          visibility?: Database["public"]["Enums"]["course_access"]
        }
        Relationships: [
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "courses_last_approved_by_fkey"
            columns: ["last_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_last_rejected_by_fkey"
            columns: ["last_rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
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
      featured_courses: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          end_date: string | null
          feature_package: string
          id: string
          payment_status: string
          start_date: string | null
          total_price: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          end_date?: string | null
          feature_package?: string
          id?: string
          payment_status?: string
          start_date?: string | null
          total_price?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          feature_package?: string
          id?: string
          payment_status?: string
          start_date?: string | null
          total_price?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_courses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_courses_pricing: {
        Row: {
          created_at: string
          daily_rate: number
          description: string
          feature_package: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_rate: number
          description: string
          feature_package: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_rate?: number
          description?: string
          feature_package?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_types: {
        Row: {
          bg_color: string
          created_at: string
          created_by: string
          description: string
          id: string
          lucide_icon: string
          name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          bg_color: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          lucide_icon: string
          name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          lucide_icon?: string
          name?: string
          updated_at?: string
          updated_by?: string
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
          created_by: string
          id: string
          lesson_type_id: string
          metadata: Json
          name: string
          position: number | null
          settings: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          chapter_id: string
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          lesson_type_id: string
          metadata?: Json
          name: string
          position?: number | null
          settings?: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          chapter_id?: string
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          lesson_type_id?: string
          metadata?: Json
          name?: string
          position?: number | null
          settings?: Json
          updated_at?: string
          updated_by?: string
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
            foreignKeyName: "lessons_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pathways: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          image_url: string
          name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          image_url: string
          name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathways_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathways_updated_by_fkey"
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
          avatar_url: string | null
          bio: string | null
          discord_url: string | null
          email: string
          email_verified: boolean
          facebook_url: string | null
          full_name: string | null
          github_url: string | null
          id: string
          instagram_url: string | null
          is_onboarding_complete: boolean
          linkedin_url: string | null
          notifications_enabled: boolean
          phone_number: string | null
          phone_number_verified: boolean
          status: Database["public"]["Enums"]["user_status"] | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          username: string | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          account_verified?: boolean
          avatar_url?: string | null
          bio?: string | null
          discord_url?: string | null
          email: string
          email_verified?: boolean
          facebook_url?: string | null
          full_name?: string | null
          github_url?: string | null
          id: string
          instagram_url?: string | null
          is_onboarding_complete?: boolean
          linkedin_url?: string | null
          notifications_enabled?: boolean
          phone_number?: string | null
          phone_number_verified?: boolean
          status?: Database["public"]["Enums"]["user_status"] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          account_verified?: boolean
          avatar_url?: string | null
          bio?: string | null
          discord_url?: string | null
          email?: string
          email_verified?: boolean
          facebook_url?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_onboarding_complete?: boolean
          linkedin_url?: string | null
          notifications_enabled?: boolean
          phone_number?: string | null
          phone_number_verified?: boolean
          status?: Database["public"]["Enums"]["user_status"] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
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
      staff_invites: {
        Row: {
          company_id: string
          confirmed_at: string | null
          expires_at: string
          id: string
          invite_token: string
          invited_at: string
          invited_by: string
          invited_email: string | null
          is_confirmed: boolean
          last_resent_at: string | null
          resend_count: number
          staff_id: string | null
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          expires_at?: string
          id?: string
          invite_token: string
          invited_at?: string
          invited_by: string
          invited_email?: string | null
          is_confirmed?: boolean
          last_resent_at?: string | null
          resend_count?: number
          staff_id?: string | null
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          expires_at?: string
          id?: string
          invite_token?: string
          invited_at?: string
          invited_by?: string
          invited_email?: string | null
          is_confirmed?: boolean
          last_resent_at?: string | null
          resend_count?: number
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          staff_id: string
          staff_role: Database["public"]["Enums"]["staff_role_enum"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          staff_id: string
          staff_role?: Database["public"]["Enums"]["staff_role_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          staff_id?: string
          staff_role?: Database["public"]["Enums"]["staff_role_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_active_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
      company_memberships: {
        Row: {
          company_id: string | null
          staff_id: string | null
          staff_role: Database["public"]["Enums"]["staff_role_enum"] | null
        }
        Insert: {
          company_id?: string | null
          staff_id?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role_enum"] | null
        }
        Update: {
          company_id?: string | null
          staff_id?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_staff_invitation: {
        Args: {
          p_user_id: string
          p_invite_id: string
          p_company_id: string
        }
        Returns: undefined
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      check_user_role: {
        Args: {
          user_id: string
          allowed_roles: string[]
        }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: {
          event: Json
        }
        Returns: Json
      }
      get_user_active_company: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_companies: {
        Args: {
          user_id: string
        }
        Returns: string[]
      }
      reorder_chapters: {
        Args: {
          chapters: Json
        }
        Returns: undefined
      }
      reorder_lessons: {
        Args: {
          lessons: Json
        }
        Returns: undefined
      }
    }
    Enums: {
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
      app_role: "go_su" | "go_admin" | "go_staff" | "user"
      course_access: "public" | "private"
      course_approval_status: "pending" | "approved" | "rejected"
      course_pricing: "free" | "paid"
      course_status: "draft" | "published"
      staff_role_enum: "su" | "admin" | "user"
      user_status: "ONLINE" | "OFFLINE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
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
      ],
      app_role: ["go_su", "go_admin", "go_staff", "user"],
      course_access: ["public", "private"],
      course_approval_status: ["pending", "approved", "rejected"],
      course_pricing: ["free", "paid"],
      course_status: ["draft", "published"],
      staff_role_enum: ["su", "admin", "user"],
      user_status: ["ONLINE", "OFFLINE"],
    },
  },
} as const

