import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { CreateRichTextPlugin } from './RichTextPlugins/RichTextPlugin/CreateRichTextPlugin';

export interface CreatePluginComponentProps {
  pluginTypeId: PluginTypeId;
}

function unimplementedPlugin(): never {
  throw new Error('Plugin component not implemented.');
}

const viewPluginComponentMap: Record<
  PluginTypeId,
  (props: CreatePluginComponentProps) => JSX.Element
> = {
  true_false: unimplementedPlugin,
  tap_to_reveal: unimplementedPlugin,
  rich_text_editor: CreateRichTextPlugin,
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
  step_by_step_reveal: unimplementedPlugin,
  video_player: unimplementedPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
};

export default function ViewPluginTypesRenderer({
  pluginTypeId,
}: CreatePluginComponentProps): JSX.Element {
  const PluginComponent = viewPluginComponentMap[pluginTypeId];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {pluginTypeId}</div>;
  }

  return <PluginComponent pluginTypeId={pluginTypeId} />;
}
