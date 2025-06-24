import type { UpsertPayoutDetailsSchemaTypes } from '@gonasi/schemas/settings';

import type { TypedSupabaseClient } from '../client';
import { getUserProfile } from '../profile';

interface UpsertPaystackSubaccountParams {
  supabase: TypedSupabaseClient;
  data: UpsertPayoutDetailsSchemaTypes;
}

export async function upsertPaystackSubaccount({ supabase, data }: UpsertPaystackSubaccountParams) {
  const { user } = await getUserProfile(supabase);
  const { data: responseData, error } = await supabase.functions.invoke(
    'paystack-create-subaccount',
    {
      body: {
        business_name: user?.full_name,
        bank_code: data.bankCode,
        account_number: data.accountNumber,
        description: `${user?.username} - ${user?.full_name}`,
        primary_contact_email: user?.email,
        primary_contact_name: user?.full_name,
        primary_contact_phone: user?.phone_number,
      },
    },
  );

  console.log('data: ', responseData);

  if (error || !responseData?.status || !Array.isArray(responseData.data)) {
    console.error(
      'Error fetching Paystack bank accounts:',
      error?.message || responseData?.message || 'Unknown error',
    );
    return [];
  }

  return {
    success: true,
    message: 'Subaccount updated successfully',
  };
}
