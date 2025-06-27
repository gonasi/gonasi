import { PASSWORD, SU_EMAIL, supabase } from './constants';

export const SIGNED_UP_EMAILS = [
  SU_EMAIL,
  // 'mcdalinoluoch@gmail.com',
  // ...Array.from({ length: TOTAL_USERS }, (_, i) => copycat.email(i).toLowerCase()),
  'mcdalinoluoch@gmail.com',
];

export async function signUpUsers() {
  for (const email of SIGNED_UP_EMAILS) {
    const { data } = await supabase.auth.signUp({
      email,
      password: PASSWORD,
    });

    console.log(`${data ? `✅ Created user: ${data.user?.id}` : '❌ Could not create user'}`);
  }
}
