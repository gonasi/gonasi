# Cloudinary Direct Upload Implementation Guide

## Problem Solved

**Before**: Large file uploads (>50MB) fail on Vercel due to:

- ⏱️ **Timeout**: Serverless functions have 10-60s limits
- 💾 **Memory**: Files loaded entirely into server memory
- 🐌 **Slow**: Client → Vercel → Cloudinary (double upload time)

**After**: Files upload directly from browser to Cloudinary:

- ✅ **No timeouts**: Upload happens outside serverless function
- ✅ **No memory issues**: File never touches your server
- ✅ **Fast**: Direct client → Cloudinary upload
- ✅ **Progress tracking**: Real-time upload progress
- ✅ **Large files**: Supports 100MB+ files

## Architecture

```
┌─────────┐                                    ┌──────────┐
│ Browser │                                    │  Vercel  │
└────┬────┘                                    └────┬─────┘
     │                                              │
     │ 1. Request upload signature                 │
     ├─────────────────────────────────────────────>│
     │                                              │
     │ 2. Return signed params (fileId + signature)│
     │<─────────────────────────────────────────────┤
     │                                              │
     │                                         ┌────┴────┐
     │ 3. Upload file directly                 │Cloudinary│
     ├────────────────────────────────────────>│         │
     │                                          └────┬────┘
     │ 4. Upload response (publicId, URL, etc.)     │
     │<─────────────────────────────────────────────┤
     │                                              │
     │ 5. Confirm upload (save to database)        │
     ├─────────────────────────────────────────────>│
     │                                              │
     │ 6. Success                                   │
     │<─────────────────────────────────────────────┤
     │                                              │
```

## Server-Side Setup

### 1. Prepare Upload (Server Action)

```typescript
// apps/web/app/routes/api/files/prepare-upload.ts
import { prepareFileUpload } from '@gonasi/database/files';
import { createClient } from '~/utils/supabase.server';

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  const result = await prepareFileUpload(supabase, {
    name: formData.get('name') as string,
    mimeType: formData.get('mimeType') as string,
    size: Number(formData.get('size')),
    courseId: formData.get('courseId') as string,
    organizationId: formData.get('organizationId') as string,
  });

  return json(result, { headers });
}
```

### 2. Confirm Upload (Server Action)

```typescript
// apps/web/app/routes/api/files/confirm-upload.ts
import { confirmFileUpload } from '@gonasi/database/files';
import { createClient } from '~/utils/supabase.server';

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  const result = await confirmFileUpload(supabase, {
    fileId: formData.get('fileId') as string,
    name: formData.get('name') as string,
    courseId: formData.get('courseId') as string,
    organizationId: formData.get('organizationId') as string,
    cloudinaryPublicId: formData.get('cloudinaryPublicId') as string,
    size: Number(formData.get('size')),
    mimeType: formData.get('mimeType') as string,
  });

  return json(result, { headers });
}
```

## Client-Side Implementation

### React Component Example

```typescript
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { uploadToCloudinaryDirect, validateFile } from '~/utils/cloudinary-direct-upload';

export function FileUploadComponent({ courseId, organizationId }: Props) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const prepareFetcher = useFetcher();
  const confirmFetcher = useFetcher();

  async function handleFileUpload(file: File) {
    // 1. Validate file
    const validation = validateFile(file, {
      maxSizeMB: 100,
      allowedTypes: ['image/*', 'video/*', 'application/pdf'],
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);

    try {
      // 2. Prepare upload - get signed parameters from server
      const prepareFormData = new FormData();
      prepareFormData.append('name', file.name);
      prepareFormData.append('mimeType', file.type);
      prepareFormData.append('size', file.size.toString());
      prepareFormData.append('courseId', courseId);
      prepareFormData.append('organizationId', organizationId);

      prepareFetcher.submit(prepareFormData, {
        method: 'POST',
        action: '/api/files/prepare-upload',
      });

      // Wait for prepare response
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (prepareFetcher.data && prepareFetcher.state === 'idle') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      const prepareResult = prepareFetcher.data;
      if (!prepareResult.success) {
        throw new Error(prepareResult.message);
      }

      const { fileId, uploadSignature } = prepareResult.data;

      // 3. Upload directly to Cloudinary
      const cloudinaryResponse = await uploadToCloudinaryDirect(
        file,
        uploadSignature,
        {
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
          },
        },
      );

      // 4. Confirm upload with server
      const confirmFormData = new FormData();
      confirmFormData.append('fileId', fileId);
      confirmFormData.append('name', file.name);
      confirmFormData.append('courseId', courseId);
      confirmFormData.append('organizationId', organizationId);
      confirmFormData.append('cloudinaryPublicId', cloudinaryResponse.public_id);
      confirmFormData.append('size', cloudinaryResponse.bytes.toString());
      confirmFormData.append('mimeType', file.type);

      confirmFetcher.submit(confirmFormData, {
        method: 'POST',
        action: '/api/files/confirm-upload',
      });

      // Wait for confirmation
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (confirmFetcher.data && confirmFetcher.state === 'idle') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      const confirmResult = confirmFetcher.data;
      if (!confirmResult.success) {
        throw new Error(confirmResult.message);
      }

      alert('File uploaded successfully!');
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
}
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

Keep both upload methods and use feature flags:

```typescript
const USE_DIRECT_UPLOAD = process.env.ENABLE_DIRECT_UPLOAD === 'true';

if (USE_DIRECT_UPLOAD) {
  // Use new direct upload flow
  await handleDirectUpload(file);
} else {
  // Use old server-proxied upload
  await createFile(supabase, { file, ... });
}
```

### Option 2: Full Cutover

1. Deploy new code with direct upload functions
2. Update all file upload UI components to use direct upload
3. Remove old `createFile` proxied upload (keep for backwards compatibility)

## Benefits Summary

| Metric                | Before (Proxied)              | After (Direct)             |
| --------------------- | ----------------------------- | -------------------------- |
| **Max file size**     | ~50MB (Vercel limit)          | 100MB+ (Cloudinary limit)  |
| **Upload time**       | 2x (client→server→cloudinary) | 1x (client→cloudinary)     |
| **Server memory**     | Full file in RAM              | ~1KB (metadata only)       |
| **Timeout risk**      | High (>60s fails)             | None (happens client-side) |
| **Progress tracking** | ❌ Not possible               | ✅ Real-time progress      |
| **Resumable**         | ❌ No                         | ✅ Via AbortSignal         |

## Security Notes

- ✅ **Signed uploads**: Signature expires and is single-use
- ✅ **Storage quota**: Checked BEFORE generating signature
- ✅ **Private files**: `type: 'authenticated'` ensures files are private
- ✅ **Size limits**: Enforced in signature (`max_bytes` parameter)
- ✅ **File types**: Validated client-side and via signature

## Testing Checklist

- [ ] Small files (<10MB) upload successfully
- [ ] Large files (>50MB) upload without timeout
- [ ] Progress bar updates smoothly
- [ ] Upload can be cancelled (AbortSignal)
- [ ] Storage quota is enforced
- [ ] Invalid file types are rejected
- [ ] Network errors are handled gracefully
- [ ] Database records created correctly

## Troubleshooting

### Issue: "Signature invalid"

- **Cause**: Clock skew between server and Cloudinary
- **Fix**: Ensure server time is synced (NTP)

### Issue: "Max file size exceeded"

- **Cause**: File larger than `max_bytes` in signature
- **Fix**: Increase buffer in `prepareFileUpload` (line 93)

### Issue: Upload completes but database insert fails

- **Cause**: Cloudinary upload succeeded but `confirmFileUpload` failed
- **Fix**: File is in Cloudinary but not in database - need to implement cleanup or retry logic
