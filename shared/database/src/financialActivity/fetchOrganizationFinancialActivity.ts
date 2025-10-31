import { getPaginationRange } from '../constants/utils';
import type { Database } from '../schema';
import type { FetchDataParams } from '../types';

type LedgerEntryType = Database['public']['Enums']['ledger_transaction_type'];
type CurrencyType = Database['public']['Enums']['currency_code'];
type TransactionDirectionType = Database['public']['Enums']['transaction_direction'];

export type LedgerEntry = Database['public']['Tables']['wallet_ledger_entries']['Row'];

interface FetchFilesParams extends FetchDataParams {
  organizationId: string;
  types?: LedgerEntryType[];
  currency?: CurrencyType;
  direction?: TransactionDirectionType;
}

export async function fetchOrganizationFinancialActivity({
  supabase,
  organizationId,
  searchQuery = '',
  limit = 12,
  page = 1,
  types,
  currency,
  direction,
}: FetchFilesParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  // First, get the organization's wallet ID(s)
  let walletQuery = supabase
    .from('organization_wallets')
    .select('id')
    .eq('organization_id', organizationId);

  // If currency filter is applied, only get that currency's wallet
  if (currency) {
    walletQuery = walletQuery.eq('currency_code', currency);
  }

  const { data: wallets, error: walletError } = await walletQuery;

  if (walletError || !wallets || wallets.length === 0) {
    console.log('Wallet error:', walletError);
    return { count: 0, data: [] };
  }

  const walletIds = wallets.map((w) => w.id);
  console.log('organization wallet ids:', walletIds);

  let query = supabase
    .from('wallet_ledger_entries')
    .select('*', { count: 'exact' })
    .or(walletIds.map((id) => `source_wallet_id.eq.${id},destination_wallet_id.eq.${id}`).join(','))
    .order('created_at', { ascending: false });

  if (types && types.length > 0) {
    query = query.in('type', types as LedgerEntryType[]);
  }

  if (currency) query = query.eq('currency_code', currency);
  if (direction) query = query.eq('direction', direction);

  if (searchQuery) {
    query = query.or(`paystack_reference.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%`);
  }

  query = query.range(startIndex, endIndex);

  const { data, count, error } = await query;

  if (error) throw new Error(`Fetch error: ${error.message}`);

  return { count: count || 0, data: data || [] };
}
