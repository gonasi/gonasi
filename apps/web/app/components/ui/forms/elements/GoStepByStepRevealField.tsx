import { Suspense, useEffect, useRef, useState } from 'react';
import { Controller, get, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { Edit, FileIcon, Plus, Trash } from 'lucide-react';
import { useRemixFormContext } from 'remix-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { FileType } from '@gonasi/schemas/file';
import { EMPTY_LEXICAL_STATE, type StepByStepRevealCardSchemaTypes } from '@gonasi/schemas/plugins';

import { Button, IconTooltipButton } from '../../button';
import { Checkbox } from '../../checkbox';
import { Label, type LabelProps } from '../../label';
import { Modal } from '../../modal';
import { ErrorDisplay, FormDescription } from './Common';
import { GoRichTextInputField } from './GoRichTextInputField';
import { GoSelectInputField } from './GoSelectInputField';

import useModal from '~/components/go-editor/hooks/useModal';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Spinner } from '~/components/loaders';
import InsertMediaDialog from '~/components/plugins/MediaInteraction/common/InsertMediaDialog';
import type { SearchFileResult } from '~/routes/api/search-files';

interface GoStepByStepRevealFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  maxCards?: number;
  minCards?: number;
}

// Card Editor Modal Component
function CardEditorModal({
  isOpen,
  onClose,
  name,
  currentCard,
  watch,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  currentCard: { card: StepByStepRevealCardSchemaTypes; index: number; isNew: boolean } | null;
  watch: any;
}) {
  const { setValue } = useRemixFormContext();
  const [modal, showModal] = useModal();
  const frontPreviousTypeRef = useRef<'richtext' | 'asset' | null>(null);
  const backPreviousTypeRef = useRef<'richtext' | 'asset' | null>(null);

  // Get values before early return
  const frontContentType = currentCard
    ? watch(`${name}.${currentCard.index}.frontContentData.type`)
    : null;
  const frontAssetId = currentCard
    ? watch(`${name}.${currentCard.index}.frontContentData.assetId`)
    : null;
  const backContentType = currentCard
    ? watch(`${name}.${currentCard.index}.backContentData.type`)
    : null;
  const backAssetId = currentCard
    ? watch(`${name}.${currentCard.index}.backContentData.assetId`)
    : null;

  // Handle front content type changes
  useEffect(() => {
    if (!currentCard) return;

    if (
      frontPreviousTypeRef.current !== null &&
      frontPreviousTypeRef.current !== frontContentType
    ) {
      if (frontContentType === 'richtext') {
        setValue(
          `${name}.${currentCard.index}.frontContentData`,
          {
            type: 'richtext',
            content: EMPTY_LEXICAL_STATE,
          },
          { shouldDirty: true },
        );
      } else if (frontContentType === 'asset') {
        setValue(
          `${name}.${currentCard.index}.frontContentData`,
          {
            type: 'asset',
            assetId: '',
            fileType: FileType.IMAGE,
          },
          { shouldDirty: true },
        );
      }
    }
    frontPreviousTypeRef.current = frontContentType;
  }, [frontContentType, name, currentCard, setValue]);

  // Handle back content type changes
  useEffect(() => {
    if (!currentCard) return;

    if (backPreviousTypeRef.current !== null && backPreviousTypeRef.current !== backContentType) {
      if (backContentType === 'richtext') {
        setValue(
          `${name}.${currentCard.index}.backContentData`,
          {
            type: 'richtext',
            content: EMPTY_LEXICAL_STATE,
          },
          { shouldDirty: true },
        );
      } else if (backContentType === 'asset') {
        setValue(
          `${name}.${currentCard.index}.backContentData`,
          {
            type: 'asset',
            assetId: '',
            fileType: FileType.IMAGE,
          },
          { shouldDirty: true },
        );
      }
    }
    backPreviousTypeRef.current = backContentType;
  }, [backContentType, name, currentCard, setValue]);

  // Early return after all hooks
  if (!currentCard) return null;

  const handleAssetSelect = (side: 'front' | 'back') => {
    showModal(
      `Select ${side === 'front' ? 'Front' : 'Revealed'} Asset`,
      (onModalClose) => (
        <Suspense fallback={<Spinner />}>
          <InsertMediaDialog
            handleImageInsert={(file: SearchFileResult) => {
              setValue(
                `${name}.${currentCard.index}.${side}ContentData.assetId`,
                file.id,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              );
              setValue(
                `${name}.${currentCard.index}.${side}ContentData.fileType`,
                file.file_type,
                {
                  shouldDirty: true,
                },
              );
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

  const renderContentFields = (
    side: 'front' | 'back',
    contentType: string,
    assetId: string | null,
  ) => (
    <>
      {/* Content Type Selection */}
      <GoSelectInputField
        name={`${name}.${currentCard.index}.${side}ContentData.type`}
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
          name={`${name}.${currentCard.index}.${side}ContentData.content`}
          labelProps={{ children: 'Content', required: true }}
          placeholder={`Enter ${side} content...`}
        />
      ) : (
        <>
          {/* Asset Selection */}
          <div className='space-y-2'>
            <Label>Media Asset</Label>
            <Button
              type='button'
              leftIcon={assetId ? <Edit /> : <Plus />}
              onClick={() => handleAssetSelect(side)}
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
                id={`${name}.${currentCard.index}.${side}ContentData.displaySettings.noPadding`}
                onCheckedChange={(checked) => {
                  setValue(
                    `${name}.${currentCard.index}.${side}ContentData.displaySettings.noPadding`,
                    checked,
                    { shouldDirty: true },
                  );
                }}
                checked={
                  watch(
                    `${name}.${currentCard.index}.${side}ContentData.displaySettings.noPadding`,
                  ) ?? false
                }
              />
              <Label
                htmlFor={`${name}.${currentCard.index}.${side}ContentData.displaySettings.noPadding`}
                className='text-sm font-normal'
              >
                Remove padding
              </Label>
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id={`${name}.${currentCard.index}.${side}ContentData.displaySettings.noBorder`}
                onCheckedChange={(checked) => {
                  setValue(
                    `${name}.${currentCard.index}.${side}ContentData.displaySettings.noBorder`,
                    checked,
                    { shouldDirty: true },
                  );
                }}
                checked={
                  watch(
                    `${name}.${currentCard.index}.${side}ContentData.displaySettings.noBorder`,
                  ) ?? false
                }
              />
              <Label
                htmlFor={`${name}.${currentCard.index}.${side}ContentData.displaySettings.noBorder`}
                className='text-sm font-normal'
              >
                Remove border
              </Label>
            </div>

            <GoSelectInputField
              name={`${name}.${currentCard.index}.${side}ContentData.displaySettings.objectFit`}
              labelProps={{ children: 'Object Fit' }}
              description='How the asset should fit'
              selectProps={{
                options: [
                  { value: 'contain', label: 'Contain (fit all)' },
                  { value: 'cover', label: 'Cover (fill, may crop)' },
                  { value: 'fill', label: 'Fill (stretch)' },
                ],
              }}
            />

            <GoSelectInputField
              name={`${name}.${currentCard.index}.${side}ContentData.displaySettings.aspectRatio`}
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
    </>
  );

  return (
    <>
      {modal}
      <Modal open={isOpen} onOpenChange={onClose}>
        <Modal.Content size='lg'>
          <Modal.Header title={`${currentCard.isNew ? 'Create' : 'Edit'} Card`} />
          <Modal.Body>
            <div className='space-y-6'>
              {/* Front Content */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='font-medium'>Front Content</h3>
                {renderContentFields('front', frontContentType, frontAssetId)}
              </div>

              {/* Back (Revealed) Content */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='font-medium'>Revealed Content (Back)</h3>
                {renderContentFields('back', backContentType, backAssetId)}
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
                    (frontContentType === 'asset' && !frontAssetId) ||
                    (backContentType === 'asset' && !backAssetId)
                  }
                >
                  {currentCard.isNew ? 'Create Card' : 'Save Changes'}
                </Button>
              </div>

              {/* Validation messages */}
              {((frontContentType === 'asset' && !frontAssetId) ||
                (backContentType === 'asset' && !backAssetId)) && (
                <p className='text-destructive mt-2 text-sm'>
                  Please select assets for all asset-type content before saving
                </p>
              )}
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}

export function GoStepByStepRevealField({
  name,
  description,
  className,
  labelProps,
  minCards = 1,
  maxCards = 10,
}: GoStepByStepRevealFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useRemixFormContext();

  const { append, remove } = useFieldArray({
    control,
    name,
  });

  const cards = (watch(name) as StepByStepRevealCardSchemaTypes[]) || [];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<{
    card: StepByStepRevealCardSchemaTypes;
    index: number;
    isNew: boolean;
  } | null>(null);

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  const addCard = () => {
    const newCard: StepByStepRevealCardSchemaTypes = {
      id: uuidv4(),
      frontContentData: {
        type: 'richtext',
        content: EMPTY_LEXICAL_STATE,
      },
      backContentData: {
        type: 'richtext',
        content: EMPTY_LEXICAL_STATE,
      },
    };

    append(newCard);

    const newIndex = cards.length;
    setCurrentCard({
      card: newCard,
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
        return (
          <div className='relative h-full w-full'>
            <img
              src={fileData.signed_url}
              alt={fileData.name}
              className='h-full w-full object-contain'
              loading='lazy'
            />
          </div>
        );

      case FileType.VIDEO:
        return (
          <video
            src={fileData.signed_url}
            className='h-full w-full object-contain'
            controls={false}
            muted
            preload='metadata'
          />
        );

      case FileType.AUDIO:
        return (
          <div className='flex items-center gap-2'>
            <svg className='h-8 w-8' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z' />
            </svg>
            <span className='truncate text-sm'>{fileData.name}</span>
          </div>
        );

      default:
        return (
          <div className='flex items-center gap-2'>
            <FileIcon size={16} />
            <span className='truncate text-sm'>{fileData.name}</span>
          </div>
        );
    }
  };

  const renderCard = (card: StepByStepRevealCardSchemaTypes, index: number) => {
    return (
      <div key={card.id} className='bg-card/20 border-border space-y-3 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Card {index + 1}</span>
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
              disabled={cards.length <= minCards}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex flex-col items-center justify-center space-y-2 space-x-0 md:flex-row md:space-y-0 md:space-x-4'>
            {/* Front Content */}
            <div className='w-full'>
              <Label className='text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium'>
                Front Content
                <span className='bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs'>
                  {card.frontContentData.type === 'richtext' ? '📝' : '🎨'}
                </span>
              </Label>
              <div className='border-border/80 bg-border/50 flex h-70 w-60 items-center justify-center rounded border p-2'>
                {card.frontContentData.type === 'richtext' ? (
                  <RichTextRenderer editorState={card.frontContentData.content} />
                ) : (
                  <AssetPreview assetId={card.frontContentData.assetId} />
                )}
              </div>
              <div className='space-y-1'>
                <ErrorMessage
                  errors={errors}
                  name={`${name}.${index}.frontContentData`}
                  render={({ message }) => (
                    <p className='text-danger font-secondary text-xs'>{message}</p>
                  )}
                />
              </div>
            </div>

            {/* Back Content */}
            <div className='w-full'>
              <Label className='text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium'>
                Revealed Content
                <span className='bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs'>
                  {card.backContentData.type === 'richtext' ? '📝' : '🎨'}
                </span>
              </Label>
              <div className='border-border/80 bg-border/50 flex h-70 w-60 items-center justify-center rounded border p-2'>
                {card.backContentData.type === 'richtext' ? (
                  <RichTextRenderer editorState={card.backContentData.content} />
                ) : (
                  <AssetPreview assetId={card.backContentData.assetId} />
                )}
              </div>
              <div className='space-y-1'>
                <ErrorMessage
                  errors={errors}
                  name={`${name}.${index}.backContentData`}
                  render={({ message }) => (
                    <p className='text-danger font-secondary text-xs'>{message}</p>
                  )}
                />
              </div>
            </div>
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
        <div className={className}>
          <Label htmlFor={id} error={hasError} {...labelProps} />

          <div className='space-y-4'>
            {/* Add Card Button */}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={addCard}
                disabled={cards.length >= maxCards}
                leftIcon={<Plus />}
                variant='secondary'
                size='sm'
              >
                Add Card ({cards.length}/{maxCards})
              </Button>
            </div>

            {/* Cards List */}
            <div className='space-y-3'>{cards.map((card, index) => renderCard(card, index))}</div>

            {/* Error and Description */}
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
          />
        </div>
      )}
    />
  );
}
