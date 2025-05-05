import type { TypedSupabaseClient, UserRole } from '../client';

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  count?: number | null;
}

export interface FetchDataParams {
  supabase: TypedSupabaseClient;
  searchQuery?: string;
  limit?: number;
  page?: number;
}

export interface FetchAssetsParams {
  supabase: TypedSupabaseClient;
  searchQuery?: string;
  limit?: number;
  page?: number;
}

export interface FetchDataWithUserRole {
  supabase: TypedSupabaseClient;
  userId: string;
  userRole: UserRole;
}
