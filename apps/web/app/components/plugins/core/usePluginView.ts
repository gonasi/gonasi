import { useCallback, useEffect, useMemo } from 'react';
import type { ZodSchema } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import type { BlockWithProgressSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';

import { useViewPluginCore } from '../hooks/useViewPluginCore';
import type { InteractionHook, PluginViewHookReturn } from './types';

import { useStore } from '~/store';

/**
 * Options for usePluginView hook
 */
export interface UsePluginViewOptions<TInteraction> {
  pluginType: PluginTypeId;
  blockWithProgress: BlockWithProgressSchemaTypes;
  interactionSchema: ZodSchema<TInteraction>;
  useInteractionHook: InteractionHook<TInteraction>;
}

/**
 * Unified hook for plugin view components
 *
 * This hook eliminates ~60 lines of boilerplate from every View plugin by:
 * - Extracting and validating interaction data from database
 * - Managing type guards for interaction data
 * - Setting up useViewPluginCore for progress tracking
 * - Calling plugin-specific interaction hook
 * - Auto-syncing state changes back to core (interaction data, score, attempts)
 * - Handling preview vs play mode
 *
 * Before: Every view plugin had 60+ lines of data extraction and syncing
 * After: One hook call
 *
 * Usage:
 * ```typescript
 * const { core, interaction, mode, content, settings } = usePluginView({
 *   pluginType: 'true_or_false',
 *   blockWithProgress,
 *   interactionSchema: TrueOrFalseInteractionSchema,
 *   useInteractionHook: useTrueOrFalseInteraction,
 * });
 * ```
 */
export function usePluginView<TInteraction = any, TContent = any, TSettings = any>(
  options: UsePluginViewOptions<TInteraction>,
): PluginViewHookReturn<TInteraction, TContent, TSettings> {
  const { mode } = useStore();

  // Unified type guard using schema validation
  const isCorrectInteractionType = useCallback(
    (data: unknown): data is TInteraction => {
      const result = options.interactionSchema.safeParse(data);
      return result.success;
    },
    [options.interactionSchema],
  );

  // Extract initial interaction data from database
  const initialInteractionData = useMemo(() => {
    const progressData = options.blockWithProgress.block_progress;
    if (!progressData?.interaction_data) return null;

    return isCorrectInteractionType(progressData.interaction_data)
      ? progressData.interaction_data
      : null;
  }, [options.blockWithProgress.block_progress, isCorrectInteractionType]);

  // Setup core progress tracking hook
  const core = useViewPluginCore(
    mode === 'play'
      ? {
          progress: options.blockWithProgress.block_progress!,
          blockWithProgress: options.blockWithProgress,
        }
      : null,
  );

  // Parse payload data from core hook (real-time updates)
  const currentInteractionData = useMemo(() => {
    if (core.payload?.interaction_data) {
      const parsed = options.interactionSchema.safeParse(core.payload.interaction_data);
      if (parsed.success) return parsed.data;
    }
    return initialInteractionData;
  }, [core.payload, initialInteractionData, options.interactionSchema]);

  // Call plugin-specific interaction hook
  const interaction = options.useInteractionHook(
    currentInteractionData,
    options.blockWithProgress.block.content,
  );

  // Auto-sync interaction state changes to core
  useEffect(() => {
    if (mode === 'play' && interaction.state) {
      core.updateInteractionData({ ...interaction.state } as any);
    }
  }, [interaction.state, mode, core.updateInteractionData]);

  // Auto-sync score changes to core
  useEffect(() => {
    if (mode === 'play' && interaction.score !== undefined) {
      core.updateEarnedScore(interaction.score);
    }
  }, [interaction.score, mode, core.updateEarnedScore]);

  // Auto-sync attempts count to core
  useEffect(() => {
    if (mode === 'play' && interaction.attemptsCount !== undefined) {
      core.updateAttemptsCount(interaction.attemptsCount);
    }
  }, [interaction.attemptsCount, mode, core.updateAttemptsCount]);

  return {
    core,
    interaction,
    mode,
    content: options.blockWithProgress.block.content as TContent,
    settings: options.blockWithProgress.block.settings as TSettings,
  };
}
