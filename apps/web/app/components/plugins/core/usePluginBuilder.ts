import { useMemo } from 'react';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRemixForm } from 'remix-hook-form';
import type { z } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { MigrationFunction, PluginBuilderHookReturn } from './types';

import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

/**
 * Options for usePluginBuilder hook
 */
export interface UsePluginBuilderOptions<TSchema extends z.ZodType> {
  schema: TSchema;
  block?: LessonBlockLoaderReturnType;
  defaultContent: z.infer<TSchema>['content'];
  defaultSettings: z.infer<TSchema>['settings'];
  pluginType: PluginTypeId;
  migrations?: MigrationFunction[];
}

/**
 * Unified hook for plugin builder components
 *
 * This hook eliminates ~80 lines of boilerplate from every Builder plugin by:
 * - Setting up react-hook-form with Zod validation
 * - Handling default values vs. editing existing blocks
 * - Running migrations on existing content
 * - Computing necessary paths for navigation
 * - Providing pending state and playback mode watching
 *
 * Before: Every builder had 80+ lines of setup code
 * After: One hook call
 *
 * Usage:
 * ```typescript
 * const { methods, isPending, paths, playbackMode } = usePluginBuilder({
 *   schema: TrueOrFalseSchema,
 *   block,
 *   defaultContent,
 *   defaultSettings,
 *   pluginType: 'true_or_false',
 * });
 * ```
 */
export function usePluginBuilder<TSchema extends z.ZodType>(
  options: UsePluginBuilderOptions<TSchema>,
): PluginBuilderHookReturn<z.infer<TSchema>> {
  const params = useParams();
  const isPending = useIsPending();

  // Compute default values with optional migrations
  const defaultValues = useMemo(() => {
    // Creating new block - use defaults
    if (!options.block) {
      return {
        organization_id: params.organizationId!,
        course_id: params.courseId!,
        chapter_id: params.chapterId!,
        lesson_id: params.lessonId!,
        plugin_type: options.pluginType,
        content: options.defaultContent,
        settings: options.defaultSettings,
      };
    }

    // Editing existing block - parse and migrate
    const parsed = options.schema.parse(options.block);
    let content = parsed.content;

    // Apply migrations if provided
    if (options.migrations && options.migrations.length > 0) {
      content = options.migrations.reduce((acc, migrate) => migrate(acc), content);
    }

    return {
      id: options.block.id,
      organization_id: params.organizationId!,
      course_id: params.courseId!,
      chapter_id: params.chapterId!,
      lesson_id: params.lessonId!,
      plugin_type: options.pluginType,
      content,
      settings: parsed.settings,
    };
  }, [
    options.block,
    options.schema,
    options.pluginType,
    options.defaultContent,
    options.defaultSettings,
    options.migrations,
    params,
  ]);

  // Setup form with remix-hook-form
  const methods = useRemixForm<z.infer<TSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(options.schema as any),
    defaultValues: defaultValues as any,
  });

  // Compute navigation paths
  const paths = useMemo(() => {
    const lessonPath = `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`;

    return {
      lesson: lessonPath,
      back: `${lessonPath}/plugins/${params.pluginGroupId}`,
      action: getActionUrl(
        {
          organizationId: params.organizationId,
          courseId: params.courseId,
          chapterId: params.chapterId,
          lessonId: params.lessonId,
        },
        { id: options.block?.id },
      ),
    };
  }, [params, options.block?.id]);

  // Watch playback mode for conditional rendering
  const playbackMode = (methods.watch as any)('settings.playbackMode') as 'inline' | 'standalone';

  return {
    methods: methods as any,
    isPending,
    paths,
    params: params as Record<string, string | undefined>,
    playbackMode: playbackMode || 'inline',
    isEditMode: !!options.block,
  };
}
