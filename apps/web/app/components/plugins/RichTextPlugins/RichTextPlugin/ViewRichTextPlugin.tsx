import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  return <p>{block.content.data.richTextState}</p>;
}
