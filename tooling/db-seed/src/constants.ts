import { faker } from '@snaplet/copycat';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@gonasi/database/schema';

// TODO: env variables
export const supabase = createClient<Database>(
  'http://127.0.0.1:54321',
  // Note you might want to use `SUPABASE_ROLE` key here with `auth.admin.signUp` if your app is using email confirmation
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
);

export const PASSWORD = 'password';

export const SU_EMAIL = 'gonasiapp@gmail.com';

function snakeToCamel(str: string): string {
  return str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase());
}

export function convertKeysToCamelCase<T = any>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = obj[key];
    }
  }

  return result as T;
}

export const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg'];

// Real base64 image data - small valid samples
const base64Images: Record<string, string> = {
  'image/png':
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAF0lEQVQoU2NkYGD4z0ACYGJgYGAYhQAAAVMAAgDVWHP9AAAAAElFTkSuQmCC', // small red dot PNG
  'image/jpeg':
    '/9j/4AAQSkZJRgABAQEAYABgAAD//gAUU29mdHdhcmU6IFNuaXBhc3Rl/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgACgAKAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A95ooooA//9k=', // small valid JPEG
};

// Use Buffer for Node.js environment
const base64ToBlob = (base64: string, type: string) => {
  const buffer = Buffer.from(base64, 'base64');
  return new Blob([buffer], { type });
};

export const generateRealImage = () => {
  const type = faker.helpers.arrayElement(VALID_IMAGE_TYPES) as 'image/png' | 'image/jpeg';
  const base64 = base64Images[type];

  if (!base64) {
    throw new Error(`No base64 data found for type: ${type}`);
  }

  const blob = base64ToBlob(base64, type);
  const name = faker.system.fileName() + (type === 'image/png' ? '.png' : '.jpg');

  return new File([blob], name, { type });
};
