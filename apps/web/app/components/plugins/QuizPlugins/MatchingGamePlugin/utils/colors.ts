/**
 * Color palette for matching game pairs
 * Each matched pair gets a unique color to visually show the connection
 */

export const MATCH_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700' },
  { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700' },
] as const;

export type MatchColor = (typeof MATCH_COLORS)[number];

/**
 * Get a color for a matched pair by index
 * Colors cycle if more than 10 pairs
 */
export function getMatchColor(matchIndex: number): MatchColor {
  return MATCH_COLORS[matchIndex % MATCH_COLORS.length]!;
}
