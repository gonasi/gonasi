import { Component, type ErrorInfo, type ReactNode, Suspense, useState } from 'react';
import { AlertCircle, FileIcon, Volume2 } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';
import type { CardDisplaySettingsSchemaTypes } from '@gonasi/schemas/plugins';

import { ModelPreviewCard } from '~/components/file-renderers/preview-cards/model-preview-card';
import { Spinner } from '~/components/loaders';
import { cn } from '~/lib/utils';

// Error Boundary for 3D Model Loading
class Model3DErrorBoundary extends Component<
  { children: ReactNode; fileName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fileName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AssetRenderer] 3D Model Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4'>
          <AlertCircle className='text-destructive h-12 w-12' />
          <p className='text-center text-sm font-medium'>{this.props.fileName}</p>
          <p className='text-destructive text-center text-xs'>
            Failed to load 3D model: {this.state.error?.message || 'Unknown error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        >
          Your browser does not support the video tag.
        </video>
      );

    case FileType.AUDIO:
      return (
        <div className='flex h-full flex-col items-center justify-center gap-4 p-4'>
          <Volume2 size={48} className='text-primary' />
          <span className='text-foreground text-center text-sm font-medium'>{file.name}</span>
          <audio src={file.signed_url} controls className='w-full' preload='metadata'>
            Your browser does not support the audio tag.
          </audio>
        </div>
      );

    case FileType.MODEL_3D:
      return (
        <Model3DErrorBoundary fileName={file.name}>
          <Suspense
            fallback={
              <div className='flex h-full flex-col items-center justify-center gap-2'>
                <Spinner />
                <p className='text-muted-foreground text-xs'>Loading 3D model...</p>
                <p className='text-muted-foreground text-xs italic'>{file.name}</p>
              </div>
            }
          >
            <ModelPreviewCard file={file} />
          </Suspense>
        </Model3DErrorBoundary>
      );

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
