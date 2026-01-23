import { useEffect, useMemo, useRef } from 'react';
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

  // Memoize param values to prevent unnecessary re-renders
  const organizationId = params.organizationId;
  const courseId = params.courseId;
  const chapterId = params.chapterId;
  const lessonId = params.lessonId;
  const pluginGroupId = params.pluginGroupId;

  // Compute default values with optional migrations
  // Only recompute when block ID changes, not when the entire block object reference changes
  const defaultValues = useMemo(() => {
    // Creating new block - use defaults
    if (!options.block) {
      return {
        organization_id: organizationId!,
        course_id: courseId!,
        chapter_id: chapterId!,
        lesson_id: lessonId!,
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
      organization_id: organizationId!,
      course_id: courseId!,
      chapter_id: chapterId!,
      lesson_id: lessonId!,
      plugin_type: options.pluginType,
      content,
      settings: parsed.settings,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.block?.id, // Only depend on block ID, not the entire block object
    options.schema,
    options.pluginType,
    options.defaultContent,
    options.defaultSettings,
    options.migrations,
    organizationId,
    courseId,
    chapterId,
    lessonId,
  ]);

  // Setup form with remix-hook-form - use stable defaultValues
  const blockIdRef = useRef<string | undefined>(options.block?.id);
  const initialDefaultValuesRef = useRef(defaultValues);
  const resolverRef = useRef(zodResolver(options.schema as any));

  const methods = useRemixForm<z.infer<TSchema>>({
    mode: 'onBlur',
    resolver: resolverRef.current,
    defaultValues: initialDefaultValuesRef.current as any,
  });

  // Update initial defaultValues and reset form only when block ID actually changes
  useEffect(() => {
    if (blockIdRef.current !== options.block?.id) {
      blockIdRef.current = options.block?.id;
      initialDefaultValuesRef.current = defaultValues;
      // Reset form when block ID changes
      methods.reset(defaultValues as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.block?.id]); // Only depend on block ID, not defaultValues or methods

  // Compute navigation paths
  const paths = useMemo(() => {
    const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;

    return {
      lesson: lessonPath,
      back: `${lessonPath}/plugins/${pluginGroupId}`,
      action: getActionUrl(
        {
          organizationId,
          courseId,
          chapterId,
          lessonId,
        },
        { id: options.block?.id },
      ),
    };
  }, [organizationId, courseId, chapterId, lessonId, pluginGroupId, options.block?.id]);

  // Get playback mode value without subscription to avoid re-renders
  // Note: This means playbackMode won't reactively update if changed, but that's okay
  // since the form will re-render anyway when the value changes
  const playbackMode =
    (methods.getValues('settings.playbackMode' as any) as 'inline' | 'standalone') || 'inline';

  return {
    methods: methods as any,
    isPending,
    paths,
    params: params as Record<string, string | undefined>,
    playbackMode,
    isEditMode: !!options.block,
  };
}
