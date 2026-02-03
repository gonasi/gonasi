import type { ComponentType, LazyExoticComponent, ReactElement } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { ZodSchema } from 'zod';

import type { BlockInteractionSchemaTypes, PluginTypeId } from '@gonasi/schemas/plugins';
import type { BlockWithProgressSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';

import type { LessonBlockLoaderReturnType } from '~/routes/organizations/courses/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';

/**
 * Plugin metadata for display and categorization
 */
export interface PluginMetadata {
  name: string;
  description: string;
  icon: string;
  category: 'quiz' | 'media' | 'richtext' | 'reveal' | 'interaction' | 'other';
}

/**
 * Score calculator interface for plugins with scoring logic
 */
export interface ScoreCalculator<TInteractionState = unknown> {
  calculate(state: TInteractionState): number;
  getMaxScore(): number;
  getPenaltyFactor(): number;
}

/**
 * Migration function type for content/settings transformations
 */
export type MigrationFunction<T = any> = (content: T) => T;

/**
 * Return type from interaction hooks
 */
export interface InteractionHookReturn<TInteractionState> {
  state: TInteractionState;
  isCompleted: boolean;
  canInteract: boolean;
  score: number;
  attemptsCount?: number;
  tryAgain?: () => void;
  revealAnswer?: () => void;
  reset?: () => void;
  [key: string]: any; // Allow plugin-specific properties
}

/**
 * Interaction hook type
 */
export type InteractionHook<TInteraction> = (
  initial: TInteraction | null,
  content: any,
) => InteractionHookReturn<TInteraction>;

/**
 * Props for builder render function
 */
export interface BuilderRenderProps<TSchema extends FieldValues = any> {
  methods: UseFormReturn<TSchema>;
  playbackMode: 'inline' | 'standalone';
  block?: LessonBlockLoaderReturnType;
}

/**
 * Props for settings render function
 */
export interface SettingsRenderProps<TSchema extends FieldValues = any> {
  methods: UseFormReturn<TSchema>;
  playbackMode: 'inline' | 'standalone';
}

/**
 * Props for view render function
 */
export interface ViewRenderProps<TInteraction = any, TContent = any, TSettings = any> {
  interaction: InteractionHookReturn<TInteraction>;
  content: TContent;
  settings: TSettings;
  mode: 'preview' | 'play';
  loading: boolean;
  blockWithProgress: BlockWithProgressSchemaTypes;
  handleContinue: () => void;
}

/**
 * Builder component props (passed to generated Builder component)
 */
export interface BuilderComponentProps {
  block?: LessonBlockLoaderReturnType;
}

/**
 * View component props (passed to generated View component)
 */
export interface ViewComponentProps {
  blockWithProgress: BlockWithProgressSchemaTypes;
}

/**
 * Configuration for createPlugin factory function
 */
export interface PluginFactoryConfig<TContent, TSettings, TInteraction> {
  pluginType: PluginTypeId;
  metadata: PluginMetadata;

  schemas: {
    builder: ZodSchema<any>;
    content: ZodSchema<TContent>;
    settings: ZodSchema<TSettings>;
    interaction: ZodSchema<TInteraction>;
  };

  defaults: {
    content: TContent;
    settings: TSettings;
  };

  hooks: {
    useInteraction: InteractionHook<TInteraction>;
  };

  renderBuilder: (props: BuilderRenderProps) => ReactElement;
  renderSettings?: (props: SettingsRenderProps) => ReactElement;
  renderView: ComponentType<ViewRenderProps<TInteraction, TContent, TSettings>>;

  migrations?: MigrationFunction[];
  scoring?: ScoreCalculator<TInteraction>;
}

/**
 * Complete plugin definition returned by createPlugin
 */
export interface PluginDefinition<TContent = any, TSettings = any, TInteraction = any> {
  pluginType: PluginTypeId;
  metadata: PluginMetadata;

  schemas: {
    content: ZodSchema<TContent>;
    settings: ZodSchema<TSettings>;
    interaction: ZodSchema<TInteraction>;
    builder: ZodSchema<any>;
  };

  defaults: {
    content: TContent;
    settings: TSettings;
  };

  components: {
    Builder: LazyExoticComponent<ComponentType<BuilderComponentProps>>;
    View: ComponentType<ViewComponentProps>;
  };

  hooks: {
    useInteraction: InteractionHook<TInteraction>;
  };

  scoring?: ScoreCalculator<TInteraction>;
}

/**
 * Result from usePluginBuilder hook
 */
export interface PluginBuilderHookReturn<TSchema extends FieldValues = any> {
  methods: UseFormReturn<TSchema>;
  isPending: boolean;
  paths: {
    lesson: string;
    back: string;
    action: string;
  };
  params: Record<string, string | undefined>;
  playbackMode: 'inline' | 'standalone';
  isEditMode: boolean;
}

/**
 * Result from usePluginView hook
 */
export interface PluginViewHookReturn<TInteraction = any, TContent = any, TSettings = any> {
  core: {
    loading: boolean;
    payload: any;
    handleContinue: () => void;
    updateInteractionData: (data: BlockInteractionSchemaTypes) => void;
    updateEarnedScore: (score: number) => void;
    updateAttemptsCount: (count: number) => void;
  };
  interaction: InteractionHookReturn<TInteraction>;
  mode: 'preview' | 'play';
  content: TContent;
  settings: TSettings;
}
