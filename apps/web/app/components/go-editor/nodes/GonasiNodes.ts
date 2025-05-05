import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import type { Klass, LexicalNode } from 'lexical';

import { MatchConceptsNode } from './GoNodes/MatchConceptsNode';
import { TapToRevealNode } from './GoNodes/TapToRevealNode';
import { TrueOrFalseNode } from './GoNodes/TrueOrFalseNode';
import { ImageNode } from './ImageNode';
import { PageBreakNode } from './PageBreakNode';

export const GonasiNodes: Klass<LexicalNode>[] = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  TrueOrFalseNode,
  TapToRevealNode,
  MatchConceptsNode,
  // PollNode,
  // StickyNode,
  ImageNode,
  // InlineImageNode,
  // MentionNode,
  // EmojiNode,
  // ExcalidrawNode,
  // EquationNode,
  // AutocompleteNode,
  // KeywordNode,
  HorizontalRuleNode,
  // TweetNode,
  // YouTubeNode,
  // FigmaNode,
  MarkNode,
  // CollapsibleContainerNode,
  // CollapsibleContentNode,
  // CollapsibleTitleNode,
  PageBreakNode,
  // LayoutContainerNode,
  // LayoutItemNode,
  // SpecialTextNode,
];

export const GonasiRichTextRendererNodes: Klass<LexicalNode>[] = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  ImageNode,
];
