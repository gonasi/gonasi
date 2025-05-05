import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Converts a date to a relative "time ago" string
 * @param input - A Date object, ISO string, or timestamp
 * @returns A human-readable relative time string (e.g., "2 hours ago")
 */
export function timeAgo(input: string | number | Date): string {
  return dayjs(input).fromNow();
}
