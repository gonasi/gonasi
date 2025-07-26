import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { BuilderTrueOrFalsePlugin } from '../QuizPlugins/TrueOrFalsePlugin/BuilderTrueOrFalsePlugin';
import { BuilderRichTextPlugin } from '../RichTextPlugins/RichTextPlugin/BuilderRichTextPlugin';

import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';

interface BuilderPluginRendererProps {
  pluginTypeId: PluginTypeId;
  block?: LessonBlockLoaderReturnType;
}

function notImplemented(): never {
  throw new Error('Plugin component not implemented.');
}

// Only components that accept `{ block?: LessonBlockLoaderReturnType }`
const pluginComponentMap: Record<
  PluginTypeId,
  (props: { block?: LessonBlockLoaderReturnType }) => JSX.Element
> = {
  rich_text_editor: BuilderRichTextPlugin,
  true_or_false: BuilderTrueOrFalsePlugin,
  tap_to_reveal: notImplemented,
  multiple_choice_multiple: notImplemented,
  multiple_choice_single: notImplemented,
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

function UnsupportedPluginMessage({ pluginTypeId }: { pluginTypeId: PluginTypeId }) {
  return <div>Unsupported plugin type: {pluginTypeId}</div>;
}

export default function BuilderPluginRenderer({
  pluginTypeId,
  block,
}: BuilderPluginRendererProps): JSX.Element {
  const PluginComponent = pluginComponentMap[pluginTypeId];

  if (!PluginComponent) {
    return <UnsupportedPluginMessage pluginTypeId={pluginTypeId} />;
  }

  return <PluginComponent block={block} />;
}
