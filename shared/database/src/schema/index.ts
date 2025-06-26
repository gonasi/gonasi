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
      organizations: {
        Row: {
          avatar_url: string | null
          banner_blur_hash: string | null
          banner_url: string | null
          blur_hash: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          max_admins_per_org: number
          max_collaborators_per_course: number
          max_custom_domains: number | null
          max_departments_per_org: number
          max_free_courses_per_org: number
          max_students_per_course: number
          platform_fee_percentage: number
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
          max_admins_per_org: number
          max_collaborators_per_course: number
          max_custom_domains?: number | null
          max_departments_per_org: number
          max_free_courses_per_org: number
          max_students_per_course: number
          platform_fee_percentage?: number
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
          max_admins_per_org?: number
          max_collaborators_per_course?: number
          max_custom_domains?: number | null
          max_departments_per_org?: number
          max_free_courses_per_org?: number
          max_students_per_course?: number
          platform_fee_percentage?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      normalize_handle: {
        Args: { input: string }
        Returns: string
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
      app_role: "go_su" | "go_admin" | "go_staff" | "user"
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
      ],
      app_role: ["go_su", "go_admin", "go_staff", "user"],
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

