import z from 'zod';

import { CompletionNavigationStateSchema } from './completion-navigation-state-schema';
import { ContinueNavigationStateSchema } from './continue-navigation-state-schema';
import { CourseNavigationInfoSchema } from './course-navigation-info-schema';
import { CurrentNavigationStateSchema } from './current-navigation-state-schema';
import { NextNavigationStateSchema } from './next-navigation-state-schema';
import { PreviousNavigationStateSchema } from './previous-navigation-state-schema';

export const UnifiedNavigationSchema = z.object({
  current: CurrentNavigationStateSchema,
  previous: PreviousNavigationStateSchema,
  next: NextNavigationStateSchema,
  continue: ContinueNavigationStateSchema,
  completion: CompletionNavigationStateSchema,
  course_info: CourseNavigationInfoSchema,
});
