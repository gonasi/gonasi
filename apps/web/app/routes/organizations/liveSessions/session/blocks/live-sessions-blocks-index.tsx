import { useEffect, useState } from 'react';
import { data, Outlet, useFetcher } from 'react-router';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { Edit, GripVerticalIcon, Plus, Trash2 } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import { fetchLiveSessionBlocks, reorderLiveSessionBlocks } from '@gonasi/database/liveSessions';
import { BlocksPositionUpdateArraySchema } from '@gonasi/schemas/plugins';

import type { Route } from './+types/live-sessions-blocks-index';

import { NotFoundCard } from '~/components/cards';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Badge } from '~/components/ui/badge';
import { IconNavLink } from '~/components/ui/button';
import { ReorderIconTooltip } from '~/components/ui/tooltip/ReorderIconToolTip';
import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Session Blocks • Gonasi' },
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
    fetchLiveSessionBlocks({ supabase, liveSessionId: sessionId }),
    supabase.rpc('can_user_edit_live_session', { arg_session_id: sessionId }),
  ]);

  return {
    blocks,
    canEdit: canEditResult.data ?? false,
  };
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

// ─── Block Type Labels ────────────────────────────────────────
const PLUGIN_TYPE_LABELS: Record<string, string> = {
  true_or_false: 'True or False',
  multiple_choice_single: 'Multiple Choice',
  multiple_choice_multiple: 'Multi-Select',
  fill_in_blank: 'Fill in the Blank',
  matching_game: 'Matching',
  swipe_categorize: 'Swipe & Sort',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  skipped: 'bg-yellow-100 text-yellow-800',
};

// ─── Block Card (Reorder.Item) ────────────────────────────────
type BlockRow = Awaited<ReturnType<typeof fetchLiveSessionBlocks>>[number];

interface BlockCardProps {
  block: BlockRow;
  index: number;
  canEdit: boolean;
  loading: boolean;
  organizationId: string;
  sessionId: string;
}

function BlockCard({ block, index, canEdit, loading, organizationId, sessionId }: BlockCardProps) {
  const basePath = `/${organizationId}/live-sessions/${sessionId}/blocks`;
  const blockY = useMotionValue(0);
  const blockShadow = useRaisedShadow(blockY, { borderRadius: '8px' });
  const dragControls = useDragControls();

  const questionPreview = (block.content as { questionState?: string })?.questionState;

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      style={{ boxShadow: blockShadow, y: blockY }}
      dragListener={false}
      dragControls={dragControls}
      layoutScroll
      className='select-none'
    >
      <div className='bg-card flex items-start gap-3 rounded-lg border p-3'>
        {/* Drag handle */}
        {canEdit && (
          <div className='mt-1'>
            <ReorderIconTooltip
              title='Drag to reorder'
              icon={GripVerticalIcon}
              disabled={loading}
              dragControls={dragControls}
            />
          </div>
        )}

        {/* Content */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground font-mono text-xs'>#{index + 1}</span>
            <span className='text-sm font-medium'>
              {PLUGIN_TYPE_LABELS[block.plugin_type] ?? block.plugin_type}
            </span>
            <Badge className={STATUS_COLORS[block.status] ?? STATUS_COLORS.pending}>
              {block.status}
            </Badge>
            <Badge variant='outline' className='text-xs'>
              Weight: {block.weight}
            </Badge>
          </div>

          {questionPreview && (
            <div className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
              <RichTextRenderer editorState={questionPreview} />
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className='flex gap-1'>
            <IconNavLink
              to={`${basePath}/${block.id}/edit`}
              icon={Edit}
              className='border-border/20 rounded border p-1.5'
            />
            <IconNavLink
              to={`${basePath}/${block.id}/delete`}
              icon={Trash2}
              className='text-danger border-border/20 rounded border p-1.5'
            />
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function BlocksIndex({ params, loaderData }: Route.ComponentProps) {
  const { blocks, canEdit } = loaderData;
  const fetcher = useFetcher();

  const [reorderedBlocks, setReorderedBlocks] = useState<BlockRow[]>(blocks);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReorderedBlocks(blocks);
  }, [blocks]);

  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;

  const handleReorder = (updated: BlockRow[]) => {
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
      <div className='space-y-6'>
        <div className='flex items-center justify-end'>
          {canEdit && (
            <IconNavLink
              to={`${blocksPath}/all-session-blocks`}
              icon={Plus}
              className='rounded-lg border p-2'
            />
          )}
        </div>

        {reorderedBlocks.length > 0 ? (
          <Reorder.Group
            axis='y'
            values={reorderedBlocks}
            onReorder={handleReorder}
            layoutScroll
            className='space-y-3 select-none'
          >
            {reorderedBlocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                index={index}
                canEdit={canEdit}
                loading={isSubmitting}
                organizationId={params.organizationId}
                sessionId={params.sessionId}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div>
            <NotFoundCard message='No blocks yet. Add your first live block to get started.' />
          </div>
        )}
      </div>

      <Outlet />
    </>
  );
}
