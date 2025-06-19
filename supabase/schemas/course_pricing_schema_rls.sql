
-- Enable RLS to ensure users can only access pricing tiers for courses they have permission to view
ALTER TABLE public.course_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR FINE-GRAINED ACCESS CONTROL
-- ============================================================================

-- Read access: users can view pricing tiers for courses they have any level of access to
-- This includes course admins, editors, viewers, and course creators
CREATE POLICY "select: users with course roles or owners can view pricing tiers"
ON public.course_pricing_tiers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        is_course_viewer(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

-- Create access: only course admins, editors, and creators can add new pricing tiers
-- Viewers cannot create pricing tiers as this could affect course monetization
CREATE POLICY "insert: users with course roles or owners can add pricing tiers"
ON public.course_pricing_tiers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

-- Update access: same permissions as create - admins, editors, and creators only
-- Requires both using and with check clauses for complete protection
CREATE POLICY "update: users with admin/editor roles or owners can modify pricing tiers"
ON public.course_pricing_tiers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);

-- Delete access: same permissions as create/update
-- Deletion of pricing tiers is a sensitive operation that affects course monetization
CREATE POLICY "delete: course admins, editors, and owners can remove pricing tiers"
ON public.course_pricing_tiers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_pricing_tiers.course_id
      AND (
        is_course_admin(c.id, (SELECT auth.uid())) OR
        is_course_editor(c.id, (SELECT auth.uid())) OR
        c.created_by = (SELECT auth.uid())
      )
  )
);