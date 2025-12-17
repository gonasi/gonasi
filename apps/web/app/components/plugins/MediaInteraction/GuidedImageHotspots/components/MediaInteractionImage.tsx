import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { useFetcher } from 'react-router';
import {
  KeepScale,
  type ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import { RefreshCcw, Trash, ZoomIn, ZoomOut } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE, type GuidedImageHotspotTypes } from '@gonasi/schemas/plugins';

import { MediaInteractionSheet } from '../../common/MediaInteractionSheet';

import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { IconTooltipButton } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

const LazyHotspotSheetDisplay = lazy(() => import('./HotspotSheetDisplay'));

interface MediaInteractionImageProps {
  imageId: string;
  name: string;
}

interface DragState {
  isDragging: boolean;
  hotspotIndex: number;
  startX: number;
  startY: number;
  initialHotspotX: number;
  initialHotspotY: number;
}

export default function MediaInteractionImage({ imageId, name }: MediaInteractionImageProps) {
  const fetcher = useFetcher<typeof loader>();
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useRemixFormContext();

  const { append, remove, update } = useFieldArray({
    control,
    name,
  });

  const { mode } = useStore();

  useEffect(() => {
    if (imageId) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  const hotSpots = (watch(name) as GuidedImageHotspotTypes[]) || [];

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentHotSpot, setCurrentHotSpot] = useState<{
    hotSpot: GuidedImageHotspotTypes;
    index: number;
  } | null>(null);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Track if actual panning movement occurred
  const hasPannedRef = useRef(false);
  // Track panning state for cursor styling
  const [isPanning, setIsPanning] = useState(false);

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add hotspot if user didn't actually pan and isn't dragging
    if (!hasPannedRef.current && !dragState?.isDragging) {
      addHotSpot(e);
    }
    // Reset the flag for next interaction
    hasPannedRef.current = false;
  };

  const handlePanningStart = () => {
    hasPannedRef.current = false;
    setIsPanning(true);
  };

  const handlePanning = () => {
    hasPannedRef.current = true;
  };

  const handlePanningStop = () => {
    setIsPanning(false);
  };

  const addHotSpot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!transformRef.current) return;

    const { scale, positionX, positionY } = transformRef.current.instance.transformState;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click coordinates to original image coordinates
    const originalX = (clickX - positionX) / scale;
    const originalY = (clickY - positionY) / scale;

    const newHotSpot: GuidedImageHotspotTypes = {
      id: uuidv4(),
      x: originalX,
      y: originalY,
      scale: 1, // Always store in original image coordinates
      message: EMPTY_LEXICAL_STATE,
    };

    append(newHotSpot);

    // Open popover with the new choice data
    const newIndex = hotSpots.length; // will be index after append
    setCurrentHotSpot({
      hotSpot: newHotSpot,
      index: newIndex,
    });
    setIsPopoverOpen(true);
  };

  const editHotSpot = (hotSpot: GuidedImageHotspotTypes, index: number) => {
    setCurrentHotSpot({ hotSpot, index });
    setIsPopoverOpen(true);
  };

  const deleteHotSpot = (index: number) => {
    remove(index);

    // ✅ FIX: adjust currentHotSpot index after deletion to keep numbering in sync
    if (currentHotSpot) {
      if (currentHotSpot.index === index) {
        // deleted the one currently being edited → close popover
        setIsPopoverOpen(false);
        setCurrentHotSpot(null);
      } else if (currentHotSpot.index > index) {
        // shift index down if it was after the deleted one
        setCurrentHotSpot({
          ...currentHotSpot,
          index: currentHotSpot.index - 1,
        });
      }
    }
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
    setCurrentHotSpot(null);
  };

  const handleZoomIn = () => {
    transformRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    transformRef.current?.zoomOut();
  };

  // Drag handlers
  const handleHotspotMouseDown = (e: React.MouseEvent, hotspotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!transformRef.current) return;

    const currentHotspot = hotSpots[hotspotIndex];
    if (!currentHotspot) return;

    const { scale } = transformRef.current.instance.transformState;

    setDragState({
      isDragging: true,
      hotspotIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialHotspotX: currentHotspot.x,
      initialHotspotY: currentHotspot.y,
    });

    // Temporarily disable zoom/pan while dragging
    transformRef.current.instance.setup.disabled = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState?.isDragging || !transformRef.current) return;

    e.preventDefault();
    const { scale } = transformRef.current.instance.transformState;

    const deltaX = (e.clientX - dragState.startX) / scale;
    const deltaY = (e.clientY - dragState.startY) / scale;

    const newX = dragState.initialHotspotX + deltaX;
    const newY = dragState.initialHotspotY + deltaY;

    const currentHotspot = hotSpots[dragState.hotspotIndex];
    if (currentHotspot) {
      update(dragState.hotspotIndex, {
        ...currentHotspot,
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    if (dragState?.isDragging) {
      transformRef.current!.instance.setup.disabled = false;
      setDragState(null);
    }
  };

  // Add global mouse listeners for dragging
  useEffect(() => {
    if (dragState?.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [dragState]);

  // Reset drag state if hotspots array shrinks
  useEffect(() => {
    if (dragState && dragState.hotspotIndex >= hotSpots.length) {
      setDragState(null);
    }
  }, [hotSpots.length, dragState]);

  // Show spinner while loading
  if (fetcher.state !== 'idle') {
    return (
      <div className='flex min-h-100 items-center'>
        <Spinner />
      </div>
    );
  }

  const fileData = fetcher.data?.success && fetcher.data.data ? fetcher.data.data : null;
  if (!fileData) {
    return null; // or error state
  }

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div className='mx-auto max-w-sm md:max-w-lg'>
          <TransformWrapper
            ref={transformRef}
            onPanningStart={handlePanningStart}
            onPanning={handlePanning}
            onPanningStop={handlePanningStop}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Controls */}
                <div className='fixed top-16 left-4 z-10 mt-1 flex flex-col space-y-1 rounded-md'>
                  <MediaInteractionSheet title='Guided Hotspots Order'>
                    <Suspense fallback={<Spinner />}>
                      <LazyHotspotSheetDisplay />
                    </Suspense>
                  </MediaInteractionSheet>
                  <IconTooltipButton
                    onClick={() => zoomIn()}
                    title='Zoom in closer'
                    icon={ZoomIn}
                    variant='secondary'
                  />
                  <IconTooltipButton
                    onClick={() => zoomOut()}
                    title='Zoom out to see more'
                    icon={ZoomOut}
                    variant='secondary'
                  />
                  <IconTooltipButton
                    onClick={() => resetTransform()}
                    title='Reset zoom & position'
                    icon={RefreshCcw}
                    variant='secondary'
                  />
                </div>

                <TransformComponent
                  wrapperProps={
                    {
                      role: 'button',
                      tabIndex: 0,
                      onClick: handleClick,
                    } as any
                  }
                  wrapperClass={cn(
                    'shadow',
                    isPanning ? 'cursor-grabbing' : 'cursor-default',
                    dragState?.isDragging ? 'cursor-grabbing' : '',
                  )}
                  wrapperStyle={{ position: 'relative' }}
                >
                  <img
                    src={fileData.signed_url}
                    alt=''
                    className='h-auto w-full'
                    crossOrigin='anonymous'
                  />

                  {/* Hotspots */}
                  {hotSpots.map((hotSpot, index) => (
                    <div
                      key={hotSpot.id}
                      className='absolute'
                      style={{
                        left: hotSpot.x,
                        top: hotSpot.y,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2,
                      }}
                    >
                      <KeepScale>
                        <Popover
                          open={isPopoverOpen && currentHotSpot?.index === index}
                          onOpenChange={(open) => {
                            if (!open) closePopover();
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div className='group relative'>
                              {/* Marker */}
                              <button
                                className={cn(
                                  'bg-secondary text-secondary-foreground hover:bg-secondary/90 relative flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none',
                                  dragState?.isDragging && dragState.hotspotIndex === index
                                    ? 'scale-110 cursor-grabbing'
                                    : 'cursor-grab',
                                )}
                                onMouseDown={(e) => handleHotspotMouseDown(e, index)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!dragState?.isDragging) editHotSpot(hotSpot, index);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editHotSpot(hotSpot, index);
                                  }
                                }}
                                aria-label={`Hotspot ${index + 1} - Click to edit, drag to move`}
                                title={`Hotspot ${index + 1} - Click to edit, drag to move`}
                              >
                                {/* ✅ numbering always follows array index */}
                                <span className='text-sm font-medium'>{index + 1}</span>
                              </button>

                              {/* Ping animation (disabled while dragging) */}
                              {!(dragState?.isDragging && dragState.hotspotIndex === index) && (
                                <div className='bg-secondary pointer-events-none absolute inset-0 animate-ping rounded-full opacity-30' />
                              )}
                            </div>
                          </PopoverTrigger>

                          <PopoverContent className='w-80 p-4 md:w-100' side='top' align='center'>
                            {currentHotSpot && currentHotSpot.index === index && (
                              <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                  <h3 className='text-sm font-medium'>
                                    Edit Hotspot #{currentHotSpot.index + 1}
                                  </h3>
                                  <div className='flex items-center'>
                                    <IconTooltipButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleZoomIn();
                                      }}
                                      title='Zoom in'
                                      icon={ZoomIn}
                                      variant='ghost'
                                      size='sm'
                                    />
                                    <IconTooltipButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleZoomOut();
                                      }}
                                      title='Zoom out'
                                      icon={ZoomOut}
                                      variant='ghost'
                                      size='sm'
                                    />
                                    <IconTooltipButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteHotSpot(currentHotSpot.index);
                                      }}
                                      title='Delete hotspot'
                                      icon={Trash}
                                      variant='ghost'
                                      size='sm'
                                    />
                                  </div>
                                </div>

                                <GoRichTextInputField
                                  name={`${name}.${currentHotSpot.index}.message`}
                                  labelProps={{ children: 'Message', required: true }}
                                  placeholder='Enter hotspot message...'
                                />

                                <div className='flex justify-end gap-2 border-t pt-4'>
                                  <Button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closePopover();
                                    }}
                                    variant='ghost'
                                    size='sm'
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closePopover();
                                    }}
                                    variant='secondary'
                                    size='sm'
                                  >
                                    Save Hotspot
                                  </Button>
                                </div>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </KeepScale>
                    </div>
                  ))}
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      )}
    />
  );
}
