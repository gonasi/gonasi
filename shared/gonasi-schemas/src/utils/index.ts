import { z } from 'zod';

/**
 * Accepts a date string or Date object and ensures RFC 3339 formatting.
 * Compatible with `z.string().datetime()` and fixes common Postgres microsecond issues.
 */
export const safeDateTime = () =>
  z.preprocess((val) => {
    if (typeof val === 'string' || val instanceof Date) {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    }
    return val;
  }, z.string().datetime());
