import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { Area, Point } from 'react-easy-crop';
import { Controller, get, useFieldArray, useWatch } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import {
  CircleX,
  Crop,
  Edit2,
  File,
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

import useModal from '~/components/go-editor/hooks/useModal';
import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { Input } from '~/components/ui/input';
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
}

export default function ImageFocusCanvas({ imageId, name }: ImageFocusCanvasProps) {
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
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Track if we're editing existing region or creating new
  const [editingRegionIndex, setEditingRegionIndex] = useState<number | null>(null);

  // Crop settings
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [customAspectWidth, setCustomAspectWidth] = useState('16');
  const [customAspectHeight, setCustomAspectHeight] = useState('9');
  const [showGrid, setShowGrid] = useState(true);
  const [restrictPosition, setRestrictPosition] = useState(true);
  const [newRegionZoomScale, setNewRegionZoomScale] = useState(2);

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

  const onCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const handleStartNewRegion = () => {
    setEditingRegionIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setAspectRatio(undefined);
    setShowGrid(true);
    setRestrictPosition(true);
    setNewRegionZoomScale(2);
    setCurrentZoomLevel(1); // Reset view zoom when entering cropper
    setShowCropper(true);
  };

  const handleAspectRatioChange = (value: string) => {
    switch (value) {
      case 'free':
        setAspectRatio(undefined);
        break;
      case '1:1':
        setAspectRatio(1);
        break;
      case '4:3':
        setAspectRatio(4 / 3);
        break;
      case '16:9':
        setAspectRatio(16 / 9);
        break;
      case '3:2':
        setAspectRatio(3 / 2);
        break;
      case 'custom': {
        const width = parseFloat(customAspectWidth);
        const height = parseFloat(customAspectHeight);
        if (width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
        break;
      }
    }
  };

  const handleCropConfirm = () => {
    if (!croppedAreaPixels || !imageRef.current) return;

    const img = imageRef.current;
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    // croppedAreaPixels is in natural image pixels from react-easy-crop
    // Convert to percentages for storage
    const regionData = {
      x: (croppedAreaPixels.x / imgNaturalWidth) * 100,
      y: (croppedAreaPixels.y / imgNaturalHeight) * 100,
      width: (croppedAreaPixels.width / imgNaturalWidth) * 100,
      height: (croppedAreaPixels.height / imgNaturalHeight) * 100,
    };

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
        zoomScale: newRegionZoomScale,
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
    setCurrentZoomLevel(1); // Reset view zoom when exiting cropper
  };

  const handleEditRegionCrop = (index: number) => {
    const region = regions[index];
    if (!region || !imageRef.current) return;

    const imgNaturalWidth = imageRef.current.naturalWidth;
    const imgNaturalHeight = imageRef.current.naturalHeight;

    // Convert region percentages back to pixels for cropper
    const regionPixels = {
      x: (region.x / 100) * imgNaturalWidth,
      y: (region.y / 100) * imgNaturalHeight,
      width: (region.width / 100) * imgNaturalWidth,
      height: (region.height / 100) * imgNaturalHeight,
    };

    // Calculate aspect ratio from the region dimensions
    const regionAspectRatio = regionPixels.width / regionPixels.height;
    setAspectRatio(regionAspectRatio);

    // Set initial crop to center of the region
    setCrop({
      x: regionPixels.x + regionPixels.width / 2,
      y: regionPixels.y + regionPixels.height / 2,
    });

    // Set initial zoom
    setZoom(1);

    // Set the cropped area to the current region
    setCroppedAreaPixels(regionPixels);

    // Reset other settings
    setShowGrid(true);
    setRestrictPosition(true);
    setCurrentZoomLevel(1); // Reset view zoom when entering cropper

    setEditingRegionIndex(index);
    setShowCropper(true);
  };

  const handleSaveRegion = () => {
    setShowCropper(false);
    setEditingRegionIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCurrentZoomLevel(1); // Reset view zoom when exiting cropper
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

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div className='container mx-auto'>
          {showCropper ? (
            // CROPPER MODE: Define region boundaries + Configure
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
                {/* Main cropper area */}
                <div className='xl:col-span-2'>
                  <div className='bg-card relative h-[50vh] w-full overflow-hidden rounded-lg border shadow md:h-[60vh] xl:h-[70vh]'>
                    <Suspense
                      fallback={
                        <div className='flex h-full items-center justify-center'>
                          <Loader2 className='animate-spin' />
                        </div>
                      }
                    >
                      <Cropper
                        image={fileData.signed_url}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
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
                </div>

                {/* Settings panel */}
                <div className='space-y-4 xl:col-span-1'>
                  <div className='rounded-lg border p-3 shadow-sm md:p-4'>
                    <h3 className='mb-3 text-sm font-semibold md:mb-4'>Crop Settings</h3>

                    {/* Aspect Ratio */}
                    <div className='space-y-2'>
                      <Label className='text-xs font-medium md:text-sm'>Aspect Ratio</Label>
                      <Select
                        value={
                          aspectRatio === undefined
                            ? 'free'
                            : aspectRatio === 1
                              ? '1:1'
                              : aspectRatio === 4 / 3
                                ? '4:3'
                                : aspectRatio === 16 / 9
                                  ? '16:9'
                                  : aspectRatio === 3 / 2
                                    ? '3:2'
                                    : 'custom'
                        }
                        onValueChange={handleAspectRatioChange}
                      >
                        <SelectTrigger className='text-xs md:text-sm'>
                          <SelectValue placeholder='Select ratio' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='free'>Free</SelectItem>
                          <SelectItem value='1:1'>1:1 Square</SelectItem>
                          <SelectItem value='4:3'>4:3</SelectItem>
                          <SelectItem value='16:9'>16:9</SelectItem>
                          <SelectItem value='3:2'>3:2</SelectItem>
                          <SelectItem value='custom'>Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Aspect Ratio */}
                    {aspectRatio !== undefined &&
                    aspectRatio !== 1 &&
                    aspectRatio !== 4 / 3 &&
                    aspectRatio !== 16 / 9 &&
                    aspectRatio !== 3 / 2 ? (
                      <div className='space-y-2'>
                        <Label className='text-xs font-medium md:text-sm'>Custom</Label>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='number'
                            value={customAspectWidth}
                            onChange={(e) => {
                              setCustomAspectWidth(e.target.value);
                              const width = parseFloat(e.target.value);
                              const height = parseFloat(customAspectHeight);
                              if (width > 0 && height > 0) {
                                setAspectRatio(width / height);
                              }
                            }}
                            className='w-16 text-xs md:text-sm'
                            min='1'
                          />
                          <span className='text-muted-foreground text-xs'>:</span>
                          <Input
                            type='number'
                            value={customAspectHeight}
                            onChange={(e) => {
                              setCustomAspectHeight(e.target.value);
                              const width = parseFloat(customAspectWidth);
                              const height = parseFloat(e.target.value);
                              if (width > 0 && height > 0) {
                                setAspectRatio(width / height);
                              }
                            }}
                            className='w-16 text-xs md:text-sm'
                            min='1'
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Zoom */}
                    <div className='space-y-2'>
                      <Label className='text-xs font-medium md:text-sm'>
                        Zoom: {zoom.toFixed(1)}x
                      </Label>
                      <Slider
                        value={[zoom]}
                        onValueChange={([z]) => setZoom(z ?? 1)}
                        min={1}
                        max={10}
                        step={0.1}
                      />
                    </div>

                    {/* Display Options */}
                    <div className='space-y-2 border-t pt-3 md:space-y-3 md:pt-4'>
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

                    {/* Region Info */}
                    {croppedAreaPixels && (
                      <div className='bg-muted/50 space-y-1 rounded-md border p-2'>
                        <div className='text-xs font-medium'>Selected</div>
                        <div className='text-muted-foreground text-xs'>
                          {Math.round(croppedAreaPixels.width)} ×{' '}
                          {Math.round(croppedAreaPixels.height)}px
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Region Content Form - appears after crop is selected */}
              {editingRegionIndex !== null && (
                <div className='rounded-lg border p-4 shadow-sm'>
                  <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-sm font-semibold'>
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

                  <div className='space-y-4'>
                    {/* Region Details */}
                    {editingRegionIndex < regions.length &&
                      imageRef.current &&
                      regions[editingRegionIndex] && (
                        <div className='bg-muted/50 space-y-2 rounded-lg border p-3'>
                          <div className='text-sm font-medium'>Region Details</div>
                          <div className='text-muted-foreground grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              X:{' '}
                              {Math.round(
                                (regions[editingRegionIndex].x / 100) *
                                  imageRef.current.naturalWidth,
                              )}
                              px ({regions[editingRegionIndex].x.toFixed(2)}%)
                            </div>
                            <div>
                              Y:{' '}
                              {Math.round(
                                (regions[editingRegionIndex].y / 100) *
                                  imageRef.current.naturalHeight,
                              )}
                              px ({regions[editingRegionIndex].y.toFixed(2)}%)
                            </div>
                            <div>
                              Width:{' '}
                              {Math.round(
                                (regions[editingRegionIndex].width / 100) *
                                  imageRef.current.naturalWidth,
                              )}
                              px ({regions[editingRegionIndex].width.toFixed(2)}%)
                            </div>
                            <div>
                              Height:{' '}
                              {Math.round(
                                (regions[editingRegionIndex].height / 100) *
                                  imageRef.current.naturalHeight,
                              )}
                              px ({regions[editingRegionIndex].height.toFixed(2)}%)
                            </div>
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            Image: {imageRef.current.naturalWidth} ×{' '}
                            {imageRef.current.naturalHeight}
                            px
                          </div>
                        </div>
                      )}

                    {/* Zoom Scale */}
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>
                        Zoom Scale:{' '}
                        {editingRegionIndex !== null && editingRegionIndex < regions.length
                          ? `${regions[editingRegionIndex]?.zoomScale || 2}x`
                          : `${newRegionZoomScale}x`}
                      </Label>
                      <Slider
                        value={[
                          editingRegionIndex !== null && editingRegionIndex < regions.length
                            ? regions[editingRegionIndex]?.zoomScale || 2
                            : newRegionZoomScale,
                        ]}
                        onValueChange={([scale]) => {
                          if (editingRegionIndex !== null && editingRegionIndex < regions.length) {
                            setValue(`${name}.${editingRegionIndex}.zoomScale`, scale ?? 2, {
                              shouldDirty: true,
                            });
                          } else {
                            setNewRegionZoomScale(scale ?? 2);
                          }
                        }}
                        min={1}
                        max={5}
                        step={0.5}
                      />
                      <p className='text-muted-foreground text-xs'>
                        Controls how much to zoom when revealing this region in play mode
                      </p>
                    </div>

                    <GoRichTextInputField
                      name={`${name}.${editingRegionIndex}.answerState`}
                      labelProps={{ children: 'Answer', required: true }}
                      placeholder='Enter the answer to reveal...'
                    />

                    <div className='space-y-2'>
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
                              '',
                              <File />,
                              'lg',
                            );
                          }}
                        >
                          Add audio
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                {editingRegionIndex !== null && editingRegionIndex < regions.length && (
                  <Button
                    onClick={handleSaveRegion}
                    className='w-full sm:w-auto'
                    disabled={
                      !regions[editingRegionIndex]?.answerState ||
                      regions[editingRegionIndex].answerState === EMPTY_LEXICAL_STATE
                    }
                  >
                    Save &amp; Close
                  </Button>
                )}
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
                                'absolute cursor-pointer border-2 transition-all',
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
                                  'absolute top-1 left-1 rounded px-1.5 py-0.5 text-xs font-semibold',
                                  hasAnswer ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
                                )}
                              >
                                {index + 1}
                              </div>
                              <Edit2
                                className={cn(
                                  'absolute top-1 right-1',
                                  hasAnswer ? 'text-green-500' : 'text-red-500',
                                )}
                                size={14}
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
                  {modal}
                </>
              )}
            </TransformWrapper>
          )}
        </div>
      )}
    />
  );
}
