import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import type { PublishBlockSchemaTypes } from '@gonasi/schemas/publish';

import { ViewMultipleChoiceMultipleAnswersPlugin } from '../QuizPlugins/MultipleChoiceMultipleAnswers/ViewMultipleChoiceMultipleAnswersPlugin';
import { ViewMultipleChoiceSingleAnswerPlugin } from '../QuizPlugins/MultipleChoiceSingleAnswer/ViewMultipleChoiceSingleAnswerPlugin';
import { ViewTrueOrFalsePlugin } from '../QuizPlugins/TrueOrFalsePlugin/ViewTrueOrFalsePlugin';
import { ViewRichTextPlugin } from '../RichTextPlugins/RichTextPlugin/ViewRichTextPlugin';

export interface ViewPluginComponentProps {
  block: PublishBlockSchemaTypes;
  mode: 'preview' | 'play';
}

function unimplementedPlugin() {
  return <div>Plugin not implemented</div>;
}

const viewPluginComponentMap: Record<
  PluginTypeId,
  (props: ViewPluginComponentProps) => JSX.Element
> = {
  true_or_false: ViewTrueOrFalsePlugin,
  tap_to_reveal: unimplementedPlugin,
  rich_text_editor: ViewRichTextPlugin,
  multiple_choice_multiple: ViewMultipleChoiceMultipleAnswersPlugin,
  multiple_choice_single: ViewMultipleChoiceSingleAnswerPlugin,
  match_concepts: unimplementedPlugin,
  sequence_ordering: unimplementedPlugin,
  categorization: unimplementedPlugin,
  bar_chart: unimplementedPlugin,
  line_chart: unimplementedPlugin,
  pie_chart: unimplementedPlugin,
  historical_events: unimplementedPlugin,
  project_milestones: unimplementedPlugin,
  step_by_step_reveal: unimplementedPlugin,
  video_player: unimplementedPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
};

export default function ViewPluginTypesRenderer({
  block,
  mode,
}: ViewPluginComponentProps): JSX.Element {
  const PluginComponent = viewPluginComponentMap[block.plugin_type];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return <PluginComponent block={block} mode={mode} />;
}
