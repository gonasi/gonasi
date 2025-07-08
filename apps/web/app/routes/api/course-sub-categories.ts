import { data } from 'react-router';

import { fetchCourseSubCategoriesAsSelectOptions } from '@gonasi/database/courseSubCategories';

import type { Route } from './+types/course-sub-categories';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('q');

  if (!categoryId) return data({ options: [] }, { status: 400 });

  const options = await fetchCourseSubCategoriesAsSelectOptions(supabase, categoryId);
  return data({ options });
}
