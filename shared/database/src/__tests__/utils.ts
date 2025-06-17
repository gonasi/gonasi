import { adminClient } from './lib/supabase';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export type ClearableTable = 'profiles' | 'role_permissions' | 'user_roles';

const DEFAULT_TABLES_TO_CLEAR: ClearableTable[] = ['profiles', 'role_permissions', 'user_roles'];

interface ResetDatabaseOptions {
  tables?: ClearableTable[]; // optional specific tables
  skipAuthUsers?: boolean; // optionally skip user deletion
}

export async function resetDatabase(options?: ResetDatabaseOptions) {
  const { tables = DEFAULT_TABLES_TO_CLEAR, skipAuthUsers = false } = options ?? {};

  try {
    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().neq('id', ZERO_UUID);

      if (error) {
        console.error(`Error clearing table "${table}":`, error.message);
      }
    }

    if (!skipAuthUsers) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data: users, error: fetchError } = await adminClient.auth.admin.listUsers({
          page,
          perPage: 100,
        });

        if (fetchError) {
          console.error('Error fetching users:', fetchError.message);
          return { success: false, error: fetchError };
        }

        for (const user of users.users) {
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.error(`Error deleting user ${user.id}:`, deleteError.message);
          }
        }

        hasMore = users.users.length > 0;
        page++;
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error during reset:', err);
    return { success: false, error: err };
  }
}
