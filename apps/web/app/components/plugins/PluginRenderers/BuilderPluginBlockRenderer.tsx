import type React from 'react';
import { type JSX, lazy, Suspense } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

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

// Lazy load the builder plugin components
const LazyBuilderMultipleChoiceSingleAnswerPlugin = lazy(() =>
  import('../QuizPlugins/MultipleChoiceSingleAnswer/BuilderMultipleChoiceSingleAnswerPlugin').then(
    (module) => ({ default: module.BuilderMultipleChoiceSingleAnswerPlugin }),
  ),
);

const LazyBuilderMultipleChoiceMultipleAnswersPlugin = lazy(() =>
  import(
    '../QuizPlugins/MultipleChoiceMultipleAnswers/BuilderMultipleChoiceMultipleAnswersPlugin'
  ).then((module) => ({ default: module.BuilderMultipleChoiceMultipleAnswersPlugin })),
);

const LazyBuilderTrueOrFalsePlugin = lazy(() =>
  import('../QuizPlugins/TrueOrFalsePlugin/BuilderTrueOrFalsePlugin').then((module) => ({
    default: module.BuilderTrueOrFalsePlugin,
  })),
);

const LazyBuilderRichTextPlugin = lazy(() =>
  import('../RichTextPlugins/RichTextPlugin/BuilderRichTextPlugin').then((module) => ({
    default: module.BuilderRichTextPlugin,
  })),
);

// Only components that accept `{ block?: LessonBlockLoaderReturnType }`
const pluginComponentMap: Record<
  PluginTypeId,
  | React.LazyExoticComponent<(props: { block?: LessonBlockLoaderReturnType }) => JSX.Element>
  | (() => never)
> = {
  rich_text_editor: LazyBuilderRichTextPlugin,
  true_or_false: LazyBuilderTrueOrFalsePlugin,
  tap_to_reveal: notImplemented,
  multiple_choice_multiple: LazyBuilderMultipleChoiceMultipleAnswersPlugin,
  multiple_choice_single: LazyBuilderMultipleChoiceSingleAnswerPlugin,
  match_concepts: notImplemented,
  sequence_ordering: notImplemented,
  categorization: notImplemented,
  bar_chart: notImplemented,
  line_chart: notImplemented,
  pie_chart: notImplemented,
  historical_events: notImplemented,
  project_milestones: notImplemented,
  step_by_step_reveal: notImplemented,
  video_player: notImplemented,
  audio_player: notImplemented,
  slideshow_player: notImplemented,
  motion_simulation: notImplemented,
  gravity_simulation: notImplemented,
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
  const PluginComponent = pluginComponentMap[pluginTypeId];

  if (!PluginComponent) {
    return <UnsupportedPluginMessage pluginTypeId={pluginTypeId} />;
  }

  // Check if it's a lazy component or the notImplemented function
  const isLazyComponent = 'render' in PluginComponent || '$$typeof' in PluginComponent;

  if (isLazyComponent) {
    const LazyComponent = PluginComponent as React.LazyExoticComponent<
      (props: { block?: LessonBlockLoaderReturnType }) => JSX.Element
    >;
    return (
      <Suspense fallback={<PluginLoadingFallback />}>
        <LazyComponent block={block} />
      </Suspense>
    );
  }

  // For notImplemented functions - this will throw an error
  const NotImplementedComponent = PluginComponent as () => never;
  return <NotImplementedComponent />;
}
