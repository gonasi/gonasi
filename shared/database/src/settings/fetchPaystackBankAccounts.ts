import type { TypedSupabaseClient } from '../client';
import type { PaystackBanksResponse } from './types';

interface FetchPaystackBankAccountsParams {
  supabase: TypedSupabaseClient;
  currency: string;
  type: string;
}

interface PaystackBankOption {
  value: number;
  label: string;
}

export async function fetchPaystackBankAccounts({
  supabase,
  currency,
  type,
}: FetchPaystackBankAccountsParams): Promise<PaystackBankOption[]> {
  const { data, error } = await supabase.functions.invoke<PaystackBanksResponse>(
    'paystack-fetch-bank-accounts',
    {
      body: { currency, type },
    },
  );

  if (error || !data?.status || !Array.isArray(data.data)) {
    console.error(
      'Error fetching Paystack bank accounts:',
      error?.message || data?.message || 'Unknown error',
    );
    return [];
  }

  return data.data.map((bank) => ({
    value: bank.id,
    label: bank.name,
  }));
}
