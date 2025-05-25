import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { EditMultipleChoiceMultipleAnswersSettings } from '../QuizPlugins/MultipleChoiceMultipleAnswers/EditMultipleChoiceMultipleAnswersSettings';
import { EditMultipleChoiceSingleAnswerSettings } from '../QuizPlugins/MultipleChoiceSingleAnswer/EditMultipleChoiceSingleAnswerSettings';
import { EditTrueOrFalseSettings } from '../QuizPlugins/TrueOrFalsePlugin/EditTrueOrFalseSettings';
import { EditRichTextSettings } from '../RichTextPlugins/RichTextPlugin/EditRichTextSettings';

import type { SettingsLoaderReturnType } from '~/routes/dashboard/courses/lessons/plugins/edit-plugin-settings-modal';

export interface EditPluginSettingsComponentProps {
  block: SettingsLoaderReturnType;
}

// Plugin component map
const editPluginSettingsComponentMap: Record<
  PluginTypeId,
  (props: EditPluginSettingsComponentProps) => JSX.Element
> = {
  true_or_false: EditTrueOrFalseSettings,
  multiple_choice_multiple: EditMultipleChoiceMultipleAnswersSettings,
  multiple_choice_single: EditMultipleChoiceSingleAnswerSettings,
  match_concepts: unimplementedPlugin,
  sequence_ordering: unimplementedPlugin,
  categorization: unimplementedPlugin,
  bar_chart: unimplementedPlugin,
  line_chart: unimplementedPlugin,
  pie_chart: unimplementedPlugin,
  historical_events: unimplementedPlugin,
  project_milestones: unimplementedPlugin,
  tap_to_reveal: unimplementedPlugin,
  step_by_step_reveal: unimplementedPlugin,
  video_player: unimplementedPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
  rich_text_editor: EditRichTextSettings,
};

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

export default function EditPluginSettingsTypesRenderer({
  block,
}: EditPluginSettingsComponentProps) {
  const PluginSettingsComponent = editPluginSettingsComponentMap[block.plugin_type];

  if (!PluginSettingsComponent) {
    return <div>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return <PluginSettingsComponent block={block} />;
}
