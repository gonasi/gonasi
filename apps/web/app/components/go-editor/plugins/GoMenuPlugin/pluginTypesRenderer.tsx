import type { JSX } from 'react';
import type { LexicalEditor } from 'lexical';

import { InsertMatchConceptsDialog } from './DragAndDropPlugins/MatchConcepts';
import { InsertTrueOrFalseDialog } from './QuizPlugins/TrueOrFalsePlugin';
import { InsertTapToRevealDialog } from './RevealPlugins/TapToRevealPlugin';
import type { PluginTypeId } from './pluginData';
import { getPluginTypeNameById } from './pluginData';

import { useStore } from '~/store';

interface PluginTypesRendererProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
}

interface PluginComponentProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
}

// Plugin component map
const pluginComponentMap: Record<PluginTypeId, (props: PluginComponentProps) => JSX.Element> = {
  true_false: InsertTrueOrFalseDialog,
  star_rating: unimplementedPlugin,

  emoji_rating: unimplementedPlugin,
  numerical_rating: unimplementedPlugin,
  multiple_choice_multiple: unimplementedPlugin,
  multiple_choice_single: unimplementedPlugin,
  match_concepts: InsertMatchConceptsDialog,
  sequence_ordering: unimplementedPlugin,
  categorization: unimplementedPlugin,
  bar_chart: unimplementedPlugin,
  line_chart: unimplementedPlugin,
  pie_chart: unimplementedPlugin,
  historical_events: unimplementedPlugin,
  project_milestones: unimplementedPlugin,
  tap_to_reveal: InsertTapToRevealDialog,
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
};

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

export function PluginTypesRenderer({ activeEditor, onClose }: PluginTypesRendererProps) {
  const { activePlugin, activeSubPlugin } = useStore();

  if (!activePlugin || !activeSubPlugin) return null;

  const PluginComponent = pluginComponentMap[activeSubPlugin];

  if (!PluginComponent) {
    return (
      <div>Unsupported plugin type: {getPluginTypeNameById(activePlugin, activeSubPlugin)}</div>
    );
  }

  return <PluginComponent activeEditor={activeEditor} onClose={onClose} />;
}
