import { Suspense, useState } from 'react';
import { AlertCircle, FileIcon, Volume2 } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';
import type { CardDisplaySettingsSchemaTypes } from '@gonasi/schemas/plugins';

import { ModelPreviewCard } from '~/components/file-renderers/preview-cards/model-preview-card';
import { Spinner } from '~/components/loaders';
import { cn } from '~/lib/utils';

interface FileWithSignedUrl {
  id: string;
  name: string;
  signed_url: string;
  file_type: FileType;
  extension: string;
  blur_url?: string | null;
  settings?: any;
}

interface AssetRendererProps {
  file: FileWithSignedUrl;
  displaySettings?: CardDisplaySettingsSchemaTypes;
}

/**
 * Error fallback component for 3D model loading failures
 */
function Model3DError({ fileName, error }: { fileName: string; error?: string }) {
  return (
    <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4'>
      <AlertCircle className='text-destructive h-12 w-12' />
      <p className='text-center text-sm font-medium'>{fileName}</p>
      <p className='text-destructive text-center text-xs'>{error || 'Failed to load 3D model'}</p>
    </div>
  );
}

/**
 * Error boundary wrapper for 3D models using functional approach
 */
function Model3DWrapper({ file }: { file: FileWithSignedUrl }) {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return <Model3DError fileName={file.name} error={error} />;
  }

  return (
    <Suspense
      fallback={
        <div className='flex h-full flex-col items-center justify-center gap-2'>
          <Spinner />
          <p className='text-muted-foreground text-xs'>Loading 3D model...</p>
          <p className='text-muted-foreground text-xs italic'>{file.name}</p>
        </div>
      }
    >
      <ModelPreviewCard
        file={file}
        onError={(err: Error) => {
          console.error('[AssetRenderer] 3D Model Error:', err);
          setError(err.message || 'Unknown error occurred');
        }}
      />
    </Suspense>
  );
}

/**
 * Shared AssetRenderer component for rendering media assets across all plugins
 *
 * Used by:
 * - SwipeCategorizePlugin
 * - MatchingGamePlugin
 * - StepByStepRevealPlugin
 * - Any other plugins that need to render media assets
 */
export function AssetRenderer({ file, displaySettings }: AssetRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { objectFit, aspectRatio, noBorder } = displaySettings ?? {};

  // Apply defaults
  const finalObjectFit = objectFit ?? 'contain';
  const finalAspectRatio = aspectRatio ?? 'auto';
  const finalNoBorder = noBorder ?? false;

  const commonStyles: React.CSSProperties = {
    objectFit: finalObjectFit,
    aspectRatio: finalAspectRatio === 'auto' ? undefined : finalAspectRatio,
  };

  if (hasError) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 p-4'>
        <FileIcon size={48} />
        <p className='text-sm'>Failed to load asset</p>
      </div>
    );
  }

  switch (file.file_type) {
    case FileType.IMAGE:
      return (
        <div className='relative h-full w-full'>
          {/* Blur placeholder while loading */}
          {file.blur_url && !imageLoaded && (
            <div
              className='absolute inset-0 h-full w-full'
              style={{
                backgroundImage: `url(${file.blur_url})`,
                backgroundSize: objectFit,
                backgroundPosition: 'center',
                zIndex: 1,
              }}
            />
          )}
          {/* Main image */}
          <img
            src={file.signed_url}
            alt={file.name}
            className={cn('h-full w-full', finalNoBorder && 'rounded-none')}
            style={{ ...commonStyles, zIndex: 2 }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
            loading='lazy'
            crossOrigin='anonymous'
          />
        </div>
      );

    case FileType.VIDEO:
      return (
        <video
          src={file.signed_url}
          className={cn('h-full w-full', finalNoBorder && 'rounded-none')}
          style={commonStyles}
          controls
          muted
          loop
          playsInline
          preload='metadata'
          crossOrigin='anonymous'
        >
          Your browser does not support the video tag.
        </video>
      );

    case FileType.AUDIO:
      return (
        <div className='flex h-full flex-col items-center justify-center gap-4 p-4'>
          <Volume2 size={48} className='text-primary' />
          <span className='text-foreground text-center text-sm font-medium'>{file.name}</span>
          <audio controls className='w-full' preload='metadata' crossOrigin='anonymous'>
            <source src={file.signed_url} />
            <track kind='captions' />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );

    case FileType.MODEL_3D:
      return <Model3DWrapper file={file} />;

    case FileType.DOCUMENT:
      return (
        <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-4'>
          <FileIcon size={48} />
          <p className='text-center text-sm font-medium'>{file.name}</p>
          <p className='text-xs'>Document preview not available</p>
        </div>
      );

    default:
      return (
        <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-4'>
          <FileIcon size={48} />
          <p className='text-center text-sm'>{file.name}</p>
        </div>
      );
  }
}
