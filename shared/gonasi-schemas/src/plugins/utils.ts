import { z } from 'zod';

const LexicalEditorStateSchema = z.object({
  root: z.object({
    type: z.literal('root'),
    version: z.number(),
    children: z.array(
      z.object({
        type: z.string(),
        version: z.number(),
        children: z.array(z.unknown()),
        // optional properties in your example
        textFormat: z.number().optional(),
        textStyle: z.string().optional(),
      }),
    ),
  }),
});

export const EMPTY_LEXICAL_STATE = JSON.stringify({
  root: {
    type: 'root',
    version: 1,
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [],
        textFormat: 0,
        textStyle: '',
      },
    ],
  },
});

export const NonEmptyLexicalState = z.string({ required_error: 'Please add some content.' }).refine(
  (val) => {
    try {
      const parsed = JSON.parse(val);
      const result = LexicalEditorStateSchema.safeParse(parsed);
      if (!result.success) return false;

      const children = result.data.root.children;

      // Non-empty if at least one child is not an empty paragraph
      return children.some((child) => !(child.type === 'paragraph' && child.children.length === 0));
    } catch {
      return false;
    }
  },
  {
    message: 'Please add some content.',
  },
);
