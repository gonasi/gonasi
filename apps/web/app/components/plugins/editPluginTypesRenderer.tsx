import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { EditTrueOrFalsePlugin } from './QuizPlugins/TrueOrFalsePlugin/EditTrueOrFalsePlugin';
import { TapToRevealPlugin } from './RevealPlugins/TapToRevealPlugin';
import { EditRichTextPlugin } from './RichTextPlugins/RichTextPlugin/EditRichTextPlugin';

import type { LessonBlockLoaderReturnType } from '~/routes/dashboard/courses/lessons/edit-plugin-modal';

export interface EditPluginComponentProps {
  block: LessonBlockLoaderReturnType;
}

export function withPluginGuard<T extends PluginTypeId>(
  expectedType: T,
  Component: (
    props: EditPluginComponentProps & {
      block: Extract<LessonBlockLoaderReturnType, { plugin_type: T }>;
    },
  ) => JSX.Element,
): (props: EditPluginComponentProps) => JSX.Element {
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
const editPluginComponentMap: Record<
  PluginTypeId,
  (props: EditPluginComponentProps) => JSX.Element
> = {
  true_false: withPluginGuard('true_false', EditTrueOrFalsePlugin),
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
  rich_text_editor: withPluginGuard('rich_text_editor', EditRichTextPlugin),
  image_upload: unimplementedPlugin,
  gltf_embed: unimplementedPlugin,
  video_embed: unimplementedPlugin,
  note_callout: unimplementedPlugin,
};

// Default placeholder for unimplemented plugins
function unimplementedPlugin(): JSX.Element {
  throw new Error('Plugin component not implemented.');
}

export default function EditPluginTypesRenderer({ block }: EditPluginComponentProps) {
  const PluginComponent = editPluginComponentMap[block.plugin_type];

  if (!PluginComponent) {
    return <div>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return <PluginComponent block={block} />;
}
