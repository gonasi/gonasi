# Cloudinary Image Upload Guide for New Applications

This guide explains how to implement direct client-to-Cloudinary image uploads in a new application from scratch. It's based on a proven production implementation and can be adapted to any tech stack.

---

## Table of Contents

1. [Why Direct Upload?](#why-direct-upload)
2. [How It Works](#how-it-works)
3. [Architecture Overview](#architecture-overview)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Best Practices](#security-best-practices)
7. [Tech Stack Variations](#tech-stack-variations)
8. [Complete Examples](#complete-examples)

---

## Why Direct Upload?

Traditional file upload (client → server → Cloudinary) has significant limitations:

❌ **Server Memory Issues**: Large files consume server RAM
❌ **Timeout Problems**: Serverless functions have execution time limits
❌ **No Progress Tracking**: Users can't see upload progress
❌ **Poor Scalability**: Server becomes bottleneck

Direct upload (client → Cloudinary) solves all these:

✅ **Zero Server Load**: Files never touch your server
✅ **No Timeouts**: Upload happens directly to Cloudinary
✅ **Real-time Progress**: Track upload percentage
✅ **Infinite Scalability**: Cloudinary handles everything

---

## How It Works

The direct upload pattern uses a **3-phase flow**:

```
┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ 1. REQUEST SIGNATURE
     │    POST /api/images/prepare
     │    { name, fileName, mimeType, size }
     │
     ▼
┌──────────┐
│  SERVER  │
└────┬─────┘
     │
     │ • Validate user permissions
     │ • Generate unique imageId
     │ • Create Cloudinary signature (signed with API secret)
     │
     │ RETURN: { imageId, uploadSignature }
     │
     ▼
┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ 2. DIRECT UPLOAD
     │    POST https://api.cloudinary.com/v1_1/{cloud}/image/upload
     │    FormData: { file, signature, timestamp, public_id, ... }
     │
     ▼
┌─────────────┐
│ CLOUDINARY  │
└──────┬──────┘
       │
       │ • Verify signature
       │ • Process and store image
       │ • Generate transformations
       │
       │ RETURN: { public_id, url, width, height, bytes, ... }
       │
       ▼
┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ 3. CONFIRM UPLOAD
     │    POST /api/images/confirm
     │    { imageId, cloudinaryPublicId, url, width, height, ... }
     │
     ▼
┌──────────┐
│  SERVER  │
└────┬─────┘
     │
     │ • Save image metadata to database
     │ • Link to user/organization/project
     │
     │ RETURN: { success: true }
     │
     ▼
   DONE
```

### Key Points

1. **Phase 1**: Server generates a cryptographically signed upload URL
2. **Phase 2**: Client uploads directly to Cloudinary (server not involved)
3. **Phase 3**: Client notifies server to save metadata in database

---

## Architecture Overview

### Required Components

```
Backend:
├── API Endpoints
│   ├── POST /api/images/prepare    (generates upload signature)
│   └── POST /api/images/confirm    (saves metadata to database)
│
├── Services/Functions
│   ├── generateUploadSignature()   (Cloudinary SDK)
│   ├── validateUserPermissions()   (your auth logic)
│   └── saveImageMetadata()         (database logic)
│
└── Database Table
    └── images (id, name, url, width, height, user_id, etc.)

Frontend:
├── UI Component
│   └── ImageUploadForm             (file input + form handling)
│
├── Upload Logic
│   ├── validateImageFile()         (client-side validation)
│   ├── uploadToCloudinary()        (direct upload with progress)
│   └── confirmUpload()             (notify server)
│
└── State Management
    ├── uploadProgress              (0-100%)
    └── uploadStatus                (idle, uploading, success, error)
```

---

## Backend Implementation

### Step 1: Set Up Cloudinary

```bash
npm install cloudinary
```

**Environment Variables** (`.env`):
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Initialize Cloudinary** (e.g., `lib/cloudinary.ts`):
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
```

---

### Step 2: Prepare Upload Endpoint

**Purpose**: Generate a signed upload URL that the client can use.

**API Endpoint**: `POST /api/images/prepare`

**Request Body**:
```json
{
  "name": "My Photo",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1048576
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "imageId": "550e8400-e29b-41d4-a716-446655440000",
    "uploadSignature": {
      "signature": "a1b2c3d4...",
      "timestamp": 1678901234,
      "cloudName": "your_cloud",
      "apiKey": "123456789",
      "publicId": "images/550e8400-e29b-41d4-a716-446655440000",
      "tags": "image,user_123"
    }
  }
}
```

**Implementation** (Node.js/Express example):

```typescript
// POST /api/images/prepare
import cloudinary from '../lib/cloudinary';
import { validateImageFile, generateImageId } from '../utils';
import { getUserFromRequest } from '../auth';

export async function prepareImageUpload(req, res) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 2. Extract and validate request data
    const { name, fileName, mimeType, size } = req.body;

    // Validate it's an image
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
      });
    }

    // Validate size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Image must be under 10MB'
      });
    }

    // 3. Generate unique image ID
    const imageId = generateImageId(); // e.g., crypto.randomUUID()

    // 4. Generate Cloudinary public_id (storage path)
    const publicId = `images/${user.id}/${imageId}`;

    // 5. Create signature for upload
    const timestamp = Math.round(Date.now() / 1000);

    const signatureParams = {
      timestamp,
      public_id: publicId,
      type: 'authenticated',  // IMPORTANT: Private uploads
      overwrite: true,
      invalidate: true,
    };

    // Generate signature using Cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(
      signatureParams,
      process.env.CLOUDINARY_API_SECRET
    );

    // 6. Return upload credentials
    return res.json({
      success: true,
      data: {
        imageId,
        uploadSignature: {
          signature,
          timestamp,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY,
          publicId,
          tags: `image,user_${user.id}`,
        }
      }
    });

  } catch (error) {
    console.error('Prepare upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to prepare upload'
    });
  }
}
```

---

### Step 3: Confirm Upload Endpoint

**Purpose**: Save image metadata to your database after successful upload.

**API Endpoint**: `POST /api/images/confirm`

**Request Body**:
```json
{
  "imageId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Photo",
  "fileName": "photo.jpg",
  "cloudinaryPublicId": "images/user_123/550e8400-e29b-41d4-a716-446655440000",
  "url": "https://res.cloudinary.com/...",
  "size": 1048576,
  "mimeType": "image/jpeg",
  "width": 1920,
  "height": 1080
}
```

**Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully"
}
```

**Implementation**:

```typescript
// POST /api/images/confirm
import { db } from '../lib/database';
import { getUserFromRequest } from '../auth';

export async function confirmImageUpload(req, res) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 2. Extract upload data
    const {
      imageId,
      name,
      fileName,
      cloudinaryPublicId,
      url,
      size,
      mimeType,
      width,
      height
    } = req.body;

    // 3. Save to database
    await db.images.insert({
      id: imageId,
      user_id: user.id,
      name,
      file_name: fileName,
      cloudinary_public_id: cloudinaryPublicId,
      url,
      size,
      mime_type: mimeType,
      width,
      height,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Return success
    return res.json({
      success: true,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Confirm upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm upload'
    });
  }
}
```

---

### Step 4: Database Schema

**SQL Example** (PostgreSQL):

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  cloudinary_public_id VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at);
```

**MongoDB Example**:

```javascript
const imageSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  fileName: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
}, { timestamps: true });

export const Image = mongoose.model('Image', imageSchema);
```

---

## Frontend Implementation

### Step 1: Upload Utility Function

**File**: `utils/uploadImage.ts`

```typescript
export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  publicId: string;
  tags?: string;
}

export interface CloudinaryResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
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

/**
 * Upload an image directly to Cloudinary using XMLHttpRequest for progress tracking
 */
export function uploadImageToCloudinary(
  file: File,
  signature: UploadSignature,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryResponse> {
  return new Promise((resolve, reject) => {
    // Build upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('public_id', signature.publicId);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('api_key', signature.apiKey);
    formData.append('type', 'authenticated');
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true');

    if (signature.tags) {
      formData.append('tags', signature.tags);
    }

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100)
        });
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || `Upload failed`));
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

    // Send request
    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Validate that a file is an image and meets size requirements
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file size
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image size (${fileSizeMB.toFixed(2)} MB) exceeds ${maxSizeMB} MB limit`
    };
  }

  // Check if it's an image
  const isImage = file.type.startsWith('image/');
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  const hasImageExtension = extension && imageExtensions.includes(extension);

  if (!isImage && !hasImageExtension) {
    return {
      valid: false,
      error: `File must be an image (${imageExtensions.join(', ')})`
    };
  }

  return { valid: true };
}
```

---

### Step 2: Upload Component (React Example)

**File**: `components/ImageUpload.tsx`

```typescript
import React, { useState } from 'react';
import { uploadImageToCloudinary, validateImageFile } from '../utils/uploadImage';

export function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-populate name from filename
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(fileName);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select an image');
      return;
    }

    // Validate image
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setStatus('uploading');
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Prepare upload (get signature from server)
      const prepareResponse = await fetch('/api/images/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          fileName: file.name,
          mimeType: file.type,
          size: file.size
        })
      });

      const prepareResult = await prepareResponse.json();

      if (!prepareResult.success) {
        throw new Error(prepareResult.message || 'Failed to prepare upload');
      }

      const { imageId, uploadSignature } = prepareResult.data;

      // Step 2: Upload directly to Cloudinary
      const cloudinaryResponse = await uploadImageToCloudinary(
        file,
        uploadSignature,
        (progress) => setUploadProgress(progress.percentage)
      );

      // Step 3: Confirm upload (save to database)
      const confirmResponse = await fetch('/api/images/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          name,
          fileName: file.name,
          cloudinaryPublicId: cloudinaryResponse.public_id,
          url: cloudinaryResponse.secure_url,
          size: cloudinaryResponse.bytes,
          mimeType: file.type,
          width: cloudinaryResponse.width,
          height: cloudinaryResponse.height
        })
      });

      const confirmResult = await confirmResponse.json();

      if (!confirmResult.success) {
        throw new Error(confirmResult.message || 'Failed to confirm upload');
      }

      // Success!
      setStatus('success');
      setUploadProgress(100);

      // Reset form
      setTimeout(() => {
        setFile(null);
        setName('');
        setUploadProgress(0);
        setStatus('idle');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <label htmlFor="file" className="block text-sm font-medium mb-2">
          Select Image
        </label>
        <input
          id="file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={status === 'uploading'}
          className="block w-full text-sm"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Image Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === 'uploading'}
          required
          className="block w-full px-3 py-2 border rounded"
        />
      </div>

      {status === 'uploading' && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {status === 'success' && (
        <div className="text-green-600 text-sm">Upload successful!</div>
      )}

      <button
        type="submit"
        disabled={status === 'uploading' || !file}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload Image'}
      </button>
    </form>
  );
}
```

---

## Security Best Practices

### 1. **Authenticated Uploads Only**

Always use `type: 'authenticated'` when generating signatures:

```typescript
const signatureParams = {
  timestamp,
  public_id: publicId,
  type: 'authenticated',  // ✅ Files are private, not public
  // ...
};
```

This ensures images are stored privately and require signed URLs to access.

---

### 2. **Validate on Both Client AND Server**

**Client-side** (UX - fast feedback):
```typescript
const validation = validateImageFile(file, 10);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

**Server-side** (Security - enforce rules):
```typescript
if (!mimeType.startsWith('image/')) {
  return res.status(400).json({ error: 'Only images allowed' });
}
if (size > 10 * 1024 * 1024) {
  return res.status(400).json({ error: 'Image too large' });
}
```

---

### 3. **User Authorization**

Always verify user has permission to upload:

```typescript
// In prepare endpoint
const user = await getUserFromRequest(req);
if (!user) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// Optional: Check user's upload quota
const userQuota = await db.getUserUploadQuota(user.id);
if (userQuota.used + size > userQuota.limit) {
  return res.status(403).json({ error: 'Storage quota exceeded' });
}
```

---

### 4. **Signature Expiration**

Signatures are time-based and expire quickly:

```typescript
const timestamp = Math.round(Date.now() / 1000);
// Cloudinary validates timestamp is recent (usually within 1 hour)
```

If a signature is too old, Cloudinary will reject the upload.

---

### 5. **Public ID Isolation**

Organize files by user to prevent conflicts:

```typescript
const publicId = `images/${userId}/${imageId}`;
// ✅ Each user's images are isolated
// ✅ Prevents one user from overwriting another's images
```

---

### 6. **Rate Limiting**

Add rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many uploads, please try again later'
});

app.post('/api/images/prepare', uploadLimiter, prepareImageUpload);
```

---

## Tech Stack Variations

### Next.js (App Router)

**API Route**: `app/api/images/prepare/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, fileName, mimeType, size } = await req.json();

  // ... generate signature ...

  return NextResponse.json({ success: true, data: { imageId, uploadSignature } });
}
```

---

### Remix

**Action**: `app/routes/api.images.prepare.tsx`

```typescript
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '~/auth.server';
import cloudinary from '~/lib/cloudinary.server';

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { name, fileName, mimeType, size } = await request.json();

  // ... generate signature ...

  return json({ success: true, data: { imageId, uploadSignature } });
}
```

---

### SvelteKit

**API Route**: `src/routes/api/images/prepare/+server.ts`

```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import cloudinary from '$lib/cloudinary';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const { name, fileName, mimeType, size } = await request.json();

  // ... generate signature ...

  return json({ success: true, data: { imageId, uploadSignature } });
};
```

---

### Django (Python)

**View**: `views.py`

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import cloudinary
import cloudinary.utils
import json
import time
import uuid

@csrf_exempt
def prepare_image_upload(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    data = json.loads(request.body)
    name = data['name']
    file_name = data['fileName']
    mime_type = data['mimeType']
    size = data['size']

    # Validate image
    if not mime_type.startswith('image/'):
        return JsonResponse({'error': 'Only images allowed'}, status=400)

    # Generate signature
    image_id = str(uuid.uuid4())
    public_id = f"images/{request.user.id}/{image_id}"
    timestamp = int(time.time())

    params_to_sign = {
        'timestamp': timestamp,
        'public_id': public_id,
        'type': 'authenticated',
        'overwrite': True,
        'invalidate': True,
    }

    signature = cloudinary.utils.api_sign_request(
        params_to_sign,
        cloudinary.config().api_secret
    )

    return JsonResponse({
        'success': True,
        'data': {
            'imageId': image_id,
            'uploadSignature': {
                'signature': signature,
                'timestamp': timestamp,
                'cloudName': cloudinary.config().cloud_name,
                'apiKey': cloudinary.config().api_key,
                'publicId': public_id,
            }
        }
    })
```

---

### Ruby on Rails

**Controller**: `app/controllers/api/images_controller.rb`

```ruby
class Api::ImagesController < ApplicationController
  before_action :authenticate_user!

  def prepare
    name = params[:name]
    file_name = params[:fileName]
    mime_type = params[:mimeType]
    size = params[:size]

    # Validate image
    unless mime_type.start_with?('image/')
      return render json: { error: 'Only images allowed' }, status: 400
    end

    # Generate signature
    image_id = SecureRandom.uuid
    public_id = "images/#{current_user.id}/#{image_id}"
    timestamp = Time.now.to_i

    params_to_sign = {
      timestamp: timestamp,
      public_id: public_id,
      type: 'authenticated',
      overwrite: true,
      invalidate: true
    }

    signature = Cloudinary::Utils.api_sign_request(
      params_to_sign,
      Cloudinary.config.api_secret
    )

    render json: {
      success: true,
      data: {
        imageId: image_id,
        uploadSignature: {
          signature: signature,
          timestamp: timestamp,
          cloudName: Cloudinary.config.cloud_name,
          apiKey: Cloudinary.config.api_key,
          publicId: public_id
        }
      }
    }
  end
end
```

---

## Complete Examples

### Vue 3 + Vite + Express

**Frontend** (`src/components/ImageUpload.vue`):

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { uploadImageToCloudinary, validateImageFile } from '@/utils/uploadImage';

const file = ref<File | null>(null);
const name = ref('');
const uploadProgress = ref(0);
const status = ref<'idle' | 'uploading' | 'success' | 'error'>('idle');
const error = ref<string | null>(null);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (selectedFile) {
    file.value = selectedFile;
    name.value = selectedFile.name.replace(/\.[^/.]+$/, '');
  }
};

const handleUpload = async () => {
  if (!file.value) return;

  const validation = validateImageFile(file.value, 10);
  if (!validation.valid) {
    error.value = validation.error || 'Invalid file';
    return;
  }

  status.value = 'uploading';
  error.value = null;

  try {
    // Prepare
    const prepareRes = await fetch('/api/images/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        fileName: file.value.name,
        mimeType: file.value.type,
        size: file.value.size
      })
    });
    const { data } = await prepareRes.json();

    // Upload
    const cloudinaryRes = await uploadImageToCloudinary(
      file.value,
      data.uploadSignature,
      (progress) => uploadProgress.value = progress.percentage
    );

    // Confirm
    await fetch('/api/images/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId: data.imageId,
        name: name.value,
        fileName: file.value.name,
        cloudinaryPublicId: cloudinaryRes.public_id,
        url: cloudinaryRes.secure_url,
        size: cloudinaryRes.bytes,
        mimeType: file.value.type,
        width: cloudinaryRes.width,
        height: cloudinaryRes.height
      })
    });

    status.value = 'success';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed';
    status.value = 'error';
  }
};
</script>

<template>
  <form @submit.prevent="handleUpload" class="space-y-4">
    <div>
      <label>Select Image</label>
      <input
        type="file"
        accept="image/*"
        @change="handleFileChange"
        :disabled="status === 'uploading'"
      />
    </div>

    <div>
      <label>Image Name</label>
      <input
        v-model="name"
        type="text"
        :disabled="status === 'uploading'"
        required
      />
    </div>

    <div v-if="status === 'uploading'">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${uploadProgress}%` }" />
      </div>
      <p>Uploading: {{ uploadProgress }}%</p>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="status === 'success'" class="success">Upload successful!</div>

    <button type="submit" :disabled="status === 'uploading' || !file">
      {{ status === 'uploading' ? 'Uploading...' : 'Upload Image' }}
    </button>
  </form>
</template>
```

---

### Angular + NestJS

**Backend** (`src/images/images.controller.ts`):

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImagesService } from './images.service';

@Controller('api/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('prepare')
  @UseGuards(AuthGuard('jwt'))
  async prepare(@Body() dto: PrepareUploadDto, @Request() req) {
    return this.imagesService.prepareUpload(req.user.id, dto);
  }

  @Post('confirm')
  @UseGuards(AuthGuard('jwt'))
  async confirm(@Body() dto: ConfirmUploadDto, @Request() req) {
    return this.imagesService.confirmUpload(req.user.id, dto);
  }
}
```

**Frontend** (`src/app/image-upload/image-upload.component.ts`):

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uploadImageToCloudinary } from '../utils/uploadImage';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html'
})
export class ImageUploadComponent {
  file: File | null = null;
  name = '';
  uploadProgress = 0;
  status: 'idle' | 'uploading' | 'success' | 'error' = 'idle';

  constructor(private http: HttpClient) {}

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.file = target.files?.[0] || null;
    if (this.file) {
      this.name = this.file.name.replace(/\.[^/.]+$/, '');
    }
  }

  async onUpload() {
    if (!this.file) return;

    this.status = 'uploading';

    try {
      // Prepare
      const prepareRes = await this.http.post<any>('/api/images/prepare', {
        name: this.name,
        fileName: this.file.name,
        mimeType: this.file.type,
        size: this.file.size
      }).toPromise();

      // Upload
      const cloudinaryRes = await uploadImageToCloudinary(
        this.file,
        prepareRes.data.uploadSignature,
        (progress) => this.uploadProgress = progress.percentage
      );

      // Confirm
      await this.http.post('/api/images/confirm', {
        imageId: prepareRes.data.imageId,
        name: this.name,
        fileName: this.file.name,
        cloudinaryPublicId: cloudinaryRes.public_id,
        url: cloudinaryRes.secure_url,
        size: cloudinaryRes.bytes,
        mimeType: this.file.type,
        width: cloudinaryRes.width,
        height: cloudinaryRes.height
      }).toPromise();

      this.status = 'success';
    } catch (error) {
      this.status = 'error';
    }
  }
}
```

---

## Testing Guide

### Unit Tests

**Test Upload Signature Generation**:

```typescript
import { describe, it, expect } from 'vitest';
import { generateUploadSignature } from './utils';

describe('generateUploadSignature', () => {
  it('should generate valid signature', () => {
    const result = generateUploadSignature({
      userId: 'user_123',
      imageId: 'img_456',
      fileName: 'photo.jpg'
    });

    expect(result.signature).toBeDefined();
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.publicId).toContain('user_123');
    expect(result.publicId).toContain('img_456');
  });
});
```

**Test File Validation**:

```typescript
describe('validateImageFile', () => {
  it('should reject files over size limit', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });

    const result = validateImageFile(largeFile, 10);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should accept valid images', () => {
    const validFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

    const result = validateImageFile(validFile, 10);

    expect(result.valid).toBe(true);
  });
});
```

---

### Integration Tests

**Test Full Upload Flow**:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { uploadImage } from './uploadImage';

describe('Image Upload Flow', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });
    const { token } = await loginRes.json();
    authToken = token;
  });

  it('should upload image successfully', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const result = await uploadImage(file, 'Test Image', authToken);

    expect(result.success).toBe(true);
    expect(result.imageId).toBeDefined();
    expect(result.url).toContain('cloudinary.com');
  });
});
```

---

## Summary

This guide provides a complete, production-ready pattern for implementing Cloudinary image uploads in any new application:

✅ **3-Phase Flow**: Prepare → Upload → Confirm
✅ **Direct Upload**: Client uploads directly to Cloudinary
✅ **Progress Tracking**: Real-time upload progress
✅ **Security**: Authenticated uploads, server-side validation
✅ **Framework Agnostic**: Works with any tech stack
✅ **Battle-Tested**: Based on production implementation

### Key Takeaways

1. **Never send files through your server** - use direct upload
2. **Always validate on both client and server** - security + UX
3. **Use `type: 'authenticated'`** - keep images private
4. **Track progress with XMLHttpRequest** - better UX
5. **Save metadata after upload** - maintain database consistency

Adapt the code examples to your specific tech stack and requirements!
