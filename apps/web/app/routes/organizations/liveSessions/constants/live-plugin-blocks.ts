import {
  ArrowLeftRight,
  CircleDot,
  FileText,
  MoveHorizontal,
  PenLine,
  SquareCheck,
  ToggleRight,
} from 'lucide-react';

// Static display metadata for all block types (including coming-soon).
// `available` is derived at render time from the plugin registry —
// no manual flag to toggle when a new plugin is implemented.
export const LIVE_SESSION_PLUGIN_BLOCKS = [
  {
    id: 'live_session_rich_text',
    label: 'Rich Text Editor',
    description: 'Edit rich text content.',
    icon: FileText,
  },
  {
    id: 'live_session_true_or_false',
    label: 'True or False',
    description: 'Students decide if a statement is true or false.',
    icon: ToggleRight,
  },
  {
    id: 'live_session_multiple_choice_single',
    label: 'Multiple Choice',
    description: 'Pick one correct answer from several options.',
    icon: CircleDot,
  },
  {
    id: 'live_session_multiple_choice_multiple',
    label: 'Multi-Select',
    description: 'Select all answers that apply.',
    icon: SquareCheck,
  },
  {
    id: 'live_session_fill_in_blank',
    label: 'Fill in the Blank',
    description: 'Complete the sentence or phrase.',
    icon: PenLine,
  },
  {
    id: 'live_session_matching_game',
    label: 'Matching',
    description: 'Match items from two columns.',
    icon: ArrowLeftRight,
  },
  {
    id: 'live_session_swipe_categorize',
    label: 'Swipe & Sort',
    description: 'Drag items into the correct categories.',
    icon: MoveHorizontal,
  },
] as const;

export type LiveSessionPluginBlockId = (typeof LIVE_SESSION_PLUGIN_BLOCKS)[number]['id'];
