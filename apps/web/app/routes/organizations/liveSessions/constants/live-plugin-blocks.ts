import {
  ArrowLeftRight,
  CircleDot,
  MoveHorizontal,
  PenLine,
  SquareCheck,
  ToggleRight,
} from 'lucide-react';

// Static display metadata for all block types (including coming-soon).
// `available` is derived at render time from the plugin registry —
// no manual flag to toggle when a new plugin is implemented.
export const LIVE_PLUGIN_BLOCKS = [
  {
    id: 'true_or_false',
    label: 'True or False',
    description: 'Students decide if a statement is true or false.',
    icon: ToggleRight,
  },
  {
    id: 'multiple_choice_single',
    label: 'Multiple Choice',
    description: 'Pick one correct answer from several options.',
    icon: CircleDot,
  },
  {
    id: 'multiple_choice_multiple',
    label: 'Multi-Select',
    description: 'Select all answers that apply.',
    icon: SquareCheck,
  },
  {
    id: 'fill_in_blank',
    label: 'Fill in the Blank',
    description: 'Complete the sentence or phrase.',
    icon: PenLine,
  },
  {
    id: 'matching_game',
    label: 'Matching',
    description: 'Match items from two columns.',
    icon: ArrowLeftRight,
  },
  {
    id: 'swipe_categorize',
    label: 'Swipe & Sort',
    description: 'Drag items into the correct categories.',
    icon: MoveHorizontal,
  },
] as const;

export type LivePluginBlockId = (typeof LIVE_PLUGIN_BLOCKS)[number]['id'];
