/**
 * Centralized environment variable loader for Supabase Edge Functions.
 * Ensures that all required environment variables are present at runtime.
 * This prevents silent failures due to missing keys or misconfigurations.
 */
function requireEnv(key: string, defaultValue?: string): string {
  const value = Deno.env.get(key) ?? defaultValue;
  if (!value || value.trim() === '') {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  // 🌐 Supabase configuration
  SUPABASE_URL: requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: requireEnv('SUPABASE_ANON_KEY'),

  // 💳 Payment and external integrations
  PAYSTACK_SECRET_KEY: requireEnv('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY: requireEnv('PAYSTACK_PUBLIC_KEY'),

  // 📬 Email or notification services
  RESEND_API_KEY: requireEnv('RESEND_API_KEY'),

  // 🪩 Frontend or app configuration
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  APP_ENV: Deno.env.get('APP_ENV') ?? 'development',

  // ☁️ Cloudinary configuration for media uploads
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),
};
