/**
 * GoCardField - Field for managing swipe categorize cards
 *
 * Features:
 * - Add/Edit/Delete cards with content and correct category
 * - Each card has an index for ordering
 * - Category selection dropdown (left/right)
 * - Rich text content editing OR media asset selection
 * - Display settings for asset cards
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { ArrowLeft, ArrowRight, Edit, FileIcon, Plus, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { FileType } from '@gonasi/schemas/file';
import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';
import type { CardSchemaTypes } from '@gonasi/schemas/plugins/schemas/swipeCategorize';

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
import InsertMediaDialog from '~/components/plugins/MediaInteraction/common/InsertMediaDialog';
import type { SearchFileResult } from '~/routes/api/search-files';

interface GoCardFieldProps {
  name: string;
  description?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  maxCards?: number;
  minCards?: number;
  leftLabel?: string;
  rightLabel?: string;
}

// Card Editor Modal Component
function CardEditorModal({
  isOpen,
  onClose,
  name,
  currentCard,
  watch,
  leftLabel = 'Left',
  rightLabel = 'Right',
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  currentCard: { card: CardSchemaTypes; index: number; isNew: boolean } | null;
  watch: any;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const { setValue } = useRemixFormContext();
  const [modal, showModal] = useModal();
  const previousTypeRef = useRef<'richtext' | 'asset' | null>(null);

  // Get values before early return (but guard against null)
  const contentType = currentCard ? watch(`${name}.${currentCard.index}.contentData.type`) : null;
  const assetId = currentCard ? watch(`${name}.${currentCard.index}.contentData.assetId`) : null;

  // Handle content type changes
  useEffect(() => {
    if (!currentCard) return;

    // Only run when type actually changes (not on initial render)
    if (previousTypeRef.current !== null && previousTypeRef.current !== contentType) {
      if (contentType === 'richtext') {
        // Switching to richtext - replace with richtext structure
        setValue(
          `${name}.${currentCard.index}.contentData`,
          {
            type: 'richtext',
            content: EMPTY_LEXICAL_STATE,
          },
          { shouldDirty: true },
        );
      } else if (contentType === 'asset') {
        // Switching to asset - replace with asset structure
        setValue(
          `${name}.${currentCard.index}.contentData`,
          {
            type: 'asset',
            assetId: '',
            fileType: FileType.IMAGE,
          },
          { shouldDirty: true },
        );
      }
    }
    previousTypeRef.current = contentType;
  }, [contentType, name, currentCard, setValue]);

  // Early return after all hooks
  if (!currentCard) return null;

  const handleAssetSelect = () => {
    showModal(
      'Select Media Asset',
      (onModalClose) => (
        <Suspense fallback={<Spinner />}>
          <InsertMediaDialog
            fileTypes={[FileType.IMAGE, FileType.AUDIO, FileType.MODEL_3D]}
            handleImageInsert={(file: SearchFileResult) => {
              setValue(`${name}.${currentCard.index}.contentData.assetId`, file.id, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue(`${name}.${currentCard.index}.contentData.fileType`, file.file_type, {
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
          <Modal.Header title={`${currentCard.isNew ? 'Create' : 'Edit'} Card`} />
          <Modal.Body>
            <div className='space-y-4'>
              {/* Content Type Selection */}
              <GoSelectInputField
                name={`${name}.${currentCard.index}.contentData.type`}
                labelProps={{ children: 'Content Type', required: true }}
                description='Choose between rich text or a media asset'
                selectProps={{
                  options: [
                    { value: 'richtext', label: '📝 Rich Text' },
                    { value: 'asset', label: '🎨 Media Asset' },
                  ],
                }}
              />

              {/* Conditional Content Input */}
              {contentType === 'richtext' ? (
                <GoRichTextInputField
                  name={`${name}.${currentCard.index}.contentData.content`}
                  labelProps={{ children: 'Card Content', required: true }}
                  placeholder='Enter card content...'
                />
              ) : (
                <>
                  {/* Asset Selection */}
                  <div className='space-y-2'>
                    <Label>Media Asset</Label>
                    <Button
                      type='button'
                      leftIcon={assetId ? <Edit /> : <Plus />}
                      onClick={handleAssetSelect}
                      variant='secondary'
                    >
                      {assetId ? 'Change Asset' : 'Select Asset'}
                    </Button>
                  </div>

                  {/* Display Settings */}
                  <div className='space-y-3 border-t pt-4'>
                    <h4 className='text-sm font-medium'>Display Settings</h4>

                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id={`${name}.${currentCard.index}.contentData.displaySettings.noPadding`}
                        onCheckedChange={(checked) => {
                          setValue(
                            `${name}.${currentCard.index}.contentData.displaySettings.noPadding`,
                            checked,
                            { shouldDirty: true },
                          );
                        }}
                        checked={
                          watch(
                            `${name}.${currentCard.index}.contentData.displaySettings.noPadding`,
                          ) ?? false
                        }
                      />
                      <Label
                        htmlFor={`${name}.${currentCard.index}.contentData.displaySettings.noPadding`}
                        className='text-sm font-normal'
                      >
                        Remove padding (asset fills entire card)
                      </Label>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id={`${name}.${currentCard.index}.contentData.displaySettings.noBorder`}
                        onCheckedChange={(checked) => {
                          setValue(
                            `${name}.${currentCard.index}.contentData.displaySettings.noBorder`,
                            checked,
                            { shouldDirty: true },
                          );
                        }}
                        checked={
                          watch(
                            `${name}.${currentCard.index}.contentData.displaySettings.noBorder`,
                          ) ?? false
                        }
                      />
                      <Label
                        htmlFor={`${name}.${currentCard.index}.contentData.displaySettings.noBorder`}
                        className='text-sm font-normal'
                      >
                        Remove border (seamless display)
                      </Label>
                    </div>

                    <GoSelectInputField
                      name={`${name}.${currentCard.index}.contentData.displaySettings.objectFit`}
                      labelProps={{ children: 'Object Fit' }}
                      description='How the asset should fit within the card'
                      selectProps={{
                        options: [
                          { value: 'contain', label: 'Contain (fit all)' },
                          { value: 'cover', label: 'Cover (fill, may crop)' },
                          { value: 'fill', label: 'Fill (stretch)' },
                        ],
                      }}
                    />

                    <GoSelectInputField
                      name={`${name}.${currentCard.index}.contentData.displaySettings.aspectRatio`}
                      labelProps={{ children: 'Aspect Ratio' }}
                      description='Force specific aspect ratio'
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
                </>
              )}

              {/* Category Selection */}
              <GoSelectInputField
                name={`${name}.${currentCard.index}.correctCategory`}
                labelProps={{ children: 'Correct Category', required: true }}
                description='Which category should this card be swiped to?'
                selectProps={{
                  options: [
                    { value: 'left', label: `👈 ${leftLabel}` },
                    { value: 'right', label: `👉 ${rightLabel}` },
                  ],
                }}
              />

              {/* Action Buttons */}
              <div className='flex justify-end gap-2 border-t pt-4'>
                <Button type='button' onClick={onClose} variant='ghost'>
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={onClose}
                  variant='secondary'
                  disabled={contentType === 'asset' && !assetId}
                >
                  {currentCard.isNew ? 'Create Card' : 'Save Changes'}
                </Button>
              </div>

              {/* Validation message */}
              {contentType === 'asset' && !assetId && (
                <p className='text-destructive mt-2 text-sm'>
                  Please select a media asset before saving
                </p>
              )}
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}

export function GoCardField({
  name,
  description,
  labelProps,
  minCards = 3,
  maxCards = 20,
  leftLabel = 'Left',
  rightLabel = 'Right',
}: GoCardFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove } = useFieldArray({
    control,
    name,
  });

  const cards = (watch(name) as CardSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<{
    card: CardSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addCard = () => {
    const newIndex = cards.length;
    const newCard: CardSchemaTypes = {
      id: uuidv4(),
      contentData: {
        type: 'richtext',
        content: EMPTY_LEXICAL_STATE,
      },
      correctCategory: 'left',
      index: newIndex,
    };

    // Add the card first
    append(newCard);

    // Open modal with the new card data
    setCurrentCard({
      card: newCard as CardSchemaTypes,
      index: newIndex,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  const editCard = (cardId: string) => {
    const index = cards.findIndex((card) => card.id === cardId);
    if (index === -1) return;

    const card = cards[index];
    if (!card) return;

    setCurrentCard({
      card,
      index,
      isNew: false,
    });
    setIsModalOpen(true);
  };

  const removeCard = (cardId: string) => {
    const index = cards.findIndex((card) => card.id === cardId);
    if (index !== -1) {
      remove(index);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCard(null);
  };

  // Asset preview component
  const AssetPreview = ({ assetId }: { assetId: string }) => {
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
  };

  const renderCard = (card: CardSchemaTypes, index: number) => {
    return (
      <div key={card.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Card {index + 1}</span>
            <Badge variant='outline'>
              {card.contentData.type === 'richtext' ? '📝 Text' : '🎨 Asset'}
            </Badge>
            <Badge variant='outline'>
              {card.correctCategory === 'left' ? (
                <>
                  <ArrowLeft /> {leftLabel}
                </>
              ) : (
                <>
                  <ArrowRight /> {rightLabel}
                </>
              )}
            </Badge>
          </div>

          <div className='flex items-center space-x-2'>
            <IconTooltipButton
              type='button'
              title='Edit Card'
              icon={Edit}
              onClick={() => editCard(card.id)}
            />
            <IconTooltipButton
              title='Delete Card'
              icon={Trash}
              onClick={() => removeCard(card.id)}
            />
          </div>
        </div>

        {/* Card content preview */}
        <div>
          <Label className='mb-2 text-xs'>Content</Label>
          <div className='border-border/80 bg-border/50 flex min-h-[60px] w-full items-center border p-2'>
            {card.contentData.type === 'richtext' ? (
              <RichTextRenderer editorState={card.contentData.content} />
            ) : (
              <AssetPreview assetId={card.contentData.assetId} />
            )}
          </div>
          <p className='text-danger font-secondary text-xs'>
            <ErrorMessage errors={errors} name={`${name}.${index}.contentData`} />
          </p>
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
            {/* Add Card Button */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={() => addCard()}
                disabled={cards.length >= maxCards}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Card
              </Button>
            </div>

            {/* Cards List */}
            <div className='space-y-3'>{cards.map((card, index) => renderCard(card, index))}</div>

            {cards.length === 0 && (
              <div className='text-muted-foreground rounded-lg border-2 border-dashed border-gray-300 py-8 text-center'>
                <p className='text-sm'>No cards added yet.</p>
                <p className='text-xs'>Add at least {minCards} cards to get started.</p>
              </div>
            )}

            {/* Constraints Info */}
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>
                Cards: {cards.length}/{maxCards}
              </span>
              <span>Minimum: {minCards} required</span>
            </div>
          </div>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>

          {/* Card Editor Modal */}
          <CardEditorModal
            isOpen={isModalOpen}
            onClose={closeModal}
            name={name}
            currentCard={currentCard}
            watch={watch}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
        </div>
      )}
    />
  );
}
