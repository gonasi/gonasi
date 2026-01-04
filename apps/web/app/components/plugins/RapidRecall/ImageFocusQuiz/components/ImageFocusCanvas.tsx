import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE, type FocusRegionSchemaTypes } from '@gonasi/schemas/plugins';

import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { IconTooltipButton } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

interface ImageFocusCanvasProps {
  imageId: string;
  name: string;
}

interface DrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX?: number;
  currentY?: number;
}

export default function ImageFocusCanvas({ imageId, name }: ImageFocusCanvasProps) {
  const fetcher = useFetcher<typeof loader>();
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove } = useFieldArray({
    control,
    name,
  });

  const { mode } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawState, setDrawState] = useState<DrawState | null>(null);

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentRegionIndex, setCurrentRegionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (imageId) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const regions = (watch(name) as FocusRegionSchemaTypes[]) || [];
  const error = get(errors, name);

  // Watch the current region's zoom scale for real-time updates
  const currentZoomScale = watch(
    currentRegionIndex !== null ? `${name}.${currentRegionIndex}.zoomScale` : `${name}.0.zoomScale`,
  );

  const getImageCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return { x, y, rect };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click

    const coords = getImageCoordinates(e);
    if (!coords) return;

    const { x, y, rect } = coords;

    // Check if clicking on existing region
    const clickedRegionIndex = regions.findIndex((region) => {
      const rx = (region.x / 100) * rect.width;
      const ry = (region.y / 100) * rect.height;
      const rw = (region.width / 100) * rect.width;
      const rh = (region.height / 100) * rect.height;
      return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    });

    if (clickedRegionIndex !== -1) {
      setCurrentRegionIndex(clickedRegionIndex);
      setIsPopoverOpen(true);
      return;
    }

    // Start drawing new region
    setDrawState({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawState?.isDrawing) return;

    const coords = getImageCoordinates(e);
    if (!coords) return;

    setDrawState({
      ...drawState,
      currentX: coords.x,
      currentY: coords.y,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawState?.isDrawing || !canvasRef.current) return;

    const coords = getImageCoordinates(e);
    if (!coords) {
      setDrawState(null);
      return;
    }

    const { x: endX, y: endY, rect } = coords;

    const minX = Math.min(drawState.startX, endX);
    const minY = Math.min(drawState.startY, endY);
    const width = Math.abs(endX - drawState.startX);
    const height = Math.abs(endY - drawState.startY);

    // Only create region if it has meaningful size
    if (width > 10 && height > 10) {
      const newRegion: FocusRegionSchemaTypes = {
        id: uuidv4(),
        x: (minX / rect.width) * 100,
        y: (minY / rect.height) * 100,
        width: (width / rect.width) * 100,
        height: (height / rect.height) * 100,
        zoomScale: 2,
        answerState: EMPTY_LEXICAL_STATE,
        index: regions.length,
      };

      append(newRegion);
      setCurrentRegionIndex(regions.length);
      setIsPopoverOpen(true);
    }

    setDrawState(null);
  };

  const deleteRegion = (index: number) => {
    remove(index);
    if (currentRegionIndex === index) {
      setIsPopoverOpen(false);
      setCurrentRegionIndex(null);
    } else if (currentRegionIndex !== null && currentRegionIndex > index) {
      setCurrentRegionIndex(currentRegionIndex - 1);
    }
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
    setCurrentRegionIndex(null);
  };

  // Calculate zoom transform for active region
  const imageTransformStyle = useMemo(() => {
    if (!isPopoverOpen || currentRegionIndex === null || !regions[currentRegionIndex]) {
      return {
        transform: 'scale(1)',
        transition: 'transform 400ms ease-in-out',
        transformOrigin: 'center center',
      };
    }

    const activeRegion = regions[currentRegionIndex];
    const { x, y, width, height } = activeRegion;

    // Use the watched zoom scale for real-time updates
    const scale = currentZoomScale || activeRegion.zoomScale || 2;

    // Calculate the center of the region in percentage coordinates
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Use image center as transform origin, calculate translation to center region in viewport
    // After scaling from center (50%, 50%), point at P becomes: 50 + (P - 50) * scale
    // We want region center to be at 50%:
    // 50 + (centerX - 50) * scale + translateX = 50
    // translateX = -((centerX - 50) * scale)
    const translateX = -((centerX - 50) * scale);
    const translateY = -((centerY - 50) * scale);

    return {
      transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
      transition: 'transform 400ms ease-in-out',
      transformOrigin: '50% 50%',
    };
  }, [isPopoverOpen, currentRegionIndex, regions, currentZoomScale]);

  if (fetcher.state !== 'idle') {
    return (
      <div className='flex min-h-100 items-center'>
        <Spinner />
      </div>
    );
  }

  const fileData = fetcher.data?.success && fetcher.data.data ? fetcher.data.data : null;
  if (!fileData) {
    return null;
  }

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div className='mx-auto max-w-sm md:max-w-lg'>
          <div
            className='relative flex items-center justify-center overflow-hidden shadow'
            style={{ height: '50vh', maxHeight: '50vh' }}
          >
            <div
              ref={canvasRef}
              className={cn('relative flex cursor-crosshair items-center justify-center')}
              style={imageTransformStyle}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              role='button'
              tabIndex={0}
              aria-label='Draw regions on image'
            >
              <img
                src={fileData.signed_url}
                alt=''
                className='h-auto max-h-[50vh] w-auto max-w-full select-none'
                draggable={false}
                crossOrigin='anonymous'
              />

              {/* Blur overlay when editing a region */}
              {isPopoverOpen && currentRegionIndex !== null && regions[currentRegionIndex] && (
                <>
                  {(() => {
                    const activeRegion = regions[currentRegionIndex];
                    return (
                      <>
                        {/* Top overlay */}
                        <div
                          className='pointer-events-none absolute right-0 left-0 bg-black/60 transition-opacity duration-300'
                          style={{
                            top: 0,
                            height: `${activeRegion.y}%`,
                            backdropFilter: 'blur(8px)',
                          }}
                        />
                        {/* Bottom overlay */}
                        <div
                          className='pointer-events-none absolute right-0 left-0 bg-black/60 transition-opacity duration-300'
                          style={{
                            top: `${activeRegion.y + activeRegion.height}%`,
                            bottom: 0,
                            backdropFilter: 'blur(8px)',
                          }}
                        />
                        {/* Left overlay */}
                        <div
                          className='pointer-events-none absolute top-0 bottom-0 bg-black/60 transition-opacity duration-300'
                          style={{
                            left: 0,
                            width: `${activeRegion.x}%`,
                            backdropFilter: 'blur(8px)',
                          }}
                        />
                        {/* Right overlay */}
                        <div
                          className='pointer-events-none absolute top-0 bottom-0 bg-black/60 transition-opacity duration-300'
                          style={{
                            left: `${activeRegion.x + activeRegion.width}%`,
                            right: 0,
                            backdropFilter: 'blur(8px)',
                          }}
                        />
                      </>
                    );
                  })()}
                </>
              )}

              {/* Render regions */}
              {regions.map((region, index) => (
                <Popover
                  key={region.id}
                  open={isPopoverOpen && currentRegionIndex === index}
                  onOpenChange={(open) => {
                    if (!open) closePopover();
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      className='border-primary bg-primary/20 hover:bg-primary/30 absolute cursor-pointer border-2 transition-colors'
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentRegionIndex !== index || !isPopoverOpen) {
                          setCurrentRegionIndex(index);
                          setIsPopoverOpen(true);
                        }
                      }}
                    >
                      <div className='bg-primary text-primary-foreground pointer-events-none absolute top-1 left-1 rounded px-1 text-xs'>
                        {index + 1}
                      </div>
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    className='w-80 p-4 md:w-100'
                    side='top'
                    align='center'
                    sideOffset={10}
                    avoidCollisions
                    sticky='always'
                  >
                    {currentRegionIndex === index && (
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-sm font-medium'>Edit Region #{index + 1}</h3>
                          <IconTooltipButton
                            type='button'
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteRegion(index);
                            }}
                            title='Delete region'
                            icon={Trash}
                            variant='ghost'
                            size='sm'
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor={`${name}.${index}.zoomScale`}>
                            Zoom Scale: {watch(`${name}.${index}.zoomScale`) || 2}x
                          </Label>
                          <Controller
                            name={`${name}.${index}.zoomScale`}
                            control={control}
                            render={({ field }) => (
                              <input
                                type='range'
                                id={`${name}.${index}.zoomScale`}
                                min='1.1'
                                max='5'
                                step='0.1'
                                value={field.value || 2}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700'
                              />
                            )}
                          />
                        </div>

                        <GoRichTextInputField
                          name={`${name}.${index}.answerState`}
                          labelProps={{ children: 'Answer', required: true }}
                          placeholder='Enter the answer to reveal...'
                        />

                        <div className='flex justify-end gap-2 border-t pt-4'>
                          <Button
                            type='button'
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              closePopover();
                            }}
                            variant='ghost'
                            size='sm'
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              ))}

              {/* Drawing preview */}
              {drawState?.isDrawing &&
                drawState.currentX &&
                drawState.currentY &&
                canvasRef.current &&
                (() => {
                  const rect = canvasRef.current.getBoundingClientRect();
                  const minX = Math.min(drawState.startX, drawState.currentX);
                  const minY = Math.min(drawState.startY, drawState.currentY);
                  const width = Math.abs(drawState.currentX - drawState.startX);
                  const height = Math.abs(drawState.currentY - drawState.startY);

                  return (
                    <div
                      className='pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-500/10'
                      style={{
                        left: `${(minX / rect.width) * 100}%`,
                        top: `${(minY / rect.height) * 100}%`,
                        width: `${(width / rect.width) * 100}%`,
                        height: `${(height / rect.height) * 100}%`,
                      }}
                    />
                  );
                })()}
            </div>
          </div>

          {error && <p className='text-destructive mt-2 text-sm'>{error.message?.toString()}</p>}
          <p className='text-muted-foreground mt-2 text-xs'>
            Click and drag to draw regions on the image. Click regions to edit.
          </p>
        </div>
      )}
    />
  );
}
