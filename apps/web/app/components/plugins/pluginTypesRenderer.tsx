import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { getPluginTypeNameById } from '@gonasi/schemas/plugins';

import { MatchConceptsPlugin } from './DragAndDropPlugins/MatchConceptsPlugin';
import { TrueOrFalsePlugin } from './QuizPlugins/TrueOrFalsePlugin';
import { TapToRevealPlugin } from './RevealPlugins/TapToRevealPlugin';
import { RichTextPlugin } from './RichTextPlugins/RichTextPlugin';

import { useStore } from '~/store';

// Interface PluginTypesRendererProps removed as it is no longer used.

interface PluginComponentProps {
  name: PluginTypeId;
}

// Plugin component map
const pluginComponentMap: Record<PluginTypeId, (props: PluginComponentProps) => JSX.Element> = {
  true_false: TrueOrFalsePlugin,
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

export function PluginTypesRenderer() {
  const { activePlugin, activeSubPlugin } = useStore();

  if (!activePlugin || !activeSubPlugin) return null;

  const PluginComponent = pluginComponentMap[activeSubPlugin as PluginTypeId];

  if (!PluginComponent) {
    return (
      <div>Unsupported plugin type: {getPluginTypeNameById(activePlugin, activeSubPlugin)}</div>
    );
  }

  return <PluginComponent name={activeSubPlugin as PluginTypeId} />;
}
