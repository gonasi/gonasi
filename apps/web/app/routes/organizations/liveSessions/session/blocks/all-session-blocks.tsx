import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';
import {
  ArrowLeftRight,
  CircleDot,
  CircleX,
  MoveHorizontal,
  PenLine,
  Search,
  SquareCheck,
  ToggleRight,
} from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import type { Route } from './+types/all-session-blocks';

import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [{ title: 'Add Live Block Plugin • Gonasi' }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const { data: canEdit } = await supabase.rpc('can_user_edit_live_session', {
    arg_session_id: sessionId,
  });

  if (!canEdit) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions/${sessionId}/blocks`,
      'You do not have permission to add blocks.',
    );
  }

  return { canEdit: true };
}

const PLUGIN_TYPES = [
  {
    id: 'true_or_false',
    label: 'True or False',
    description: 'Students decide if a statement is true or false.',
    icon: ToggleRight,
    available: true,
  },
  {
    id: 'multiple_choice_single',
    label: 'Multiple Choice',
    description: 'Pick one correct answer from several options.',
    icon: CircleDot,
    available: false,
  },
  {
    id: 'multiple_choice_multiple',
    label: 'Multi-Select',
    description: 'Select all answers that apply.',
    icon: SquareCheck,
    available: false,
  },
  {
    id: 'fill_in_blank',
    label: 'Fill in the Blank',
    description: 'Complete the sentence or phrase.',
    icon: PenLine,
    available: false,
  },
  {
    id: 'matching_game',
    label: 'Matching',
    description: 'Match items from two columns.',
    icon: ArrowLeftRight,
    available: false,
  },
  {
    id: 'swipe_categorize',
    label: 'Swipe & Sort',
    description: 'Drag items into the correct categories.',
    icon: MoveHorizontal,
    available: false,
  },
];

const MotionLink = motion(Link);

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function AllSessionBlocks({ params }: Route.ComponentProps) {
  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;

  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('q') ?? '');
  const deferredValue = useDeferredValue(value);

  const debouncedSetSearchParams = useRef(
    debounce((newValue: string) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (newValue) {
            newParams.set('q', newValue);
          } else {
            newParams.delete('q');
          }
          return newParams;
        },
        { replace: true },
      );
    }, 300),
  ).current;

  useEffect(() => {
    debouncedSetSearchParams(deferredValue);
    return () => debouncedSetSearchParams.cancel();
  }, [deferredValue, debouncedSetSearchParams]);

  // Sync query param -> value on back/forward nav
  useEffect(() => {
    const paramValue = searchParams.get('q') ?? '';
    if (paramValue !== value) {
      setValue(paramValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filteredPlugins = useMemo(() => {
    const q = deferredValue.trim().toLowerCase();
    if (!q) return PLUGIN_TYPES;
    return PLUGIN_TYPES.filter(
      (plugin) =>
        plugin.label.toLowerCase().includes(q) || plugin.description.toLowerCase().includes(q),
    );
  }, [deferredValue]);

  return (
    <>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title='Select Block Plugin' closeRoute={blocksPath} />
          <Modal.Body>
            <motion.div
              className='bg-background sticky top-0 z-10'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='pt-1'>
                <Input
                  placeholder='Search for a Block Plugin'
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onRightIconClick={() => setValue('')}
                  className='mb-4 rounded-full'
                  leftIcon={<Search />}
                  rightIcon={value ? <CircleX className='cursor-pointer' /> : null}
                />
              </div>
            </motion.div>
            {filteredPlugins.length === 0 && (
              <p className='text-muted-foreground py-6 text-center text-sm'>
                No plugins match your search.
              </p>
            )}
            <motion.div
              className='grid gap-1'
              initial='hidden'
              animate='visible'
              variants={listVariants}
            >
              {filteredPlugins.map((plugin) => {
                const Icon = plugin.icon;

                const content = (
                  <>
                    <div className='bg-muted-foreground/5 border-primary/5 rounded-sm border p-2 transition-colors duration-200'>
                      <Icon className='text-primary' />
                    </div>
                    <div className='flex-1'>
                      <div className='font-secondary font-semibold'>{plugin.label}</div>
                      <div className='text-muted-foreground font-secondary text-sm'>
                        {plugin.description}
                      </div>
                    </div>
                    {!plugin.available && (
                      <Badge variant='secondary' className='text-xs'>
                        Coming Soon
                      </Badge>
                    )}
                  </>
                );

                if (!plugin.available) {
                  return (
                    <motion.div
                      key={plugin.id}
                      variants={itemVariants}
                      className='flex w-full cursor-not-allowed items-center gap-3 rounded-sm p-2 text-left opacity-60'
                    >
                      {content}
                    </motion.div>
                  );
                }

                return (
                  <MotionLink
                    key={plugin.id}
                    variants={itemVariants}
                    to={`${blocksPath}/new/${plugin.id}/create`}
                    className='hover:bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-sm p-2 text-left transition-all duration-200 ease-in-out'
                  >
                    {content}
                  </MotionLink>
                );
              })}
            </motion.div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
