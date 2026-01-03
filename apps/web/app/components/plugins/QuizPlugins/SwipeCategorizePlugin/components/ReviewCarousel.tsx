import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';
import type {
  CardSchemaTypes,
  SwipeCategorizeInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { AssetRenderer } from './AssetRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Badge } from '~/components/ui/badge';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
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

interface ReviewCarouselProps {
  cards: CardSchemaTypes[];
  state: SwipeCategorizeInteractionSchemaTypes;
  leftLabel: string;
  rightLabel: string;
  mode?: 'preview' | 'play';
}

interface CardResult {
  card: CardSchemaTypes;
  swipedTo: 'left' | 'right';
  wasCorrect: boolean;
  hadWrongAttempt: boolean;
}

// Card content renderer component
function CardContentRenderer({ card, mode = 'play' }: { card: CardSchemaTypes; mode?: 'preview' | 'play' }) {
  const [assetFile, setAssetFile] = useState<FileWithSignedUrl | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card.contentData.type === 'asset') {
      const assetId = card.contentData.assetId;
      setLoading(true);
      fetch(`/api/files/${assetId}/signed-url?mode=${mode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAssetFile(data.data);
          }
        })
        .catch((error) => {
          console.error('Failed to load asset:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [card.contentData, mode]);

  if (card.contentData.type === 'richtext') {
    return <RichTextRenderer editorState={card.contentData.content} />;
  }

  if (loading) {
    return <Spinner />;
  }

  if (assetFile) {
    return <AssetRenderer file={assetFile} displaySettings={card.contentData.displaySettings} />;
  }

  return <div className='text-muted-foreground text-center text-sm'>Asset not found</div>;
}

export function ReviewCarousel({ cards, state, leftLabel, rightLabel, mode = 'play' }: ReviewCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Build results for each card
  const results: CardResult[] = cards.map((card) => {
    // Find where this card ended up (left or right bucket)
    const leftEntry = state.leftBucket.find((entry) => entry.cardId === card.id);
    const rightEntry = state.rightBucket.find((entry) => entry.cardId === card.id);

    const swipedTo = leftEntry ? 'left' : 'right';
    const wasCorrect = leftEntry ? leftEntry.wasCorrect : rightEntry!.wasCorrect;

    // Check if there was a wrong attempt for this card
    const hadWrongAttempt = state.wrongSwipes.some((wrong) => wrong.cardId === card.id);

    return {
      card,
      swipedTo,
      wasCorrect,
      hadWrongAttempt,
    };
  });

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (results.length === 0) return null;

  return (
    <div className='w-full'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Review Your Answers</h3>
        <span className='text-muted-foreground text-sm'>
          {current + 1} / {count}
        </span>
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: true,
        }}
        className='mx-auto w-full'
      >
        <CarouselContent>
          {results.map((result) => (
            <CarouselItem
              key={result.card.id}
              className='flex w-full flex-col items-center justify-center'
            >
              {/* Category Badge */}
              <div className='z-10 -mb-6 flex w-60 items-center justify-between'>
                <Badge variant={result.swipedTo === 'left' ? 'destructive' : 'success'}>
                  {result.swipedTo === 'left' ? (
                    <ArrowLeft className='h-4 w-4' />
                  ) : (
                    <ArrowRight className='h-4 w-4' />
                  )}
                  <span>{result.swipedTo === 'left' ? leftLabel : rightLabel}</span>
                </Badge>

                {/* Result Indicators */}
                <div className='flex items-center gap-2'>
                  {result.hadWrongAttempt && (
                    <div
                      className='bg-destructive/20 text-destructive flex h-10 w-10 items-center justify-center rounded-full'
                      title='Wrong first attempt'
                    >
                      <X className='h-5 w-5' />
                    </div>
                  )}
                  {result.wasCorrect && (
                    <div
                      className='bg-success/20 text-success flex h-10 w-10 items-center justify-center rounded-full'
                      title={
                        result.hadWrongAttempt ? 'Corrected on second attempt' : 'Correct first try'
                      }
                    >
                      <Check className='h-5 w-5' />
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'bg-card border-border relative flex h-96 w-72 flex-col rounded-2xl',
                  // Conditional padding and border based on display settings
                  result.card.contentData.type === 'asset' &&
                  result.card.contentData.displaySettings?.noPadding
                    ? 'p-0'
                    : 'p-4',
                  result.card.contentData.type === 'asset' &&
                  result.card.contentData.displaySettings?.noBorder
                    ? 'border-0'
                    : 'border-2',
                )}
              >
                {/* Card Content */}
                <div
                  className={cn(
                    'flex flex-1 items-center justify-center',
                    result.card.contentData.type === 'richtext' && 'overflow-y-auto',
                  )}
                >
                  <CardContentRenderer card={result.card} mode={mode} />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* Progress Dots */}
      <div className='mt-6 flex justify-center gap-2'>
        {results.map((result, index) => (
          <button
            key={result.card.id}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              index === current ? 'bg-primary w-8' : 'bg-muted',
              result.hadWrongAttempt ? 'ring-destructive/50 ring-2' : '',
            )}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
