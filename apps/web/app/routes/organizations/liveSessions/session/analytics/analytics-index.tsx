import type { Route } from './+types/analytics-index';

import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Session Analytics • Gonasi' },
    {
      name: 'description',
      content: 'View post-session analytics and participant performance.',
    },
  ];
}

// TODO: Implement loader to fetch analytics data
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session analytics
  // TODO: Fetch block breakdown with stats
  // TODO: Fetch participant list with scores
  // TODO: Check user can view session

  return { analytics: null, blocks: [], participants: [] };
}

// TODO: Implement analytics component
export default function AnalyticsIndex({ params, loaderData }: Route.ComponentProps) {
  const { analytics, blocks, participants } = loaderData;

  // TODO: Overview Stats:
  // - Total participants, peak participants
  // - Total responses, participation rate
  // - Average score, median score, accuracy rate
  // - Session duration

  // TODO: Participation Chart:
  // - Timeline of joins/leaves

  // TODO: Performance Chart:
  // - Score distribution histogram

  // TODO: Block Breakdown:
  // - Each block with response count, accuracy, avg time
  // - Difficulty indicator (based on accuracy)

  // TODO: Participant List:
  // - Sortable table (rank, name, score, responses, avg time)
  // - Export to CSV button

  // TODO: Detailed Responses (optional):
  // - View individual responses per block
  // - Filter by participant

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Session Analytics</h2>

      {/* TODO: Overview stats cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <div className='rounded border p-4'>
          <p className='text-muted-foreground text-sm'>Total Participants</p>
          <p className='text-2xl font-bold'>0</p>
        </div>
        <div className='rounded border p-4'>
          <p className='text-muted-foreground text-sm'>Total Responses</p>
          <p className='text-2xl font-bold'>0</p>
        </div>
        <div className='rounded border p-4'>
          <p className='text-muted-foreground text-sm'>Average Score</p>
          <p className='text-2xl font-bold'>0%</p>
        </div>
        <div className='rounded border p-4'>
          <p className='text-muted-foreground text-sm'>Accuracy Rate</p>
          <p className='text-2xl font-bold'>0%</p>
        </div>
      </div>

      {/* TODO: Charts section */}
      <div className='rounded border p-4'>
        <h3 className='mb-4 font-semibold'>Performance Chart</h3>
        <p>Chart goes here...</p>
      </div>

      {/* TODO: Block breakdown section */}
      <div className='rounded border p-4'>
        <h3 className='mb-4 font-semibold'>Block Breakdown</h3>
        <p>Block stats go here...</p>
      </div>

      {/* TODO: Participant list section */}
      <div className='rounded border p-4'>
        <h3 className='mb-4 font-semibold'>Participant List</h3>
        <p>Participant table goes here...</p>
      </div>
    </div>
  );
}
