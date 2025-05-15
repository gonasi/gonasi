import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { EditMultipleChoiceMultipleAnswersPlugin } from './QuizPlugins/MultipleChoiceMultipleAnswers/EditMultipleChoiceMultipleAnswersPlugin';
import { EditMultipleChoiceSingleAnswerPlugin } from './QuizPlugins/MultipleChoiceSingleAnswer/EditMultipleChoiceSingleAnswerPlugin';
import { EditTrueOrFalsePlugin } from './QuizPlugins/TrueOrFalsePlugin/EditTrueOrFalsePlugin';
import { EditTapToRevealPlugin } from './RevealPlugins/TapToRevealPlugin/EditTapToRevealPlugin';
import { EditRichTextPlugin } from './RichTextPlugins/RichTextPlugin/EditRichTextPlugin';

import type { LessonBlockLoaderReturnType } from '~/routes/dashboard/courses/lessons/edit-plugin-modal';

export interface EditPluginComponentProps {
  block: LessonBlockLoaderReturnType;
}

// Plugin component map
const editPluginComponentMap: Record<
  PluginTypeId,
  (props: EditPluginComponentProps) => JSX.Element
> = {
  true_false: EditTrueOrFalsePlugin,
  multiple_choice_multiple: EditMultipleChoiceMultipleAnswersPlugin,
  multiple_choice_single: EditMultipleChoiceSingleAnswerPlugin,
  match_concepts: unimplementedPlugin,
  sequence_ordering: unimplementedPlugin,
  categorization: unimplementedPlugin,
  bar_chart: unimplementedPlugin,
  line_chart: unimplementedPlugin,
  pie_chart: unimplementedPlugin,
  historical_events: unimplementedPlugin,
  project_milestones: unimplementedPlugin,
  tap_to_reveal: EditTapToRevealPlugin,
  step_by_step_reveal: unimplementedPlugin,
  video_player: unimplementedPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
  rich_text_editor: EditRichTextPlugin,
};

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

export default function EditPluginTypesRenderer({ block }: EditPluginComponentProps) {
  const PluginComponent = editPluginComponentMap[block.plugin_type];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return <PluginComponent block={block} />;
}
