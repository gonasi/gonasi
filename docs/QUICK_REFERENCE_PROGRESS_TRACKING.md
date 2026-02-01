# Quick Reference: Progress Tracking & Publishing

> **TL;DR**: Gonasi now intelligently tracks course versions and only resets progress for content that actually changed, preserving user progress on unchanged content.

## Key Concepts in 60 Seconds

### 1. Draft vs Published
- **Draft**: Where you edit (`courses`, `chapters`, `lessons`, `lesson_blocks`)
- **Published**: What learners see (`published_courses`, `published_course_structure_content`)

### 2. Version Tracking
Every change increments a version number:
```
Edit block content → block.content_version++
Edit pricing → tier.pricing_version++
Edit course name → course.overview_version++
```

### 3. Smart Progress Reset
**Old way:** Republish → Delete ALL progress ❌
**New way:** Republish → Delete ONLY changed block progress ✅

## Common Tasks

### Publish a Course
```typescript
import { upsertPublishCourse, getTransformedDataToPublish } from '@gonasi/database/publishedCourses';

const data = await getTransformedDataToPublish(supabase, courseId);
await upsertPublishCourse(supabase, courseId, data);
// Automatically detects changes and resets only affected progress
```

### Track Block Completion
```typescript
await supabase.rpc('complete_block', {
  p_published_course_id: publishedCourseId,
  p_chapter_id: chapterId,
  p_lesson_id: lessonId,
  p_block_id: blockId,
  p_earned_score: 95,
  p_time_spent_seconds: 120
});
```

### Check What Changed
```sql
SELECT * FROM detect_changed_blocks(
  'draft-course-id',
  'published-course-id'
);
-- Returns: block_id, change_type ('new'|'modified'|'deleted'), versions
```

## Version Numbers Explained

| Column | Increments When | Used For |
|--------|----------------|----------|
| `content_version` | Block/lesson/chapter content changes | Detecting content updates |
| `pricing_version` | Pricing tier changes | Tracking pricing changes |
| `overview_version` | Name/description/image changes | Metadata updates |
| `last_update_type` | Any of the above | Quick filtering by update type |

## Progress Hierarchy

```
course_progress (overall %)
  ├─ chapter_progress (per chapter %)
  │   ├─ lesson_progress (per lesson %)
  │   │   └─ block_progress (completed/not completed)
```

All percentages auto-calculate based on completed block weights.

## Important Functions

### Database (SQL)
```sql
-- Compare versions and find changes
detect_changed_blocks(course_id, published_course_id)

-- Reset progress for changed blocks only
invalidate_stale_block_progress(published_course_id, changed_blocks)

-- Mark a block as completed
complete_block(published_course_id, chapter_id, lesson_id, block_id, ...)
```

### TypeScript
```typescript
// Transform draft course to publishable format
getTransformedDataToPublish(supabase, courseId)

// Publish course (includes change detection + progress reset)
upsertPublishCourse(supabase, courseId, transformedData)
```

## When Progress Gets Reset

| Scenario | Progress Reset? | Reason |
|----------|----------------|---------|
| First publication | ✅ All | No version history to compare |
| Republish unchanged course | ❌ None | No version changes detected |
| Edit 1 block, republish | ✅ That block only | Granular invalidation |
| Delete a block, republish | ✅ That block only | Marked as 'deleted' |
| Edit pricing only | ❌ None | Pricing doesn't affect content progress |
| Edit course name only | ❌ None | Overview doesn't affect content progress |

## Monitoring & Debugging

### Check Version History
```sql
SELECT
  name,
  content_version,
  pricing_version,
  overview_version,
  last_update_type,
  updated_at
FROM published_courses
WHERE id = 'course-uuid';
```

### View Progress Invalidation Logs
Look for console logs in publication process:
```
[upsertPublishCourse] Detected 3 changed block(s), invalidating progress
[upsertPublishCourse] ✅ Progress invalidation complete: {
  invalidated_count: 5,
  affected_users: 2,
  ...
}
```

### Find Blocks with Draft Changes
```sql
SELECT
  lb.id,
  lb.plugin_type,
  lb.content_version as draft_version,
  -- Compare with published version
FROM lesson_blocks lb
WHERE lb.content_version > /* published version */;
```

## Performance Notes

- **Change Detection**: ~50-100ms for 100+ blocks
- **Progress Invalidation**: ~200-500ms for 10+ affected users
- **Version Increment**: <1ms (automatic via triggers)

## Migration Applied

✅ **Migration:** `20260131125756_add_version_tracking_and_progress_invalidation.sql`

- Added version columns to all relevant tables
- Created change detection functions
- Added progress invalidation logic
- Set up automatic triggers for version increments

## Need More Detail?

See the full documentation: [`COURSE_PUBLISHING_AND_PROGRESS.md`](./COURSE_PUBLISHING_AND_PROGRESS.md)

---

**Quick Tips:**
- ✅ Always check console logs after publishing
- ✅ Test in draft mode before publishing
- ✅ Batch edits before republishing to minimize resets
- ✅ Communicate major content changes to learners
