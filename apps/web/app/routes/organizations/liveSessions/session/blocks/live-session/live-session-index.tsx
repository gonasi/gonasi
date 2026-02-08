import { useOutletContext } from 'react-router';
import { TvMinimalPlay } from 'lucide-react';

import type { Route } from './+types/live-session-index';
import type { LiveSessionBlocksOutletContext } from '../types';

import { Modal } from '~/components/ui/modal';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Control Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Control the flow of live session',
    },
  ];
}

export default function LiveSessionIndex({ params }: Route.ComponentProps) {
  const { organizationId, sessionId } = params;
  const { session, blocks, sessionCode, mode } = useOutletContext<LiveSessionBlocksOutletContext>();

  const closeRoute = `/${organizationId}/live-sessions/${sessionId}/blocks`;

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={
            <div className='flex items-center space-x-1'>
              <div
                className={cn(
                  'relative flex items-center text-sm font-medium transition-colors',
                  mode === 'live' ? 'text-success' : 'text-muted-foreground',
                )}
              >
                <TvMinimalPlay
                  className={cn(mode === 'live' ? 'text-success' : 'text-secondary')}
                />
                <span
                  className={cn(
                    'absolute -top-1 -right-1 h-1 w-1 animate-pulse rounded-full',
                    mode === 'live' ? 'bg-success' : 'bg-secondary',
                  )}
                />
              </div>
              <p
                className={cn(
                  'font-secondary text-xs',
                  mode === 'live' ? 'text-success' : 'text-secondary',
                )}
              >
                {mode}
              </p>
            </div>
          }
          closeRoute={closeRoute}
          title='Session Controls'
        />
        <Modal.Body>
          <div className='space-y-6'>
            {/* Session Info */}
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <h2 className='text-lg font-semibold'>{session.name}</h2>
              <div className='mt-2 space-y-1 text-sm text-gray-600'>
                <p>
                  <span className='font-medium'>Session Code:</span> {sessionCode}
                </p>
                <p>
                  <span className='font-medium'>Mode:</span>{' '}
                  <span className='capitalize'>{mode}</span>
                </p>
                <p>
                  <span className='font-medium'>Status:</span>{' '}
                  <span className='capitalize'>{session.status}</span>
                </p>
                <p>
                  <span className='font-medium'>Total Blocks:</span> {blocks.length}
                </p>
              </div>
            </div>

            {/* Blocks List */}
            <div>
              <h3 className='mb-3 text-base font-semibold'>Session Blocks</h3>
              <div className='space-y-2'>
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium'>
                        {index + 1}
                      </span>
                      <div>
                        <p className='font-medium capitalize'>
                          {block.plugin_type.replace(/_/g, ' ')}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Time Limit: {block.time_limit}s | Difficulty: {block.difficulty}
                        </p>
                      </div>
                    </div>
                    <div className='text-sm text-gray-500'>
                      Status: <span className='capitalize'>{block.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Buttons Placeholder */}
            <div className='rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500'>
              <p>Session control buttons will be added here</p>
              <p className='mt-1 text-sm'>Start, Next, Previous, End Session, etc.</p>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
