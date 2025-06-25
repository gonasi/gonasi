import { adminClient } from '../lib/supabase';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

// user_roles, role_permissions, course_categories, course_sub_categories
// should be populated by migration code

export type ClearableTable = 'profiles' | 'user_roles';

const DEFAULT_TABLES_TO_CLEAR: ClearableTable[] = ['profiles', 'user_roles'];

interface ResetDatabaseOptions {
  tables?: ClearableTable[]; // optional specific tables
  skipAuthUsers?: boolean; // optionally skip user deletion
}

export async function resetDatabase(options?: ResetDatabaseOptions) {
  const { tables = DEFAULT_TABLES_TO_CLEAR, skipAuthUsers = false } = options ?? {};
  const messages: string[] = [];

  try {
    // Clear specified tables
    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().neq('id', ZERO_UUID);

      if (error) {
        const msg = `❌ Error clearing table "${table}": ${error.message}`;
        console.error(msg);
        messages.push(msg);
      } else {
        messages.push(`✅ Cleared table "${table}".`);
      }
    }

    // Optionally delete auth users
    if (!skipAuthUsers) {
      let page = 1;
      let hasMore = true;
      let deletedCount = 0;

      while (hasMore) {
        const { data: users, error: fetchError } = await adminClient.auth.admin.listUsers({
          page,
          perPage: 100,
        });

        if (fetchError) {
          const msg = `❌ Error fetching users: ${fetchError.message}`;
          console.error(msg);
          messages.push(msg);
          return { success: false, message: messages.join('\n') };
        }

        if (users.users.length === 0) break;

        for (const user of users.users) {
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
          if (deleteError) {
            const msg = `❌ Error deleting user ${user.id}: ${deleteError.message}`;
            console.error(msg);
            messages.push(msg);
          } else {
            deletedCount++;
          }
        }

        hasMore = users.users.length > 0;
        page++;
      }

      messages.push(`✅ Deleted ${deletedCount} auth user(s).`);
    } else {
      messages.push(`ℹ️ Skipped deleting auth users.`);
    }

    return { success: true, message: messages.join('\n') };
  } catch (err: any) {
    const msg = `❌ Unexpected error during reset: ${err.message || err}`;
    console.error(msg);
    messages.push(msg);
    return { success: false, message: messages.join('\n') };
  }
}
