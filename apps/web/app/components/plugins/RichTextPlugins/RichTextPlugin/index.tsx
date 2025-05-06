interface RichTextPluginProps {
  name: string;
}

export function RichTextPlugin({ name }: RichTextPluginProps) {
  return <div>Rich Text Plugin {name}</div>;
}
