import { adminSupabase } from './constants';

export async function seedGonasiOrgWallets() {
  const { error } = await adminSupabase.from('gonasi_wallets').insert([
    { currency_code: 'USD', available_balance: 0.0, pending_balance: 0.0 },
    { currency_code: 'KES', available_balance: 0.0, pending_balance: 0.0 },
  ]);

  if (error) {
    console.error('❌ Failed to seed Gonasi wallets:', error.message);
  } else {
    console.log('✅ Gonasi wallets seeded (USD & KES)');
  }
}
