import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { CreateTrueOrFalsePlugin } from './QuizPlugins/TrueOrFalsePlugin/CreateTrueOrFalsePlugin';
import { CreateRichTextPlugin } from './RichTextPlugins/RichTextPlugin/CreateRichTextPlugin';

interface ViewPluginRendererProps {
  pluginTypeId: PluginTypeId;
}

function notImplemented(): never {
  throw new Error('Plugin component not implemented.');
}

const pluginComponentMap: Record<PluginTypeId, (props: ViewPluginRendererProps) => JSX.Element> = {
  true_or_false: CreateTrueOrFalsePlugin,
  tap_to_reveal: notImplemented,
  rich_text_editor: CreateRichTextPlugin,
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

export default function ViewPluginRenderer({ pluginTypeId }: ViewPluginRendererProps): JSX.Element {
  const PluginComponent = pluginComponentMap[pluginTypeId];

  if (!PluginComponent) {
    return <UnsupportedPluginMessage pluginTypeId={pluginTypeId} />;
  }

  return <PluginComponent pluginTypeId={pluginTypeId} />;
}
