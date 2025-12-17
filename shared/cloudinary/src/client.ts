import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Initializes the Cloudinary SDK with the provided configuration.
 * Should be called once at application startup (e.g., in root loader).
 *
 * @param config - Cloudinary configuration containing cloud_name, api_key, and api_secret
 */
export function initCloudinary(config: CloudinaryConfig): void {
  if (isConfigured) {
    console.warn('[Cloudinary] Already initialized. Skipping re-initialization.');
    return;
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true, // Always use HTTPS
  });

  isConfigured = true;
  console.log('[Cloudinary] Initialized successfully');
}

/**
 * Returns the configured Cloudinary instance.
 * Throws an error if Cloudinary has not been initialized.
 *
 * @returns Cloudinary v2 instance
 * @throws Error if initCloudinary has not been called
 */
export function getCloudinary() {
  if (!isConfigured) {
    throw new Error('[Cloudinary] Not initialized. Call initCloudinary() first.');
  }
  return cloudinary;
}

export type CloudinaryClient = typeof cloudinary;
