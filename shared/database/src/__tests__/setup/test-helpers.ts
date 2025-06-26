import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { afterAll, afterEach, beforeAll } from 'vitest';

import type { Database } from '../../schema';

// Test database configuration
const TEST_SUPABASE_URL = 'http://127.0.0.1:54321';
const TEST_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const TEST_SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const testSupabase = createClient<Database>(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

export const testSupabaseAdmin = createClient<Database>(
  TEST_SUPABASE_URL,
  TEST_SUPABASE_SERVICE_KEY,
);

export type ClearableTable = 'profiles' | 'user_roles' | 'tier_limits' | 'organizations';

const DEFAULT_TABLES_TO_CLEAR: ClearableTable[] = [
  'profiles',
  'user_roles',
  'tier_limits',
  'organizations',
];

// Centralized cleanup manager
export class TestCleanupManager {
  static async signOutAllClients() {
    try {
      await testSupabase.auth.signOut();
    } catch (error) {
      console.warn('Failed to sign out test client:', error);
    }
  }

  static async cleanupUsers() {
    try {
      const {
        data: { users },
        error,
      } = await testSupabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('Failed to list users for cleanup:', error);
        return;
      }

      // Delete all users in parallel for better performance
      const deletePromises = users.map(async (user) => {
        try {
          await testSupabaseAdmin.auth.admin.deleteUser(user.id);
        } catch (error) {
          console.warn(`Failed to delete user ${user.id}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.warn('Failed to cleanup auth users:', error);
    }
  }

  static async clearTables(tables: ClearableTable[] = DEFAULT_TABLES_TO_CLEAR) {
    // Clear tables in reverse order to handle dependencies
    for (const table of [...tables].reverse()) {
      try {
        // For tier_limits and other tables with enum IDs, we need a different approach
        if (table === 'tier_limits') {
          // Delete all rows without any condition (Supabase allows this)
          const { error } = await testSupabaseAdmin.from(table).delete().not('tier', 'is', null); // This will match all rows since id is not null (it's a primary key)

          if (error) {
            console.error(`Failed to clear table ${table}:`, error);
          }
          continue;
        }

        // For other tables, try to get table structure to check if 'id' column exists
        const { data: tableData, error: fetchError } = await testSupabaseAdmin
          .from(table)
          .select('*')
          .limit(1);

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error(`Failed to check table structure for ${table}:`, fetchError);
          continue;
        }

        // Check if table has any data and if it has an 'id' field
        const hasIdField = tableData && tableData.length > 0 && 'id' in tableData[0];

        if (hasIdField) {
          // Check if the id looks like a UUID (for tables with UUID primary keys)
          const firstRow = tableData[0];
          const isUuidId =
            typeof firstRow.id === 'string' &&
            firstRow.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

          if (isUuidId) {
            // Use the existing logic for tables with UUID 'id' field
            await testSupabaseAdmin
              .from(table)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
          } else {
            // For tables with non-UUID 'id' field, delete all rows
            await testSupabaseAdmin.from(table).delete().not('id', 'is', null); // This will match all rows since id cannot be null
          }
        } else {
          // For tables without 'id' field, delete all rows
          // Try multiple approaches since we don't know the table structure
          try {
            // Try with created_at first (most common timestamp field)
            await testSupabaseAdmin.from(table).delete().not('created_at', 'is', null);
          } catch {
            try {
              // Fallback: try with updated_at
              await testSupabaseAdmin.from(table).delete().not('updated_at', 'is', null);
            } catch {
              // Last resort: try to delete everything (this might fail on some Supabase versions)
              await testSupabaseAdmin
                .from(table)
                .delete()
                .neq('dummy_field_that_does_not_exist', 'dummy_value');
            }
          }
        }
      } catch (error) {
        console.error(`Failed to clear table ${table}:`, error);
      }
    }
  }

  // Main cleanup method that handles the complete reset
  static async performFullCleanup() {
    await this.signOutAllClients();
    await this.clearTables();
    await this.cleanupUsers();
  }
}

// User management utilities
export class TestUserManager {
  static async signInUser(email: string, password: string): Promise<SupabaseClient> {
    const client = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }
}

// Database state management
export class DatabaseManager {
  static async resetDatabase() {
    await TestCleanupManager.performFullCleanup();
  }

  // TODO: Seed data when needed
  static async seedTestData() {}
}

// Test setup hooks
export function setupTestDatabase() {
  beforeAll(async () => {
    await TestCleanupManager.performFullCleanup();
    await DatabaseManager.seedTestData();
  });

  afterAll(async () => {
    await TestCleanupManager.performFullCleanup();
  });
}

export function signOutTestUsers() {
  afterEach(async () => {
    await TestCleanupManager.signOutAllClients();
  });
}
