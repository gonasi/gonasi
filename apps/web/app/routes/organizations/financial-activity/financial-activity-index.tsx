// financial-activity.tsx
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { fetchOrganizationFinancialActivity } from '@gonasi/database/financialActivity';

import type { Route } from './+types/financial-activity-index';
import { LedgerTable } from './components/LedgerTable';

import { NotFoundCard } from '~/components/cards';
import { PaginationBar } from '~/components/search-params/pagination-bar';
import { SearchInput } from '~/components/search-params/search-input';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = 20;

  // return the financials directly so `loaderData` === financials
  const financials = await fetchOrganizationFinancialActivity({
    supabase,
    organizationId: params.organizationId,
    searchQuery,
    limit,
    page,
  });

  return { financials };
}

export default function FinancialActivityIndex({ loaderData }: Route.ComponentProps) {
  const shouldReduceMotion = useReducedMotion();

  const {
    financials: { data: entries, count: totalItems },
  } = loaderData;

  return (
    <motion.section
      className='p-4'
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* header/search omitted for brevity — keep your existing markup */}
      <div className='pb-4'>
        <SearchInput placeholder='Search by reference, id or metadata...' />
      </div>

      {entries && entries.length > 0 ? (
        <>
          <AnimatePresence>
            <LedgerTable entries={entries} />
          </AnimatePresence>
          <PaginationBar totalItems={totalItems ?? 0} itemsPerPage={20} />
        </>
      ) : (
        <NotFoundCard message='No finance records' />
      )}
    </motion.section>
  );
}
