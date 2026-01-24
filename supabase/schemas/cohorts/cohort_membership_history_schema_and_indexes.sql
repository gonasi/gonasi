-- =====================================================================================
-- Cohort Membership History Schema and Indexes
-- =====================================================================================
-- Audit trail for cohort reassignments
-- Tracks when users are moved between cohorts
-- Note: This file must be loaded AFTER course_enrollments schema
-- =====================================================================================

-- =====================================================================================
-- Table: cohort_membership_history
-- =====================================================================================
CREATE TABLE IF NOT EXISTS cohort_membership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  old_cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  new_cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  reason text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================================
-- Indexes for cohort_membership_history table
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_cohort_history_enrollment_id ON cohort_membership_history(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cohort_history_old_cohort_id ON cohort_membership_history(old_cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_history_new_cohort_id ON cohort_membership_history(new_cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_history_changed_by ON cohort_membership_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_cohort_history_changed_at ON cohort_membership_history(changed_at);

-- Composite index for enrollment history timeline
CREATE INDEX IF NOT EXISTS idx_cohort_history_enrollment_time ON cohort_membership_history(enrollment_id, changed_at DESC);
