import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import type { BlockWithProgressSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';

import { ViewFillInTheBlankPlugin } from '../QuizPlugins/FillInTheBlankPlugin/ViewFillInTheBlankPlugin';
import { ViewMatchingGamePlugin } from '../QuizPlugins/MatchingGamePlugin/ViewMatchingGamePlugin';
import { ViewMultipleChoiceMultipleAnswersPlugin } from '../QuizPlugins/MultipleChoiceMultipleAnswers/ViewMultipleChoiceMultipleAnswersPlugin';
import { ViewMultipleChoiceSingleAnswerPlugin } from '../QuizPlugins/MultipleChoiceSingleAnswer/ViewMultipleChoiceSingleAnswerPlugin';
import { ViewSwipeCategorizePlugin } from '../QuizPlugins/SwipeCategorizePlugin/ViewSwipeCategorizePlugin';
import { ViewTrueOrFalsePlugin } from '../QuizPlugins/TrueOrFalsePlugin/ViewTrueOrFalsePlugin';
import { ViewStepByStepRevealPlugin } from '../RevealPlugins/StepByStepReveal/ViewStepByStepRevealPlugin';
import { ViewRichTextPlugin } from '../RichTextPlugins/RichTextPlugin/ViewRichTextPlugin';
import { ViewVideoPlayerPlugin } from '../MediaPlayerPlugins/VideoPlayerPlugin/ViewVideoPlayerPlugin';

export interface ViewPluginComponentProps {
  blockWithProgress: BlockWithProgressSchemaTypes;
}

function unimplementedPlugin() {
  return <div>Plugin not implemented</div>;
}

const viewPluginComponentMap: Record<
  PluginTypeId,
  (props: ViewPluginComponentProps) => JSX.Element
> = {
  true_or_false: ViewTrueOrFalsePlugin,
  fill_in_the_blank: ViewFillInTheBlankPlugin,
  rich_text_editor: ViewRichTextPlugin,
  multiple_choice_multiple: ViewMultipleChoiceMultipleAnswersPlugin,
  multiple_choice_single: ViewMultipleChoiceSingleAnswerPlugin,
  matching_game: ViewMatchingGamePlugin,
  swipe_categorize: ViewSwipeCategorizePlugin,
  guided_image_hotspots: unimplementedPlugin,
  hotspot_identification_question: unimplementedPlugin,
  match_concepts: unimplementedPlugin,
  sequence_ordering: unimplementedPlugin,
  categorization: unimplementedPlugin,
  bar_chart: unimplementedPlugin,
  line_chart: unimplementedPlugin,
  pie_chart: unimplementedPlugin,
  historical_events: unimplementedPlugin,
  project_milestones: unimplementedPlugin,
  step_by_step_reveal: ViewStepByStepRevealPlugin,
  video_player: ViewVideoPlayerPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
};

export default function ViewPluginTypesRenderer({
  blockWithProgress,
}: ViewPluginComponentProps): JSX.Element {
  const PluginComponent = viewPluginComponentMap[blockWithProgress.block.plugin_type];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {blockWithProgress.block.plugin_type}</div>;
  }

  return <PluginComponent blockWithProgress={blockWithProgress} />;
}
