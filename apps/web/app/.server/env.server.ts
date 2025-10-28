import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  BASE_URL: z.string().min(1),

  VITE_PUBLIC_SUPABASE_URL: z.string().min(1),
  VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

  SUPABASE_URL: z.string().min(1),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  HONEYPOT_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
});

export const initEnv = () => {
  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    console.error('❌ Invalid environment variables: ', env.error.flatten().fieldErrors);

    throw new Error('Invalid environment variables');
  }

  return env.data;
};

export const getServerEnv = () => initEnv();

export const getClientEnv = () => {
  const serverEnv = getServerEnv();

  return {
    NODE_ENV: serverEnv.NODE_ENV,
    BASE_URL: serverEnv.BASE_URL,
  };
};

export type CLIENT_ENV = ReturnType<typeof getClientEnv>;
type APP_ENV = z.infer<typeof envSchema>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends APP_ENV {}
  }
}
