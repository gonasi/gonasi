import { lazy, Suspense, useEffect, useState } from 'react';
import { data, Outlet, useFetcher, useNavigate } from 'react-router';
import { Reorder } from 'framer-motion';
import { dataWithError, redirectWithError } from 'remix-toast';
import { ClientOnly } from 'remix-utils/client-only';

import { fetchLiveSessionBlocks, reorderLiveSessionBlocks } from '@gonasi/database/liveSessions';
import { BlocksPositionUpdateArraySchema } from '@gonasi/schemas/plugins';

import type { Route } from './+types/live-sessions-blocks-index';

import { NotFoundCard } from '~/components/cards';
import { Spinner } from '~/components/loaders';
import LiveSessionBlockWrapper from '~/components/plugins/liveSession/LiveSessionBlockWrapper';
import { PluginButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

const ViewLiveSessionPluginRenderer = lazy(
  () => import('~/components/plugins/liveSession/ViewLiveSessionPluginRenderer'),
);

export type LiveSessionBlock = NonNullable<NonNullable<LiveSessionBlockType>>[number];

export type LiveSessionBlockType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['blocks'];

export function meta() {
  return [
    { title: 'Live Session Blocks • Gonasi' },
    {
      name: 'description',
      content: 'Manage question blocks for your live session.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const [blocks, canEditResult] = await Promise.all([
    fetchLiveSessionBlocks({
      supabase,
      liveSessionId: sessionId,
      organizationId: params.organizationId,
    }),
    supabase.rpc('can_user_edit_live_session', { arg_session_id: sessionId }),
  ]);

  if (!blocks.success) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions/${sessionId}/blocks`,
      'Unable to load live session blocks.',
    );
  }

  return { blocks: blocks.data, canEdit: canEditResult.data ?? false };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  if (formData.get('intent') === 'reorder-blocks') {
    const blocksRaw = formData.get('blocks');
    const parsed = BlocksPositionUpdateArraySchema.safeParse(JSON.parse(blocksRaw as string));

    if (!parsed.success) {
      return dataWithError(null, 'Invalid block order.');
    }

    const result = await reorderLiveSessionBlocks({
      supabase,
      liveSessionId: params.sessionId,
      blockPositions: parsed.data,
    });

    return result.success ? data({ success: true }) : dataWithError(null, result.message);
  }

  return data({ success: false });
}

// ─── Main Component ──────────────────────────────────────────
export default function BlocksIndex({ params, loaderData }: Route.ComponentProps) {
  const { blocks, canEdit } = loaderData;
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const { setMode } = useStore();

  useEffect(() => {
    setMode('preview');
  }, [setMode]);

  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;

  const navigateTo = (path: string) => () => navigate(path);

  const [reorderedBlocks, setReorderedBlocks] = useState<LiveSessionBlock[]>(blocks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setReorderedBlocks(blocks);
  }, [blocks]);

  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const handleReorder = (updated: LiveSessionBlock[]) => {
    if (!canEdit) return;

    setReorderedBlocks(updated);

    const orderedData = updated.map((block, index) => ({
      id: block.id,
      position: index + 1,
    }));

    const formData = new FormData();
    formData.append('intent', 'reorder-blocks');
    formData.append('blocks', JSON.stringify(orderedData));

    fetcher.submit(formData, { method: 'post', action: blocksPath });
  };

  return (
    <>
      {reorderedBlocks.length > 0 ? (
        <div className='mx-auto flex max-w-2xl flex-col pl-4 md:px-0'>
          <Reorder.Group
            axis='y'
            values={reorderedBlocks}
            onReorder={handleReorder}
            className='flex w-full flex-col space-y-8 py-10'
          >
            {reorderedBlocks.map((block, index) => {
              const blockIdPath = `${blocksPath}/${block.id}`;
              const isLastBlock = index === reorderedBlocks.length - 1;

              return (
                <LiveSessionBlockWrapper
                  key={block.id}
                  block={block}
                  loading={isSubmitting}
                  onEdit={navigateTo(`${blockIdPath}/edit`)}
                  onDelete={navigateTo(`${blockIdPath}/delete`)}
                  canEdit={canEdit}
                  isDragging={isDragging}
                  onMinimize={() => setIsDragging(true)}
                  onExpand={() => setIsDragging(false)}
                >
                  <ClientOnly fallback={<Spinner />}>
                    {() => (
                      <Suspense fallback={<Spinner />}>
                        <ViewLiveSessionPluginRenderer block={block} isLastBlock={isLastBlock} />
                      </Suspense>
                    )}
                  </ClientOnly>
                </LiveSessionBlockWrapper>
              );
            })}
          </Reorder.Group>
        </div>
      ) : (
        <div className='max-w-2xl'>
          <NotFoundCard message='No blocks yet. Add your first live block to get started.' />
        </div>
      )}

      {canEdit ? (
        <PluginButton
          tooltipTitle='Add a live session block'
          onClick={navigateTo(`${blocksPath}/all-session-blocks`)}
        />
      ) : null}

      <Outlet />
    </>
  );
}
