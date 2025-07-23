import { z } from 'zod';

export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime().nullable();
