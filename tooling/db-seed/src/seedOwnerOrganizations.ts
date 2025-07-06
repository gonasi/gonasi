import { faker } from '@snaplet/copycat';

import { createNewOrganization } from '@gonasi/database/organizations';

import { TOTAL_ORGANIZATIONS } from './config';
import { PASSWORD, supabase } from './constants';
import { SIGNED_UP_EMAILS } from './signUpUsers';

/**
 * Seeds TOTAL_ORGANIZATIONS organizations per signed-up user.
 * Each organization is created after signing in as the respective user.
 */
export async function seedOwnerOrganizations() {
  let totalCreated = 0;

  for (const email of SIGNED_UP_EMAILS) {
    console.log(`\n🔐 Signing in as ${email}...`);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });

    if (signInError) {
      console.error(`❌ Failed to sign in as ${email} - ${signInError.message}`);
      continue;
    }

    let userCreated = 0;

    while (userCreated < TOTAL_ORGANIZATIONS) {
      const orgName = faker.company.name();
      const orgHandle = faker.internet.domainWord().toLowerCase();

      const { success, message } = await createNewOrganization(supabase, {
        name: orgName,
        handle: orgHandle,
      });

      if (success) {
        userCreated++;
        totalCreated++;
        console.log(
          `✅ Created organization "${orgName}" for user ${email} (${userCreated}/${TOTAL_ORGANIZATIONS})`,
        );
      } else {
        console.error(`❌ Failed to create org for ${email} - ${message}`);
        break; // Prevent infinite retries
      }
    }

    await supabase.auth.signOut();
  }

  console.log(
    `\n🎉 Done. Created ${totalCreated} organizations across ${SIGNED_UP_EMAILS.length} users.`,
  );
}
