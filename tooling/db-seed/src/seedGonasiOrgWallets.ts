import { adminSupabase } from './constants';

export async function seedGonasiOrgWallets() {
  const { error } = await adminSupabase
    .from('gonasi_wallets')
    .insert([{ currency_code: 'USD' }, { currency_code: 'KES' }]);

  if (error) {
    console.error('❌ Failed to seed Gonasi wallets:', error.message);
  } else {
    console.log('✅ Gonasi wallets seeded (USD & KES)');
  }
}
