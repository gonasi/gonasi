import type { Session, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../schema/index';

export type TypedSupabaseClient = SupabaseClient<Database>;
export type SupabaseSession = Session;
export type UserRole = Database['public']['Enums']['app_role'];
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
