import type React from 'react';
import { type ComponentType, type JSX, lazy, Suspense, useMemo } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import '../QuizPlugins/TrueOrFalsePlugin';
import '../QuizPlugins/MultipleChoiceSingleAnswer';
import '../QuizPlugins/MultipleChoiceMultipleAnswers';
import '../QuizPlugins/FillInTheBlankPlugin';
import '../QuizPlugins/MatchingGamePlugin';
import '../QuizPlugins/SwipeCategorizePlugin';

import type { BuilderComponentProps } from '../core/types';
// Import registry and refactored plugins
import { pluginRegistry } from '../index';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';

interface BuilderPluginRendererProps {
  pluginTypeId: PluginTypeId;
  block?: LessonBlockLoaderReturnType;
}

function notImplemented(): never {
  throw new Error('Plugin component not implemented.');
}

// Lazy load the builder plugin components (refactored plugins use registry)
const LazyBuilderMultipleChoiceSingleAnswerPlugin =
  pluginRegistry.getBuilder('multiple_choice_single');
const LazyBuilderMultipleChoiceMultipleAnswersPlugin = pluginRegistry.getBuilder(
  'multiple_choice_multiple',
);
const LazyBuilderTrueOrFalsePlugin = pluginRegistry.getBuilder('true_or_false');
const LazyBuilderFillInTheBlankPlugin = pluginRegistry.getBuilder('fill_in_the_blank');
const LazyBuilderMatchingGamePlugin = pluginRegistry.getBuilder('matching_game');
const LazyBuilderSwipeCategorizePlugin = pluginRegistry.getBuilder('swipe_categorize');

const LazyBuilderRichTextPlugin = lazy(() =>
  import('../RichTextPlugins/RichTextPlugin/BuilderRichTextPlugin').then((module) => ({
    default: module.BuilderRichTextPlugin,
  })),
);

const LazyBuilderGuidedImageHotspotsPlugin = lazy(() =>
  import('../MediaInteraction/GuidedImageHotspots/BuilderGuidedImageHotspotsPlugin').then(
    (module) => ({
      default: module.BuilderGuidedImageHotspotsPlugin,
    }),
  ),
);

const LazyBuilderStepByStepRevealPluginPlugin = lazy(() =>
  import('../RevealPlugins/StepByStepReveal/BuilderStepByStepRevealPlugin').then((module) => ({
    default: module.BuilderStepByStepRevealPlugin,
  })),
);

const LazyBuilderAudioPlayerPlugin = lazy(() =>
  import('../MediaPlayerPlugins/AudioPlayerPlugin/BuilderAudioPlayerPlugin').then((module) => ({
    default: module.BuilderAudioPlayerPlugin,
  })),
);

const LazyBuilderVideoPlayerPlugin = lazy(() =>
  import('../MediaPlayerPlugins/VideoPlayerPlugin/BuilderVideoPlayerPlugin').then((module) => ({
    default: module.BuilderVideoPlayerPlugin,
  })),
);

const LazyBuilderYouTubeEmbedPlugin = lazy(() =>
  import('../MediaPlayerPlugins/YouTubeEmbedPlugin/BuilderYouTubeEmbedPlugin').then((module) => ({
    default: module.BuilderYouTubeEmbedPlugin,
  })),
);

const LazyBuilderVimeoEmbedPlugin = lazy(() =>
  import('../MediaPlayerPlugins/VimeoEmbedPlugin/BuilderVimeoEmbedPlugin').then((module) => ({
    default: module.BuilderVimeoEmbedPlugin,
  })),
);

const LazyBuilderImageFocusQuizPlugin = lazy(() =>
  import('../RapidRecall/ImageFocusQuiz/BuilderImageFocusQuizPlugin').then((module) => ({
    default: module.BuilderImageFocusQuizPlugin,
  })),
);

// Only components that accept `{ block?: LessonBlockLoaderReturnType }`
const pluginComponentMap: Record<
  PluginTypeId,
  React.LazyExoticComponent<ComponentType<BuilderComponentProps>> | (() => never)
> = {
  rich_text_editor: LazyBuilderRichTextPlugin,
  true_or_false: LazyBuilderTrueOrFalsePlugin,
  fill_in_the_blank: LazyBuilderFillInTheBlankPlugin,
  multiple_choice_multiple: LazyBuilderMultipleChoiceMultipleAnswersPlugin,
  multiple_choice_single: LazyBuilderMultipleChoiceSingleAnswerPlugin,
  matching_game: LazyBuilderMatchingGamePlugin,
  swipe_categorize: LazyBuilderSwipeCategorizePlugin,
  guided_image_hotspots: LazyBuilderGuidedImageHotspotsPlugin,
  step_by_step_reveal: LazyBuilderStepByStepRevealPluginPlugin,
  hotspot_identification_question: notImplemented,
  match_concepts: notImplemented,
  sequence_ordering: notImplemented,
  categorization: notImplemented,
  bar_chart: notImplemented,
  line_chart: notImplemented,
  pie_chart: notImplemented,
  historical_events: notImplemented,
  project_milestones: notImplemented,
  audio_player: LazyBuilderAudioPlayerPlugin,
  video_player: LazyBuilderVideoPlayerPlugin,
  slideshow_player: notImplemented,
  youtube_embed: LazyBuilderYouTubeEmbedPlugin,
  vimeo_embed: LazyBuilderVimeoEmbedPlugin,
  twitch_embed: notImplemented,
  instagram_embed: notImplemented,
  tiktok_embed: notImplemented,
  motion_simulation: notImplemented,
  gravity_simulation: notImplemented,
  image_focus_quiz: LazyBuilderImageFocusQuizPlugin,
};

function PluginLoadingFallback() {
  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Body>
          <Spinner />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

function UnsupportedPluginMessage({ pluginTypeId }: { pluginTypeId: PluginTypeId }) {
  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Unsupported Plugin' closeRoute='/' />
        <Modal.Body>
          <p>
            The plugin <strong>{pluginTypeId}</strong> is not currently supported. Please try a
            different one or contact support for help.
          </p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

export default function BuilderPluginRenderer({
  pluginTypeId,
  block,
}: BuilderPluginRendererProps): JSX.Element {
  console.log('[BuilderPluginRenderer] Rendering', {
    pluginTypeId,
    blockId: block?.id,
    hasBlock: !!block,
  });

  const PluginComponent = useMemo(() => {
    const component = pluginComponentMap[pluginTypeId];
    console.log('[BuilderPluginRenderer] PluginComponent lookup', {
      pluginTypeId,
      found: !!component,
      isNotImplemented: component === notImplemented,
    });
    return component;
  }, [pluginTypeId]);

  if (!PluginComponent) {
    console.warn('[BuilderPluginRenderer] Plugin component not found:', pluginTypeId);
    return <UnsupportedPluginMessage pluginTypeId={pluginTypeId} />;
  }

  // Check if it's the notImplemented function by checking if it's a function that throws
  if (PluginComponent === notImplemented) {
    console.warn('[BuilderPluginRenderer] Plugin not implemented:', pluginTypeId);
    // This will throw an error, which is the intended behavior
    return <PluginComponent />;
  }

  // All other components are lazy components
  const LazyComponent = PluginComponent as React.LazyExoticComponent<
    ComponentType<BuilderComponentProps>
  >;

  console.log('[BuilderPluginRenderer] Rendering LazyComponent', {
    pluginTypeId,
    blockId: block?.id,
  });

  return (
    <Suspense fallback={<PluginLoadingFallback />}>
      <LazyComponent block={block} />
    </Suspense>
  );
}
