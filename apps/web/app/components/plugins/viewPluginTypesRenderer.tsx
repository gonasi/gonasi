import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { ViewTrueOrFalsePlugin } from './QuizPlugins/TrueOrFalsePlugin/ViewTrueOrFalsePlugin';
import { TapToRevealPlugin } from './RevealPlugins/TapToRevealPlugin';
import { ViewRichTextPlugin } from './RichTextPlugins/RichTextPlugin/ViewRichTextPlugin';

import type { LessonBlockLoaderReturnType } from '~/routes/dashboard/courses/lessons/edit-plugin-modal';

export interface ViewPluginComponentProps {
  block: LessonBlockLoaderReturnType;
  mode: 'preview' | 'play';
}

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

// Wrapper to enforce correct plugin_type at runtime
export function withPluginGuard<T extends PluginTypeId>(
  expectedType: T,
  Component: (
    props: ViewPluginComponentProps & {
      block: Extract<LessonBlockLoaderReturnType, { plugin_type: T }>;
    },
  ) => JSX.Element,
): (props: ViewPluginComponentProps) => JSX.Element {
  return (props) => {
    if (props.block.plugin_type !== expectedType) {
      throw new Error(
        `Expected plugin_type "${expectedType}", but received "${props.block.plugin_type}"`,
      );
    }

    return <Component {...(props as any)} />;
  };
}

// Plugin component map
const viewPluginComponentMap: Record<
  PluginTypeId,
  (props: ViewPluginComponentProps) => JSX.Element
> = {
  true_false: withPluginGuard('true_false', ViewTrueOrFalsePlugin),
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
  tap_to_reveal: withPluginGuard('tap_to_reveal', TapToRevealPlugin),
  step_by_step_reveal: unimplementedPlugin,
  video_player: unimplementedPlugin,
  audio_player: unimplementedPlugin,
  slideshow_player: unimplementedPlugin,
  motion_simulation: unimplementedPlugin,
  gravity_simulation: unimplementedPlugin,
  rich_text_editor: withPluginGuard('rich_text_editor', ViewRichTextPlugin),
  image_upload: unimplementedPlugin,
  gltf_embed: unimplementedPlugin,
  video_embed: unimplementedPlugin,
  note_callout: unimplementedPlugin,
};

export default function ViewPluginTypesRenderer({ block, mode }: ViewPluginComponentProps) {
  const PluginComponent = viewPluginComponentMap[block.plugin_type];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return <PluginComponent block={block} mode={mode} />;
}
