import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import type { BlockWithProgressSchemaTypes } from '@gonasi/schemas/publish/progressiveReveal';

// Ensure refactored plugins are imported and registered
import '../QuizPlugins/TrueOrFalsePlugin';
import '../QuizPlugins/MultipleChoiceSingleAnswer';
import '../QuizPlugins/MultipleChoiceMultipleAnswers';
import '../QuizPlugins/FillInTheBlankPlugin';
import '../QuizPlugins/MatchingGamePlugin';
import '../QuizPlugins/SwipeCategorizePlugin';

import { pluginRegistry } from '../index';
import { ViewAudioPlayerPlugin } from '../MediaPlayerPlugins/AudioPlayerPlugin/ViewAudioPlayerPlugin';
import { ViewVideoPlayerPlugin } from '../MediaPlayerPlugins/VideoPlayerPlugin/ViewVideoPlayerPlugin';
import { ViewVimeoEmbedPlugin } from '../MediaPlayerPlugins/VimeoEmbedPlugin/ViewVimeoEmbedPlugin';
import { ViewYouTubeEmbedPlugin } from '../MediaPlayerPlugins/YouTubeEmbedPlugin/ViewYouTubeEmbedPlugin';
import { ViewImageFocusQuizPlugin } from '../RapidRecall/ImageFocusQuiz/ViewImageFocusQuizPlugin';
import { ViewStepByStepRevealPlugin } from '../RevealPlugins/StepByStepReveal/ViewStepByStepRevealPlugin';
import { ViewRichTextPlugin } from '../RichTextPlugins/RichTextPlugin/ViewRichTextPlugin';

export interface ViewPluginComponentProps {
  blockWithProgress: BlockWithProgressSchemaTypes;
}

function unimplementedPlugin() {
  return <div>Plugin not implemented</div>;
}

// Get view components from registry once at module level
const ViewTrueOrFalsePlugin = pluginRegistry.getView('true_or_false');
const ViewMultipleChoiceSinglePlugin = pluginRegistry.getView('multiple_choice_single');
const ViewMultipleChoiceMultiplePlugin = pluginRegistry.getView('multiple_choice_multiple');
const ViewFillInTheBlankPlugin = pluginRegistry.getView('fill_in_the_blank');
const ViewMatchingGamePlugin = pluginRegistry.getView('matching_game');
const ViewSwipeCategorizePlugin = pluginRegistry.getView('swipe_categorize');

const viewPluginComponentMap: Record<
  PluginTypeId,
  (props: ViewPluginComponentProps) => JSX.Element
> = {
  // Refactored plugins - use registry (wrapped to ensure stable references)
  true_or_false: (props) => <ViewTrueOrFalsePlugin blockWithProgress={props.blockWithProgress} />,
  multiple_choice_single: (props) => (
    <ViewMultipleChoiceSinglePlugin blockWithProgress={props.blockWithProgress} />
  ),
  multiple_choice_multiple: (props) => (
    <ViewMultipleChoiceMultiplePlugin blockWithProgress={props.blockWithProgress} />
  ),
  fill_in_the_blank: (props) => (
    <ViewFillInTheBlankPlugin blockWithProgress={props.blockWithProgress} />
  ),
  matching_game: (props) => <ViewMatchingGamePlugin blockWithProgress={props.blockWithProgress} />,
  swipe_categorize: (props) => (
    <ViewSwipeCategorizePlugin blockWithProgress={props.blockWithProgress} />
  ),

  // Legacy plugins - still using old imports
  rich_text_editor: ViewRichTextPlugin,
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
  audio_player: ViewAudioPlayerPlugin,
  video_player: ViewVideoPlayerPlugin,
  slideshow_player: unimplementedPlugin,
  youtube_embed: ViewYouTubeEmbedPlugin,
  vimeo_embed: ViewVimeoEmbedPlugin,
  twitch_embed: unimplementedPlugin,
  instagram_embed: unimplementedPlugin,
  tiktok_embed: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
  image_focus_quiz: ViewImageFocusQuizPlugin,
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
