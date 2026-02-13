import type { fetchLiveSessionById, LiveSessionBlock } from '@gonasi/database/liveSessions';

// Type for the session data returned from fetchLiveSessionById
export type LiveSession = NonNullable<Awaited<ReturnType<typeof fetchLiveSessionById>>>;

// Outlet context type passed from parent blocks route to child routes
export interface LiveSessionBlocksOutletContext {
  mode: 'test' | 'live';
  session: LiveSession;
  blocks: LiveSessionBlock[];
  canEdit: boolean;
  sessionCode: string;
}
