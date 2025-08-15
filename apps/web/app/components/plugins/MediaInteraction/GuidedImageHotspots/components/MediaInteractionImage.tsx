import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { useFetcher } from 'react-router';
import {
  KeepScale,
  type ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import { Image } from '@unpic/react';
import { RefreshCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { EMPTY_LEXICAL_STATE, type GuidedImageHotspotTypes } from '@gonasi/schemas/plugins';

import { MediaInteractionSheet } from '../../common/MediaInteractionSheet';

import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { IconTooltipButton } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

const LazyHotspotSheetDisplay = lazy(() => import('./HotspotSheetDisplay'));

interface MediaInteractionImageProps {
  imageId: string;
  name: string;
}

export default function MediaInteractionImage({ imageId, name }: MediaInteractionImageProps) {
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

  useEffect(() => {
    if (imageId) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  const hotSpots = (watch(name) as GuidedImageHotspotTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHotSpot, setCurrentHotSpot] = useState<{
    hotSpot: GuidedImageHotspotTypes;
    index: number;
  } | null>(null);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Track if actual panning movement occurred
  const hasPannedRef = useRef(false);
  // Track panning state for cursor styling
  const [isPanning, setIsPanning] = useState(false);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add hotspot if user didn't actually pan
    if (!hasPannedRef.current) {
      addHotSpot(e);
    }
    // Reset the flag for next interaction
    hasPannedRef.current = false;
  };

  const handlePanningStart = () => {
    // Don't set flag here - wait for actual panning
    hasPannedRef.current = false;
    setIsPanning(true);
  };

  const handlePanning = () => {
    // This fires when actual panning movement occurs
    hasPannedRef.current = true;
  };

  const handlePanningStop = () => {
    // Keep the flag set until after the potential click event
    setIsPanning(false);
  };

  const addHotSpot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!transformRef.current) return;

    const { scale } = transformRef.current.instance.transformState;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHotSpot: GuidedImageHotspotTypes = {
      id: uuidv4(),
      x,
      y,
      scale,
      message: EMPTY_LEXICAL_STATE,
    };

    // Add the choice first
    append(newHotSpot);

    // Open modal with the new choice data
    const newIndex = hotSpots.length; // This will be the index after append
    setCurrentHotSpot({
      hotSpot: newHotSpot as GuidedImageHotspotTypes,
      index: newIndex,
    });
    setIsModalOpen(true);
  };

  const editHotSpot = (hotSpot: GuidedImageHotspotTypes, index: number) => {
    setCurrentHotSpot({ hotSpot, index });
    setIsModalOpen(true);
  };

  const deleteHotSpot = (index: number) => {
    remove(index);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentHotSpot(null);
  };

  // Show spinner while loading
  if (fetcher.state !== 'idle') {
    return (
      <div className='flex min-h-100 items-center'>
        <Spinner />
      </div>
    );
  }

  // Check if data exists and was successful
  const fileData = fetcher.data?.success && fetcher.data.data ? fetcher.data.data : null;
  if (!fileData) {
    return null; // or render an error state
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
                  wrapperProps={{
                    role: 'button',
                    tabIndex: 0,
                    onClick: handleClick,
                  }}
                  wrapperClass={cn('shadow', isPanning ? 'cursor-grabbing' : 'cursor-default')}
                  wrapperStyle={{
                    position: 'relative',
                  }}
                >
                  <Image
                    src={fileData.signed_url}
                    layout='constrained'
                    width={800}
                    height={200}
                    alt=''
                    className='h-auto w-full'
                  />

                  {/* Render Hotspots */}
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
                        <div className='group relative'>
                          {/* Hotspot Marker */}
                          <button
                            className='relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none'
                            onClick={(e) => {
                              e.stopPropagation();
                              editHotSpot(hotSpot, index);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                editHotSpot(hotSpot, index);
                              }
                            }}
                            aria-label={`Edit hotspot ${index + 1}`}
                            title={`Edit hotspot ${index + 1}`}
                          >
                            <span className='text-sm font-medium'>{index + 1}</span>

                            {/* Delete Button (appears on hover) */}
                            <button
                              className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 focus:ring-2 focus:ring-red-400 focus:ring-offset-1 focus:outline-none'
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHotSpot(index);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteHotSpot(index);
                                }
                              }}
                              aria-label={`Delete hotspot ${index + 1}`}
                              title={`Delete hotspot ${index + 1}`}
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </button>

                          {/* Pulse Animation */}
                          <div className='pointer-events-none absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-30' />
                        </div>
                      </KeepScale>
                    </div>
                  ))}
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          {/* Choice Editor Modal */}
          <Modal open={isModalOpen} onOpenChange={closeModal}>
            <Modal.Content size='sm' className=''>
              <Modal.Header title={currentHotSpot ? 'Edit Hot Spot' : 'Create Hot Spot'} />
              <Modal.Body>
                {currentHotSpot && (
                  <div className='space-y-4'>
                    <p className='text-sm text-gray-600'>{`${name}.${currentHotSpot.index}.message`}</p>
                    <GoRichTextInputField
                      name={`${name}.${currentHotSpot.index}.message`}
                      labelProps={{ children: 'Message', required: true }}
                      placeholder='Enter hotspot message...'
                    />

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-2 border-t pt-4'>
                      <Button type='button' onClick={closeModal} variant='ghost'>
                        Cancel
                      </Button>
                      <Button type='button' onClick={closeModal} variant='secondary'>
                        Save Hotspot
                      </Button>
                    </div>
                  </div>
                )}
              </Modal.Body>
            </Modal.Content>
          </Modal>
        </div>
      )}
    />
  );
}
