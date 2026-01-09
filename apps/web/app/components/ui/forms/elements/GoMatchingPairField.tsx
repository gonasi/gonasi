/**
 * GoMatchingPairField - Field for managing matching game pairs
 *
 * Features:
 * - Add/Edit/Delete pairs with left and right content
 * - Each pair has leftIndex and rightIndex for custom ordering
 * - Support for both rich text and media assets
 * - Display settings for asset cards
 *
 * Future Enhancement:
 * - Drag-and-drop reordering for left and right items independently
 * - When implementing drag-and-drop:
 *   1. Use @dnd-kit/core for drag-and-drop functionality
 *   2. Add separate drag handles for left and right items
 *   3. Update leftIndex/rightIndex on drop
 *   4. Reindex all items after reordering to maintain sequential indexes
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Edit, FileIcon, Plus, RefreshCw, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { FileType } from '@gonasi/schemas/file';
import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';
import type { MatchingPairSchemaTypes } from '@gonasi/schemas/plugins/schemas/matchingGame';

import { Badge } from '../../badge';
import { Button, IconTooltipButton } from '../../button';
import { Checkbox } from '../../checkbox';
import { Label, type LabelProps } from '../../label';
import { Modal } from '../../modal';
import { ErrorDisplay, FormDescription } from './Common';
import { GoRichTextInputField } from './GoRichTextInputField';
import { GoSelectInputField } from './GoSelectInputField';

import { DocumentPreviewCard } from '~/components/file-renderers/preview-cards/document-preview-card';
import { FileCard } from '~/components/file-renderers/preview-cards/file-preview-card';
import { ImagePreviewCard } from '~/components/file-renderers/preview-cards/image-preview-card';
import { MediaPreviewCard } from '~/components/file-renderers/preview-cards/media-preview-card';
import { ModelPreviewCard } from '~/components/file-renderers/preview-cards/model-preview-card';
import useModal from '~/components/go-editor/hooks/useModal';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import { AssetRenderer } from '~/components/plugins/common/AssetRenderer';
import InsertMediaDialog from '~/components/plugins/MediaInteraction/common/InsertMediaDialog';
import { cn } from '~/lib/utils';
import type { SearchFileResult } from '~/routes/api/search-files';

interface GoMatchingPairFieldProps {
  name: string;
  description?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  maxPairs?: number;
  minPairs?: number;
}

// Asset preview component
function AssetPreview({ assetId }: { assetId: string }) {
  const [fileData, setFileData] = useState<SearchFileResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/files/${assetId}/signed-url?mode=preview`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFileData(data.data);
        }
      })
      .catch((error) => {
        console.error('Failed to load asset:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [assetId]);

  if (loading) return <Spinner />;
  if (!fileData) return <div className='text-muted-foreground text-sm'>Asset not found</div>;

  switch (fileData.file_type) {
    case FileType.IMAGE:
      return <ImagePreviewCard file={fileData} />;

    case FileType.VIDEO:
    case FileType.AUDIO:
      return <MediaPreviewCard file={fileData} />;

    case FileType.DOCUMENT:
      return <DocumentPreviewCard file={fileData} />;

    case FileType.MODEL_3D:
      return <ModelPreviewCard file={fileData} />;

    default:
      return <FileCard file={fileData} />;
  }
}

// Asset Preview Component with Real-time Display Settings
function AssetPreviewWithSettings({
  assetId,
  displaySettings,
}: {
  assetId: string;
  displaySettings?: any;
}) {
  const [fileData, setFileData] = useState<SearchFileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!assetId) {
      setLoading(false);
      return;
    }

    const fetchAsset = async (attempt: number = 0) => {
      const maxRetries = 3;
      const retryDelay = 1000;

      setLoading(true);
      setError(null);

      try {
        const controller = new AbortController();
        const timeout = 15000; // 15 seconds for preview
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`/api/files/${assetId}/signed-url?mode=preview`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setFileData(data.data);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load asset data');
        }
      } catch (err) {
        const isTimeout = err instanceof Error && err.name === 'AbortError';
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        console.error(`[AssetPreview] Failed to load (attempt ${attempt + 1}/${maxRetries}):`, {
          assetId,
          error: errorMessage,
          isTimeout,
        });

        if (attempt < maxRetries - 1) {
          setTimeout(() => {
            setRetryCount(attempt + 1);
            fetchAsset(attempt + 1);
          }, retryDelay * (attempt + 1));
        } else {
          setError(
            isTimeout
              ? 'Timeout loading asset. The file may be too large.'
              : `Failed to load: ${errorMessage}`,
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAsset(retryCount);
  }, [assetId, retryCount]);

  if (loading) {
    return (
      <div className='bg-muted/30 relative mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-lg border p-4'>
        <Spinner />
        <p className='text-muted-foreground text-xs'>Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-muted/30 relative mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-lg border p-4'>
        <FileIcon className='text-destructive h-8 w-8' />
        <p className='text-destructive text-center text-xs'>{error}</p>
        <button
          type='button'
          onClick={() => setRetryCount(0)}
          className='text-primary hover:text-primary/80 flex items-center gap-1 text-xs underline'
        >
          <RefreshCw className='h-3 w-3' />
          Retry
        </button>
      </div>
    );
  }

  if (!fileData) return null;

  // Map SearchFileResult to the format expected by AssetRenderer
  const assetFile = {
    id: fileData.id,
    name: fileData.name,
    signed_url: fileData.signed_url,
    file_type: fileData.file_type as FileType,
    extension: fileData.extension,
    blur_url: fileData.blur_url,
    settings: fileData.settings as any,
  };

  return (
    <div className='bg-muted/30 relative mt-4 rounded-lg border p-4'>
      <Label className='mb-2 text-xs font-medium'>Live Preview</Label>
      <div
        className={cn(
          'bg-background relative h-32 w-full overflow-hidden rounded-md',
          // Apply display settings to preview container
          displaySettings?.noBorder ? 'border-0' : 'border',
          displaySettings?.noPadding ? 'p-0' : 'p-2',
        )}
      >
        <AssetRenderer file={assetFile} displaySettings={displaySettings} />
      </div>
      <p className='text-muted-foreground mt-2 text-xs'>
        ✨ Preview updates in real-time as you change settings
      </p>
    </div>
  );
}

// Pair Editor Modal Component
function PairEditorModal({
  isOpen,
  onClose,
  name,
  currentPair,
  watch,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  currentPair: { pair: MatchingPairSchemaTypes; index: number; isNew: boolean } | null;
  watch: any;
}) {
  const { setValue } = useRemixFormContext();
  const [modal, showModal] = useModal();
  const previousLeftTypeRef = useRef<'richtext' | 'asset' | null>(null);
  const previousRightTypeRef = useRef<'richtext' | 'asset' | null>(null);

  // Get values before early return (but guard against null)
  const leftContentType = currentPair
    ? watch(`${name}.${currentPair.index}.leftContentData.type`)
    : null;
  const rightContentType = currentPair
    ? watch(`${name}.${currentPair.index}.rightContentData.type`)
    : null;
  const leftAssetId = currentPair
    ? watch(`${name}.${currentPair.index}.leftContentData.assetId`)
    : null;
  const rightAssetId = currentPair
    ? watch(`${name}.${currentPair.index}.rightContentData.assetId`)
    : null;

  // Watch display settings for real-time preview updates
  const leftDisplaySettings = currentPair
    ? watch(`${name}.${currentPair.index}.leftContentData.displaySettings`)
    : null;
  const rightDisplaySettings = currentPair
    ? watch(`${name}.${currentPair.index}.rightContentData.displaySettings`)
    : null;

  // Handle left content type changes
  useEffect(() => {
    if (!currentPair) return;

    if (previousLeftTypeRef.current !== null && previousLeftTypeRef.current !== leftContentType) {
      if (leftContentType === 'richtext') {
        setValue(
          `${name}.${currentPair.index}.leftContentData`,
          {
            type: 'richtext',
            content: EMPTY_LEXICAL_STATE,
          },
          { shouldDirty: true },
        );
      } else if (leftContentType === 'asset') {
        setValue(
          `${name}.${currentPair.index}.leftContentData`,
          {
            type: 'asset',
            assetId: '',
            fileType: FileType.IMAGE,
          },
          { shouldDirty: true },
        );
      }
    }
    previousLeftTypeRef.current = leftContentType;
  }, [leftContentType, name, currentPair, setValue]);

  // Handle right content type changes
  useEffect(() => {
    if (!currentPair) return;

    if (previousRightTypeRef.current !== null && previousRightTypeRef.current !== rightContentType) {
      if (rightContentType === 'richtext') {
        setValue(
          `${name}.${currentPair.index}.rightContentData`,
          {
            type: 'richtext',
            content: EMPTY_LEXICAL_STATE,
          },
          { shouldDirty: true },
        );
      } else if (rightContentType === 'asset') {
        setValue(
          `${name}.${currentPair.index}.rightContentData`,
          {
            type: 'asset',
            assetId: '',
            fileType: FileType.IMAGE,
          },
          { shouldDirty: true },
        );
      }
    }
    previousRightTypeRef.current = rightContentType;
  }, [rightContentType, name, currentPair, setValue]);

  // Early return after all hooks
  if (!currentPair) return null;

  const handleAssetSelect = (side: 'left' | 'right') => {
    showModal(
      'Select Media Asset',
      (onModalClose) => (
        <Suspense fallback={<Spinner />}>
          <InsertMediaDialog
            fileTypes={[FileType.IMAGE, FileType.AUDIO, FileType.MODEL_3D]}
            handleImageInsert={(file: SearchFileResult) => {
              const fieldName =
                side === 'left'
                  ? `${name}.${currentPair.index}.leftContentData`
                  : `${name}.${currentPair.index}.rightContentData`;
              setValue(`${fieldName}.assetId`, file.id, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue(`${fieldName}.fileType`, file.file_type, {
                shouldDirty: true,
              });
              onModalClose();
            }}
          />
        </Suspense>
      ),
      '',
      <FileIcon />,
      'lg',
    );
  };

  return (
    <>
      {modal}
      <Modal open={isOpen} onOpenChange={onClose}>
        <Modal.Content size='lg'>
          <Modal.Header title={`${currentPair.isNew ? 'Create' : 'Edit'} Pair`} />
          <Modal.Body>
            <div className='space-y-6'>
              {/* Left Item */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='font-semibold'>Left Item</h3>

                <GoSelectInputField
                  name={`${name}.${currentPair.index}.leftContentData.type`}
                  labelProps={{ children: 'Content Type', required: true }}
                  description='Choose between rich text or a media asset'
                  selectProps={{
                    options: [
                      { value: 'richtext', label: '📝 Rich Text' },
                      { value: 'asset', label: '🎨 Media Asset' },
                    ],
                  }}
                />

                {leftContentType === 'richtext' ? (
                  <GoRichTextInputField
                    name={`${name}.${currentPair.index}.leftContentData.content`}
                    labelProps={{ children: 'Content', required: true }}
                    placeholder='Enter left item content...'
                  />
                ) : (
                  <>
                    <div className='space-y-2'>
                      <Label>Media Asset</Label>
                      <Button
                        type='button'
                        leftIcon={leftAssetId ? <Edit /> : <Plus />}
                        onClick={() => handleAssetSelect('left')}
                        variant='secondary'
                      >
                        {leftAssetId ? 'Change Asset' : 'Select Asset'}
                      </Button>
                    </div>

                    <div className='space-y-3 border-t pt-4'>
                      <h4 className='text-sm font-medium'>Display Settings</h4>

                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`${name}.${currentPair.index}.leftContentData.displaySettings.noPadding`}
                          onCheckedChange={(checked) => {
                            setValue(
                              `${name}.${currentPair.index}.leftContentData.displaySettings.noPadding`,
                              checked,
                              { shouldDirty: true },
                            );
                          }}
                          checked={
                            watch(
                              `${name}.${currentPair.index}.leftContentData.displaySettings.noPadding`,
                            ) ?? false
                          }
                        />
                        <Label
                          htmlFor={`${name}.${currentPair.index}.leftContentData.displaySettings.noPadding`}
                          className='text-sm font-normal'
                        >
                          Remove padding
                        </Label>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`${name}.${currentPair.index}.leftContentData.displaySettings.noBorder`}
                          onCheckedChange={(checked) => {
                            setValue(
                              `${name}.${currentPair.index}.leftContentData.displaySettings.noBorder`,
                              checked,
                              { shouldDirty: true },
                            );
                          }}
                          checked={
                            watch(
                              `${name}.${currentPair.index}.leftContentData.displaySettings.noBorder`,
                            ) ?? false
                          }
                        />
                        <Label
                          htmlFor={`${name}.${currentPair.index}.leftContentData.displaySettings.noBorder`}
                          className='text-sm font-normal'
                        >
                          Remove border
                        </Label>
                      </div>

                      <GoSelectInputField
                        name={`${name}.${currentPair.index}.leftContentData.displaySettings.objectFit`}
                        labelProps={{ children: 'Object Fit' }}
                        selectProps={{
                          options: [
                            { value: 'contain', label: 'Contain (fit all)' },
                            { value: 'cover', label: 'Cover (fill, may crop)' },
                            { value: 'fill', label: 'Fill (stretch)' },
                          ],
                        }}
                      />

                      <GoSelectInputField
                        name={`${name}.${currentPair.index}.leftContentData.displaySettings.aspectRatio`}
                        labelProps={{ children: 'Aspect Ratio' }}
                        selectProps={{
                          options: [
                            { value: 'auto', label: 'Auto (preserve original)' },
                            { value: '1/1', label: 'Square (1:1)' },
                            { value: '16/9', label: 'Landscape (16:9)' },
                            { value: '4/3', label: 'Standard (4:3)' },
                            { value: '3/4', label: 'Portrait (3:4)' },
                          ],
                        }}
                      />
                    </div>

                    {/* Real-time Asset Preview */}
                    {leftAssetId && (
                      <AssetPreviewWithSettings
                        assetId={leftAssetId}
                        displaySettings={leftDisplaySettings}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Right Item */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='font-semibold'>Right Item</h3>

                <GoSelectInputField
                  name={`${name}.${currentPair.index}.rightContentData.type`}
                  labelProps={{ children: 'Content Type', required: true }}
                  description='Choose between rich text or a media asset'
                  selectProps={{
                    options: [
                      { value: 'richtext', label: '📝 Rich Text' },
                      { value: 'asset', label: '🎨 Media Asset' },
                    ],
                  }}
                />

                {rightContentType === 'richtext' ? (
                  <GoRichTextInputField
                    name={`${name}.${currentPair.index}.rightContentData.content`}
                    labelProps={{ children: 'Content', required: true }}
                    placeholder='Enter right item content...'
                  />
                ) : (
                  <>
                    <div className='space-y-2'>
                      <Label>Media Asset</Label>
                      <Button
                        type='button'
                        leftIcon={rightAssetId ? <Edit /> : <Plus />}
                        onClick={() => handleAssetSelect('right')}
                        variant='secondary'
                      >
                        {rightAssetId ? 'Change Asset' : 'Select Asset'}
                      </Button>
                    </div>

                    <div className='space-y-3 border-t pt-4'>
                      <h4 className='text-sm font-medium'>Display Settings</h4>

                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`${name}.${currentPair.index}.rightContentData.displaySettings.noPadding`}
                          onCheckedChange={(checked) => {
                            setValue(
                              `${name}.${currentPair.index}.rightContentData.displaySettings.noPadding`,
                              checked,
                              { shouldDirty: true },
                            );
                          }}
                          checked={
                            watch(
                              `${name}.${currentPair.index}.rightContentData.displaySettings.noPadding`,
                            ) ?? false
                          }
                        />
                        <Label
                          htmlFor={`${name}.${currentPair.index}.rightContentData.displaySettings.noPadding`}
                          className='text-sm font-normal'
                        >
                          Remove padding
                        </Label>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`${name}.${currentPair.index}.rightContentData.displaySettings.noBorder`}
                          onCheckedChange={(checked) => {
                            setValue(
                              `${name}.${currentPair.index}.rightContentData.displaySettings.noBorder`,
                              checked,
                              { shouldDirty: true },
                            );
                          }}
                          checked={
                            watch(
                              `${name}.${currentPair.index}.rightContentData.displaySettings.noBorder`,
                            ) ?? false
                          }
                        />
                        <Label
                          htmlFor={`${name}.${currentPair.index}.rightContentData.displaySettings.noBorder`}
                          className='text-sm font-normal'
                        >
                          Remove border
                        </Label>
                      </div>

                      <GoSelectInputField
                        name={`${name}.${currentPair.index}.rightContentData.displaySettings.objectFit`}
                        labelProps={{ children: 'Object Fit' }}
                        selectProps={{
                          options: [
                            { value: 'contain', label: 'Contain (fit all)' },
                            { value: 'cover', label: 'Cover (fill, may crop)' },
                            { value: 'fill', label: 'Fill (stretch)' },
                          ],
                        }}
                      />

                      <GoSelectInputField
                        name={`${name}.${currentPair.index}.rightContentData.displaySettings.aspectRatio`}
                        labelProps={{ children: 'Aspect Ratio' }}
                        selectProps={{
                          options: [
                            { value: 'auto', label: 'Auto (preserve original)' },
                            { value: '1/1', label: 'Square (1:1)' },
                            { value: '16/9', label: 'Landscape (16:9)' },
                            { value: '4/3', label: 'Standard (4:3)' },
                            { value: '3/4', label: 'Portrait (3:4)' },
                          ],
                        }}
                      />
                    </div>

                    {/* Real-time Asset Preview */}
                    {rightAssetId && (
                      <AssetPreviewWithSettings
                        assetId={rightAssetId}
                        displaySettings={rightDisplaySettings}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end gap-2 border-t pt-4'>
                <Button type='button' onClick={onClose} variant='ghost'>
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={onClose}
                  variant='secondary'
                  disabled={
                    (leftContentType === 'asset' && !leftAssetId) ||
                    (rightContentType === 'asset' && !rightAssetId)
                  }
                >
                  {currentPair.isNew ? 'Create Pair' : 'Save Changes'}
                </Button>
              </div>

              {/* Validation message */}
              {((leftContentType === 'asset' && !leftAssetId) ||
                (rightContentType === 'asset' && !rightAssetId)) && (
                <p className='text-destructive mt-2 text-sm'>
                  Please select media assets for all asset-type content before saving
                </p>
              )}
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}

export function GoMatchingPairField({
  name,
  description,
  labelProps,
  minPairs = 2,
  maxPairs = 10,
}: GoMatchingPairFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove } = useFieldArray({
    control,
    name,
  });

  const pairs = (watch(name) as MatchingPairSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPair, setCurrentPair] = useState<{
    pair: MatchingPairSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addPair = () => {
    const newIndex = pairs.length;
    const newPair: MatchingPairSchemaTypes = {
      id: uuidv4(),
      leftContentData: {
        type: 'richtext',
        content: EMPTY_LEXICAL_STATE,
      },
      rightContentData: {
        type: 'richtext',
        content: EMPTY_LEXICAL_STATE,
      },
      leftIndex: newIndex,
      rightIndex: newIndex,
    };

    // Add the pair first
    append(newPair);

    // Open modal with the new pair data
    setCurrentPair({
      pair: newPair as MatchingPairSchemaTypes,
      index: newIndex,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  const editPair = (pairId: string) => {
    const index = pairs.findIndex((pair) => pair.id === pairId);
    if (index === -1) return;

    const pair = pairs[index];
    if (!pair) return;

    setCurrentPair({
      pair,
      index,
      isNew: false,
    });
    setIsModalOpen(true);
  };

  const removePair = (pairId: string) => {
    const index = pairs.findIndex((pair) => pair.id === pairId);
    if (index !== -1) {
      remove(index);
      // Note: Reindexing will be handled when drag-and-drop is implemented
      // For now, gaps in indexes are acceptable
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentPair(null);
  };

  const renderPair = (pair: MatchingPairSchemaTypes, index: number) => {
    return (
      <div key={pair.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Pair {index + 1}</span>
            <Badge variant='outline'>
              {pair.leftContentData.type === 'richtext' ? '📝' : '🎨'} Left
            </Badge>
            <Badge variant='outline'>
              {pair.rightContentData.type === 'richtext' ? '📝' : '🎨'} Right
            </Badge>
          </div>

          <div className='flex items-center space-x-2'>
            <IconTooltipButton
              type='button'
              title='Edit Pair'
              icon={Edit}
              onClick={() => editPair(pair.id)}
            />
            <IconTooltipButton
              title='Delete Pair'
              icon={Trash}
              onClick={() => removePair(pair.id)}
            />
          </div>
        </div>

        {/* Left and Right content preview */}
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <Label className='mb-2 text-xs'>Left Item</Label>
            <div className='border-border/80 bg-border/50 flex min-h-[60px] w-full items-center border p-2'>
              {pair.leftContentData.type === 'richtext' ? (
                <RichTextRenderer editorState={pair.leftContentData.content} />
              ) : (
                <AssetPreview assetId={pair.leftContentData.assetId} />
              )}
            </div>
            <p className='text-danger font-secondary text-xs'>
              <ErrorMessage errors={errors} name={`${name}.${index}.leftContentData`} />
            </p>
          </div>

          <div>
            <Label className='mb-2 text-xs'>Right Item</Label>
            <div className='border-border/80 bg-border/50 flex min-h-[60px] w-full items-center border p-2'>
              {pair.rightContentData.type === 'richtext' ? (
                <RichTextRenderer editorState={pair.rightContentData.content} />
              ) : (
                <AssetPreview assetId={pair.rightContentData.assetId} />
              )}
            </div>
            <p className='text-danger font-secondary text-xs'>
              <ErrorMessage errors={errors} name={`${name}.${index}.rightContentData`} />
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div>
          <Label htmlFor={id} error={hasError} {...labelProps} />

          <div className='space-y-4'>
            {/* Add Pair Button */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={() => addPair()}
                disabled={pairs.length >= maxPairs}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Pair
              </Button>
            </div>

            {/* Pairs List */}
            <div className='space-y-3'>{pairs.map((pair, index) => renderPair(pair, index))}</div>

            {pairs.length === 0 && (
              <div className='text-muted-foreground rounded-lg border-2 border-dashed border-gray-300 py-8 text-center'>
                <p className='text-sm'>No pairs added yet.</p>
                <p className='text-xs'>Add at least {minPairs} pairs to get started.</p>
              </div>
            )}

            {/* Constraints Info */}
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>
                Pairs: {pairs.length}/{maxPairs}
              </span>
              <span>Minimum: {minPairs} required</span>
            </div>
          </div>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>

          {/* Pair Editor Modal */}
          <PairEditorModal
            isOpen={isModalOpen}
            onClose={closeModal}
            name={name}
            currentPair={currentPair}
            watch={watch}
          />
        </div>
      )}
    />
  );
}
