import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { TapToRevealPlugin } from './RevealPlugins/TapToRevealPlugin';
import { ViewRichTextPlugin } from './RichTextPlugins/RichTextPlugin/ViewRichTextPlugin';

import type { LessonBlockLoaderReturnType } from '~/routes/dashboard/courses/lessons/edit-plugin-modal';

export interface ViewPluginComponentProps {
  block: LessonBlockLoaderReturnType;
  mode: 'preview' | 'play';
  blockInteraction?: any;
}

// Plugin component map
const viewPluginComponentMap: Record<
  PluginTypeId,
  (props: ViewPluginComponentProps) => JSX.Element
> = {
  true_false: unimplementedPlugin,
  multiple_choice_multiple: unimplementedPlugin,
  multiple_choice_single: unimplementedPlugin,
  match_concepts: unimplementedPlugin,
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
  rich_text_editor: ViewRichTextPlugin,
  image_upload: unimplementedPlugin,
  gltf_embed: unimplementedPlugin,
  video_embed: unimplementedPlugin,
  note_callout: unimplementedPlugin,
};

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

export default function ViewPluginTypesRenderer({
  block,
  mode,
  blockInteraction,
}: ViewPluginComponentProps) {
  const PluginComponent = viewPluginComponentMap[block.plugin_type];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return <PluginComponent block={block} mode={mode} blockInteraction={blockInteraction} />;
}
