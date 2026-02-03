# Plugin Architecture Refactoring Plan

## Executive Summary

Refactor the Gonasi plugin system to eliminate ~2,000 lines of duplicated code, introduce professional abstractions following best practices, implement singleton patterns for registries, and create a more maintainable and extensible architecture.

## Current State Analysis

**Strengths:**

- Clear separation between Builder and View modes
- Type-safe with Zod schemas
- Good reusable UI components (ViewPluginWrapper, PlayPluginWrapper, RenderFeedback)

**Critical Issues:**

1. **Massive Code Duplication** (~2,000 lines)
   - Every Builder plugin repeats form setup boilerplate (~80 lines × 15 plugins)
   - Every View plugin repeats interaction data management (~60 lines × 12 plugins)
   - Similar migration helpers duplicated across plugins

2. **Missing Core Abstractions**
   - No base builder hook
   - No unified interaction manager
   - No plugin factory pattern
   - No auto-registration system

3. **Manual Plugin Registration**
   - Requires editing 2 renderer files for each new plugin
   - Error-prone and not scalable

4. **Inconsistent Patterns**
   - Settings management varies across plugins
   - Default values defined differently
   - Interaction data parsing inconsistent

## Refactoring Strategy

### Phase 1: Core Infrastructure (Foundation)

Create reusable abstractions that all plugins will build upon.

#### 1.1 Create Plugin Core Module

**Location:** `apps/web/app/components/plugins/core/`

**Files to Create:**

- `core/types.ts` - Shared types and interfaces
- `core/usePluginBuilder.ts` - Base builder hook
- `core/usePluginView.ts` - Unified view manager
- `core/PluginFactory.ts` - Plugin factory pattern
- `core/PluginRegistry.ts` - Singleton registry with auto-registration
- `core/BasePluginComponent.tsx` - Abstract base component patterns
- `core/index.ts` - Public API exports

**Key Abstractions:**

```typescript
// core/types.ts
export interface PluginDefinition<TContent, TSettings, TInteraction> {
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
    Builder: React.ComponentType<BuilderProps>;
    View: React.ComponentType<ViewProps>;
  };
  hooks: {
    useInteraction: InteractionHook<TInteraction>;
  };
  scoring?: ScoreCalculator;
}

export interface ScoreCalculator {
  calculate(state: unknown): number;
  getMaxScore(): number;
  getPenaltyFactor(): number;
}
```

```typescript
// core/PluginRegistry.ts (Singleton)
class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins = new Map<PluginTypeId, PluginDefinition<any, any, any>>();

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  register(definition: PluginDefinition<any, any, any>): void {
    this.plugins.set(definition.pluginType, definition);
  }

  get(pluginType: PluginTypeId): PluginDefinition<any, any, any> | undefined {
    return this.plugins.get(pluginType);
  }

  getBuilder(pluginType: PluginTypeId): LazyExoticComponent<any> {
    const plugin = this.get(pluginType);
    if (!plugin) throw new Error(`Plugin ${pluginType} not registered`);
    return plugin.components.Builder;
  }

  getView(pluginType: PluginTypeId): ComponentType<any> {
    const plugin = this.get(pluginType);
    if (!plugin) throw new Error(`Plugin ${pluginType} not registered`);
    return plugin.components.View;
  }

  getAllPlugins(): PluginDefinition<any, any, any>[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
```

```typescript
// core/usePluginBuilder.ts
export function usePluginBuilder<TSchema extends z.ZodType>(options: {
  schema: TSchema;
  block?: LessonBlockLoaderReturnType;
  defaultContent: z.infer<TSchema>['content'];
  defaultSettings: z.infer<TSchema>['settings'];
  pluginType: PluginTypeId;
  migrations?: MigrationFunction[];
}) {
  const params = useParams();
  const isPending = useIsPending();

  // Unified default values logic
  const defaultValues = useMemo(() => {
    if (!options.block) {
      return {
        content: options.defaultContent,
        settings: options.defaultSettings,
      };
    }

    // Parse and migrate existing block
    const parsed = options.schema.parse(options.block);
    let content = parsed.content;

    // Apply migrations if provided
    if (options.migrations) {
      content = options.migrations.reduce((acc, migrate) => migrate(acc), content);
    }

    return { content, settings: parsed.settings };
  }, [options.block, options.schema, options.migrations]);

  // Unified form setup
  const methods = useRemixForm<z.infer<TSchema>>({
    resolver: zodResolver(options.schema),
    defaultValues,
  });

  // Unified paths
  const paths = useMemo(
    () => ({
      lesson: `/${params.organizationId}/courses/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`,
      back: `/${params.organizationId}/courses/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks/plugins/${params.pluginGroupId}`,
      action: getActionUrl(
        {
          organizationId: params.organizationId!,
          courseId: params.courseId!,
          chapterId: params.chapterId!,
          lessonId: params.lessonId!,
        },
        { id: options.block?.id },
      ),
    }),
    [params, options.block?.id],
  );

  // Watch playback mode for conditional rendering
  const playbackMode = methods.watch('settings.playbackMode');

  return {
    methods,
    isPending,
    paths,
    params,
    playbackMode,
    isEditMode: !!options.block,
  };
}
```

```typescript
// core/usePluginView.ts
export function usePluginView<TInteraction>(options: {
  pluginType: PluginTypeId;
  blockWithProgress: BlockWithProgressSchemaTypes;
  interactionSchema: ZodSchema<TInteraction>;
  useInteractionHook: (
    initial: TInteraction | null,
    content: any,
  ) => InteractionHookReturn<TInteraction>;
}) {
  const { mode } = useStore();

  // Unified type guard
  const isCorrectInteractionType = useCallback(
    (data: unknown): data is TInteraction => {
      const result = options.interactionSchema.safeParse(data);
      return result.success;
    },
    [options.interactionSchema],
  );

  // Extract initial interaction data from progress
  const initialInteractionData = useMemo(() => {
    const progressData = options.blockWithProgress.block_progress;
    if (!progressData?.interaction_data) return null;

    return isCorrectInteractionType(progressData.interaction_data)
      ? progressData.interaction_data
      : null;
  }, [options.blockWithProgress, isCorrectInteractionType]);

  // Core hook setup
  const core = useViewPluginCore(
    mode === 'play'
      ? {
          blockId: options.blockWithProgress.block.id,
          weight: options.blockWithProgress.block.settings.weight,
          lessonId: options.blockWithProgress.block.lesson_id,
          chapterId: options.blockWithProgress.block.chapter_id,
          blockProgress: options.blockWithProgress.block_progress,
        }
      : null,
  );

  // Parse payload data from core hook
  const currentInteractionData = useMemo(() => {
    if (core.payload?.interactionData) {
      const parsed = options.interactionSchema.safeParse(core.payload.interactionData);
      if (parsed.success) return parsed.data;
    }
    return initialInteractionData;
  }, [core.payload, initialInteractionData, options.interactionSchema]);

  // Call plugin-specific interaction hook
  const interaction = options.useInteractionHook(
    currentInteractionData,
    options.blockWithProgress.block.content,
  );

  // Auto-sync state changes to core
  useEffect(() => {
    if (mode === 'play' && interaction.state) {
      core.updateInteractionData({ ...interaction.state });
    }
  }, [interaction.state, mode, core.updateInteractionData]);

  useEffect(() => {
    if (mode === 'play' && interaction.score !== undefined) {
      core.updateEarnedScore(interaction.score);
    }
  }, [interaction.score, mode, core.updateEarnedScore]);

  useEffect(() => {
    if (mode === 'play' && interaction.attemptsCount !== undefined) {
      core.updateAttemptsCount(interaction.attemptsCount);
    }
  }, [interaction.attemptsCount, mode, core.updateAttemptsCount]);

  return {
    core,
    interaction,
    mode,
    content: options.blockWithProgress.block.content,
    settings: options.blockWithProgress.block.settings,
  };
}
```

```typescript
// core/PluginFactory.ts
export function createPlugin<TContent, TSettings, TInteraction>(
  config: PluginFactoryConfig<TContent, TSettings, TInteraction>
): PluginDefinition<TContent, TSettings, TInteraction> {

  // Create Builder component with all common logic
  const Builder = lazy(() => Promise.resolve({
    default: (props: BuilderComponentProps) => {
      const { methods, isPending, paths, playbackMode } = usePluginBuilder({
        schema: config.schemas.builder,
        block: props.block,
        defaultContent: config.defaults.content,
        defaultSettings: config.defaults.settings,
        pluginType: config.pluginType,
        migrations: config.migrations,
      });

      return (
        <RemixFormProvider {...methods}>
          <Modal size="xl">
            <Modal.Header
              title={config.metadata.name}
              onBack={() => window.history.back()}
              settingsPopover={config.renderSettings?.(methods, playbackMode)}
            />
            <Modal.Body>
              {config.renderBuilder({ methods, playbackMode, block: props.block })}
            </Modal.Body>
            <Modal.Footer>
              <SaveButton
                form={methods.formState}
                isPending={isPending}
                action={paths.action}
              />
            </Modal.Footer>
          </Modal>
        </RemixFormProvider>
      );
    }
  }));

  // Create View component with all common logic
  const View = (props: ViewComponentProps) => {
    const { core, interaction, mode, content, settings } = usePluginView({
      pluginType: config.pluginType,
      blockWithProgress: props.blockWithProgress,
      interactionSchema: config.schemas.interaction,
      useInteractionHook: config.hooks.useInteraction,
    });

    return (
      <ViewPluginWrapper
        blockWithProgress={props.blockWithProgress}
        isCompleted={interaction.isCompleted}
        earnedScore={interaction.score}
        mode={mode}
      >
        <PlayPluginWrapper hint={content.hint}>
          {config.renderView({
            interaction,
            content,
            settings,
            mode,
            loading: core.loading,
          })}

          <RenderFeedback
            isCompleted={interaction.isCompleted}
            score={interaction.score}
            onContinue={core.handleContinue}
            onTryAgain={interaction.tryAgain}
            onShowAnswer={interaction.revealAnswer}
            canTryAgain={interaction.canTryAgain}
            mode={mode}
          />
        </PlayPluginWrapper>
      </ViewPluginWrapper>
    );
  };

  const definition: PluginDefinition<TContent, TSettings, TInteraction> = {
    pluginType: config.pluginType,
    metadata: config.metadata,
    schemas: config.schemas,
    defaults: config.defaults,
    components: { Builder, View },
    hooks: config.hooks,
    scoring: config.scoring,
  };

  // Auto-register the plugin
  pluginRegistry.register(definition);

  return definition;
}
```

#### 1.2 Create Shared Utilities

**Location:** `apps/web/app/components/plugins/core/utils/`

**Files:**

- `scoring.ts` - Base score calculator classes
- `migrations.ts` - Common migration helpers
- `validation.ts` - Type guard generators
- `settings.ts` - Unified settings management

### Phase 2: Refactor Existing Plugins

Migrate all existing plugins to use the new core abstractions.

#### 2.1 Start with Simple Plugin (TrueOrFalse)

**Why:** Simple structure, good test case for the pattern

**Files to Refactor:**

- `QuizPlugins/TrueOrFalsePlugin/BuilderTrueOrFalsePlugin.tsx`
- `QuizPlugins/TrueOrFalsePlugin/ViewTrueOrFalsePlugin.tsx`
- `QuizPlugins/TrueOrFalsePlugin/useTrueOrFalseInteraction.tsx`

**Expected Reduction:** ~150 lines → ~50 lines per plugin

**New Structure:**

```typescript
// TrueOrFalsePlugin/index.ts
import { createPlugin } from '../../core/PluginFactory';
import { TrueOrFalseSchema, TrueOrFalseInteractionSchema } from '@gonasi/schemas';

export const TrueOrFalsePlugin = createPlugin({
  pluginType: 'true_or_false',
  metadata: {
    name: 'True or False',
    description: 'Binary choice questions',
    icon: 'CheckCircle',
    category: 'quiz',
  },
  schemas: {
    builder: TrueOrFalseSchema,
    content: TrueOrFalseContentSchema,
    settings: TrueOrFalseSettingsSchema,
    interaction: TrueOrFalseInteractionSchema,
  },
  defaults: {
    content: defaultTrueOrFalseContent,
    settings: defaultTrueOrFalseSettings,
  },
  hooks: {
    useInteraction: useTrueOrFalseInteraction,
  },
  renderBuilder: ({ methods, playbackMode }) => (
    <>
      <GoRichTextInputField
        control={methods.control}
        name="content.questionState"
        label="Question"
      />
      <GoRadioGroupField
        control={methods.control}
        name="content.correctAnswer"
        label="Correct Answer"
        options={[
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ]}
      />
      <GoInputField
        control={methods.control}
        name="content.hint"
        label="Hint (optional)"
      />
      <GoRichTextInputField
        control={methods.control}
        name="content.explanationState"
        label="Explanation"
      />
    </>
  ),
  renderSettings: (methods, playbackMode) => (
    <SettingsPopover>
      <BlockWeightField control={methods.control} />
      <PlaybackModeField control={methods.control} />
      <LayoutStyleField control={methods.control} />
    </SettingsPopover>
  ),
  renderView: ({ interaction, content, settings, mode }) => (
    <div className="space-y-4">
      <RichTextDisplay state={content.questionState} />

      <div className={cn('grid gap-3', settings.layoutStyle === 'double' && 'grid-cols-2')}>
        <AnswerButton
          onClick={() => interaction.selectOption('true')}
          disabled={!interaction.canInteract}
          selected={interaction.selectedOption === 'true'}
          correct={interaction.revealedCorrect === 'true'}
        >
          True
        </AnswerButton>
        <AnswerButton
          onClick={() => interaction.selectOption('false')}
          disabled={!interaction.canInteract}
          selected={interaction.selectedOption === 'false'}
          correct={interaction.revealedCorrect === 'false'}
        >
          False
        </AnswerButton>
      </div>

      {interaction.selectedOption && (
        <Button onClick={interaction.checkAnswer}>
          Check Answer
        </Button>
      )}
    </div>
  ),
  scoring: {
    calculate: (state) => {
      if (state.correctAttempts[0]) return 100;
      if (state.correctAttempts[1]) return 50;
      return 0;
    },
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.5,
  },
});
```

#### 2.2 Refactor Remaining Quiz Plugins

**Order:** (simplest to most complex)

1. ✅ TrueOrFalsePlugin
2. MultipleChoiceSingleAnswer
3. MultipleChoiceMultipleAnswers
4. FillInTheBlankPlugin
5. MatchingGamePlugin
6. SwipeCategorizePlugin

#### 2.3 Refactor Media Player Plugins

1. AudioPlayerPlugin
2. VideoPlayerPlugin
3. YouTubeEmbedPlugin
4. VimeoEmbedPlugin

**Note:** These don't have interactions, so simpler refactor

#### 2.4 Refactor Other Plugins

1. RichTextPlugin
2. StepByStepReveal
3. GuidedImageHotspots
4. ImageFocusQuiz

### Phase 3: Update Renderers

Update the renderer components to use the singleton registry.

#### 3.1 Update BuilderPluginBlockRenderer

**Location:** `apps/web/app/components/plugins/PluginRenderers/BuilderPluginBlockRenderer.tsx`

**Changes:**

```typescript
// OLD: Static map with manual entries
const pluginComponentMap = { ... };

// NEW: Use registry
import { pluginRegistry } from '../core/PluginRegistry';

export function BuilderPluginBlockRenderer({ block }: Props) {
  const { pluginType } = useParams();

  const PluginComponent = useMemo(() => {
    return pluginRegistry.getBuilder(pluginType as PluginTypeId);
  }, [pluginType]);

  return (
    <Suspense fallback={<BuilderPluginSkeleton />}>
      <PluginComponent block={block} />
    </Suspense>
  );
}
```

#### 3.2 Update ViewPluginTypesRenderer

**Location:** `apps/web/app/components/plugins/PluginRenderers/ViewPluginTypesRenderer.tsx`

**Changes:**

```typescript
// NEW: Use registry
import { pluginRegistry } from '../core/PluginRegistry';

export function ViewPluginTypesRenderer({ blockWithProgress }: Props) {
  const PluginComponent = useMemo(() => {
    return pluginRegistry.getView(blockWithProgress.block.plugin_type);
  }, [blockWithProgress.block.plugin_type]);

  return <PluginComponent blockWithProgress={blockWithProgress} />;
}
```

### Phase 4: Create Plugin Barrel Export

Centralize all plugin imports for auto-registration.

#### 4.1 Create Master Plugin Index

**Location:** `apps/web/app/components/plugins/index.ts`

```typescript
// Import all plugins - this triggers auto-registration
import './QuizPlugins/TrueOrFalsePlugin';
import './QuizPlugins/MultipleChoiceSingleAnswer';
import './QuizPlugins/MultipleChoiceMultipleAnswers';
// ... all other plugins

export { pluginRegistry } from './core/PluginRegistry';

// Re-export core utilities for external use
export { createPlugin } from './core/PluginFactory';
export { usePluginBuilder, usePluginView } from './core';
export type { PluginDefinition } from './core/types';
```

#### 4.2 Update App Entry Point

Ensure plugins are registered before app renders.

**Location:** `apps/web/app/entry.client.tsx` or `root.tsx`

```typescript
// Import plugins to trigger registration
import '@/components/plugins';
```

### Phase 5: Testing Infrastructure

Add comprehensive tests for the new architecture.

#### 5.1 Create Testing Utilities

**Location:** `apps/web/app/components/plugins/core/__tests__/`

**Files:**

- `test-utils.tsx` - Testing helpers
- `mock-plugins.ts` - Mock plugin definitions
- `PluginRegistry.test.ts` - Registry tests
- `PluginFactory.test.ts` - Factory tests
- `usePluginBuilder.test.ts` - Builder hook tests
- `usePluginView.test.ts` - View hook tests

#### 5.2 Add Plugin-Specific Tests

For each refactored plugin, add:

- Interaction hook unit tests
- Score calculation tests
- Migration tests (if applicable)

### Phase 6: Documentation & Examples

#### 6.1 Create Plugin Development Guide

**Location:** `apps/web/app/components/plugins/README.md`

**Content:**

- Architecture overview
- How to create a new plugin
- Best practices
- Testing guidelines
- Migration guide for existing plugins

#### 6.2 Create Plugin Template

**Location:** `apps/web/app/components/plugins/core/templates/`

- `PluginTemplate/` - Boilerplate for new plugins
- Generator script (optional)

## Expected Impact

### Code Reduction

- **Before:** ~88 files, ~8,000+ lines
- **After:** ~88 files, ~6,000 lines (25% reduction)
- **Boilerplate per plugin:** 150 lines → 50 lines (67% reduction)

### Developer Experience

- ✅ Adding new plugin: 8 manual steps → 1 file creation (auto-registration)
- ✅ Consistent patterns across all plugins
- ✅ Type-safe plugin definitions
- ✅ Centralized configuration

### Maintainability

- ✅ Single source of truth for plugin logic
- ✅ Easy to update common patterns
- ✅ Testable abstractions
- ✅ Clear separation of concerns

### Performance

- ✅ Maintains lazy loading for builder components
- ✅ Singleton registry (zero overhead)
- ✅ Memoized component lookups

## Implementation Priorities (User-Selected)

### This Session Scope: Core + 1-2 Sample Plugins

- ✅ **Phase 1:** Complete core infrastructure (Registry, Factory, hooks)
- ✅ **Phase 2 (Partial):** Refactor 1-2 simple plugins as proof of concept
  - Priority: TrueOrFalsePlugin (simplest quiz plugin)
  - Secondary: AudioPlayerPlugin (simplest media plugin)
- ⏸️ **Phases 3-6:** Deferred to future sessions

### Testing Strategy

- Skip test creation for now (focus on implementation)
- Tests can be added in future iteration

### Migration Approach: Breaking Changes OK

- No backward compatibility needed
- Replace old patterns immediately
- Clean implementation without legacy support
- All plugins will be refactored eventually

### Session Goals

1. ✅ Build complete core infrastructure
2. ✅ Refactor TrueOrFalsePlugin using new system
3. ✅ Refactor AudioPlayerPlugin using new system
4. ✅ Verify both plugins work in builder and view modes
5. ✅ Provide clear path for refactoring remaining 12 plugins

### Future Work (Next Sessions)

- Refactor remaining 12 plugins using established pattern
- Update renderers to use registry exclusively
- Add comprehensive test coverage
- Create documentation and developer guide

## Critical Files to Modify

### Core Files (New)

- `apps/web/app/components/plugins/core/types.ts`
- `apps/web/app/components/plugins/core/PluginRegistry.ts`
- `apps/web/app/components/plugins/core/PluginFactory.ts`
- `apps/web/app/components/plugins/core/usePluginBuilder.ts`
- `apps/web/app/components/plugins/core/usePluginView.ts`
- `apps/web/app/components/plugins/core/utils/scoring.ts`

### Renderer Files (Modified)

- `apps/web/app/components/plugins/PluginRenderers/BuilderPluginBlockRenderer.tsx`
- `apps/web/app/components/plugins/PluginRenderers/ViewPluginTypesRenderer.tsx`

### Plugin Files (Modified - All 14)

- Every `Builder*Plugin.tsx` file
- Every `View*Plugin.tsx` file
- Keep interaction hooks (`use*Interaction.tsx`) - minimal changes needed

### Entry Files (Modified)

- `apps/web/app/entry.client.tsx` or `apps/web/app/root.tsx`

## Success Criteria

- ✅ All 14 existing plugins refactored and working
- ✅ No runtime errors in plugin rendering
- ✅ Builder and view modes function identically
- ✅ Score calculations produce same results
- ✅ Registry properly manages all plugins
- ✅ Test coverage for core abstractions
- ✅ Documentation complete
- ✅ Developer can add new plugin in <30 minutes

## Notes

### Singleton Pattern Justification

- **PluginRegistry:** Perfect use case - single source of truth, global state, no need for multiple instances
- **Lazy initialization:** Ensures registry ready before use
- **Thread-safe:** JavaScript single-threaded, no race conditions
- **Testable:** Can reset registry between tests if needed

### Best Practices Applied

- **DRY Principle:** Eliminate all duplication
- **SOLID Principles:**
  - Single Responsibility: Each abstraction has one job
  - Open/Closed: Extensible via factory pattern
  - Liskov Substitution: Plugins interchangeable via interface
  - Interface Segregation: Minimal required implementations
  - Dependency Inversion: Depend on abstractions, not concrete implementations
- **Composition over Inheritance:** Use hooks and factories instead of class hierarchies
- **Type Safety:** Leverage TypeScript discriminated unions
- **Progressive Enhancement:** Maintain server-side form posts
