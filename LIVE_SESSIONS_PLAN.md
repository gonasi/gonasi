# Live Interactive Sessions - Database Design Plan

## Summary

I've designed a comprehensive database schema for the **Live Interactive Sessions** feature that enables educators to run real-time Q&A sessions with instant scoring and leaderboards.

## What Was Created

### 1. Database Schema Files

All schema files are in `/supabase/schemas/liveSessions/`:

#### Enums (5 files)
- `live_session_visibility.sql` - public, unlisted, private
- `live_session_status.sql` - draft, waiting, active, paused, ended
- `live_session_block_status.sql` - pending, active, closed, skipped
- `live_response_status.sql` - submitted, correct, incorrect, partial
- `live_participant_status.sql` - joined, left, kicked

#### Core Tables (7 files)
- `live_sessions_schema_and_indexes.sql` - Main session table with visibility & key-based access
- `live_session_blocks_schema_and_indexes.sql` - Questions (reuses existing plugin types)
- `live_session_participants_schema_and_indexes.sql` - Participant tracking with stats & ranks
- `live_session_responses_schema_and_indexes.sql` - Individual answers with timing & scoring
- `live_session_messages_schema_and_indexes.sql` - Optional real-time chat
- `live_session_reactions_schema_and_indexes.sql` - Optional emoji reactions
- `live_session_analytics_schema_and_indexes.sql` - Aggregate analytics per session

#### Utility Functions (10 files)
- `generate_session_code.sql` - Generates unique 6-char codes
- `trigger_generate_session_code.sql` - Auto-generates codes on insert
- `update_participant_stats.sql` - Recalculates participant statistics
- `update_block_stats.sql` - Recalculates block statistics
- `calculate_leaderboard_ranks.sql` - Ranks participants by score & speed
- `update_session_analytics.sql` - Updates session-wide analytics
- `trigger_update_stats_after_response.sql` - Auto-updates all stats on new responses
- `join_live_session.sql` - RPC for joining with validation
- `leave_live_session.sql` - RPC for leaving
- `live_session_blocks_rpc_reorder.sql` - Reorder blocks within session

#### Triggers & RLS (8 files)
- `live_sessions_triggers.sql` - Timestamp update triggers
- `live_sessions_rls.sql` - Access control for sessions
- `live_session_blocks_rls.sql` - Access control for blocks
- `live_session_participants_rls.sql` - Access control for participants
- `live_session_responses_rls.sql` - Access control for responses
- `live_session_messages_rls.sql` - Access control for messages
- `live_session_reactions_rls.sql` - Access control for reactions
- `live_session_analytics_rls.sql` - Access control for analytics

#### Documentation
- `README.md` - Comprehensive documentation covering architecture, real-time setup, usage flows, and examples

### 2. Configuration Updated

Updated `/supabase/config.toml` with all 38 new schema file paths in the correct order.

## Key Features Implemented

### Visibility & Access Control
- **Public**: Anyone with session code can join
- **Unlisted**: Anyone with code can join, not listed publicly
- **Private**: Requires session code + session key (password)

### Real-Time Capabilities
- All tables configured for Supabase Realtime
- Instant leaderboard updates
- Live question display
- Real-time response tracking
- Optional live chat and reactions

### Automatic Statistics
When a response is submitted, triggers automatically:
- Update block stats (response count, accuracy, avg time)
- Update participant stats (score, response count, avg time)
- Recalculate leaderboard rankings (by score, then speed)
- Update session-wide analytics

### Plugin Integration
- Reuses ALL existing quiz plugin types (no changes needed)
- Same content/settings schemas as lesson_blocks
- Supports: multiple_choice_single, true_or_false, fill_in_blank, matching, swipe_categorize, etc.

### Course Integration
- Optional linking to courses/published_courses
- Use live sessions to reinforce lessons
- Organization-scoped with full RLS

## Database Structure

```
live_sessions (main session metadata)
├── live_session_blocks (questions)
│   └── live_session_responses (participant answers)
├── live_session_participants (who's in the session)
├── live_session_messages (optional chat)
├── live_session_reactions (optional reactions)
└── live_session_analytics (aggregate stats)
```

## Next Steps

### 1. Generate Migration
```bash
cd supabase
supabase db reset  # Local development

# Or for production migration:
supabase db diff --schema public --schema auth --schema extensions \
  --schema storage --schema pgmq --schema realtime -f live_sessions
```

### 2. Update TypeScript Types
```bash
cd supabase
supabase gen types typescript --local > ../shared/database/src/schema/index.ts
```

### 3. Create Database Functions (shared/database/src/)
Create type-safe database functions in `/shared/database/src/liveSessions/`:
- `createLiveSession.ts`
- `fetchLiveSessionByCode.ts`
- `fetchLiveSessionById.ts`
- `joinLiveSession.ts` (calls RPC)
- `submitLiveResponse.ts`
- `fetchSessionLeaderboard.ts`
- `updateSessionStatus.ts`
- `activateBlock.ts`
- `closeBlock.ts`
- etc.

### 4. Create Zod Schemas (shared/gonasi-schemas/src/)
Define validation schemas in `/shared/gonasi-schemas/src/liveSessions/`:
- `liveSessionSchema.ts` - Session creation/update
- `liveSessionBlockSchema.ts` - Block creation (reuse plugin schemas)
- `joinSessionSchema.ts` - Join validation
- `submitResponseSchema.ts` - Response submission
- etc.

### 5. Build UI Components (apps/web/app/)

#### Instructor View
- **Session Builder**: Create session, add blocks, configure settings
- **Session Control Panel**: Start/pause/end session, activate blocks, view responses
- **Live Dashboard**: Real-time participant count, current question stats
- **Leaderboard**: Live rankings
- **Analytics**: Post-session analysis

#### Participant View
- **Join Screen**: Enter session code + key (if private)
- **Waiting Room**: Before session starts
- **Question Display**: Shows active question
- **Answer Input**: Reuse existing plugin UI components
- **Leaderboard**: Live rankings
- **Chat/Reactions**: If enabled

### 6. Real-Time Subscriptions

Example for participants:
```typescript
const channel = supabase
  .channel('live-session')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'live_session_blocks',
      filter: `live_session_id=eq.${sessionId}`
    },
    (payload) => {
      // New question activated
      if (payload.new.status === 'active') {
        showQuestion(payload.new);
      }
    }
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'live_session_participants',
      filter: `live_session_id=eq.${sessionId}`
    },
    (payload) => {
      // Leaderboard updated
      updateLeaderboard();
    }
  )
  .subscribe();
```

### 7. Routes to Create (apps/web/app/routes/)

Suggested route structure:
```
/dashboard/live-sessions
  /new - Create session
  /$sessionId
    /edit - Edit session
    /control - Instructor control panel (during session)
    /results - Post-session analytics

/live/$sessionCode
  /join - Join screen
  /session - Active session (participant view)
```

### 8. Enable Realtime in Supabase

After running migration, enable realtime publication:
```sql
alter publication supabase_realtime add table live_sessions;
alter publication supabase_realtime add table live_session_blocks;
alter publication supabase_realtime add table live_session_participants;
alter publication supabase_realtime add table live_session_responses;
alter publication supabase_realtime add table live_session_messages;
alter publication supabase_realtime add table live_session_reactions;
alter publication supabase_realtime add table live_session_analytics;
```

## Architecture Decisions

### Why No "Published" Version?
Unlike courses, live sessions are ephemeral and real-time. There's no need for:
- Publishing workflow
- Version tracking
- Separate draft/published states

The `status` enum handles lifecycle: draft → waiting → active → ended

### Why Reuse Plugin Types?
- Zero code duplication
- Existing plugins work immediately
- Consistent content structure
- Easier maintenance

### Why Automatic Statistics?
- Real-time leaderboards require instant updates
- Triggers ensure consistency
- Reduces client-side complexity
- Better performance than on-the-fly calculations

### Why Separate Analytics Table?
- Pre-computed aggregates for fast queries
- Decouple analytics from operational tables
- Support historical analysis
- Enable reporting without impacting live sessions

## Testing Checklist

Before deploying to production:

- [ ] Run migration locally
- [ ] Create public session and join
- [ ] Create private session and verify key requirement
- [ ] Test max participants limit
- [ ] Submit responses from multiple participants
- [ ] Verify leaderboard ranking (score, then speed)
- [ ] Test real-time updates with multiple browser tabs
- [ ] Verify chat/reactions when enabled
- [ ] Test all RLS policies (different user roles)
- [ ] Check analytics accuracy
- [ ] Test session state transitions
- [ ] Verify block reordering
- [ ] Test late join prevention
- [ ] Verify organization scoping
- [ ] Load test with 100+ participants

## Performance Considerations

### Database Indexes
All critical paths indexed:
- Foreign keys
- Status fields (for filtering)
- Session codes (for lookups)
- Ranks (for leaderboard queries)

### Real-Time Optimization
- Use Supabase Realtime filters to reduce bandwidth
- Subscribe only to relevant session
- Unsubscribe on leave

### Caching Strategy
- Statistics cached in tables (not calculated on-the-fly)
- Triggers handle incremental updates
- Analytics pre-aggregated

## Future Enhancements

Potential features for v2:
- Team mode (group participants)
- Bonus points (time-based multipliers)
- Power-ups (hints, skips, 50/50)
- Replay mode (review past sessions)
- Export results (CSV, PDF)
- Webhooks (notify external systems)
- Advanced analytics (cohort analysis, difficulty ratings)
- Mobile app optimizations
- Screen sharing for instructors

## Security Notes

### Current Implementation
- RLS enforced on all tables
- Organization membership required
- Role-based permissions (owner/admin/editor can create)
- Session keys for private sessions

### Production Hardening
- Consider hashing session_keys (currently plaintext)
- Rate limiting on response submissions
- Spam prevention for chat/reactions
- Audit logging for sensitive operations
- GDPR compliance (right to deletion)

## Questions for Product Team

1. **Scoring**: Should we add configurable scoring rules (e.g., bonus for speed, penalty for wrong answers)?
2. **Capacity Limits**: What's the expected max participants per session?
3. **Mobile**: Is native mobile app a priority for v1?
4. **Recording**: Should we record sessions for replay?
5. **Moderation**: What moderation tools do instructors need for chat?
6. **Notifications**: Should participants get notifications when session starts?

## File Summary

Total files created: **39 files**

- 5 enum definitions
- 7 table schemas
- 10 utility functions
- 8 RLS policy files
- 1 trigger file
- 1 reordering RPC
- 1 comprehensive README
- 1 config.toml update
- 1 plan document (this file)

All ready for migration generation!

---

**Next immediate step**: Run `supabase db diff` to generate the migration, then implement the TypeScript database functions and Zod schemas.
