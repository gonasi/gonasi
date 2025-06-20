import { PASSWORD, SU_EMAIL, supabase } from './constants';

export async function signUpUsers() {
  const emails = [
    SU_EMAIL,
    // 'mcdalinoluoch@gmail.com',
    // ...Array.from({ length: TOTAL_USERS }, (_, i) => copycat.email(i).toLowerCase()),
    'mcdalinoluoch@gmail.com',
  ];

  for (const email of emails) {
    const { data } = await supabase.auth.signUp({
      email,
      password: PASSWORD,
    });

    console.log(`${data ? `✅ Created user: ${data.user?.id}` : '❌ Could not create user'}`);
  }
}
