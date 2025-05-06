import type { JSX } from 'react';

import { MatchConceptsPlugin } from './DragAndDropPlugins/MatchConceptsPlugin';
import { TrueOrFalsePlugin } from './QuizPlugins/TrueOrFalsePlugin';
import { TapToRevealPlugin } from './RevealPlugins/TapToRevealPlugin';
import { RichTextPlugin } from './RichTextPlugins/RichTextPlugin';
import type { PluginTypeId } from './pluginData';
import { getPluginTypeNameById } from './pluginData';

import { useStore } from '~/store';

interface PluginTypesRendererProps {
  name: string;
}

interface PluginComponentProps {
  name: string;
}

// Plugin component map
const pluginComponentMap: Record<PluginTypeId, (props: PluginComponentProps) => JSX.Element> = {
  true_false: TrueOrFalsePlugin,
  star_rating: unimplementedPlugin,

  emoji_rating: unimplementedPlugin,
  numerical_rating: unimplementedPlugin,
  multiple_choice_multiple: unimplementedPlugin,
  multiple_choice_single: unimplementedPlugin,
  match_concepts: MatchConceptsPlugin,
  sequence_ordering: unimplementedPlugin,
  categorization: unimplementedPlugin,
  bar_chart: unimplementedPlugin,
  line_chart: unimplementedPlugin,
  pie_chart: unimplementedPlugin,
  historical_events: unimplementedPlugin,
  project_milestones: unimplementedPlugin,
  tap_to_reveal: TapToRevealPlugin,
  step_by_step_reveal: unimplementedPlugin,
  video_player: unimplementedPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
  basic_circuits: unimplementedPlugin,
  advanced_circuits: unimplementedPlugin,
  xp_system: unimplementedPlugin,
  leaderboards: unimplementedPlugin,
  open_forum: unimplementedPlugin,
  moderated_forum: unimplementedPlugin,
  manual_review: unimplementedPlugin,
  automated_review: unimplementedPlugin,
  rich_text_editor: RichTextPlugin,
  image_upload: unimplementedPlugin,
  gltf_embed: unimplementedPlugin,
  video_embed: unimplementedPlugin,
  note_callout: unimplementedPlugin,
};

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

export function PluginTypesRenderer({ name }: PluginTypesRendererProps) {
  const { activePlugin, activeSubPlugin } = useStore();

  if (!activePlugin || !activeSubPlugin) return null;

  const PluginComponent = pluginComponentMap[activeSubPlugin];

  if (!PluginComponent) {
    return (
      <div>Unsupported plugin type: {getPluginTypeNameById(activePlugin, activeSubPlugin)}</div>
    );
  }

  return <PluginComponent name={name} />;
}
