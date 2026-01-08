import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { Area, Point } from 'react-easy-crop';
import { Controller, get, useFieldArray, useWatch } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import {
  CircleX,
  Crop,
  Edit2,
  Loader2,
  Music,
  Plus,
  RotateCcw,
  Trash,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { FileType } from '@gonasi/schemas/file';
import { EMPTY_LEXICAL_STATE, type FocusRegionSchemaTypes } from '@gonasi/schemas/plugins';

import type { AspectRatioKey } from '../constants/aspectRatios';
import { ASPECT_RATIOS } from '../constants/aspectRatios';

import useModal from '~/components/go-editor/hooks/useModal';
import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Slider } from '~/components/ui/slider';
import {
  IconTooltipButton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { loader } from '~/routes/api/get-signed-url';
import type { SearchFileResult } from '~/routes/api/search-files';
import { useStore } from '~/store';

const InsertMediaDialog = lazy(() => import('../../../MediaInteraction/common/InsertMediaDialog'));
const Cropper = lazy(() => import('react-easy-crop'));

interface ImageFocusCanvasProps {
  imageId: string;
  name: string;
  showCropper: boolean;
  setShowCropper: (show: boolean) => void;
}

const getAspectRatioKey = (value: number): AspectRatioKey | null => {
  for (const [key, config] of Object.entries(ASPECT_RATIOS)) {
    if (Math.abs(config.value - value) < 0.001) {
      return key as AspectRatioKey;
    }
  }
  return null;
};

export default function ImageFocusCanvas({
  imageId,
  name,
  showCropper,
  setShowCropper,
}: ImageFocusCanvasProps) {
  const fetcher = useFetcher<typeof loader>();
  const audioFetcher = useFetcher<typeof loader>();
  const {
    control,
    formState: { errors },
    setValue,
  } = useRemixFormContext();

  const { append, update, remove } = useFieldArray({
    control,
    name,
  });

  const { mode } = useStore();
  const imageRef = useRef<HTMLImageElement>(null);
  const [modal, showModal] = useModal();

  // Use useWatch to properly track form state changes
  const regions = (useWatch({ control, name, defaultValue: [] }) as FocusRegionSchemaTypes[]) || [];
  const error = get(errors, name);

  // Crop state for creating/editing regions
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedAreaPercentages, setCroppedAreaPercentages] = useState<Area | null>(null);
  const [initialCroppedAreaPercentages, setInitialCroppedAreaPercentages] = useState<
    Area | undefined
  >(undefined);

  // Track if we're editing existing region or creating new
  const [editingRegionIndex, setEditingRegionIndex] = useState<number | null>(null);

  // Force Cropper remount on each edit by incrementing this key
  const [cropperKey, setCropperKey] = useState(0);

  // Crop settings - default to 1:1
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [showGrid, setShowGrid] = useState(true);
  const [restrictPosition, setRestrictPosition] = useState(true);

  // Track current zoom level for display
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1);

  useEffect(() => {
    if (imageId) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  // Watch audio for editing region
  const editingAudioId =
    editingRegionIndex !== null && regions[editingRegionIndex]
      ? regions[editingRegionIndex].audioId
      : null;

  useEffect(() => {
    if (editingAudioId) {
      audioFetcher.load(`/api/files/${editingAudioId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAudioId, mode]);

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

  const onCropComplete = (croppedArea: Area, pixels: Area) => {
    console.log('📐 onCropComplete called:', {
      croppedAreaPercentages: croppedArea,
      croppedAreaPixels: pixels,
    });
    setCroppedAreaPercentages(croppedArea);
    setCroppedAreaPixels(pixels);
  };

  const handleStartNewRegion = () => {
    setEditingRegionIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedAreaPercentages(null);
    setInitialCroppedAreaPercentages(undefined);
    setAspectRatio(1); // Default to 1:1
    setShowGrid(true);
    setRestrictPosition(true);
    setCurrentZoomLevel(1);
    setShowCropper(true);
  };

  const handleCropConfirm = () => {
    if (!croppedAreaPercentages || !croppedAreaPixels) return;

    console.log('💾 Saving crop:', {
      croppedAreaPercentages,
      croppedAreaPixels,
      currentZoom: zoom,
      currentCrop: crop,
    });

    const regionData = {
      x: croppedAreaPercentages.x,
      y: croppedAreaPercentages.y,
      width: croppedAreaPercentages.width,
      height: croppedAreaPercentages.height,
      zoom,
      cropX: crop.x,
      cropY: crop.y,
    };

    console.log('💾 Region data (using croppedAreaPercentages):', regionData);

    if (editingRegionIndex !== null && editingRegionIndex < regions.length) {
      // Update existing region - only update coordinates
      const currentRegion = regions[editingRegionIndex];
      update(editingRegionIndex, {
        ...currentRegion,
        ...regionData,
      });
    } else {
      // Create new region
      const newRegion: FocusRegionSchemaTypes = {
        id: uuidv4(),
        ...regionData,
        answerState: EMPTY_LEXICAL_STATE,
        index: regions.length,
      };

      append(newRegion);
      // Set to edit the newly created region
      setEditingRegionIndex(regions.length);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setEditingRegionIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedAreaPercentages(null);
    setInitialCroppedAreaPercentages(undefined);
    setCurrentZoomLevel(1);
  };

  const handleEditRegionCrop = (index: number) => {
    const region = regions[index];
    if (!region || !imageRef.current) return;

    console.log('🔄 Editing region - RESETTING ALL STATE FIRST');

    // STEP 1: Reset ALL state first to avoid stale values
    setShowCropper(false);
    setEditingRegionIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedAreaPercentages(null);
    setInitialCroppedAreaPercentages(undefined);

    // Increment key to force Cropper remount
    setCropperKey((prev) => prev + 1);

    // STEP 2: Use setTimeout to ensure state reset completes before setting new values
    setTimeout(() => {
      const imgNaturalWidth = imageRef.current?.naturalWidth;
      const imgNaturalHeight = imageRef.current?.naturalHeight;

      if (!imgNaturalWidth || !imgNaturalHeight) return;

      console.log('🔄 Editing region - SETTING NEW STATE:', {
        index,
        savedRegion: region,
        imageNaturalDimensions: {
          width: imgNaturalWidth,
          height: imgNaturalHeight,
        },
      });

      // Calculate aspect ratio from the region dimensions in pixels
      const regionWidthPixels = (region.width / 100) * imgNaturalWidth;
      const regionHeightPixels = (region.height / 100) * imgNaturalHeight;
      const regionAspectRatio = regionWidthPixels / regionHeightPixels;

      console.log('🔄 Aspect ratio calculation:', {
        regionWidthPercent: region.width,
        regionHeightPercent: region.height,
        regionWidthPixels,
        regionHeightPixels,
        calculatedAspectRatio: regionAspectRatio,
      });

      // Set aspect ratio
      setAspectRatio(regionAspectRatio);

      // Restore the exact zoom and crop position that were saved
      if (region.zoom && region.cropX !== undefined && region.cropY !== undefined) {
        console.log('🔄 Restoring saved zoom and crop:', {
          zoom: region.zoom,
          crop: { x: region.cropX, y: region.cropY },
        });
        setZoom(region.zoom);
        setCrop({ x: region.cropX, y: region.cropY });
      } else {
        // Fallback: use initialCroppedAreaPercentages if zoom/crop not saved (old regions)
        console.log('🔄 No saved zoom/crop, using initialCroppedAreaPercentages fallback');
        const initialArea = {
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
        };
        setInitialCroppedAreaPercentages(initialArea);
      }

      // Reset other settings
      setShowGrid(true);
      setRestrictPosition(true);
      setCurrentZoomLevel(1);

      // Finally, show the cropper and set the editing index
      setEditingRegionIndex(index);
      setShowCropper(true);
    }, 0);
  };

  const deleteRegion = (index: number) => {
    remove(index);
    if (editingRegionIndex === index) {
      setEditingRegionIndex(null);
    } else if (editingRegionIndex !== null && editingRegionIndex > index) {
      setEditingRegionIndex(editingRegionIndex - 1);
    }
  };

  const openRegionEditor = (index: number) => {
    handleEditRegionCrop(index);
  };

  // Get current aspect ratio key for select value
  const currentAspectRatioKey = getAspectRatioKey(aspectRatio) || '1:1';

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <>
          {showCropper ? (
            // CROPPER MODE: Define region boundaries + Configure
            <div className='space-y-4'>
              {/* Main cropper area */}
              <div className='bg-card relative h-[40vh] w-full overflow-hidden rounded-lg'>
                <Suspense
                  fallback={
                    <div className='flex h-full items-center justify-center'>
                      <Loader2 className='animate-spin' />
                    </div>
                  }
                >
                  <Cropper
                    key={`cropper-${cropperKey}-${editingRegionIndex !== null && editingRegionIndex < regions.length ? regions[editingRegionIndex]?.id : 'new'}`}
                    image={fileData.signed_url}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    minZoom={1}
                    maxZoom={10}
                    initialCroppedAreaPercentages={initialCroppedAreaPercentages}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    objectFit='contain'
                    showGrid={showGrid}
                    restrictPosition={restrictPosition}
                  />
                </Suspense>
                {/* Hidden image to get natural dimensions */}
                <img
                  ref={imageRef}
                  src={fileData.signed_url}
                  alt=''
                  className='hidden'
                  crossOrigin='anonymous'
                />
              </div>

              {/* Settings panel */}
              <div className='space-y-2'>
                {/* Aspect Ratio */}
                <div className='space-y-2'>
                  <Label className='text-xs font-medium md:text-sm'>Aspect Ratio</Label>
                  <Select
                    value={currentAspectRatioKey}
                    onValueChange={(key: AspectRatioKey) => {
                      setAspectRatio(ASPECT_RATIOS[key].value);
                    }}
                  >
                    <SelectTrigger className='text-xs md:text-sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASPECT_RATIOS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zoom */}
                <div className='space-y-2'>
                  <Label className='text-xs font-medium md:text-sm'>Zoom: {zoom.toFixed(1)}x</Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={([z]) => setZoom(z ?? 1)}
                    min={1}
                    max={10}
                    step={0.1}
                  />
                </div>

                {/* Display Options */}
                <div className='space-y-2 pt-3 md:space-y-3 md:pt-4'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='show-grid'
                      checked={showGrid}
                      onCheckedChange={(checked) => setShowGrid(checked === true)}
                    />
                    <label
                      htmlFor='show-grid'
                      className='text-xs leading-none font-normal md:text-sm'
                    >
                      Grid
                    </label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='restrict-position'
                      checked={restrictPosition}
                      onCheckedChange={(checked) => setRestrictPosition(checked === true)}
                    />
                    <label
                      htmlFor='restrict-position'
                      className='text-xs leading-none font-normal md:text-sm'
                    >
                      Restrict
                    </label>
                  </div>
                </div>
              </div>

              {/* Region Content Form - appears after crop is selected */}
              {editingRegionIndex !== null && (
                <>
                  <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-bold'>
                      Region Content{' '}
                      {editingRegionIndex < regions.length ? `#${editingRegionIndex + 1}` : '(New)'}
                    </h3>
                    {editingRegionIndex < regions.length && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type='button'
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteRegion(editingRegionIndex);
                                setShowCropper(false);
                                setEditingRegionIndex(null);
                              }}
                              variant='ghost'
                              size='sm'
                              leftIcon={<Trash size={16} />}
                            >
                              Delete
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete region</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <GoRichTextInputField
                    name={`${name}.${editingRegionIndex}.answerState`}
                    labelProps={{ children: 'Answer', required: true }}
                    placeholder='Enter the answer to reveal...'
                  />

                  <div>
                    <Label htmlFor={`${name}.${editingRegionIndex}.audioId`}>
                      Audio (optional)
                    </Label>
                    {regions[editingRegionIndex]?.audioId ? (
                      <div className='border-border/40 bg-muted/50 flex items-center justify-between gap-2 rounded-md border p-2'>
                        <div className='flex items-center gap-2 truncate'>
                          <Music className='text-muted-foreground' size={16} />
                          <span className='text-muted-foreground truncate text-xs'>
                            {audioFetcher.data?.success && audioFetcher.data.data
                              ? audioFetcher.data.data.name
                              : 'Audio selected'}
                          </span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type='button'
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setValue(`${name}.${editingRegionIndex}.audioId`, undefined, {
                                    shouldDirty: true,
                                  });
                                }}
                                variant='ghost'
                                size='sm'
                                className='h-6 w-6 p-0'
                              >
                                <X size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove audio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        className='w-full'
                        leftIcon={<Music size={16} />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          showModal(
                            'Select Audio',
                            (onClose: () => void) => (
                              <Suspense fallback={<Spinner />}>
                                <InsertMediaDialog
                                  handleImageInsert={(file: SearchFileResult) => {
                                    setValue(`${name}.${editingRegionIndex}.audioId`, file.id, {
                                      shouldDirty: true,
                                    });
                                    onClose();
                                  }}
                                  fileTypes={[FileType.AUDIO]}
                                />
                              </Suspense>
                            ),
                            'Select an audio file to play when this region is revealed',
                            <Music />,
                            'lg',
                          );
                        }}
                      >
                        Add audio
                      </Button>
                    )}
                  </div>
                </>
              )}

              <div className='flex space-x-4 py-4'>
                {/* Action buttons */}
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Button
                    variant='ghost'
                    leftIcon={<CircleX />}
                    onClick={handleCropCancel}
                    className='w-full sm:w-auto'
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={handleCropConfirm}
                    rightIcon={<Crop />}
                    disabled={!croppedAreaPixels}
                    className='w-full sm:flex-1'
                  >
                    {editingRegionIndex !== null && editingRegionIndex < regions.length
                      ? 'Update Crop'
                      : 'Confirm Crop'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // VIEW MODE: Display all regions
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={10}
              wheel={{ step: 0.2 }}
              doubleClick={{ disabled: false, mode: 'zoomIn' }}
              panning={{ disabled: false }}
              onTransformed={(_ref, state) => {
                setCurrentZoomLevel(state.scale);
              }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Controls */}
                  <div className='mb-2 flex flex-wrap items-center gap-2'>
                    <Button
                      type='button'
                      onClick={handleStartNewRegion}
                      variant='secondary'
                      size='sm'
                      leftIcon={<Plus size={16} />}
                    >
                      New Region
                    </Button>

                    <div className='border-border/40 mx-2 h-6 w-px border-l' />

                    <IconTooltipButton
                      type='button'
                      onClick={() => zoomIn()}
                      title='Zoom In (Ctrl + Scroll)'
                      variant='secondary'
                      size='sm'
                      icon={ZoomIn}
                    />
                    <IconTooltipButton
                      type='button'
                      onClick={() => zoomOut()}
                      title='Zoom Out (Ctrl + Scroll)'
                      variant='secondary'
                      size='sm'
                      icon={ZoomOut}
                    />
                    <IconTooltipButton
                      type='button'
                      onClick={() => resetTransform()}
                      title='Reset View'
                      variant='secondary'
                      size='sm'
                      icon={RotateCcw}
                    />
                    <span className='text-muted-foreground text-sm'>
                      {Math.round(currentZoomLevel * 100)}%
                    </span>
                  </div>

                  <div className='relative h-[40vh] max-h-[70vh] overflow-hidden rounded-lg border shadow md:h-[60vh] lg:h-[70vh]'>
                    <TransformComponent
                      wrapperClass='!w-full !h-full'
                      contentClass='!w-full !h-full flex items-center justify-center'
                    >
                      <div className='relative inline-block'>
                        <img
                          ref={imageRef}
                          src={fileData.signed_url}
                          alt=''
                          className='block h-auto max-h-[80vh] w-auto max-w-full select-none'
                          draggable={false}
                          crossOrigin='anonymous'
                        />

                        {/* Render regions as overlays */}
                        {regions.map((region, index) => {
                          const img = imageRef.current;
                          if (!img) return null;

                          // Check if answer is entered (not empty)
                          const hasAnswer =
                            region.answerState && region.answerState !== EMPTY_LEXICAL_STATE;

                          return (
                            <div
                              key={region.id}
                              className={cn(
                                'border-0.5 absolute cursor-pointer transition-all md:border-2',
                                hasAnswer
                                  ? 'border-green-500 bg-green-500/20 hover:bg-green-500/30'
                                  : 'border-red-500 bg-red-500/20 hover:bg-red-500/30',
                              )}
                              style={{
                                left: `${region.x}%`,
                                top: `${region.y}%`,
                                width: `${region.width}%`,
                                height: `${region.height}%`,
                                pointerEvents: 'auto',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openRegionEditor(index);
                              }}
                              role='button'
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  openRegionEditor(index);
                                }
                              }}
                              aria-label={`Edit region ${index + 1}`}
                            >
                              <div
                                className={cn(
                                  'absolute top-0 left-0 rounded px-1 py-0.5 text-[6px] leading-none font-semibold md:top-1 md:left-1 md:px-1.5 md:text-xs',
                                  hasAnswer ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
                                )}
                              >
                                {index + 1}
                              </div>
                              <Edit2
                                className={cn(
                                  'absolute top-0 right-0 md:top-1 md:right-1',
                                  hasAnswer ? 'text-green-500' : 'text-red-500',
                                )}
                                size={10}
                                strokeWidth={2.5}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </TransformComponent>
                  </div>

                  {error && (
                    <p className='text-destructive mt-2 text-sm'>{error.message?.toString()}</p>
                  )}
                  <p className='text-muted-foreground mt-2 text-xs'>
                    📍 Click &quot;New Region&quot; to crop a new region. Click existing regions to
                    edit details. Zoom with Ctrl+Scroll or buttons.
                  </p>
                </>
              )}
            </TransformWrapper>
          )}
          {modal}
        </>
      )}
    />
  );
}
