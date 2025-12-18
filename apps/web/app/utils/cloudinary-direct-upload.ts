import type { UploadSignature } from '@gonasi/cloudinary';

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DirectUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

/**
 * Uploads a file directly from the browser to Cloudinary using a signed upload URL.
 *
 * BENEFITS:
 * - Bypasses your server completely (no timeout/memory issues)
 * - Supports large files (100MB+)
 * - Progress tracking
 * - Resumable uploads (with signal for cancellation)
 *
 * USAGE:
 * ```typescript
 * // 1. Get upload signature from your server
 * const { fileId, uploadSignature } = await prepareFileUpload({...});
 *
 * // 2. Upload directly to Cloudinary
 * const result = await uploadToCloudinaryDirect(file, uploadSignature, {
 *   onProgress: (progress) => {
 *     console.log(`${progress.percentage}% uploaded`);
 *   }
 * });
 *
 * // 3. Confirm upload with your server
 * await confirmFileUpload({ fileId, ...result });
 * ```
 *
 * @param file - File to upload
 * @param signature - Signed upload parameters from server
 * @param options - Upload options (progress callback, abort signal)
 * @returns Cloudinary upload response
 */
export async function uploadToCloudinaryDirect(
  file: File,
  signature: UploadSignature,
  options: DirectUploadOptions = {},
): Promise<CloudinaryUploadResponse> {
  const { onProgress, signal } = options;

  // Build upload URL
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType || 'auto'}/upload`;

  // Build form data with signed parameters
  // IMPORTANT: Must include ALL parameters that were signed
  const formData = new FormData();

  formData.append('file', file);
  formData.append('public_id', signature.publicId);
  formData.append('timestamp', signature.timestamp.toString());
  formData.append('signature', signature.signature);
  formData.append('api_key', signature.apiKey);
  formData.append('type', 'authenticated'); // CRITICAL: Private file storage
  formData.append('invalidate', 'true');
  // Note: resource_type is in URL path, not a form parameter

  if (signature.tags) {
    formData.append('tags', signature.tags);
  }

  if (signature.context) {
    formData.append('context', signature.context);
  }

  // Note: max_bytes is sent but NOT signed (it's a constraint only)
  if (signature.maxBytes) {
    formData.append('max_bytes', signature.maxBytes.toString());
  }

  // Upload with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(
            new Error(errorResponse.error?.message || `Upload failed with status ${xhr.status}`),
          );
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Send request
    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Validates that a file meets size and type requirements.
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {},
): { valid: boolean; error?: string } {
  const { maxSizeMB = 100, allowedTypes, allowedExtensions } = options;

  // Check file size
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(2)} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    };
  }

  // Check file type (supports wildcards like 'image/*')
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((allowedType) => {
      // Exact match
      if (allowedType === file.type) return true;

      // Wildcard match (e.g., 'image/*' matches 'image/png')
      if (allowedType.endsWith('/*')) {
        const prefix = allowedType.slice(0, -2);
        return file.type.startsWith(`${prefix}/`);
      }

      return false;
    });

    // If MIME type validation failed, try extension validation for binary files
    if (!isAllowed) {
      // Extract file extension
      const extension = file.name.split('.').pop()?.toLowerCase();

      // If file has no MIME type or is application/octet-stream, check extension
      if ((!file.type || file.type === 'application/octet-stream') && extension && allowedExtensions) {
        const isExtensionAllowed = allowedExtensions.includes(extension);
        if (isExtensionAllowed) {
          return { valid: true };
        }
      }

      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}
