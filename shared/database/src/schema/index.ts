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
            foreignKeyName: "chapters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "chapters_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "course_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "course_pricing_tiers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_pricing_tiers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_pricing_tiers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "course_sub_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sub_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sub_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "courses_owned_by_fkey"
            columns: ["owned_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "courses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "file_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "file_library_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_blocks: {
        Row: {
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
            foreignKeyName: "lesson_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "lesson_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "lesson_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "lessons_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "organization_members_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "organizations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "organizations_owned_by_fkey"
            columns: ["owned_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "organizations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          account_verified: boolean | null
          avatar_url: string | null
          blur_hash: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_public: boolean | null
          username: string | null
        }
        Insert: {
          account_verified?: boolean | null
          avatar_url?: string | null
          blur_hash?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_public?: boolean | null
          username?: string | null
        }
        Update: {
          account_verified?: boolean | null
          avatar_url?: string | null
          blur_hash?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_public?: boolean | null
          username?: string | null
        }
        Relationships: []
      }
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
      extract_course_content_text: {
        Args: { course_data: Json }
        Returns: string
      }
      get_active_organization_members: {
        Args: { _organization_id: string; _user_id: string }
        Returns: Json
      }
      get_available_payment_frequencies: {
        Args: { p_course_id: string }
        Returns: Database["public"]["Enums"]["payment_frequency"][]
      }
      get_tier_limits_for_org: {
        Args: { org_id: string }
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

