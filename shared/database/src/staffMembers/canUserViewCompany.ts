import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Checks if a user has permission to view a specific company.
 *
 * This function queries the `staff_members` table to see if the user
 * is a staff member of the given company.
 *
 * @param supabase - The Supabase client instance to interact with the database.
 * @param companyId - The ID of the company to check access for.
 * @returns A promise that resolves to `true` if the user can view the company,
 *          or `false` if the user does not have access or an error occurs.
 */
export async function canUserViewCompany(
  supabase: TypedSupabaseClient,
  companyId: string,
): Promise<boolean> {
  // Retrieve the user ID from the authentication system
  const userId = await getUserId(supabase);

  try {
    // Query the staff_members table to check if the user is associated with the company
    const { data, error } = await supabase
      .from('staff_members')
      .select('staff_id, company_id')
      .match({ staff_id: userId, company_id: companyId })
      .single();

    // Return false if there's an error or no matching data is found
    if (error || !data) return false;

    // Return true if the user is found in the staff_members table for the company
    return true;
  } catch (err) {
    // Log any unexpected errors and return false
    console.error('Unexpected error while checking team exit permission:', err);
    return false;
  }
}
