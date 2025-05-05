import { copycat } from '@snaplet/copycat';

import { PASSWORD, SU_EMAIL, supabase } from './constants';

export async function signUpUsers() {
  const emails = [
    SU_EMAIL,
    ...Array.from({ length: 10 }, (_, i) => copycat.email(i).toLowerCase()),
  ];

  for (const email of emails) {
    const { data } = await supabase.auth.signUp({
      email,
      password: PASSWORD,
    });

    console.log(`${data ? `✅ Created user: ${data.user?.id}` : '❌ Could not create user'}`);
  }
}
