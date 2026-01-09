import { memo, Suspense, useState } from 'react';
import { AlertCircle, FileIcon, RefreshCw, Volume2 } from 'lucide-react';

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
 * Simple error fallback for 3D models
 */
function Model3DError({ fileName, onRetry }: { fileName: string; onRetry: () => void }) {
  return (
    <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-4'>
      <AlertCircle className='text-destructive h-12 w-12' />
      <p className='text-center text-sm font-medium'>{fileName}</p>
      <p className='text-destructive text-center text-xs'>Failed to load 3D model</p>
      <button
        onClick={onRetry}
        className='bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-md px-4 py-2 text-sm transition-colors'
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Memoized 3D model wrapper with error handling and reload
 */
const Model3DWrapper = memo(({ file }: { file: FileWithSignedUrl }) => {
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    setError(false);
    setKey((prev) => prev + 1);
    // Reset reloading state after a brief delay
    setTimeout(() => setIsReloading(false), 500);
  };

  if (error) {
    return (
      <Model3DError
        fileName={file.name}
        onRetry={() => {
          setError(false);
          setKey((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <div className='relative h-full w-full'>
      <Suspense
        key={key}
        fallback={
          <div className='flex h-full flex-col items-center justify-center gap-2'>
            <Spinner />
            <p className='text-muted-foreground text-xs'>Loading 3D model...</p>
            <p className='text-muted-foreground text-xs italic'>{file.name}</p>
          </div>
        }
      >
        <ModelPreviewCard file={file} onError={() => setError(true)} onReload={handleReload} />
      </Suspense>

      {/* Reload button - always visible */}
      <button
        onClick={handleReload}
        disabled={isReloading}
        className='absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 disabled:opacity-50'
        style={{ zIndex: 10 }}
        title='Reload 3D model'
      >
        <RefreshCw size={16} className={isReloading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
});

Model3DWrapper.displayName = 'Model3DWrapper';

/**
 * Memoized image renderer with blur placeholder
 */
const ImageRenderer = memo(
  ({
    file,
    finalObjectFit,
    finalNoBorder,
    commonStyles,
  }: {
    file: FileWithSignedUrl;
    finalObjectFit: string;
    finalNoBorder: boolean;
    commonStyles: React.CSSProperties;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    if (hasError) {
      return (
        <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 p-4'>
          <FileIcon size={48} />
          <p className='text-sm'>Failed to load image</p>
        </div>
      );
    }

    return (
      <div className='relative h-full w-full'>
        {/* Blur placeholder */}
        {file.blur_url && !imageLoaded && (
          <div
            className='absolute inset-0 h-full w-full'
            style={{
              backgroundImage: `url(${file.blur_url})`,
              backgroundSize: finalObjectFit,
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
  },
);

ImageRenderer.displayName = 'ImageRenderer';

/**
 * Memoized video renderer
 */
const VideoRenderer = memo(
  ({
    file,
    finalNoBorder,
    commonStyles,
  }: {
    file: FileWithSignedUrl;
    finalNoBorder: boolean;
    commonStyles: React.CSSProperties;
  }) => (
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
  ),
);

VideoRenderer.displayName = 'VideoRenderer';

/**
 * Memoized audio renderer
 */
const AudioRenderer = memo(({ file }: { file: FileWithSignedUrl }) => (
  <div className='flex h-full flex-col items-center justify-center gap-4 p-4'>
    <Volume2 size={48} className='text-primary' />
    <span className='text-foreground text-center text-sm font-medium'>{file.name}</span>
    <audio controls className='w-full' preload='metadata' crossOrigin='anonymous'>
      <source src={file.signed_url} />
      <track kind='captions' />
      Your browser does not support the audio tag.
    </audio>
  </div>
));

AudioRenderer.displayName = 'AudioRenderer';

/**
 * Memoized document renderer
 */
const DocumentRenderer = memo(({ file }: { file: FileWithSignedUrl }) => (
  <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-4'>
    <FileIcon size={48} />
    <p className='text-center text-sm font-medium'>{file.name}</p>
    <p className='text-xs'>Document preview not available</p>
  </div>
));

DocumentRenderer.displayName = 'DocumentRenderer';

/**
 * Shared AssetRenderer component for rendering media assets across all plugins
 *
 * Used by:
 * - SwipeCategorizePlugin
 * - MatchingGamePlugin
 * - StepByStepRevealPlugin
 * - Any other plugins that need to render media assets
 *
 * Features:
 * - Memoized renderers for performance
 * - Lazy loading for images
 * - Error handling with retry for 3D models
 * - Mobile-optimized
 */
export const AssetRenderer = memo(({ file, displaySettings }: AssetRendererProps) => {
  const { objectFit, aspectRatio, noBorder } = displaySettings ?? {};

  // Apply defaults
  const finalObjectFit = objectFit ?? 'contain';
  const finalAspectRatio = aspectRatio ?? 'auto';
  const finalNoBorder = noBorder ?? false;

  const commonStyles: React.CSSProperties = {
    objectFit: finalObjectFit,
    aspectRatio: finalAspectRatio === 'auto' ? undefined : finalAspectRatio,
  };

  switch (file.file_type) {
    case FileType.IMAGE:
      return (
        <ImageRenderer
          file={file}
          finalObjectFit={finalObjectFit}
          finalNoBorder={finalNoBorder}
          commonStyles={commonStyles}
        />
      );

    case FileType.VIDEO:
      return (
        <VideoRenderer file={file} finalNoBorder={finalNoBorder} commonStyles={commonStyles} />
      );

    case FileType.AUDIO:
      return <AudioRenderer file={file} />;

    case FileType.MODEL_3D:
      return <Model3DWrapper file={file} />;

    case FileType.DOCUMENT:
      return <DocumentRenderer file={file} />;

    default:
      return (
        <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-4'>
          <FileIcon size={48} />
          <p className='text-center text-sm'>{file.name}</p>
        </div>
      );
  }
});

AssetRenderer.displayName = 'AssetRenderer';
