import { z } from 'zod';

import { safeDateTime } from '../../../utils';

export const UUIDSchema = z.string().uuid();
export const TimestampSchema = safeDateTime().nullable();
