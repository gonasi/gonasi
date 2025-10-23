set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.count_active_students(org_id uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(distinct user_id)
  from public.course_enrollments
  where organization_id = org_id
    and is_active = true;
$function$
;

CREATE OR REPLACE FUNCTION public.count_total_unique_students(org_id uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(distinct user_id)
  from public.course_enrollments
  where organization_id = org_id;
$function$
;


