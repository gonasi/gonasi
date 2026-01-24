-- =====================================================================================
-- Cohorts Schema and Indexes
-- =====================================================================================
-- This file defines the schema for cohorts table only.
-- Cohorts are informational groupings for course enrollments and do NOT control access.
-- Note: cohort_membership_history is in a separate file (loaded after enrollments)
-- =====================================================================================

-- =====================================================================================
-- Table: cohorts
-- =====================================================================================
-- Stores cohort information for organizing course enrollments
-- Dual FK pattern: organization_id + published_course_id ensures proper ownership
-- =====================================================================================
CREATE TABLE IF NOT EXISTS cohorts (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dual foreign keys (both NOT NULL for proper ownership)
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  published_course_id uuid NOT NULL REFERENCES published_courses(id) ON DELETE CASCADE,

  -- Cohort metadata
  name text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  max_enrollment int,

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Denormalized enrollment count (maintained by triggers)
  current_enrollment_count int NOT NULL DEFAULT 0,

  -- Audit fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_cohort_name_per_course UNIQUE(published_course_id, name),
  CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date < end_date),
  CONSTRAINT positive_max_enrollment CHECK (max_enrollment IS NULL OR max_enrollment > 0),
  CONSTRAINT non_negative_enrollment_count CHECK (current_enrollment_count >= 0)
);

-- =====================================================================================
-- Indexes for cohorts table
-- =====================================================================================

-- Single column indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_cohorts_organization_id ON cohorts(organization_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_published_course_id ON cohorts(published_course_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_created_by ON cohorts(created_by);
CREATE INDEX IF NOT EXISTS idx_cohorts_updated_by ON cohorts(updated_by);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cohorts_org_course ON cohorts(organization_id, published_course_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_course_active ON cohorts(published_course_id, is_active);

-- Partial indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_cohorts_active ON cohorts(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cohorts_with_dates ON cohorts(id) WHERE start_date IS NOT NULL;
