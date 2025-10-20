import { ENV } from './env.ts';

// ============================================================================
// CLOUDINARY UTILITY FUNCTIONS
// ============================================================================

export interface CloudinaryUploadParams {
  file_data: string;
  file_name: string;
  folder: string;
  isPublic?: boolean; // Default: false = private (authenticated)
}

export interface CloudinaryUploadResponse {
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  url: string;
  secure_url: string;
  [key: string]: any;
}

// ============================================================================
// Cloudinary Secure Upload (private by default)
// ============================================================================
export async function uploadToCloudinary({
  file_data,
  file_name,
  folder,
  isPublic = false,
}: CloudinaryUploadParams): Promise<CloudinaryUploadResponse> {
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary "type" refers to the storage bucket type (usually "upload")
  // "authenticated" access mode controls visibility
  const type = 'upload';
  const access_mode = isPublic ? 'public' : 'authenticated';

  // Generate signature
  const paramsToSign = [
    `access_mode=${access_mode}`,
    `folder=${folder}`,
    `public_id=${file_name}`,
    `timestamp=${timestamp}`,
    `type=${type}`,
  ].join('&');

  const signatureBase = `${paramsToSign}${ENV.CLOUDINARY_API_SECRET}`;
  const signatureBuffer = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(signatureBase),
  );
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Build form data
  const formData = new FormData();
  formData.append('file', file_data);
  formData.append('api_key', ENV.CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', file_name);
  formData.append('type', type);
  formData.append('access_mode', access_mode);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData },
  );

  const json = await res.json();
  if (!res.ok) {
    console.error('[cloudinary] Upload error:', json.error?.message);
    throw new Error(json.error?.message || 'Cloudinary upload failed');
  }

  console.log(`[cloudinary] File uploaded (${access_mode}):`, json.public_id);
  return json;
}

// ----------------------------------------------------------------------------
// Delete File (signed API call)
// ----------------------------------------------------------------------------
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string = 'image',
  type: 'upload' | 'authenticated' = 'authenticated',
): Promise<boolean> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}&type=${type}${ENV.CLOUDINARY_API_SECRET}`;

    const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(stringToSign));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', ENV.CLOUDINARY_API_KEY);
    formData.append('signature', signature);
    formData.append('type', type);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
      { method: 'POST', body: formData },
    );

    const result = await response.json();

    if (!response.ok || result.result !== 'ok') {
      console.error('[cloudinary] Failed to delete:', publicId, result);
      return false;
    }

    console.log('[cloudinary] File deleted:', publicId);
    return true;
  } catch (err) {
    console.error('[cloudinary] Error deleting file:', err);
    return false;
  }
}

// ----------------------------------------------------------------------------
// Generate Signed Delivery URL (authenticated delivery)
// ----------------------------------------------------------------------------
export async function generateSignedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    expiresIn?: number;
    resourceType?: string;
  } = {},
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000) + (options.expiresIn || 3600);
  const resourceType = options.resourceType ?? 'image';

  const transformations: string[] = [];
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  const transformation = transformations.length > 0 ? transformations.join(',') + '/' : '';

  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${ENV.CLOUDINARY_API_SECRET}`;
  const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(stringToSign));
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `https://res.cloudinary.com/${ENV.CLOUDINARY_CLOUD_NAME}/${resourceType}/authenticated/${transformation}v1/${publicId}?api_key=${ENV.CLOUDINARY_API_KEY}&timestamp=${timestamp}&signature=${signature}`;
}

export function getMimeTypeFromFileName(fileName: string, fileType: string): string {
  if (fileType === 'image') return 'image/' + (fileName.split('.').pop() || 'png');
  if (fileType === 'video') return 'video/' + (fileName.split('.').pop() || 'mp4');
  if (fileType === 'audio') return 'audio/' + (fileName.split('.').pop() || 'mp3');
  if (fileType === 'document') return 'application/pdf';
  if (fileType === 'model3d') return 'model/gltf-binary';
  return 'application/octet-stream';
}
