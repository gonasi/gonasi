import { getPaginationRange } from '../constants/utils';
import type { Database } from '../schema';
import type { FetchDataParams } from '../types';

type CurrencyType = Database['public']['Enums']['currency_code'];
type TransactionDirectionType = Database['public']['Enums']['transaction_direction'];

export type LedgerEntry = Database['public']['Tables']['wallet_ledger_entries']['Row'];

interface FetchFilesParams extends FetchDataParams {
  organizationId: string;
  types?: string; // 👈 now comma-separated string, e.g. "payment,refund"
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

  // 1️⃣ Get organization wallet IDs
  let walletQuery = supabase
    .from('organization_wallets')
    .select('id')
    .eq('organization_id', organizationId);

  if (currency) {
    walletQuery = walletQuery.eq('currency_code', currency);
  }

  const { data: wallets, error: walletError } = await walletQuery;

  if (walletError || !wallets?.length) {
    console.error('Wallet error:', walletError);
    return { count: 0, data: [] };
  }

  const walletIds = wallets.map((w) => w.id);
  console.log('organization wallet ids:', walletIds);

  // 2️⃣ Base query: all ledger entries linked to wallets
  let query = supabase
    .from('wallet_ledger_entries')
    .select('*', { count: 'exact' })
    .or(walletIds.map((id) => `source_wallet_id.eq.${id},destination_wallet_id.eq.${id}`).join(','))
    .order('created_at', { ascending: false });

  // 3️⃣ Filters
  if (types) {
    const formattedTypes = types
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .join(',');
    if (formattedTypes.length > 0) {
      query = query.filter('type', 'in', `(${formattedTypes})`);
    }
  }

  if (currency) query = query.eq('currency_code', currency);
  if (direction) query = query.eq('direction', direction);

  // 4️⃣ Text search only on text fields
  if (searchQuery) {
    const safeSearch = searchQuery.replace(/[%_]/g, '\\$&');
    query = query.or(`payment_reference.ilike.%${safeSearch}%`);
  }

  query = query.range(startIndex, endIndex);

  const { data, count, error } = await query;

  if (error) throw new Error(`Fetch error: ${error.message}`);

  return {
    count,
    data,
  };
}
